import React, { useState } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8081/api/pyqs';

const EXAM_TYPES = ['T1', 'T2', 'T3'];

function StudentDashboard() {
    const [search, setSearch] = useState({
        subjectCode: '',
        yearFrom: '',
        yearTo: '',
        examTypeFrom: 'T1',
        examTypeTo: 'T3',
    });
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    const handleSearch = async (e) => {
        if (e) e.preventDefault();

        const { subjectCode, yearFrom, yearTo, examTypeFrom, examTypeTo } = search;

        if (!subjectCode || !yearFrom || !yearTo || !examTypeFrom || !examTypeTo) {
            alert('Please fill in all fields to search.');
            return;
        }

        if (parseInt(yearFrom) > parseInt(yearTo)) {
            alert('Year From cannot be greater than Year To.');
            return;
        }

        setLoading(true);
        setHasSearched(true);
        try {
            const params = new URLSearchParams({
                subjectCode,
                yearFrom,
                yearTo,
                examTypeFrom,
                examTypeTo,
            });

            const response = await axios.get(`${API_BASE_URL}/search?${params.toString()}`);
            setResults(response.data);
        } catch (error) {
            console.error('Error searching PYQs', error);
        } finally {
            setLoading(false);
        }
    };

    const rangeLabel = hasSearched && search.yearFrom && search.yearTo
        ? `${search.yearFrom}–${search.yearTo} · ${search.examTypeFrom}→${search.examTypeTo}`
        : null;

    return (
        <div className="container">
            <header style={{ marginBottom: '3rem' }}>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
                    Find Your <span style={{ color: 'var(--primary)' }}>PYQs</span>
                </h1>
                <p style={{ color: 'var(--text-muted)' }}>
                    Enter Subject Code, a Year range and an Exam Type range to view resources.
                </p>
            </header>

            <form
                onSubmit={handleSearch}
                className="card"
                style={{ marginBottom: '3rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}
            >
                {/* Subject Code */}
                <div style={{ flex: '2', minWidth: '200px' }}>
                    <label>Subject Code</label>
                    <input
                        type="text"
                        placeholder="e.g. 15B11PH211"
                        value={search.subjectCode}
                        onChange={(e) => setSearch({ ...search, subjectCode: e.target.value })}
                        required
                    />
                </div>

                {/* Year Range */}
                <div style={{ flex: '1', minWidth: '120px' }}>
                    <label>Year From</label>
                    <input
                        type="number"
                        placeholder="e.g. 2020"
                        min="2000"
                        max="2099"
                        value={search.yearFrom}
                        onChange={(e) => setSearch({ ...search, yearFrom: e.target.value })}
                        required
                    />
                </div>
                <div style={{ flex: '1', minWidth: '120px' }}>
                    <label>Year To</label>
                    <input
                        type="number"
                        placeholder="e.g. 2023"
                        min="2000"
                        max="2099"
                        value={search.yearTo}
                        onChange={(e) => setSearch({ ...search, yearTo: e.target.value })}
                        required
                    />
                </div>

                {/* Exam Type Range */}
                <div style={{ flex: '1', minWidth: '110px' }}>
                    <label>Exam From</label>
                    <select
                        value={search.examTypeFrom}
                        onChange={(e) => setSearch({ ...search, examTypeFrom: e.target.value })}
                        required
                    >
                        {EXAM_TYPES.map((t) => (
                            <option key={t} value={t}>{t}</option>
                        ))}
                    </select>
                </div>
                <div style={{ flex: '1', minWidth: '110px' }}>
                    <label>Exam To</label>
                    <select
                        value={search.examTypeTo}
                        onChange={(e) => setSearch({ ...search, examTypeTo: e.target.value })}
                        required
                    >
                        {EXAM_TYPES.map((t) => (
                            <option key={t} value={t}>{t}</option>
                        ))}
                    </select>
                </div>

                <button type="submit" className="btn btn-primary" style={{ height: '3rem' }}>
                    Search Resources
                </button>
            </form>

            {/* Range badge */}
            {rangeLabel && (
                <div style={{ marginBottom: '1.5rem' }}>
                    <span className="status" style={{ background: 'rgba(99,102,241,0.12)', color: 'var(--primary)', fontSize: '0.85rem' }}>
                        🔍 Showing results for: <strong>{search.subjectCode.toUpperCase()}</strong> &nbsp;|&nbsp; Years: <strong>{search.yearFrom}–{search.yearTo}</strong> &nbsp;|&nbsp; Exam: <strong>{search.examTypeFrom} → {search.examTypeTo}</strong>
                    </span>
                </div>
            )}

            <div className="grid">
                {loading ? (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                        Searching...
                    </div>
                ) : results.length > 0 ? (
                    results.map((pyq) => (
                        <div key={pyq.id} className="card pyq-item">
                            <div>
                                <h3 style={{ marginBottom: '0.25rem' }}>{pyq.subject}</h3>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <span className="status" style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)' }}>
                                        {pyq.subjectCode} | {pyq.year} - {pyq.examType}
                                    </span>
                                </div>
                            </div>

                            <div className="side-by-side">
                                {pyq.questionPaperS3Key ? (
                                    <a
                                        href={pyq.questionPaperS3Key}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="pdf-link"
                                    >
                                        📄 Question Paper
                                    </a>
                                ) : (
                                    <div className="pdf-link disabled">Question Not Uploaded</div>
                                )}

                                {pyq.solutionS3Key ? (
                                    <a
                                        href={pyq.solutionS3Key}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="pdf-link"
                                        style={{ borderLeft: '4px solid var(--success)' }}
                                    >
                                        ✅ Solution PDF
                                    </a>
                                ) : (
                                    <div className="pdf-link disabled">Solution Not Uploaded</div>
                                )}
                            </div>
                        </div>
                    ))
                ) : hasSearched ? (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                        No PYQs found for the given criteria.
                    </div>
                ) : null}
            </div>
        </div>
    );
}

export default StudentDashboard;
