# Jay PYQs Microservice

This microservice handles the Previous Year Questions (PYQs) management system for JIIT.

## Features

1.  **Dashboards**:
    *   Teachers: Upload PYQs.
    *   Students: Download PYQs.
2.  **Chatbot**: Integrated with OpenAI/Gemini for student queries.
3.  **Storage**: AWS S3 for storing PDF files.
    *   Structure: `coursecode/year/examtype(t1,t2,t3)/filename.pdf`
4.  **Prediction**: ML-based prediction of upcoming exam questions.

## Tech Stack

*   **Backend**: Spring Boot
*   **Frontend**: React
*   **Storage**: AWS S3
*   **ML**: Python (Scikit-learn/TensorFlow)
*   **Database**: Cloud Database (TBD)
