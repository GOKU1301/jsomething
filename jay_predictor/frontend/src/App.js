import React from 'react';
import './index.css';
import PredictorDashboard from './PredictorDashboard';

export default function App() {
    return (
        <div className="app-shell">
            {/* ── Nav ── */}
            <nav>
                <div className="nav-brand">
                    <div className="nav-badge">🔮</div>
                    <span className="nav-title">JayPredictor</span>
                </div>
                <a className="nav-hub-link" href="http://localhost:3000/hub">← JIIT Hub</a>
            </nav>

            {/* ── Main ── */}
            <main style={{ flex: 1 }}>
                <PredictorDashboard />
            </main>

            <footer>
                © 2026 JayPredictor · JIIT Hub Ecosystem
            </footer>
        </div>
    );
}
