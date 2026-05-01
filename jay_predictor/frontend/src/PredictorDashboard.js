import React, { useState, useEffect } from 'react';
import axios from 'axios';

const PREDICTOR_URL = 'http://localhost:3002';
const EXAM_TYPES = ['T1', 'T2', 'T3'];
const CURRENT_YEAR = new Date().getFullYear();

/* ── Colour helpers ──────────────────────────────────────────────────────── */

/**
 * Maps a confidence value (0–100) to an HSL colour on a
 * cool-blue → amber → hot-red heat spectrum.
 */
function confidenceToHsl(score) {
    if (score >= 80) return { h: 0,   s: 90, l: 55 };  // red-hot
    if (score >= 65) return { h: 20,  s: 90, l: 55 };  // orange
    if (score >= 50) return { h: 40,  s: 90, l: 55 };  // amber
    if (score >= 35) return { h: 200, s: 70, l: 50 };  // cool blue
    return              { h: 220, s: 40, l: 40 };       // dim slate
}

function heatColor(score) {
    const { h, s, l } = confidenceToHsl(score);
    return `hsl(${h}, ${s}%, ${l}%)`;
}

function heatBg(score) {
    const { h, s, l } = confidenceToHsl(score);
    return `hsla(${h}, ${s}%, ${l}%, 0.12)`;
}

function heatLabel(score) {
    if (score >= 80) return '🔥 Very High';
    if (score >= 65) return '⚠️ High';
    if (score >= 50) return '📈 Moderate';
    if (score >= 35) return '🔵 Low';
    return '❄️ Very Low';
}

/* ── Single heatmap cell ─────────────────────────────────────────────────── */
function HeatCell({ item, rank, isHovered, onHover, onLeave }) {
    const color = heatColor(item.confidence_score);
    const bg    = heatBg(item.confidence_score);
    const score = item.confidence_score;

    return (
        <div
            className="heat-cell"
            style={{ '--heat-color': color, '--heat-bg': bg }}
            onMouseEnter={() => onHover(rank)}
            onMouseLeave={onLeave}
        >
            <div className="heat-rank">#{rank + 1}</div>
            <div className="heat-topic">{item.topic}</div>
            <div className="heat-bar-track">
                <div className="heat-bar-fill" style={{ width: `${score}%`, background: color }} />
            </div>
            <div className="heat-score" style={{ color }}>{score}%</div>
            <div className="heat-label"  style={{ color }}>{heatLabel(score)}</div>

            {isHovered && (
                <div className="heat-tooltip">
                    <div className="heat-tt-title">{item.topic}</div>
                    <div className="heat-tt-row">
                        <span>Confidence</span><strong style={{ color }}>{score}%</strong>
                    </div>
                    <div className="heat-tt-row">
                        <span>Gap (years)</span><strong>{item.gap_years}</strong>
                    </div>
                    <div className="heat-tt-row">
                        <span>Years seen</span>
                        <strong>{item.years_appeared?.join(', ') ?? '—'}</strong>
                    </div>
                    <div className="heat-tt-row">
                        <span>Occurrences</span><strong>{item.total_occurrences}</strong>
                    </div>
                    <div className="heat-tt-reason">{item.reasoning}</div>
                </div>
            )}
        </div>
    );
}

