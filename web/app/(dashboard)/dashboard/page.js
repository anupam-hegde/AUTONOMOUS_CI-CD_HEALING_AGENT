'use client';

import { useState, useEffect } from 'react';

export default function DashboardPage() {
    const [stats, setStats] = useState(null);
    const [recentActivity, setRecentActivity] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const res = await fetch('/api/dashboard/stats');
            const data = await res.json();
            if (data.success) {
                setStats(data.stats);
                setRecentActivity(data.recentActivity || []);
            }
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
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

    return (
        <div>
            {/* Header */}
            <div style={{ marginBottom: '32px' }}>
                <h1 style={{ marginBottom: '8px' }}>Welcome back 👋</h1>
                <p style={{ color: 'var(--text-muted)' }}>
                    Here's an overview of your code compliance status.
                </p>
            </div>

            {/* Loading State */}
            {loading && (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                    <div style={{ width: '40px', height: '40px', border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
                    <p style={{ color: 'var(--text-muted)' }}>Loading dashboard...</p>
                </div>
            )}

            {!loading && (
                <>
                    {/* Stats Grid */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: '20px',
                        marginBottom: '32px',
                    }}>
                        <StatCard title="Active Projects" value={stats?.projectsCount || 0} icon="📁" />
                        <StatCard title="Total Rules" value={stats?.rulesCount || 0} icon="⚖️" />
                        <StatCard title="PRs Analyzed" value={stats?.analysesCount || 0} icon="🔍" />
                        <StatCard title="Success Rate" value={`${stats?.fixRate || 0}%`} icon="✅" />
                    </div>

                    {/* Quick Actions (shown when no data) */}
                    {stats?.projectsCount === 0 && (
                        <div className="card" style={{ textAlign: 'center', padding: '40px', marginBottom: '24px' }}>
                            <h3 style={{ marginBottom: '12px' }}>Get Started</h3>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
                                Add a project and configure compliance rules to start monitoring.
                            </p>
                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                                <a href="/projects" className="btn btn-primary">Add Project</a>
                                <a href="/rules/templates" className="btn btn-secondary">Browse Rule Templates</a>
                            </div>
                        </div>
                    )}

                    {/* Recent Activity */}
                    <div className="card">
                        <h3 style={{ marginBottom: '16px' }}>Recent Analysis Runs</h3>
                        {recentActivity.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                                <p>No analyses yet. Connect a GitHub repository and set up a webhook to start analyzing PRs.</p>
                            </div>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                                        <th style={{ padding: '12px 0', color: 'var(--text-muted)', fontWeight: '500', fontSize: '0.75rem' }}>PROJECT</th>
                                        <th style={{ padding: '12px 0', color: 'var(--text-muted)', fontWeight: '500', fontSize: '0.75rem' }}>PR</th>
                                        <th style={{ padding: '12px 0', color: 'var(--text-muted)', fontWeight: '500', fontSize: '0.75rem' }}>STATUS</th>
                                        <th style={{ padding: '12px 0', color: 'var(--text-muted)', fontWeight: '500', fontSize: '0.75rem' }}>VIOLATIONS</th>
                                        <th style={{ padding: '12px 0', color: 'var(--text-muted)', fontWeight: '500', fontSize: '0.75rem' }}>TIME</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentActivity.map((activity) => (
                                        <TableRow 
                                            key={activity.id}
                                            project={activity.project}
                                            pr={`#${activity.prNumber}`}
                                            status={activity.status?.toLowerCase() || 'pending'}
                                            violations={activity.violationsCount}
                                            time={timeAgo(activity.createdAt)}
                                        />
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </>
            )}

            <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}

function StatCard({ title, value, icon }) {
    return (
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
                width: '48px',
                height: '48px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-tertiary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
            }}>
                {icon}
            </div>
            <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>{title}</p>
                <p style={{ fontSize: '1.5rem', fontWeight: '700' }}>{value}</p>
            </div>
        </div>
    );
}

function TableRow({ project, pr, status, violations, time }) {
    const statusColors = {
        success: 'var(--accent-success)',
        warning: 'var(--accent-warning)',
        error: 'var(--accent-error)',
    };
    const statusLabels = {
        success: 'Passed',
        warning: 'Warnings',
        error: 'Failed',
    };

    return (
        <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '16px 0', fontSize: '0.875rem' }}>{project}</td>
            <td style={{ padding: '16px 0', fontSize: '0.875rem', color: 'var(--accent-primary)' }}>{pr}</td>
            <td style={{ padding: '16px 0' }}>
                <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 10px',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    background: `${statusColors[status]}20`,
                    color: statusColors[status],
                }}>
                    <span style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: statusColors[status],
                    }} />
                    {statusLabels[status]}
                </span>
            </td>
            <td style={{ padding: '16px 0', fontSize: '0.875rem' }}>{violations}</td>
            <td style={{ padding: '16px 0', fontSize: '0.875rem', color: 'var(--text-muted)' }}>{time}</td>
        </tr>
    );
}
