-- =============================================================================
-- Supabase Schema: exam_predictor
-- Run this in your Supabase project's SQL Editor (once).
-- =============================================================================

-- Drop existing table if re-running (comment out if you have data you want to keep)
-- DROP TABLE IF EXISTS extracted_questions;

CREATE TABLE IF NOT EXISTS extracted_questions (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Subject identification
    course_code   VARCHAR(50)  NOT NULL,
    subject_name  TEXT         NOT NULL,

    -- Exam metadata (the three filters used by Step 3)
    year          INT          NOT NULL CHECK (year >= 2000 AND year <= 2099),
    exam_type     VARCHAR(5)   NOT NULL CHECK (exam_type IN ('T1', 'T2', 'T3')),
    exam_name     VARCHAR(50)  NOT NULL,

    -- Question content
    question_text TEXT         NOT NULL,
    topic_name    VARCHAR(150) NOT NULL,

    -- Timestamps
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Indexes for fast filtering (used by every /predict call)
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_eq_course_exam
    ON extracted_questions (course_code, exam_type, exam_name);

CREATE INDEX IF NOT EXISTS idx_eq_year
    ON extracted_questions (year);

-- ---------------------------------------------------------------------------
-- Row Level Security (optional but recommended)
-- ---------------------------------------------------------------------------
-- ALTER TABLE extracted_questions ENABLE ROW LEVEL SECURITY;

-- Allow the service role (used by the Python backend) full access:
-- CREATE POLICY "service_role_all" ON extracted_questions
--     FOR ALL USING (true);
