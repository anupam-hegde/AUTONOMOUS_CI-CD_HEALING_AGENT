'use client';

import { useState, useEffect } from 'react';

// Modern SVG Icons
const Icons = {
    history: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
        </svg>
    ),
    check: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
        </svg>
    ),
    warning: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
    ),
    error: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
    ),
    clock: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
        </svg>
    ),
    eye: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    ),
    gitBranch: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="6" y1="3" x2="6" y2="15" />
            <circle cx="18" cy="6" r="3" />
            <circle cx="6" cy="18" r="3" />
            <path d="M18 9a9 9 0 0 1-9 9" />
        </svg>
    ),
    activity: (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
    ),
    close: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    ),
};

export default function HistoryPage() {
    const [analyses, setAnalyses] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedProject, setSelectedProject] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [selectedAnalysis, setSelectedAnalysis] = useState(null);

    useEffect(() => {
        fetchProjects();
        fetchAnalyses();
    }, []);

    useEffect(() => {
        fetchAnalyses();
    }, [selectedProject, selectedStatus]);

    const fetchProjects = async () => {
        try {
            const res = await fetch('/api/projects');
            const data = await res.json();
            if (data.success) {
                setProjects(data.projects || []);
            }
        } catch (err) {
            console.error('Error fetching projects:', err);
        }
    };

    const fetchAnalyses = async () => {
        setLoading(true);
        try {
            let url = '/api/analyses?limit=50';
            if (selectedProject) url += `&projectId=${selectedProject}`;
            if (selectedStatus) url += `&status=${selectedStatus}`;
            
            const res = await fetch(url);
            const data = await res.json();
            if (data.success) {
                setAnalyses(data.analyses || []);
            }
        } catch (err) {
            console.error('Error fetching analyses:', err);
        } finally {
            setLoading(false);
        }
    };

    const timeAgo = (date) => {
        if (!date) return 'N/A';
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
        return `${Math.floor(seconds / 86400)} days ago`;
    };

    const statusConfig = {
        SUCCESS: { label: 'Passed', color: '#10b981' },
        WARNING: { label: 'Warnings', color: '#f59e0b' },
        FAILURE: { label: 'Failed', color: '#ef4444' },
        PENDING: { label: 'Pending', color: '#6b7280' },
        RUNNING: { label: 'Running', color: '#3b82f6' },
    };

    return (
        <div>
            {/* Header */}
            <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                    width: '48px',
                    height: '48px',
                    background: 'linear-gradient(135deg, var(--accent-primary), #8b5cf6)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white'
                }}>
                    {Icons.history}
                </div>
                <div>
                    <h1 style={{ marginBottom: '4px' }}>Analysis History</h1>
                    <p style={{ color: 'var(--text-muted)', margin: 0 }}>
                        View past compliance checks across all your projects.
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                <select 
                    className="input" 
                    style={{ width: '200px' }}
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                >
                    <option value="">All Projects</option>
                    {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.repoOwner}/{p.repoName}</option>
                    ))}
                </select>
                <select 
                    className="input" 
                    style={{ width: '150px' }}
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                >
                    <option value="">All Statuses</option>
                    <option value="SUCCESS">Passed</option>
                    <option value="WARNING">Warnings</option>
                    <option value="FAILURE">Failed</option>
                </select>
            </div>

            {/* Loading State */}
            {loading && (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                    <div style={{ width: '40px', height: '40px', border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
                    <p style={{ color: 'var(--text-muted)' }}>Loading history...</p>
                </div>
            )}

            {/* Empty State */}
            {!loading && analyses.length === 0 && (
                <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
                    <div style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>
                        {Icons.activity}
                    </div>
                    <h3 style={{ marginBottom: '12px' }}>No analyses yet</h3>
                    <p style={{ color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto' }}>
                        Once you set up GitHub webhooks and add rules to your projects, PR analyses will appear here.
                    </p>
                </div>
            )}

            {/* History Table */}
            {!loading && analyses.length > 0 && (
                <div className="card">
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                                <th style={{ padding: '12px 0', color: 'var(--text-muted)', fontWeight: '500', fontSize: '0.75rem' }}>PROJECT</th>
                                <th style={{ padding: '12px 0', color: 'var(--text-muted)', fontWeight: '500', fontSize: '0.75rem' }}>PR</th>
                                <th style={{ padding: '12px 0', color: 'var(--text-muted)', fontWeight: '500', fontSize: '0.75rem' }}>COMMIT</th>
                                <th style={{ padding: '12px 0', color: 'var(--text-muted)', fontWeight: '500', fontSize: '0.75rem' }}>STATUS</th>
                                <th style={{ padding: '12px 0', color: 'var(--text-muted)', fontWeight: '500', fontSize: '0.75rem' }}>VIOLATIONS</th>
                                <th style={{ padding: '12px 0', color: 'var(--text-muted)', fontWeight: '500', fontSize: '0.75rem' }}>TIME</th>
                                <th style={{ padding: '12px 0', color: 'var(--text-muted)', fontWeight: '500', fontSize: '0.75rem' }}>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {analyses.map((analysis) => {
                                const config = statusConfig[analysis.status] || statusConfig.PENDING;
                                return (
                                    <tr key={analysis.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        <td style={{ padding: '16px 0', fontSize: '0.875rem' }}>{analysis.project}</td>
                                        <td style={{ padding: '16px 0', fontSize: '0.875rem', color: 'var(--accent-primary)' }}>#{analysis.prNumber}</td>
                                        <td style={{ padding: '16px 0' }}>
                                            <code style={{
                                                fontSize: '0.75rem',
                                                padding: '4px 8px',
                                                background: 'var(--bg-tertiary)',
                                                borderRadius: '4px',
                                                fontFamily: 'var(--font-mono)',
                                            }}>
                                                {analysis.commitHash?.substring(0, 7) || 'N/A'}
                                            </code>
                                        </td>
                                        <td style={{ padding: '16px 0' }}>
                                            <span style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                padding: '4px 10px',
                                                borderRadius: '9999px',
                                                fontSize: '0.75rem',
                                                fontWeight: '500',
                                                background: `${config.color}20`,
                                                color: config.color,
                                            }}>
                                                <span style={{
                                                    width: '6px',
                                                    height: '6px',
                                                    borderRadius: '50%',
                                                    background: config.color,
                                                }} />
                                                {config.label}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px 0', fontSize: '0.875rem' }}>{analysis.violationsCount}</td>
                                        <td style={{ padding: '16px 0', fontSize: '0.875rem', color: 'var(--text-muted)' }}>{timeAgo(analysis.createdAt)}</td>
                                        <td style={{ padding: '16px 0' }}>
                                            <button 
                                                className="btn btn-secondary" 
                                                style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                                                onClick={() => setSelectedAnalysis(analysis)}
                                            >
                                                View Details
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Analysis Details Modal */}
            {selectedAnalysis && (
                <AnalysisDetailsModal 
                    analysis={selectedAnalysis} 
                    onClose={() => setSelectedAnalysis(null)} 
                />
            )}

            <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}

function AnalysisDetailsModal({ analysis, onClose }) {
    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: 'var(--card)', borderRadius: '16px', padding: '24px', width: '700px', maxWidth: '90vw', maxHeight: '80vh', overflow: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h2 style={{ margin: 0 }}>Analysis Details</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '24px' }}>×</button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                    <div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Project</p>
                        <p style={{ fontWeight: '500' }}>{analysis.project}</p>
                    </div>
                    <div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>PR Number</p>
                        <p style={{ fontWeight: '500' }}>#{analysis.prNumber}</p>
                    </div>
                    <div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Commit</p>
                        <code style={{ fontSize: '0.875rem', padding: '4px 8px', background: 'var(--bg-tertiary)', borderRadius: '4px' }}>
                            {analysis.commitHash || 'N/A'}
                        </code>
                    </div>
                    <div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Status</p>
                        <p style={{ fontWeight: '500' }}>{analysis.status}</p>
                    </div>
                </div>

                <h3 style={{ marginBottom: '16px' }}>Violations ({analysis.violationsCount})</h3>
                {analysis.violations?.length > 0 ? (
                    <div style={{ border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
                        {analysis.violations.map((v, i) => (
                            <div key={v.id || i} style={{ padding: '12px 16px', borderBottom: i < analysis.violations.length - 1 ? '1px solid var(--border)' : 'none' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                    <code style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{v.filePath}:{v.lineNumber}</code>
                                </div>
                                <p style={{ fontSize: '0.875rem' }}>{v.message}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '24px' }}>No violations found! 🎉</p>
                )}

                <div style={{ marginTop: '24px', textAlign: 'right' }}>
                    <button onClick={onClose} className="btn btn-secondary">Close</button>
                </div>
            </div>
        </div>
    );
}
