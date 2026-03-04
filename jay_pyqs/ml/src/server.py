from flask import Flask, request, jsonify
import boto3
import os
from sentence_transformers import SentenceTransformer, util
import pdfplumber
import io

app = Flask(__name__)

# Load Sentence Transformer Model (Small, fast for similarity)
model = SentenceTransformer('all-MiniLM-L6-v2')

# S3 Client Setup
s3 = boto3.client(
    's3',
    aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
    region_name=os.getenv('AWS_DEFAULT_REGION')
)

@app.route('/extract', methods=['POST'])
def extract_questions():
    """
    Endpoint called when a new PDF is uploaded.
    Currently just extracts ALL text. In production, need AI to extract discrete questions.
    """
    data = request.json
    s3_key = data.get('s3_key') # e.g. "maths/2023/T2.pdf"
    bucket_name = os.getenv('S3_BUCKET_NAME')

    try:
        # 1. Download PDF to Memory
        obj = s3.get_object(Bucket=bucket_name, Key=s3_key)
        pdf_stream = io.BytesIO(obj['Body'].read())

        # 2. Extract Text
        full_text = ""
        with pdfplumber.open(pdf_stream) as pdf:
            for page in pdf.pages:
                full_text += page.extract_text() + "\n"

        # 3. (TODO) Use OpenAI/Gemini to split 'full_text' into list of questions
        # questions = ask_gpt_to_split(full_text)
        
        # For now, return raw text length as proof of concept
        return jsonify({
            "status": "success", 
            "extracted_length": len(full_text),
            "preview": full_text[:200]
        })

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/predict', methods=['POST'])
def predict():
    """
    Endpoint for students to get predictions.
    Logic: Find most similar questions from database (simulated list).
    """
    data = request.json
    course_code = data.get('course_code') 
    
    # 1. Mock Data (Ideally fetch from DB)
    all_past_questions = [
        "Define Dynamic Programming", 
        "Explain Quick Sort Algorithm with example", 
        "What is Memoization?",
        "Difference between Merge Sort and Quick Sort",
        "Explain Dynamic Programming with Matrix Chain Multiplication"
    ]

    # 2. Cluster Similar Questions (Naive Approach using Embeddings)
    embeddings = model.encode(all_past_questions)
    
    # Calculate similarity matrix...
    # Return top 3 'concepts'
    
    return jsonify({
        "likely_topics": [
            {"topic": "Dynamic Programming", "frequency": "High"},
            {"topic": "Sorting Algorithms", "frequency": "Medium"}
        ]
    })

if __name__ == '__main__':
    app.run(port=5000, debug=True)
