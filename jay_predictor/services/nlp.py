import re
from sklearn.feature_extraction.text import TfidfVectorizer

# Comprehensive Academic & Engineering Stopwords
STOP_WORDS = {
    "question", "marks", "explain", "describe", "write", "define", "discuss",
    "short", "note", "following", "either", "each", "carrying", "total",
    "answer", "questions", "part", "section", "attempt", "given", "any",
    "simplify", "using", "technique", "verify", "design", "diagram", "down",
    "expression", "circuit", "gates", "operation", "system", "convert", "find",
    "determine", "evaluate", "calculate", "compare", "briefly", "what", "how",
    "why", "state", "prove", "show", "method", "value", "type", "types",
    "different", "between", "with", "help", "example", "examples", "suitable",
    "block", "draw", "brief", "derive", "based", "which", "where", "also",
    "their", "these", "this", "that", "from", "into", "both", "only", "well",
    "examination", "troubleshoot", "perform"
}

def clean_boilerplate(text: str) -> str:
    """Removes institutional headers, instructions, and Course Outcomes (COs)."""
    lines = text.split('\n')
    filtered = []
    
    for line in lines:
        upper = line.upper()
        # Skip headers and metadata
        if "MOBILES" in upper or "JAYPEE" in upper or "INSTITUTE" in upper: continue
        if "COURSE CODE" in upper or "COURSE TITLE" in upper: continue
        if "MAXIMUM MARKS" in upper or "MAXIMUM TIME" in upper: continue
        if "ENROLLMENT" in upper or "SEMESTER" in upper or "B.TECH" in upper: continue
        
        # Skip Course Outcome definitions (e.g., "CO1: Understand...")
        if re.match(r'^CO\d+\s*:', upper) or "COURSE OUTCOME" in upper: continue
        
        # Strip inline [CO1] tags from questions
        line = re.sub(r'\[CO\d+\]', ' ', line, flags=re.IGNORECASE)
        filtered.append(line)
        
    return " ".join(filtered)

def isolate_subject_paper(text: str, subject_code: str) -> str:
    """Isolate the specific exam paper from a multi-subject scanned PDF."""
    if not subject_code:
        return text
        
    # Standardise subject code for matching (remove spaces)
    target_code = subject_code.upper().replace(" ", "")
    
    # Split document by the common university header
    papers = re.split(r'Jaypee Institute', text, flags=re.IGNORECASE)
    
    if len(papers) > 1:
        for paper in papers:
            # Remove spaces in the paper text just for the check
            paper_no_spaces = paper.upper().replace(" ", "")
            if target_code in paper_no_spaces:
                return paper
                
    return text

def get_top_topics(text: str, subject_code: str = "", top_n: int = 15):
    """Identify top topics using TF-IDF analysis."""
    # Isolate the correct exam paper if it's a multi-subject PDF
    text = isolate_subject_paper(text, subject_code)
    
    # Pre-process text to remove noise
    text = clean_boilerplate(text)
    
    # Clean text: remove non-alphabetic chars
    clean_text = re.sub(r'[^a-zA-Z\s]', ' ', text.lower())
    
    try:
        vectorizer = TfidfVectorizer(
            stop_words='english',
            ngram_range=(1, 2), # unigrams and bigrams
            max_features=100
        )
        
        tfidf_matrix = vectorizer.fit_transform([clean_text])
        feature_names = vectorizer.get_feature_names_out()
        scores = tfidf_matrix.toarray()[0]
        
        # Pair feature names with scores
        topic_scores = zip(feature_names, scores)
        
        # Sort and filter out generic academic words
        filtered_topics = [
            (t, s) for t, s in topic_scores 
            if not any(word in STOP_WORDS for word in t.split()) and len(t) > 3
        ]
        
        sorted_topics = sorted(filtered_topics, key=lambda x: x[1], reverse=True)
        
        return [{"topic": t, "score": float(s)} for t, s in sorted_topics[:top_n]]
    except Exception:
        return []
