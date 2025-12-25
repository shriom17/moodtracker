from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

class MoodEntry(BaseModel):
    name: str
    mood: str
    timestamp: str

@app.post("/submit_mood")
async def submit_mood(entry: MoodEntry):
    try:
        with open("moods.json", "r") as f:
            data = json.load(f)
    except FileNotFoundError:   
        data = []
    
    data.append(entry.dict())
    
    with open("moods.json", "w") as f:
        json.dump(data, f, indent=2)
    
    return {"status": "success", "message": "Mood entry saved"}

@app.get("/get_moods")
async def get_moods():
    try:
        with open("moods.json", "r") as f:
            data = json.load(f)
    except FileNotFoundError:
        data = []
    
    return data