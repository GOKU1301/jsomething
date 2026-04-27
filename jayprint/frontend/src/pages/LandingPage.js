import React from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <div className="landing-container">
            <div className="landing-card">
                <button
                    onClick={() => navigate('/hub')}
                    style={{
                        position: 'absolute', top: '1rem', left: '1rem',
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: '#667eea', fontSize: '0.85rem', fontWeight: 600,
                        display: 'flex', alignItems: 'center', gap: '0.3rem',
                        padding: '0.3rem 0.6rem', borderRadius: '8px',
                        transition: 'background 0.2s',
                    }}
                    onMouseOver={e => e.currentTarget.style.background = 'rgba(102,126,234,0.1)'}
                    onMouseOut={e => e.currentTarget.style.background = 'none'}
                    title="Back to Hub"
                >
                    ← Hub
                </button>
                <div className="landing-header">
                    <h1>🖨️ JayPrint</h1>
                    <p>Select your role to continue</p>
                </div>

                <div className="landing-options">
                    <div
                        className="role-card student-card"
                        onClick={() => navigate('/login/student')}
                    >
                        <div className="role-icon">
                            👨‍🎓
                        </div>
                        <div className="role-info">
                            <h3>Student</h3>
                            <p>Upload files, print documents, and track orders</p>
                        </div>
                    </div>

                    <div
                        className="role-card admin-card"
                        onClick={() => navigate('/login/admin')}
                    >
                        <div className="role-icon">
                            🛡️
                        </div>
                        <div className="role-info">
                            <h3>Admin</h3>
                            <p>Manage queue, update status, and handle requests</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LandingPage;
