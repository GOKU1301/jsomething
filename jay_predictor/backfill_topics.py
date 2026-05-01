import os
import sys

# Ensure imports work when run from jay_predictor
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from supabase import create_client
from dotenv import load_dotenv
from services.extractor import download_and_extract_text
from services.nlp import get_top_topics

load_dotenv()

def main():
    supabase = create_client(
        os.getenv("SUPABASE_URL"),
        os.getenv("SUPABASE_KEY")
    )

    # 1. Fetch all PYQs
    pyqs_res = supabase.table("pyq").select("*").execute()
    pyqs = pyqs_res.data
    
    print(f"Total PYQs found: {len(pyqs)}")

    # 2. Fetch all existing doc_topics to find which ones are already processed
    doc_topics_res = supabase.table("doc_topics").select("pyq_id").execute()
    processed_pyq_ids = set(record["pyq_id"] for record in doc_topics_res.data)

    print(f"Already processed PYQs: {len(processed_pyq_ids)}")

    processed_count = 0
    error_count = 0

    for pyq in pyqs:
        pyq_id = pyq["id"]
        if pyq_id in processed_pyq_ids:
            continue

        s3_key = pyq.get("questionpapers3key") # note: in supabase, columns may be named exactly this
        if not s3_key:
            # Maybe there's a different column name based on the schema
            s3_key = pyq.get("question_papers3key")
            
        if not s3_key:
            print(f"Skipping PYQ {pyq_id}: No question paper S3 key")
            continue

        subject_code = pyq.get("subject_code", "")
        year = pyq.get("year", 0)
        exam_type = pyq.get("exam_type", "")

        print(f"Processing PYQ {pyq_id} (Subject: {subject_code}, Year: {year})...")
        
        try:
            text = download_and_extract_text(s3_key)
            if not text:
                print(f" - Failed to extract text for PYQ {pyq_id}")
                error_count += 1
                continue
                
            topics = get_top_topics(text, subject_code=subject_code)
            
            rows = []
            for t in topics:
                rows.append({
                    "pyq_id": pyq_id,
                    "subject_code": subject_code,
                    "year": year,
                    "exam_type": exam_type,
                    "topic": t["topic"],
                    "frequency": int(t["score"] * 100)
                })
            
            if rows:
                supabase.table("doc_topics").insert(rows).execute()
                print(f" - Successfully inserted {len(rows)} topics for PYQ {pyq_id}")
                processed_count += 1
            else:
                print(f" - No topics extracted for PYQ {pyq_id}")
                
        except Exception as e:
            print(f" - Error processing PYQ {pyq_id}: {e}")
            error_count += 1

    print("\n--- Summary ---")
    print(f"Successfully processed: {processed_count}")
    print(f"Errors: {error_count}")
    
    if processed_count > 0:
        print("\nNote: Please ensure the JayPredictor FastAPI service is running on port 3002 in the background so future uploads are processed automatically.")
        print("To start it, navigate to the jay_predictor folder and run:")
        print("uvicorn main:app --port 3002 --reload")

if __name__ == "__main__":
    main()
