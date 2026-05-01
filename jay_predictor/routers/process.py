from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel
from services.extractor import download_and_extract_text
from services.nlp import get_top_topics
from supabase import create_client
import os

router = APIRouter()

# Lazy Supabase client — initialized on first use, not at import time
_supabase = None

def get_supabase():
    global _supabase
    if _supabase is None:
        _supabase = create_client(
            os.getenv("SUPABASE_URL"),
            os.getenv("SUPABASE_KEY")
        )
    return _supabase

class ProcessRequest(BaseModel):
    pyq_id: int
    s3_key: str
    subject_code: str
    year: int
    exam_type: str

async def perform_processing(req: ProcessRequest):
    """Background task to process the document."""
    text = download_and_extract_text(req.s3_key)
    if not text:
        return
        
    topics = get_top_topics(text, subject_code=req.subject_code)
    supabase = get_supabase()
    # Prepare rows for Supabase doc_topics table
    rows = []
    for t in topics:
        rows.append({
            "pyq_id": req.pyq_id,
            "subject_code": req.subject_code,
            "year": req.year,
            "exam_type": req.exam_type,
            "topic": t["topic"],
            "frequency": int(t["score"] * 100) # Convert normalized score to scale of 100
        })
    
    if rows:
        supabase.table("doc_topics").insert(rows).execute()

@router.post("")
async def start_processing(req: ProcessRequest, background_tasks: BackgroundTasks):
    """Trigger document processing in the background."""
    background_tasks.add_task(perform_processing, req)
    return {"status": "processing_started", "doc_id": req.pyq_id}
