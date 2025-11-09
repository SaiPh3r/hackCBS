from fastapi import FastAPI, Request , Query
from fastapi import HTTPException
from googleapiclient.errors import HttpError
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from datetime import datetime, timezone
from PyPDF2 import PdfReader
import os
import io
from fastapi import FastAPI, UploadFile, File
from googleapiclient.http import MediaIoBaseDownload
app = FastAPI()
from googleapiclient.http import MediaFileUpload
os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'

from langchain_google_genai import GoogleGenerativeAIEmbeddings
from fastapi import UploadFile, File
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_core.prompts import PromptTemplate,ChatPromptTemplate,MessagesPlaceholder
from langchain_google_genai import ChatGoogleGenerativeAI
from dotenv import load_dotenv
load_dotenv()
from docx import Document



emb = GoogleGenerativeAIEmbeddings(model="models/text-embedding-004")

import os
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"
retriever = None
stored_files = []  
retrieval = None
assignment_text=""
llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash")   # cloud LLM

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Course(BaseModel):
    id: str

SCOPES = [
    "https://www.googleapis.com/auth/classroom.student-submissions.me.readonly",
    "https://www.googleapis.com/auth/classroom.courses.readonly",
    "https://www.googleapis.com/auth/drive.readonly",
    "https://www.googleapis.com/auth/classroom.coursework.students",   # ⭐ NEEDED FOR SUBMIT
    "https://www.googleapis.com/auth/drive.file"                        # ⭐ NEEDED FOR UPLOAD
]
# OAuth flow
flow = Flow.from_client_secrets_file(
    'credentials.json', 
    scopes=SCOPES, 
    redirect_uri="http://localhost:2000/oauth2callback"
)

user_creds = None 

@app.get("/login")
def login():
    auth_url, state = flow.authorization_url(
        access_type='offline',
        include_granted_scopes='true'
    )
    return {"auth_url": auth_url}

def convert(messages):
    chat_history=[]
    for item in messages:
        if(item["sender"]=="user"):
            chat_history.append({"role":"user","content":item["text"]})
        else:
            chat_history.append({"role":"assistant","content":item["text"]})
    return chat_history

@app.get("/oauth2callback")
def oauth2callback(request: Request):
    global user_creds
    flow.fetch_token(authorization_response=str(request.url))
    user_creds = flow.credentials
    return RedirectResponse(url="http://localhost:5173")

@app.get("/courses")
def get_courses():
    if not user_creds:
        return {"error": "User not logged in"}
    
    service = build("classroom", "v1", credentials=user_creds)
    results = service.courses().list().execute()
    courses = results.get('courses', [])
    return {"courses": courses}


@app.get("/signout")

def signout():
    global user_creds
    if user_creds:
        user_creds = None
        return {"status": "✅ Signed out successfully"}
    return {"status": "⚠️ No active session"}

@app.post("/assignments")
def get_assignments(course: Course):
    if not user_creds:
        return {"error": "User not logged in"}
    
    service = build("classroom", "v1", credentials=user_creds)
    coursework = service.courses().courseWork().list(courseId=course.id).execute()
    assignments = coursework.get('courseWork', [])
    data = []

    now = datetime.now(timezone.utc)

    for assignment in assignments:
    
        submission_list = service.courses().courseWork().studentSubmissions().list(
            courseId=course.id, courseWorkId=assignment["id"]
        ).execute().get('studentSubmissions', [])

      
        state = submission_list[0].get('state', 'NEW') if submission_list else 'NEW'

     
        due_date = assignment.get("dueDate")
        due_time = assignment.get("dueTime", {})
        is_open = True

        if due_date:
            deadline = datetime(
                due_date['year'], due_date['month'], due_date['day'],
                due_time.get('hours', 23), due_time.get('minutes', 59),
                due_time.get('seconds', 59),
                tzinfo=timezone.utc
            )
            is_open = now < deadline

    
        if state not in ['TURNED_IN', 'RETURNED'] and is_open:
            data.append({
                "title": assignment["title"],
                "state": state,
                "is_open": is_open,
                "id":assignment["id"]
            })

    return {"assignments": data}


