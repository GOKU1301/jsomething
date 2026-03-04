import React, { useState } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8081/api/pyqs';

function TeacherDashboard() {
    const [formData, setFormData] = useState({
        subject: '',
        subjectCode: '',
        year: '2023',
        examType: 'T1'
    });
    const [questionFile, setQuestionFile] = useState(null);
    const [solutionFile, setSolutionFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!formData.subject || !formData.subjectCode) {
            setMessage({ type: 'error', text: 'Please enter subject name and code' });
            return;
        }

        setLoading(true);
        setMessage({ type: '', text: '' });

        const data = new FormData();
        data.append('subject', formData.subject);
        data.append('subjectCode', formData.subjectCode);
        data.append('year', formData.year);
        data.append('examType', formData.examType);
        if (questionFile) data.append('questionPaper', questionFile);
        if (solutionFile) data.append('solution', solutionFile);

        try {
            await axios.post(`${API_BASE_URL}/upload`, data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setMessage({ type: 'success', text: 'PYQ and Solution uploaded successfully!' });
            setFormData({ subject: '', subjectCode: '', year: '2023', examType: 'T1' });
            setQuestionFile(null);
            setSolutionFile(null);
            // Reset file inputs
            document.getElementById('questionInput').value = '';
            document.getElementById('solutionInput').value = '';
        } catch (error) {
            console.error('Upload failed', error);
            setMessage({ type: 'error', text: 'Upload failed. Check console for details.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container" style={{ maxWidth: '800px' }}>
            <header style={{ marginBottom: '3rem' }}>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Upload <span style={{ color: 'var(--secondary)' }}>PYQs</span></h1>
                <p style={{ color: 'var(--text-muted)' }}>Contribute to the student resource portal by uploading papers and solutions.</p>
            </header>

            {message.text && (
                <div className={`card`} style={{
                    marginBottom: '2rem',
                    borderLeft: `5px solid ${message.type === 'success' ? 'var(--success)' : 'var(--error)'}`,
                    padding: '1rem 2rem'
                }}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleUpload} className="card">
                <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem' }}>
                    <div className="form-group" style={{ flex: 2 }}>
                        <label>Subject Name</label>
                        <input
                            type="text"
                            placeholder="e.g. Applied Physics - II"
                            value={formData.subject}
                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                            required
                        />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                        <label>Subject Code</label>
                        <input
                            type="text"
                            placeholder="e.g. 15B11PH211"
                            value={formData.subjectCode}
                            onChange={(e) => setFormData({ ...formData, subjectCode: e.target.value })}
                            required
                        />
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem' }}>
                    <div className="form-group" style={{ flex: 1 }}>
                        <label>Exam Year</label>
                        <input
                            type="number"
                            min="2000"
                            max="2100"
                            value={formData.year}
                            onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                            placeholder="e.g. 2023"
                            required
                        />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                        <label>Exam Type</label>
                        <select value={formData.examType} onChange={(e) => setFormData({ ...formData, examType: e.target.value })}>
                            <option value="T1">Test 1 (T1)</option>
                            <option value="T2">Test 2 (T2)</option>
                            <option value="T3">End Term (T3)</option>
                        </select>
                    </div>
                </div>

                <div className="form-group">
                    <label>Question Paper PDF (Optional)</label>
                    <input
                        id="questionInput"
                        type="file"
                        accept=".pdf"
                        onChange={(e) => setQuestionFile(e.target.files[0])}
                    />
                </div>

                <div className="form-group">
                    <label>Solution PDF (Optional)</label>
                    <input
                        id="solutionInput"
                        type="file"
                        accept=".pdf"
                        onChange={(e) => setSolutionFile(e.target.files[0])}
                    />
                </div>

                <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}
                    disabled={loading}
                >
                    {loading ? 'Uploading...' : 'Upload PYQ Resources'}
                </button>
            </form>
        </div>
    );
}

export default TeacherDashboard;
