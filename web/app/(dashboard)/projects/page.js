'use client';

import { useState, useEffect } from 'react';

// Icons
const Icons = {
    plus: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14"/><path d="M5 12h14"/>
        </svg>
    ),
    close: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
        </svg>
    ),
    github: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
        </svg>
    ),
    delete: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
        </svg>
    ),
    rules: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
        </svg>
    ),
    external: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
            <polyline points="15 3 21 3 21 9"/>
            <line x1="10" y1="14" x2="21" y2="3"/>
        </svg>
    )
};

export default function ProjectsPage() {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [deleting, setDeleting] = useState(null);

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const res = await fetch('/api/projects');
            const data = await res.json();
            if (data.success) {
                setProjects(data.projects || []);
            }
        } catch (err) {
            console.error('Error fetching projects:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteProject = async (projectId) => {
        if (!confirm('Are you sure you want to delete this project? All associated rules and analysis history will be lost.')) return;
        
        setDeleting(projectId);
        try {
            const res = await fetch(`/api/projects?id=${projectId}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                setProjects(projects.filter(p => p.id !== projectId));
            } else {
                alert('Failed to delete project: ' + data.error);
            }
        } catch (err) {
            alert('Error deleting project');
        } finally {
            setDeleting(null);
        }
    };

    const handleProjectAdded = (newProject) => {
        setProjects([newProject, ...projects]);
        setShowAddModal(false);
    };

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ marginBottom: '8px' }}>Connected Projects</h1>
                    <p style={{ color: 'var(--text-muted)' }}>
                        Repositories linked to your compliance monitoring.
                    </p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowAddModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {Icons.plus} Add Project
                </button>
            </div>

            {/* Loading State */}
            {loading && (
                <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                    <div style={{ width: '40px', height: '40px', border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
                    <p style={{ color: 'var(--text-muted)' }}>Loading projects...</p>
                </div>
            )}

            {/* Empty State */}
            {!loading && projects.length === 0 && (
                <div className="card" style={{ textAlign: 'center', padding: '60px 40px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📁</div>
                    <h2 style={{ marginBottom: '12px' }}>No projects yet</h2>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '24px', maxWidth: '400px', margin: '0 auto 24px' }}>
                        Add a GitHub repository to start monitoring code compliance on pull requests.
                    </p>
                    <button className="btn btn-primary" onClick={() => setShowAddModal(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                        {Icons.github} Add Your First Project
                    </button>
                </div>
            )}

            {/* Projects Grid */}
            {!loading && projects.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                    {projects.map((project) => (
                        <ProjectCard 
                            key={project.id} 
                            project={project} 
                            onDelete={() => handleDeleteProject(project.id)}
                            deleting={deleting === project.id}
                        />
                    ))}
                </div>
            )}

            {/* Add Project Modal */}
            {showAddModal && (
                <AddProjectModal 
                    onClose={() => setShowAddModal(false)} 
                    onProjectAdded={handleProjectAdded}
                />
            )}

            <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}

function ProjectCard({ project, onDelete, deleting }) {
    const timeAgo = (date) => {
        if (!date) return 'Never';
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
        return `${Math.floor(seconds / 86400)} days ago`;
    };

    return (
        <div className="card" style={{ position: 'relative' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                        {Icons.github}
                    </div>
                    <div>
                        <h3 style={{ fontSize: '1rem', marginBottom: '2px' }}>{project.repoName}</h3>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{project.repoOwner}</p>
                    </div>
                </div>
                <a 
                    href={project.repoUrl || `https://github.com/${project.repoOwner}/${project.repoName}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ color: 'var(--text-muted)', padding: '4px' }}
                    title="Open in GitHub"
                >
                    {Icons.external}
                </a>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                <div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Rules</p>
                    <p style={{ fontSize: '1.25rem', fontWeight: '600' }}>{project.rulesCount || 0}</p>
                </div>
                <div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Analyses</p>
                    <p style={{ fontSize: '1.25rem', fontWeight: '600' }}>{project.analysisCount || 0}</p>
                </div>
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Added {timeAgo(project.createdAt)}
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <a href={`/rules?projectId=${project.id}`} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {Icons.rules} Rules
                    </a>
                    <button 
                        onClick={onDelete} 
                        disabled={deleting}
                        style={{ padding: '6px 10px', fontSize: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px', cursor: deleting ? 'wait' : 'pointer', opacity: deleting ? 0.5 : 1 }}
                    >
                        {Icons.delete}
                    </button>
                </div>
            </div>
        </div>
    );
}

function AddProjectModal({ onClose, onProjectAdded }) {
    const [formData, setFormData] = useState({ repoOwner: '', repoName: '', repoUrl: '' });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.repoOwner.trim() || !formData.repoName.trim()) {
            setError('Repository owner and name are required');
            return;
        }

        setSaving(true);
        try {
            const repoUrl = formData.repoUrl || `https://github.com/${formData.repoOwner}/${formData.repoName}`;
            const res = await fetch('/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    repoOwner: formData.repoOwner.trim(),
                    repoName: formData.repoName.trim(),
                    repoUrl: repoUrl,
                    githubRepoId: Date.now() // Temporary ID for manual creation
                })
            });

            const data = await res.json();
            if (data.success) {
                onProjectAdded(data.project);
            } else {
                setError(data.error || 'Failed to create project');
            }
        } catch (err) {
            setError('Error creating project');
        } finally {
            setSaving(false);
        }
    };

    const handleRepoUrlChange = (url) => {
        setFormData({ ...formData, repoUrl: url });
        // Auto-extract owner/name from GitHub URL
        const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
        if (match) {
            setFormData({ repoUrl: url, repoOwner: match[1], repoName: match[2].replace('.git', '') });
        }
    };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: 'var(--card)', borderRadius: '16px', padding: '24px', width: '500px', maxWidth: '90vw' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h2 style={{ margin: 0 }}>Add Project</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>{Icons.close}</button>
                </div>

                <form onSubmit={handleSubmit}>
                    {error && (
                        <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', marginBottom: '20px', color: '#ef4444', fontSize: '14px' }}>
                            {error}
                        </div>
                    )}

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>GitHub Repository URL (optional)</label>
                        <input
                            type="text"
                            value={formData.repoUrl}
                            onChange={(e) => handleRepoUrlChange(e.target.value)}
                            placeholder="https://github.com/owner/repo"
                            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '14px' }}
                        />
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>Paste a URL to auto-fill owner and repo name</p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Repository Owner *</label>
                            <input
                                type="text"
                                value={formData.repoOwner}
                                onChange={(e) => setFormData({ ...formData, repoOwner: e.target.value })}
                                placeholder="e.g. acme-corp"
                                required
                                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '14px' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Repository Name *</label>
                            <input
                                type="text"
                                value={formData.repoName}
                                onChange={(e) => setFormData({ ...formData, repoName: e.target.value })}
                                placeholder="e.g. backend-api"
                                required
                                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '14px' }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                        <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {saving ? 'Adding...' : <>{Icons.plus} Add Project</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
