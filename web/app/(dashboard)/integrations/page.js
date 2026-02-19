'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function IntegrationsPage() {
    const searchParams = useSearchParams();
    const installationSuccess = searchParams.get('setup_action') === 'install';
    const installationId = searchParams.get('installation_id');
    
    const [installations, setInstallations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);

    useEffect(() => {
        fetchInstallations();
    }, []);

    const fetchInstallations = async () => {
        try {
            const res = await fetch('/api/github/installations');
            const data = await res.json();
            if (data.success) {
                setInstallations(data.installations || []);
            }
        } catch (err) {
            console.error('Error fetching installations:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleInstallApp = () => {
        // Redirect to GitHub App installation page
        const appSlug = process.env.NEXT_PUBLIC_GITHUB_APP_SLUG || 'compliance-checker';
        window.location.href = `https://github.com/apps/${appSlug}/installations/new`;
    };

    const handleSyncRepos = async (installationId) => {
        setSyncing(true);
        try {
            const res = await fetch('/api/github/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ installationId })
            });
            const data = await res.json();
            if (data.success) {
                alert(`Synced ${data.projectsCreated || 0} new repositories`);
                fetchInstallations();
            } else {
                alert('Failed to sync: ' + data.error);
            }
        } catch (err) {
            alert('Error syncing repositories');
        } finally {
            setSyncing(false);
        }
    };

    return (
        <div>
            {/* Header */}
            <div style={{ marginBottom: '32px' }}>
                <h1 style={{ marginBottom: '8px' }}>Integrations</h1>
                <p style={{ color: 'var(--text-muted)' }}>
                    Connect your GitHub repositories for automated compliance checking.
                </p>
            </div>

            {/* Success Banner */}
            {installationSuccess && (
                <div className="card" style={{ 
                    background: 'rgba(16, 185, 129, 0.1)', 
                    borderColor: 'rgba(16, 185, 129, 0.3)',
                    marginBottom: '24px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '1.5rem' }}>✓</span>
                        <div>
                            <strong style={{ color: 'var(--accent-success)' }}>GitHub App Installed Successfully!</strong>
                            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                Installation ID: {installationId}. Click "Sync Repositories" to import your repos.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* GitHub Integration Card */}
            <div className="card" style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            background: 'var(--bg-tertiary)',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.5rem'
                        }}>
                            🐙
                        </div>
                        <div>
                            <h3 style={{ marginBottom: '8px' }}>GitHub</h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', maxWidth: '500px' }}>
                                Install our GitHub App to automatically analyze pull requests. 
                                The app will run compliance checks on every PR and report violations.
                            </p>
                        </div>
                    </div>
                    <button className="btn btn-primary" onClick={handleInstallApp}>
                        Install GitHub App
                    </button>
                </div>
            </div>

            {/* Installations List */}
            <div className="card">
                <h3 style={{ marginBottom: '20px' }}>Active Installations</h3>
                
                {loading ? (
                    <p style={{ color: 'var(--text-muted)' }}>Loading installations...</p>
                ) : installations.length === 0 ? (
                    <div style={{ 
                        textAlign: 'center', 
                        padding: '40px',
                        color: 'var(--text-muted)'
                    }}>
                        <p style={{ fontSize: '2rem', marginBottom: '8px' }}>🔗</p>
                        <p>No GitHub installations yet.</p>
                        <p style={{ fontSize: '0.875rem' }}>
                            Install the GitHub App to connect your repositories.
                        </p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {installations.map((inst) => (
                            <div 
                                key={inst.id}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '16px',
                                    background: 'var(--bg-tertiary)',
                                    borderRadius: '8px'
                                }}
                            >
                                <div>
                                    <strong>{inst.account || `Installation ${inst.id}`}</strong>
                                    <p style={{ 
                                        margin: 0, 
                                        color: 'var(--text-muted)', 
                                        fontSize: '0.875rem' 
                                    }}>
                                        {inst.repositoryCount || 0} repositories • 
                                        Installed {inst.createdAt ? new Date(inst.createdAt).toLocaleDateString() : 'recently'}
                                    </p>
                                </div>
                                <button 
                                    className="btn btn-secondary"
                                    onClick={() => handleSyncRepos(inst.id)}
                                    disabled={syncing}
                                >
                                    {syncing ? 'Syncing...' : 'Sync Repositories'}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* How it Works */}
            <div className="card" style={{ marginTop: '24px' }}>
                <h3 style={{ marginBottom: '20px' }}>How It Works</h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
                    <div>
                        <div style={{ 
                            width: '40px', 
                            height: '40px', 
                            borderRadius: '50%', 
                            background: 'var(--accent-primary)',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                            marginBottom: '12px'
                        }}>1</div>
                        <h4 style={{ marginBottom: '8px' }}>Install App</h4>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                            Click "Install GitHub App" and authorize access to your repositories.
                        </p>
                    </div>
                    
                    <div>
                        <div style={{ 
                            width: '40px', 
                            height: '40px', 
                            borderRadius: '50%', 
                            background: 'var(--accent-primary)',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                            marginBottom: '12px'
                        }}>2</div>
                        <h4 style={{ marginBottom: '8px' }}>Configure Rules</h4>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                            Set up compliance rules for each project using templates or custom definitions.
                        </p>
                    </div>
                    
                    <div>
                        <div style={{ 
                            width: '40px', 
                            height: '40px', 
                            borderRadius: '50%', 
                            background: 'var(--accent-primary)',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                            marginBottom: '12px'
                        }}>3</div>
                        <h4 style={{ marginBottom: '8px' }}>Automatic Checks</h4>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                            PRs are automatically analyzed and violations are reported as comments.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
