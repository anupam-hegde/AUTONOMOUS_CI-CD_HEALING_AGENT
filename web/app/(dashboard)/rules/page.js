'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

// Icons
const Icons = {
    edit: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
    ),
    delete: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
        </svg>
    ),
    close: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
        </svg>
    ),
    check: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
        </svg>
    ),
    plus: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14"/><path d="M5 12h14"/>
        </svg>
    ),
    template: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <line x1="3" y1="9" x2="21" y2="9"/>
            <line x1="9" y1="21" x2="9" y2="9"/>
        </svg>
    )
};

export default function RulesPage() {
    const searchParams = useSearchParams();
    const [rules, setRules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState(null);
    const [editingRule, setEditingRule] = useState(null);
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [pendingTemplates, setPendingTemplates] = useState([]);
    const [savingTemplates, setSavingTemplates] = useState(false);

    // Check for templates from localStorage on mount
    useEffect(() => {
        const fromTemplates = searchParams.get('fromTemplates');
        if (fromTemplates === 'true') {
            const storedTemplates = localStorage.getItem('selectedTemplates');
            if (storedTemplates) {
                try {
                    const templateIds = JSON.parse(storedTemplates);
                    if (templateIds.length > 0) {
                        fetchTemplatesById(templateIds);
                    }
                } catch (e) {
                    console.error('Error parsing templates:', e);
                }
                // Clear after reading
                localStorage.removeItem('selectedTemplates');
            }
        }
    }, [searchParams]);

    // Fetch templates by IDs and show modal
    const fetchTemplatesById = async (templateIds) => {
        try {
            const res = await fetch('/api/rules/templates?format=abstract');
            const data = await res.json();
            if (data.success) {
                const selectedRules = data.rules.filter(r => templateIds.includes(r.id));
                if (selectedRules.length > 0) {
                    setPendingTemplates(selectedRules);
                    setShowTemplateModal(true);
                }
            }
        } catch (err) {
            console.error('Error fetching templates:', err);
        }
    };

    // Fetch projects
    useEffect(() => {
        fetchProjects();
    }, []);

    // Fetch rules when project changes
    useEffect(() => {
        if (selectedProject) {
            fetchRules();
        }
    }, [selectedProject]);

    const fetchProjects = async () => {
        try {
            const res = await fetch('/api/projects');
            const data = await res.json();
            if (data.success && data.projects?.length > 0) {
                setProjects(data.projects);
                setSelectedProject(data.projects[0].id);
            } else {
                setProjects([]);
                setLoading(false);
            }
        } catch (err) {
            console.error('Error fetching projects:', err);
            setLoading(false);
        }
    };

    const fetchRules = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/rules?projectId=${selectedProject}`);
            const data = await res.json();
            if (data.success) {
                setRules(data.rules);
            }
        } catch (err) {
            console.error('Error fetching rules:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveTemplates = async () => {
        if (!selectedProject || pendingTemplates.length === 0) return;
        
        setSavingTemplates(true);
        try {
            const rulesToCreate = pendingTemplates.map(t => ({
                description: t.description,
                displayName: t.displayName,
                name: t.name,
                language: 'javascript',
                severity: t.severity,
                treeSitterQuery: '',
                aiExplanation: `From template: ${t.name} (${t.patternType})`
            }));

            const res = await fetch('/api/rules', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectId: selectedProject,
                    rules: rulesToCreate
                })
            });

            const data = await res.json();
            if (data.success) {
                setShowTemplateModal(false);
                setPendingTemplates([]);
                fetchRules();
            } else {
                alert('Failed to save rules: ' + data.error);
            }
        } catch (err) {
            alert('Error saving rules');
        } finally {
            setSavingTemplates(false);
        }
    };

    const handleUpdateRule = async (updatedRule) => {
        try {
            const res = await fetch('/api/rules', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedRule)
            });

            const data = await res.json();
            if (data.success) {
                setRules(rules.map(r => r.id === updatedRule.id ? data.rule : r));
                setEditingRule(null);
            } else {
                alert('Failed to update rule: ' + data.error);
            }
        } catch (err) {
            alert('Error updating rule');
        }
    };

    const handleDeleteRule = async (ruleId) => {
        if (!confirm('Are you sure you want to delete this rule?')) return;
        
        try {
            const res = await fetch(`/api/rules?id=${ruleId}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                setRules(rules.filter(r => r.id !== ruleId));
            }
        } catch (err) {
            alert('Error deleting rule');
        }
    };

    const handleToggleActive = async (rule) => {
        await handleUpdateRule({ id: rule.id, isActive: !rule.isActive });
    };

    if (!loading && projects.length === 0) {
        return (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <h2 style={{ marginBottom: '16px' }}>No Projects Found</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
                    Connect a GitHub repository first to start adding compliance rules.
                </p>
                <a href="/projects" className="btn btn-primary">Go to Projects</a>
            </div>
        );
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ marginBottom: '8px' }}>Compliance Rules</h1>
                    <p style={{ color: 'var(--text-muted)' }}>
                        Define rules in plain English. AI will convert them to enforcement logic.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <a href="/rules/templates" className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {Icons.template} Browse Templates
                    </a>
                    <a href="/rules/new" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {Icons.plus} Add New Rule
                    </a>
                </div>
            </div>

            {projects.length > 1 && (
                <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Select Project</label>
                    <select
                        value={selectedProject || ''}
                        onChange={(e) => setSelectedProject(e.target.value)}
                        style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--text)', fontSize: '14px', minWidth: '250px' }}
                    >
                        {projects.map(p => (
                            <option key={p.id} value={p.id}>{p.repoOwner}/{p.repoName}</option>
                        ))}
                    </select>
                </div>
            )}

            {loading && (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                    <div style={{ width: '40px', height: '40px', border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
                    <p style={{ color: 'var(--text-muted)' }}>Loading rules...</p>
                </div>
            )}

            {!loading && rules.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
                    <h3 style={{ marginBottom: '12px' }}>No rules yet</h3>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Start by adding rules from templates or creating custom ones.</p>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                        <a href="/rules/templates" className="btn btn-primary">Browse Templates</a>
                        <a href="/rules/new" className="btn btn-secondary">Create Custom Rule</a>
                    </div>
                </div>
            ) : !loading && (
                <div className="card">
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                                <th style={{ padding: '12px 0', color: 'var(--text-muted)', fontWeight: '500', fontSize: '0.75rem' }}>RULE DESCRIPTION</th>
                                <th style={{ padding: '12px 0', color: 'var(--text-muted)', fontWeight: '500', fontSize: '0.75rem' }}>LANGUAGE</th>
                                <th style={{ padding: '12px 0', color: 'var(--text-muted)', fontWeight: '500', fontSize: '0.75rem' }}>SEVERITY</th>
                                <th style={{ padding: '12px 0', color: 'var(--text-muted)', fontWeight: '500', fontSize: '0.75rem' }}>STATUS</th>
                                <th style={{ padding: '12px 0', color: 'var(--text-muted)', fontWeight: '500', fontSize: '0.75rem' }}>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rules.map((rule) => (
                                <RuleRow 
                                    key={rule.id} 
                                    rule={rule} 
                                    onEdit={() => setEditingRule(rule)}
                                    onDelete={() => handleDeleteRule(rule.id)}
                                    onToggleActive={() => handleToggleActive(rule)}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {editingRule && <EditRuleModal rule={editingRule} onClose={() => setEditingRule(null)} onSave={handleUpdateRule} />}
            {showTemplateModal && <TemplateImportModal templates={pendingTemplates} projects={projects} selectedProject={selectedProject} onProjectChange={setSelectedProject} onClose={() => { setShowTemplateModal(false); setPendingTemplates([]); }} onSave={handleSaveTemplates} saving={savingTemplates} />}

            <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}

function RuleRow({ rule, onEdit, onDelete, onToggleActive }) {
    const severityColors = { WARNING: '#f59e0b', CRITICAL: '#ef4444' };

    return (
        <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '16px 0', fontSize: '0.875rem', maxWidth: '400px' }}>{rule.description}</td>
            <td style={{ padding: '16px 0' }}>
                <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>{rule.language}</span>
            </td>
            <td style={{ padding: '16px 0' }}>
                <span style={{ padding: '4px 10px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '500', background: `${severityColors[rule.severity]}20`, color: severityColors[rule.severity] }}>{rule.severity}</span>
            </td>
            <td style={{ padding: '16px 0' }}>
                <button onClick={onToggleActive} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: rule.isActive ? '#10b981' : 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: '4px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: rule.isActive ? '#10b981' : 'var(--text-muted)' }} />
                    {rule.isActive ? 'Active' : 'Disabled'}
                </button>
            </td>
            <td style={{ padding: '16px 0' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={onEdit} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>{Icons.edit} Edit</button>
                    <button onClick={onDelete} style={{ padding: '6px 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px', cursor: 'pointer' }}>{Icons.delete}</button>
                </div>
            </td>
        </tr>
    );
}

function EditRuleModal({ rule, onClose, onSave }) {
    const [formData, setFormData] = useState({ id: rule.id, description: rule.description, language: rule.language, severity: rule.severity, treeSitterQuery: rule.treeSitterQuery || '', isActive: rule.isActive });
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e) => { e.preventDefault(); setSaving(true); await onSave(formData); setSaving(false); };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: 'var(--card)', borderRadius: '16px', padding: '24px', width: '600px', maxWidth: '90vw', maxHeight: '90vh', overflow: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h2 style={{ margin: 0 }}>Edit Rule</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>{Icons.close}</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Description</label>
                        <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '14px', resize: 'vertical' }} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Language</label>
                            <select value={formData.language} onChange={(e) => setFormData({ ...formData, language: e.target.value })} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '14px' }}>
                                <option value="javascript">JavaScript</option>
                                <option value="typescript">TypeScript</option>
                                <option value="python">Python</option>
                                <option value="java">Java</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Severity</label>
                            <select value={formData.severity} onChange={(e) => setFormData({ ...formData, severity: e.target.value })} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '14px' }}>
                                <option value="WARNING">Warning</option>
                                <option value="CRITICAL">Critical</option>
                            </select>
                        </div>
                    </div>
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Tree-sitter Query (Optional)</label>
                        <textarea value={formData.treeSitterQuery} onChange={(e) => setFormData({ ...formData, treeSitterQuery: e.target.value })} rows={4} placeholder="Leave empty to auto-generate with AI" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '13px', fontFamily: 'monospace', resize: 'vertical' }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
                        <input type="checkbox" id="isActive" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} />
                        <label htmlFor="isActive">Rule is active</label>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                        <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function TemplateImportModal({ templates, projects, selectedProject, onProjectChange, onClose, onSave, saving }) {
    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: 'var(--card)', borderRadius: '16px', padding: '24px', width: '600px', maxWidth: '90vw', maxHeight: '90vh', overflow: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h2 style={{ margin: 0 }}>Import {templates.length} Rules</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>{Icons.close}</button>
                </div>
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Select Project</label>
                    <select value={selectedProject || ''} onChange={(e) => onProjectChange(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '14px' }}>
                        {projects.map(p => (<option key={p.id} value={p.id}>{p.repoOwner}/{p.repoName}</option>))}
                    </select>
                </div>
                <div style={{ marginBottom: '20px' }}>
                    <h4 style={{ marginBottom: '12px' }}>Rules to Import:</h4>
                    <div style={{ maxHeight: '300px', overflow: 'auto', border: '1px solid var(--border)', borderRadius: '8px' }}>
                        {templates.map((t, i) => (
                            <div key={t.id} style={{ padding: '12px 16px', borderBottom: i < templates.length - 1 ? '1px solid var(--border)' : 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span style={{ color: '#10b981' }}>{Icons.check}</span>
                                <div>
                                    <div style={{ fontWeight: '500' }}>{t.displayName || t.name}</div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t.category} • {t.severity}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    <button onClick={onClose} className="btn btn-secondary">Cancel</button>
                    <button onClick={onSave} className="btn btn-primary" disabled={saving || !selectedProject}>{saving ? 'Importing...' : `Import ${templates.length} Rules`}</button>
                </div>
            </div>
        </div>
    );
}