@app.get("/assignment_details")
def assignment_details(course_id: str = Query(...), assignment_id: str = Query(...)):
    if not user_creds:
        return {"error": "User not logged in"}
    
    service = build("classroom", "v1", credentials=user_creds)

    # fetch assignment detail
    assignment = service.courses().courseWork().get(
        courseId=course_id,
        id=assignment_id
    ).execute()

    # fetch submissions (optional but useful)
    submissions = service.courses().courseWork().studentSubmissions().list(
        courseId=course_id,
        courseWorkId=assignment_id
    ).execute().get('studentSubmissions', [])

    return {
        "assignment": assignment,
        "submissions": submissions
    }


@app.get("/download_file")
def download_file(file_id: str):
    if not user_creds:
        return {"error": "User not logged in"}

    drive_service = build("drive", "v3", credentials=user_creds)

    request = drive_service.files().get_media(fileId=file_id)
    fh = io.BytesIO()
    downloader = MediaIoBaseDownload(fh, request)

    done = False
    while not done:
        status, done = downloader.next_chunk()

    # now extract
    fh.seek(0)
    pdf_reader = PdfReader(fh)

    text = ""
    global assignment_text
      # store assignment pdf text here

    
    for page in pdf_reader.pages:
        text += page.extract_text()
    assignment_text=text
    # return text directly
    return {
        "text": text
    }
    
@app.post("/upload_assignment")
async def upload_pdf(file: UploadFile = File(...)):
    global retrieval
    pdf_bytes = await file.read()

    pdf_reader = PdfReader(io.BytesIO(pdf_bytes))
    text = ""
    for page in pdf_reader.pages:
        text += page.extract_text()

    

   
    return {"message": "PDF processed successfully"}

     # will store list:  {"source": "Book" | "Assignment", "path": "...."}


splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)

prompt = ChatPromptTemplate(messages=[
    ("system", """
You are an assignment solving AI.

Input you will get:
1) ASSIGNMENT TEXT  → the actual questions + instructions extracted from classroom PDF
2) BOOK CONTEXT     → knowledge reference from course book
3) USER QUESTION    → student asking about a specific part
 ANSWER all questions
Rules:
- Your answer MUST follow assignment instructions
- Use BOOK only for theory support / definitions
- If necessary info is not present in EITHER assignment or book → ans on ur own
- Write academically. No casual language.
- 
"""),
    MessagesPlaceholder("chat_history"),
    ("human", """
ASSIGNMENT:
{assignment_instructions}

BOOK CONTEXT:
{context}

QUESTION:
{question}
""")
])

class AskInput(BaseModel):
    question: str
    chat_history: list = []
    description: str = "" 


def rebuild_vectorstore():
    global retriever

    docs = []

    for entry in stored_files:
        loader = PyPDFLoader(entry["path"])
        pages = loader.load()
        print(pages)
        chunks = splitter.split_documents(pages)
        for c in chunks:
            c.metadata["source"] = entry["source"]
        docs.extend(chunks)

    vs = FAISS.from_documents(docs, emb)
    retriever = vs.as_retriever(search_kwargs={"k": 6})


@app.post("/upload/book")
async def upload_book(file: UploadFile = File(...)):
    save_path = f"uploads/book-{file.filename}"
    os.makedirs("uploads", exist_ok=True)

    with open(save_path, "wb") as f:
        f.write(await file.read())

    stored_files.append({"source": "Book", "path": save_path})
    rebuild_vectorstore()
    return {"status": "book stored & vector updated"}


# @app.post("/upload/assignment")
# async def upload_assignment(file: UploadFile = File(...)):
#     save_path = f"uploads/assignment-{file.filename}"
#     os.makedirs("uploads", exist_ok=True)

#     with open(save_path, "wb") as f:
#         f.write(await file.read())

#     stored_files.append({"source": "Assignment", "path": save_path})
#     rebuild_vectorstore()
#     return {"status": "assignment stored & vector updated"}


@app.post("/ask")
def ask(data: AskInput):
    global retriever

    if retriever is None:
        return {"error": "upload book + assignment first"}

    docs = retriever.invoke(data.question)
    context_text = "\n\n".join([d.page_content for d in docs])
    chat_hist=convert(messages=data.chat_history)
    chain = prompt | llm
    resp = chain.invoke({
        "question": data.question,
        "chat_history": chat_hist,
        "context": context_text,
        "assignment_instructions":assignment_text
    })

    return {"answer": resp.content}



