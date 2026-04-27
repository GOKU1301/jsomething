import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, NavLink } from 'react-router-dom';
import StudentDashboard from './StudentDashboard';
import TeacherDashboard from './TeacherDashboard';

function App() {
    return (
        <Router>
            <div className="App">
                <nav>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '10px',
                            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                            fontSize: '1.2rem'
                        }}>JP</div>
                        <span style={{ fontWeight: '700', fontSize: '1.25rem', letterSpacing: '-0.025em' }}>JAY_PYQS</span>
                    </div>
                    <div className="nav-links">
                        <a href="http://localhost:3000/hub" style={{ marginLeft: 0, marginRight: '2rem', color: 'var(--primary)', fontWeight: '700' }}>← HUB</a>
                        <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>Student Portal</NavLink>
                        <NavLink to="/teacher" className={({ isActive }) => isActive ? 'active' : ''}>Teacher Portal</NavLink>
                    </div>
                </nav>

                <main style={{ flex: 1 }}>
                    <Routes>
                        <Route path="/" element={<StudentDashboard />} />
                        <Route path="/teacher" element={<TeacherDashboard />} />
                    </Routes>
                </main>

                <footer style={{
                    padding: '2rem',
                    textAlign: 'center',
                    borderTop: '1px solid var(--border)',
                    color: 'var(--text-muted)',
                    fontSize: '0.875rem'
                }}>
                    © 2026 Jay Pyqs Management System. All rights reserved.
                </footer>
            </div>
        </Router>
    );
}

export default App;
