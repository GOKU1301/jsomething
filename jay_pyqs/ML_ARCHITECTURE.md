# ML Feature: Exam Question Prediction Architecture

To predict likely questions, you cannot rely solely on S3. S3 stores **unstructured** data (PDFs). Machine Learning requires **structured** data (Text, Topics, Frequency).

**Verdict**: YES, you absolutely need a database (or a structured store) to act as an intermediate layer between your raw PDFs and your prediction logic.

## The Complete Workflow

### Phase 1: Ingestion & Extraction (The "Hard" Part)
*Happens when a Teacher uploads a file.*

1.  **Upload**: Teacher uploads a PYQ (PDF) to S3 via the Spring Boot Backend.
2.  **Trigger**: The Backend sends a message to the Python ML Service (e.g., via HTTP REST endpoint) saying: "New file uploaded: `maths_2023_t1.pdf`".
3.  **Download**: Python script downloads the PDF from S3.
4.  **Text Extraction (OCR)**: Python uses libraries (like `pdfplumber` or `pypdf`) to read text from the PDF.
5.  **Question Segmentation (AI)**:
    *   The raw text is sent to an LLM (Gemini/OpenAI).
    *   **Prompt**: "Extract all questions from this text. Return them as a JSON list. For each question, identify the 'Topic' or 'Chapter'."
    *   *Result*: A structured list of questions.
6.  **Storage**: Save these extracted questions into your Database.

### Phase 2: The Database Schema
You need a table to store individual questions so you can count/analyze them.

**Table: `extracted_questions`**
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Unique ID |
| `course_code` | VARCHAR | e.g., "15B11CI312" |
| `year` | INT | e.g., 2023 |
| `exam_type` | VARCHAR | e.g., "T1" |
| `question_text` | TEXT | The actual question content |
| `topic_tag` | VARCHAR | e.g., "Integration", "Sorting" |
| `embedding` | VECTOR | (Optional) For semantic similarity search |

### Phase 3: Prediction (The "Smart" Part)
*Happens when a Student requests "Probable Questions".*

1.  **Query**: Student asks for "Maths (15B11CI312) Predictions".
2.  **Fetch**: ML Service queries the Database:
    *   `SELECT * FROM extracted_questions WHERE course_code = '15B11CI312' AND year >= 2019` (Last 5 years).
3.  **Analysis**:
    *   **Frequency Count**: Count occurrences of each `topic_tag`.
    *   **Similarity Check**: If Question A (2020) is "Define OOP" and Question B (2022) is "What is Object Oriented Programming", they are the same. You use **Text Similarity** (Cosine Similarity) to group these together.
4.  **Result**: Return a list of:
    *   "High Probability Topics: Integration (appeared 8 times)"
    *   "Most Repeated Question: 'Define DBMS' (appeared 4 times)"

---

## Implementation Plan

### 1. Update Python Requirements
We need libraries for PDF reading and maybe simple similarity matching.

### 2. Database Setup
Since you are using H2 (in-memory) for now, we can create this entity in Spring Boot, but eventually, you'll want a persistent Postgres database.

### 3. Workflow Implementation
We will build a simple "Extractor" script in the ML folder to demonstrate Phase 1.
