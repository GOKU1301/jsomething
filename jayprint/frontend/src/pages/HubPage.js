import React from 'react';
import './HubPage.css';

const JAYPYQS_URL = 'http://localhost:3001';  // JayPyQs frontend

const HubPage = () => {
    return (
        <div className="hub-root">
            {/* ── Header ── */}
            <header className="hub-header">
                <div className="hub-logo-row">
                    <div className="hub-logo-badge">🎓</div>
                    <span className="hub-logo-text">JIIT Hub</span>
                </div>
                <p className="hub-tagline">College Services Portal</p>
            </header>

            {/* ── App Grid ── */}
            <div className="hub-grid">

                {/* ── JayPrint Card ── */}
                <a
                    id="hub-jayprint-btn"
                    className="hub-app-card jayprint-card"
                    href="/select-role"
                    rel="noopener noreferrer"
                    title="Open JayPrint"
                >
                    <div className="hub-card-icon">🖨️</div>
                    <div className="hub-card-body">
                        <h2 className="hub-card-title">JayPrint</h2>
                        <p className="hub-card-desc">
                            Digital printing management — upload files, pay online, and track your print orders in real time.
                        </p>
                    </div>
                    <div className="hub-card-pills">
                        <span className="hub-pill">Print Queue</span>
                        <span className="hub-pill">Payments</span>
                        <span className="hub-pill">Admin Panel</span>
                    </div>
                    <span className="hub-status">Live</span>
                    <span className="hub-card-arrow">→</span>
                </a>

                {/* ── JayPyQs Card ── */}
                <a
                    id="hub-jaypyqs-btn"
                    className="hub-app-card jaypyqs-card"
                    href={JAYPYQS_URL}
                    rel="noopener noreferrer"
                    title="Open JayPyQs"
                >
                    <div className="hub-card-icon">📚</div>
                    <div className="hub-card-body">
                        <h2 className="hub-card-title">JayPyQs</h2>
                        <p className="hub-card-desc">
                            Previous Year Questions portal — browse, search, and submit exam papers organised by subject and year.
                        </p>
                    </div>
                    <div className="hub-card-pills">
                        <span className="hub-pill">PYQ Browser</span>
                        <span className="hub-pill">Upload</span>
                        <span className="hub-pill">Teacher Panel</span>
                    </div>
                    <span className="hub-status">Live</span>
                    <span className="hub-card-arrow">→</span>
                </a>

            </div>

            <p className="hub-footer">JIIT College · All Services © 2026</p>
        </div>
    );
};

export default HubPage;
