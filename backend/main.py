from fastapi import FastAPI 
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from db import client
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

db = client[os.getenv("DB_NAME", "Assingly_db")]
users_collection = db["users"]

class User(BaseModel):
    user_id : str
    name : str
    email: str

@app.get("/")
def home():
    return {"message":"welcome"}
    