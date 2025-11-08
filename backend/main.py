from fastapi import FastAPI, Request , Query
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from datetime import datetime, timezone
import os
import io
from googleapiclient.http import MediaIoBaseDownload
app = FastAPI()
os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'

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
    "https://www.googleapis.com/auth/drive.readonly"
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
    save_path = f"downloads/{file_id}"
    with open(save_path, "wb") as f:
        f.write(fh.read())

    return {
        "message": "saved",
        "path": save_path
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=2000, reload=True)