/* ── Main component ──────────────────────────────────────────────────────── */
export default function PredictorDashboard() {
    const [subjectCode,   setSubjectCode]   = useState('');
    const [examType,      setExamType]      = useState('T1');
    const [year,          setYear]          = useState(CURRENT_YEAR);
    const [result,        setResult]        = useState(null);
    const [loading,       setLoading]       = useState(false);
    const [error,         setError]         = useState('');
    const [hovered,       setHovered]       = useState(null);
    const [available,     setAvailable]     = useState([]);
    const [loadingAvail,  setLoadingAvail]  = useState(true);

    /* Load available subjects on mount */
    useEffect(() => {
        axios.get(`${PREDICTOR_URL}/predict/available-subjects`)
            .then(r => setAvailable(r.data.subjects ?? []))
            .catch(() => setAvailable([]))
            .finally(() => setLoadingAvail(false));
    }, []);

    const handlePredict = async (e) => {
        e.preventDefault();
        if (!subjectCode.trim()) { setError('Please enter a subject code.'); return; }
        setLoading(true);
        setError('');
        setResult(null);
        setHovered(null);
        try {
            const params = new URLSearchParams({
                subject_code: subjectCode.trim().toUpperCase(),
                exam_type: examType,
                year,
            });
            const resp = await axios.get(`${PREDICTOR_URL}/predict/?${params}`);
            setResult(resp.data);
        } catch (err) {
            const msg = err.response?.data?.detail ?? err.message;
            setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
        } finally {
            setLoading(false);
        }
    };

    const fillFromAvailable = (s) => {
        setSubjectCode(s.subject_code);
        setExamType(s.exam_type);
    };

    return (
        <div className="container predictor-root">

            {/* ── Header ── */}
            <header style={{ marginBottom: '2.5rem' }}>
                <h1 style={{ fontSize: '2.6rem', marginBottom: '0.75rem', lineHeight: 1.15 }}>
                    Exam <span style={{ background: 'linear-gradient(135deg,#c4b5fd,#f9a8d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Predictor</span>
                </h1>
                <p style={{ color: 'var(--text-muted)', maxWidth: '580px', lineHeight: 1.6 }}>
                    Analyses historical PYQ papers and surfaces the topics most likely to appear in your next exam — ranked by confidence score.
                </p>
            </header>

            {/* ── Available subjects quick-pick ── */}
            {!loadingAvail && available.length > 0 && (
                <div className="card" style={{ marginBottom: '1.75rem' }}>
                    <p style={{ margin: '0 0 0.85rem', color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                        Subjects with data
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {available.map((s, i) => (
                            <button
                                key={i}
                                className="btn btn-outline"
                                style={{ fontSize: '0.8rem', padding: '0.4rem 0.9rem' }}
                                onClick={() => fillFromAvailable(s)}
                            >
                                {s.subject_code} · {s.exam_type}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {!loadingAvail && available.length === 0 && (
                <div className="card" style={{ marginBottom: '1.75rem', borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.05)' }}>
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                        ⚠️ No processed PYQ data found yet. Upload question papers via <strong>JayPyQs → Teacher Portal</strong> and the predictor will populate automatically.
                    </p>
                </div>
            )}

            {/* ── Query form ── */}
            <form onSubmit={handlePredict} className="card" style={{ marginBottom: '2.5rem' }}>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <div style={{ flex: 3, minWidth: '180px' }}>
                        <label>Subject Code</label>
                        <input
                            id="predictor-subject-input"
                            type="text"
                            placeholder="e.g. CS301"
                            value={subjectCode}
                            onChange={e => setSubjectCode(e.target.value)}
                        />
                    </div>
                    <div style={{ flex: 1, minWidth: '110px' }}>
                        <label>Exam Type</label>
                        <select
                            id="predictor-exam-select"
                            value={examType}
                            onChange={e => setExamType(e.target.value)}
                        >
                            {EXAM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <div style={{ flex: 1, minWidth: '110px' }}>
                        <label>Predict For Year</label>
                        <input
                            id="predictor-year-input"
                            type="number"
                            min={2000}
                            max={2100}
                            value={year}
                            onChange={e => setYear(Number(e.target.value))}
                        />
                    </div>
                    <button
                        id="predictor-submit-btn"
                        type="submit"
                        className="btn btn-primary"
                        style={{ height: '3rem', minWidth: '140px' }}
                        disabled={loading}
                    >
                        {loading ? 'Analysing…' : '🔮 Predict'}
                    </button>
                </div>
            </form>

            {/* ── Error ── */}
            {error && (
                <div className="card" style={{ marginBottom: '2rem', borderLeft: '4px solid var(--error)', padding: '1rem 1.5rem', color: 'var(--error)' }}>
                    ⚠️ {error}
                </div>
            )}

            {/* ── Loading ── */}
            {loading && (
                <div style={{ textAlign: 'center', padding: '5rem 2rem', color: 'var(--text-muted)' }}>
                    <div className="pred-spinner" />
                    <p style={{ marginTop: '1.5rem', fontSize: '0.95rem' }}>Crunching historical data…</p>
                </div>
            )}

            {/* ── Results ── */}
            {result && !loading && (
                <>
                    {/* Meta strip */}
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.75rem', alignItems: 'center' }}>
                        <div className="pred-meta-badge">📘 {result.subject_name}</div>
                        <div className="pred-meta-badge">🗂 {result.exam_type}</div>
                        <div className="pred-meta-badge">📅 Predicting for {result.predicted_year}</div>
                        <div className="pred-meta-badge">
                            📄 {result.papers_analysed} paper{result.papers_analysed !== 1 ? 's' : ''} analysed
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="pred-legend">
                        {[
                            { label: 'Very High (80–100%)', color: 'hsl(0,90%,55%)' },
                            { label: 'High (65–79%)',        color: 'hsl(20,90%,55%)' },
                            { label: 'Moderate (50–64%)',    color: 'hsl(40,90%,55%)' },
                            { label: 'Low (35–49%)',         color: 'hsl(200,70%,50%)' },
                            { label: 'Very Low (<35%)',      color: 'hsl(220,40%,40%)' },
                        ].map(l => (
                            <span key={l.label} className="pred-legend-item">
                                <span className="pred-legend-dot" style={{ background: l.color }} />
                                {l.label}
                            </span>
                        ))}
                    </div>

                    {/* Heatmap grid */}
                    <div className="heat-grid">
                        {result.predictions.map((item, i) => (
                            <HeatCell
                                key={i}
                                item={item}
                                rank={i}
                                isHovered={hovered === i}
                                onHover={setHovered}
                                onLeave={() => setHovered(null)}
                            />
                        ))}
                    </div>

                    {/* Bar chart */}
                    <div className="card" style={{ marginTop: '2.5rem' }}>
                        <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>Confidence Overview</h3>
                        <div className="pred-bar-list">
                            {result.predictions.map((item, i) => (
                                <div key={i} className="pred-bar-row">
                                    <div className="pred-bar-label">
                                        <span className="pred-bar-rank">#{i + 1}</span>
                                        <span className="pred-bar-topic">{item.topic}</span>
                                    </div>
                                    <div className="pred-bar-track">
                                        <div
                                            className="pred-bar-fill"
                                            style={{ width: `${item.confidence_score}%`, background: heatColor(item.confidence_score) }}
                                        />
                                    </div>
                                    <div className="pred-bar-pct" style={{ color: heatColor(item.confidence_score) }}>
                                        {item.confidence_score}%
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}

            {/* ── Empty state ── */}
            {!result && !loading && !error && (
                <div style={{ textAlign: 'center', padding: '5rem 2rem', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔮</div>
                    <p style={{ fontSize: '1rem' }}>
                        Enter a subject code and exam type above to generate topic predictions.
                    </p>
                </div>
            )}
        </div>
    );
}
