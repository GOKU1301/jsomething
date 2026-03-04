# Topic Determination & Vector Search: The Complete "Intelligence" Flow

You asked three critical questions:
1.  **How are topics determined?**
2.  **Do I need a Vector Database?** (Short answer: For a college project, *Postgres with pgvector* is best, but a raw Vector DB like Pinecone is overkill).
3.  **How does semantic search work in this flow?**

Here is the definitive end-to-end explanation of the "Brain" of your system.

---

## Part 1: How Topics Are Determined (The "Labeling" Phase)

We don't "calculate" the topic mathematically. We ask an AI (LLM) to Identify it.

**Scenario**: You upload a PDF for "Database Management Systems (DBMS)".
**The Extraction Script** pulls out this text: *"Explain 3rd Normal Form with an example."*

### The Flow:
1.  **Input**: Raw Question Text: *"Explain 3rd Normal Form..."*
2.  **Process (The LLM Call)**:
    *   Your Python service sends this text to **Google Gemini** or **OpenAI**.
    *   **Prompt**:
        > "I am giving you a question from a DBMS exam. Classify it into one of these syllabus modules: [Normalization, SQL, Transactions, Concurrency]. If it doesn't fit, name a new topic. Output ONLY the topic name."
3.  **Output**: The LLM replies: `Normalization`.
4.  **Action**: You save this in your database:
    *   `Question`: "Explain 3rd Normal Form..."
    *   `Topic`: "Normalization"

**Result**: Now you can run a simple SQL query: `SELECT topic, COUNT(*) FROM questions GROUP BY topic`.
*   *Normalization*: 5 questions.
*   *SQL*: 2 questions.
*   **Prediction**: "Normalization" is a high-probability topic.

---

## Part 2: Why Do You Need "Semantic Search" (Vectors)?

**The Problem**: Topic tags aren't enough.
*   Question A (2020): *"Define ACID properties."* -> Topic: *Transactions*
*   Question B (2021): *"Explain Atomicity, Consistency, Isolation, Durability."* -> Topic: *Transactions*
*   Question C (2022): *"Write a short note on Deadlocks."* -> Topic: *Transactions*

If you just count "Transactions", you get 3.
But specific questions are different!
*   Questions A & B are **IDENTICAL** in meaning (Duplicates).
*   Question C is **DIFFERENT**.

**The Soluton**: Vector Embeddings allow you to see that A & B are "the same question" even if words differ.

### Do I Need a Vector DB?
*   **No**, you don't need a dedicated beast like Pinecone or Milvus for < 10,000 questions.
*   **YES**, you need vector capabilities.
*   **Best Choice**: Use **PostgreSQL with `pgvector` extension**. It lets you store your normal data (`id`, `text`, `year`) AND the vector (`[0.12, 0.98, ...]`) in the same row.

---

## Part 3: The Complete Semantic Flow (End-to-End)

### Step A: When a New Question is Saved (Ingestion)
1.  **Extract**: "Define ACID properties."
2.  **Vectorize**: Python's `sentence-transformers` converts this text into a list of 384 numbers (the "Embedding").
    *   `[0.051, -0.32, 0.88, ...]`
3.  **Store**: Insert into Postgres:
    *   `INSERT INTO questions (text, topic, embedding) VALUES ('Define ACID...', 'Transactions', [0.051, -0.32...]);`

### Step B: When Predicting "Most Repeated Questions" (Analysis)
1.  **Fetch**: Get all questions for "DBMS" course.
2.  **Cluster**: You have 50 questions. You want to group them by "Meaning".
    *   You compare every vector with every other vector (Cosine Similarity).
    *   If Similarity > 0.85, they are the "Same Question".
3.  **Result**:
    *   *Cluster 1* (ACID Props): Contains 5 questions (2018, 2019, 2021, 2022, 2023).
    *   *Cluster 2* (Deadlocks): Contains 1 question (2020).
4.  **Final Prediction Output**:
    *   "The question **'Define ACID Properties'** has a **100% chance** of appearing (appeared 5 times in 5 years)."

---

## Summary Checklist for You

1.  **Database**: Install **PostgreSQL** and enable the `pgvector` extension.
2.  **Python Libs**: You already have `sentence-transformers`.
3.  **Code Logic**:
    *   **Upload**: Extract Text -> Call LLM (Get Topic) -> Generate Vector -> Save to DB.
    *   **Predict**: Fetch Vectors -> Run Clustering Algorithm (e.g., DBSCAN or simple Threshold grouping) -> Report biggest clusters.
