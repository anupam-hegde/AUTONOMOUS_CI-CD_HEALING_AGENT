'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NewRulePage() {
    const router = useRouter();
    const [description, setDescription] = useState('');
    const [language, setLanguage] = useState('javascript');
    const [severity, setSeverity] = useState('WARNING');
    const [generatedQuery, setGeneratedQuery] = useState('');
    const [aiExplanation, setAiExplanation] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [previewMatches, setPreviewMatches] = useState([]);
    const [isEditMode, setIsEditMode] = useState(false);
    const [querySource, setQuerySource] = useState(''); // 'template' or 'ai'
    
    // Project selection
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState('');
    const [loadingProjects, setLoadingProjects] = useState(true);

    // Fetch projects on mount
    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const res = await fetch('/api/projects');
            const data = await res.json();
            if (data.success && data.projects?.length > 0) {
                setProjects(data.projects);
                setSelectedProject(data.projects[0].id);
            }
        } catch (err) {
            console.error('Error fetching projects:', err);
        } finally {
            setLoadingProjects(false);
        }
    };

    const sampleCode = `// Sample code for preview
class user_profile {
  constructor() {
    this.user_name = "John";
    this.MAX_ATTEMPTS = 5;
    this.password = "secret123"; // Security issue
  }

  get_user_data() {
    return this.user_name;
  }

  calculateTotal() {
    return 100;
  }
}

function calculate_tax(amount) {
  return amount * 0.1;
}

const apiKey = "sk-1234567890"; // Security issue
const fetchUserData = async () => {
  // Good naming
};`;

    const handleGenerateQuery = async () => {
        if (!description.trim()) return;

        setIsLoading(true);
        setError('');
        setGeneratedQuery('');
        setAiExplanation('');
        setIsEditMode(false);

        try {
            const response = await fetch('/api/rules/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ description, language }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to generate query');
            }

            setGeneratedQuery(data.query);
            setAiExplanation(data.explanation);
            setQuerySource(data.source || 'ai');
            
            // Simple preview matching (for demo purposes)
            const matches = [];
            if (description.toLowerCase().includes('underscore') || description.toLowerCase().includes('snake')) {
                matches.push(
                    { line: 9, text: 'get_user_data', message: 'Contains underscore' },
                    { line: 21, text: 'calculate_tax', message: 'Contains underscore' },
                );
            } else if (description.toLowerCase().includes('class') && description.toLowerCase().includes('capital')) {
                matches.push({ line: 2, text: 'user_profile', message: 'Starts with lowercase' });
            } else if (description.toLowerCase().includes('password') || description.toLowerCase().includes('secret')) {
                matches.push(
                    { line: 6, text: 'password = "secret123"', message: 'Hardcoded password detected' },
                    { line: 22, text: 'apiKey = "sk-1234567890"', message: 'Hardcoded API key detected' },
                );
            }
            setPreviewMatches(matches);

        } catch (err) {
            console.error('Error:', err);
            setError(err.message || 'Failed to generate rule. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleQueryEdit = (e) => {
        setGeneratedQuery(e.target.value);
    };

    const toggleEditMode = () => {
        setIsEditMode(!isEditMode);
    };

    const handleSaveRule = async () => {
        if (!selectedProject) {
            setError('Please select a project first');
            return;
        }
        if (!description.trim()) {
            setError('Please enter a rule description');
            return;
        }

        setIsSaving(true);
        setError('');

        try {
            const res = await fetch('/api/rules', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectId: selectedProject,
                    rule: {
                        description: description.trim(),
                        language,
                        severity,
                        treeSitterQuery: generatedQuery || '',
                        aiExplanation: aiExplanation || ''
                    }
                })
            });

            const data = await res.json();
            if (data.success) {
                router.push('/rules?saved=true');
            } else {
                setError(data.error || 'Failed to save rule');
            }
        } catch (err) {
            setError('Error saving rule');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div>
            {/* Header */}
            <div style={{ marginBottom: '32px' }}>
                <h1 style={{ marginBottom: '8px' }}>Create New Rule</h1>
                <p style={{ color: 'var(--text-muted)' }}>
                    Write your rule in plain English. AI will generate the enforcement logic.
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                {/* Left: Rule Editor */}
                <div className="card">
                    <h3 style={{ marginBottom: '20px' }}>Rule Definition</h3>

                    {/* Project Select */}
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                            Target Project *
                        </label>
                        {loadingProjects ? (
                            <div style={{ padding: '12px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Loading projects...</div>
                        ) : projects.length === 0 ? (
                            <div style={{ padding: '12px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                                <p style={{ color: 'var(--accent-warning)', fontSize: '0.875rem', marginBottom: '8px' }}>No projects found</p>
                                <a href="/projects" className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '6px 12px' }}>Add a Project First</a>
                            </div>
                        ) : (
                            <select
                                className="input"
                                value={selectedProject}
                                onChange={(e) => setSelectedProject(e.target.value)}
                                style={{ cursor: 'pointer' }}
                            >
                                {projects.map(p => (
                                    <option key={p.id} value={p.id}>{p.repoOwner}/{p.repoName}</option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* Language Select */}
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                            Target Language
                        </label>
                        <select
                            className="input"
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            style={{ cursor: 'pointer' }}
                        >
                            <option value="javascript">JavaScript</option>
                            <option value="java">Java</option>
                            <option value="python">Python</option>
                        </select>
                    </div>

                    {/* Rule Description */}
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                            Rule Description (Plain English)
                        </label>
                        <textarea
                            className="textarea"
                            placeholder="Example: Function names must not contain underscores"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            style={{ minHeight: '120px' }}
                        />
                    </div>

                    {/* Severity */}
                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                            Severity
                        </label>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '10px 16px',
                                borderRadius: 'var(--radius-md)',
                                border: `1px solid ${severity === 'WARNING' ? 'var(--accent-warning)' : 'var(--border-color)'}`,
                                background: severity === 'WARNING' ? 'rgba(245, 158, 11, 0.1)' : 'transparent',
                                cursor: 'pointer',
                            }}>
                                <input
                                    type="radio"
                                    name="severity"
                                    value="WARNING"
                                    checked={severity === 'WARNING'}
                                    onChange={(e) => setSeverity(e.target.value)}
                                    style={{ display: 'none' }}
                                />
                                <span style={{ color: 'var(--accent-warning)' }}>⚠️</span>
                                Warning
                            </label>
                            <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '10px 16px',
                                borderRadius: 'var(--radius-md)',
                                border: `1px solid ${severity === 'CRITICAL' ? 'var(--accent-error)' : 'var(--border-color)'}`,
                                background: severity === 'CRITICAL' ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
                                cursor: 'pointer',
                            }}>
                                <input
                                    type="radio"
                                    name="severity"
                                    value="CRITICAL"
                                    checked={severity === 'CRITICAL'}
                                    onChange={(e) => setSeverity(e.target.value)}
                                    style={{ display: 'none' }}
                                />
                                <span style={{ color: 'var(--accent-error)' }}>🚨</span>
                                Critical (Creates Jira Ticket)
                            </label>
                        </div>
                    </div>

                    {/* Generate Button */}
                    <button
                        className="btn btn-primary"
                        onClick={handleGenerateQuery}
                        disabled={isLoading || !description.trim()}
                        style={{ width: '100%', opacity: isLoading || !description.trim() ? 0.6 : 1 }}
                    >
                        {isLoading ? '🔄 Generating with AI...' : '✨ Generate & Preview Rule'}
                    </button>

                    {/* Error Display */}
                    {error && (
                        <div style={{ 
                            marginTop: '16px', 
                            padding: '12px', 
                            background: 'rgba(239, 68, 68, 0.1)', 
                            border: '1px solid var(--accent-error)',
                            borderRadius: 'var(--radius-md)',
                            color: 'var(--accent-error)',
                            fontSize: '0.875rem'
                        }}>
                            ❌ {error}
                        </div>
                    )}

                    {/* Generated Query */}
                    {generatedQuery && (
                        <div style={{ marginTop: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                    Generated Tree-sitter Query 
                                    {querySource === 'template' && (
                                        <span style={{ 
                                            marginLeft: '8px', 
                                            padding: '2px 6px', 
                                            background: 'rgba(34, 197, 94, 0.2)', 
                                            color: 'var(--accent-success)',
                                            borderRadius: '4px',
                                            fontSize: '0.65rem'
                                        }}>
                                            ✓ Verified Template
                                        </span>
                                    )}
                                    {querySource === 'ai' && (
                                        <span style={{ 
                                            marginLeft: '8px', 
                                            padding: '2px 6px', 
                                            background: 'rgba(245, 158, 11, 0.2)', 
                                            color: 'var(--accent-warning)',
                                            borderRadius: '4px',
                                            fontSize: '0.65rem'
                                        }}>
                                            ⚠ AI Generated - Review Recommended
                                        </span>
                                    )}
                                </label>
                                <button
                                    onClick={toggleEditMode}
                                    className="btn btn-secondary"
                                    style={{ padding: '4px 10px', fontSize: '0.7rem' }}
                                >
                                    {isEditMode ? '👁 View Mode' : '✏️ Edit Query'}
                                </button>
                            </div>
                            
                            {isEditMode ? (
                                <textarea
                                    value={generatedQuery}
                                    onChange={handleQueryEdit}
                                    className="textarea"
                                    style={{ 
                                        fontFamily: 'var(--font-mono)', 
                                        fontSize: '0.75rem',
                                        minHeight: '120px',
                                        background: 'var(--bg-tertiary)',
                                    }}
                                />
                            ) : (
                                <pre className="code-block" style={{ fontSize: '0.75rem' }}>
                                    {generatedQuery}
                                </pre>
                            )}
                            
                            {isEditMode && (
                                <p style={{ 
                                    marginTop: '8px', 
                                    fontSize: '0.7rem', 
                                    color: 'var(--text-muted)',
                                    fontStyle: 'italic'
                                }}>
                                    💡 Tip: Edit the query if AI made mistakes. Use Tree-sitter S-expression syntax.
                                </p>
                            )}
                        </div>
                    )}

                    {/* AI Explanation */}
                    {aiExplanation && (
                        <div style={{ marginTop: '16px' }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                                AI Explanation
                            </label>
                            <p style={{ 
                                fontSize: '0.875rem', 
                                color: 'var(--text-secondary)',
                                padding: '12px',
                                background: 'var(--bg-tertiary)',
                                borderRadius: 'var(--radius-md)',
                                lineHeight: '1.5'
                            }}>
                                💡 {aiExplanation}
                            </p>
                        </div>
                    )}

                    {/* Save Rule Button */}
                    {generatedQuery && (
                        <button
                            className="btn btn-primary"
                            style={{ width: '100%', marginTop: '20px', opacity: isSaving || !selectedProject ? 0.6 : 1 }}
                            onClick={handleSaveRule}
                            disabled={isSaving || !selectedProject}
                        >
                            {isSaving ? '⏳ Saving...' : '💾 Save Rule'}
                        </button>
                    )}
                </div>

                {/* Right: Playground Preview */}
                <div className="card">
                    <h3 style={{ marginBottom: '20px' }}>🎮 Playground Preview</h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                        See how your rule would apply to sample code.
                    </p>

                    {/* Code Preview */}
                    <div style={{ position: 'relative' }}>
                        <pre className="code-block" style={{
                            minHeight: '300px',
                            lineHeight: '1.8',
                            fontSize: '0.8125rem',
                        }}>
                            {sampleCode.split('\n').map((line, idx) => {
                                const match = previewMatches.find(m => m.line === idx + 1);
                                return (
                                    <div key={idx} style={{
                                        background: match ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
                                        borderLeft: match ? '3px solid var(--accent-error)' : '3px solid transparent',
                                        paddingLeft: '8px',
                                        marginLeft: '-8px',
                                    }}>
                                        <span style={{ color: 'var(--text-muted)', marginRight: '16px', userSelect: 'none' }}>
                                            {String(idx + 1).padStart(2, ' ')}
                                        </span>
                                        {line}
                                        {match && (
                                            <span style={{
                                                marginLeft: '16px',
                                                fontSize: '0.75rem',
                                                color: 'var(--accent-error)',
                                                background: 'rgba(239, 68, 68, 0.2)',
                                                padding: '2px 8px',
                                                borderRadius: '4px',
                                            }}>
                                                ← {match.message}
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </pre>
                    </div>

                    {/* Match Summary */}
                    {previewMatches.length > 0 && (
                        <div style={{
                            marginTop: '16px',
                            padding: '12px 16px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                        }}>
                            <p style={{ fontSize: '0.875rem', color: 'var(--accent-error)' }}>
                                🎯 {previewMatches.length} potential violation{previewMatches.length > 1 ? 's' : ''} detected
                            </p>
                        </div>
                    )}

                    {/* Save Button */}
                    {generatedQuery && (
                        <button
                            className="btn btn-primary"
                            style={{ width: '100%', marginTop: '20px', opacity: isSaving || !selectedProject ? 0.6 : 1 }}
                            onClick={handleSaveRule}
                            disabled={isSaving || !selectedProject}
                        >
                            {isSaving ? '⏳ Saving...' : '✅ Approve & Save Rule'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