# @app.post("/submit_assignment")
# def submit_assignment(course_id: str = Query(...), assignment_id: str = Query(...), submission_id: str = Query(...)):
#     if not user_creds:
#         return {"error": "User not logged in"}
    
#     service = build("classroom", "v1", credentials=user_creds)

#     # ATTACH FILE
#     FILE_PATH = "downloads/output.pdf"   # change file name if different

#     drive = build("drive", "v3", credentials=user_creds)
#     file_metadata = {"name": os.path.basename(FILE_PATH)}
#     media = MediaFileUpload(FILE_PATH)

#     file = drive.files().create(body=file_metadata, media_body=media).execute()
#     file_id = file.get("id")

#     body = {
#         "assignmentSubmission": {
#             "attachments": [
#                 {
#                     "driveFile": {
#                         "id": file_id,
#                         "title": os.path.basename(FILE_PATH)
#                     }
#                 }
#             ]
#         }
#     }

#     service.courses().courseWork().studentSubmissions().patch(
#         courseId=course_id,
#         courseWorkId=assignment_id,
#         id=submission_id,
#         updateMask="assignmentSubmission"
#     ).execute()

    # TURN IN
    # service.courses().courseWork().studentSubmissions().turnIn(
    #     courseId=course_id,
    #     courseWorkId=assignment_id,
    #     id=submission_id
    # ).execute()

    # return {"status": "submitted ", "file_attached": file_id}


# @app.post("/submit_assignment")
# def submit_assignment(course_id: str, assignment_id: str, submission_id: str):
#     creds = user_creds  # however you load your Google API credentials
#     service = build("classroom", "v1", credentials=creds)

#     try:
#         # ✅ Correct method for marking as submitted
#         service.courses().courseWork().studentSubmissions().turnIn(
#             courseId=course_id,
#             courseWorkId=assignment_id,
#             id=submission_id,
#         ).execute()

#         return {"status": "✅ Assignment successfully turned in!"}

#     except HttpError as e:
#         print("❌ Google Classroom API Error:", e)
#         raise HTTPException(status_code=e.resp.status, detail=str(e))


def create_txt_from_text(text: str, filename: str = "output.txt"):
    with open(filename, "w", encoding="utf-8") as f:
        f.write(text)
    return filename

class SubmissionData(BaseModel):
    course_id: str
    assignment_id: str
    submission_id: str
    answer_text: str
from docx import Document

def create_docx_from_text(text: str, filename: str = "output.docx"):
    document = Document()
    document.add_paragraph(text)
    document.save(filename)
    return filename
@app.post("/submit_assignment")
async def submit_assignment(data: SubmissionData):
    """
    Uploads the student's assignment answer as a DOCX file to Google Drive
    and returns the file URL for download.
    """
    global user_creds

    if not user_creds:
        raise HTTPException(status_code=401, detail="⚠️ User not logged in")

    answer_text = data.answer_text

    try:
        # 1️⃣ Create DOCX from the provided text
        file_path = create_docx_from_text(answer_text)

        # 2️⃣ Upload to Google Drive
        drive_service = build("drive", "v3", credentials=user_creds)
        file_metadata = {"name": os.path.basename(file_path)}
        media = MediaFileUpload(
            file_path,
            mimetype="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        )

        uploaded_file = drive_service.files().create(
            body=file_metadata, media_body=media, fields="id"
        ).execute()
        file_id = uploaded_file.get("id")

        # 3️⃣ Make it viewable / downloadable
        drive_service.permissions().create(
            fileId=file_id,
            body={"role": "reader", "type": "anyone"}
        ).execute()

        # 4️⃣ Return the file URL
        return {
            "status": "✅ Assignment uploaded successfully!",
            "file_url": f"https://drive.google.com/file/d/{file_id}/view?usp=sharing"
        }

    except HttpError as e:
        detail = e._get_reason() or str(e)
        raise HTTPException(status_code=e.resp.status, detail=detail)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))




if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=2000, reload=True)