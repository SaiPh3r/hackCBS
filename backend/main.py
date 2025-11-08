from fastapi import FastAPI, Request , Query
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
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain.prompts import PromptTemplate,ChatPromptTemplate,MessagesPlaceholder
from langchain_google_genai import ChatGoogleGenerativeAI
from dotenv import load_dotenv
load_dotenv()

emb = GoogleGenerativeAIEmbeddings(model="models/text-embedding-004")


retriever = None
stored_files = []  
retrieval = None
llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash")   # cloud LLM
prompt = PromptTemplate(
    template="""
        Answer the user's question below in a clear, concise, and informative way.
        If the answer cannot be found in the context, simply say:
        I am not sure based on the given document.

        CONTEXT:
        {context}

        QUESTION: {question}
    """,
    input_variables=["context","question"]
)

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

@app.get("/oauth2callback")
def oauth2callback(request: Request):
    global user_creds
    flow.fetch_token(authorization_response=str(request.url))
    user_creds = flow.credentials
    return RedirectResponse(url="http://localhost:5173/")

@app.get("/courses")
def get_courses():
    if not user_creds:
        return {"error": "User not logged in"}
    
    service = build("classroom", "v1", credentials=user_creds)
    results = service.courses().list().execute()
    courses = results.get('courses', [])
    return {"courses": courses}



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

    fh.seek(0)

    # save locally
    os.makedirs("downloads", exist_ok=True)
    save_path = "downloads/output.pdf"
    with open(save_path, "wb") as f:
        f.write(fh.read())

    return {
        "message": "saved",
        "path": save_path
    }


# @app.post("/upload_assignment/")
# async def upload_pdf(file: UploadFile = File(...)):
#     global retrieval
#     pdf_bytes = await file.read()

#     pdf_reader = PdfReader(io.BytesIO(pdf_bytes))
#     text = ""
#     for page in pdf_reader.pages:
#         text += page.extract_text()

    

   
#     return {"message": "PDF processed successfully"}

     # will store list:  {"source": "Book" | "Assignment", "path": "...."}


splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)

prompt = ChatPromptTemplate.from_messages([
    ("system",
     """You are an assignment solving AI.

Use ONLY context from BOOK + ASSIGNMENT.
If required info not in context → reply:
"Not enough information in provided content."
     """),
    MessagesPlaceholder("chat_history"),
    ("human", "{question}")
])


class AskInput(BaseModel):
    question: str
    chat_history: list = []


def rebuild_vectorstore():
    global retriever

    docs = []

    for entry in stored_files:
        loader = PyPDFLoader(entry["path"])
        pages = loader.load()
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


@app.post("/upload/assignment")
async def upload_assignment(file: UploadFile = File(...)):
    save_path = f"uploads/assignment-{file.filename}"
    os.makedirs("uploads", exist_ok=True)

    with open(save_path, "wb") as f:
        f.write(await file.read())

    stored_files.append({"source": "Assignment", "path": save_path})
    rebuild_vectorstore()
    return {"status": "assignment stored & vector updated"}


@app.post("/ask")
def ask(data: AskInput):
    global retriever

    if retriever is None:
        return {"error": "upload book + assignment first"}

    ctx = retriever.invoke(data.question)
    chain = prompt | llm
    resp = chain.invoke({"question": data.question,
                         "chat_history": data.chat_history,
                         "context": ctx})
    return {"answer": resp.content}



@app.post("/submit_assignment")
def submit_assignment(course_id: str = Query(...), assignment_id: str = Query(...), submission_id: str = Query(...)):
    if not user_creds:
        return {"error": "User not logged in"}
    
    service = build("classroom", "v1", credentials=user_creds)

    # ATTACH FILE
    FILE_PATH = "downloads/output.pdf"   # change file name if different

    drive = build("drive", "v3", credentials=user_creds)
    file_metadata = {"name": os.path.basename(FILE_PATH)}
    media = MediaFileUpload(FILE_PATH)

    file = drive.files().create(body=file_metadata, media_body=media).execute()
    file_id = file.get("id")

    body = {
        "assignmentSubmission": {
            "attachments": [
                {
                    "driveFile": {
                        "id": file_id,
                        "title": os.path.basename(FILE_PATH)
                    }
                }
            ]
        }
    }

    service.courses().courseWork().studentSubmissions().patch(
        courseId=course_id,
        courseWorkId=assignment_id,
        id=submission_id,
        updateMask="assignmentSubmission"
    ).execute()

    # TURN IN
    service.courses().courseWork().studentSubmissions().turnIn(
        courseId=course_id,
        courseWorkId=assignment_id,
        id=submission_id
    ).execute()

    return {"status": "submitted ", "file_attached": file_id}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=2000, reload=True)