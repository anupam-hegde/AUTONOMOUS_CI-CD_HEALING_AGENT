'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Modern SVG Icons
const Icons = {
    security: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            <path d="M12 8v4"/><path d="M12 16h.01"/>
        </svg>
    ),
    naming: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/>
        </svg>
    ),
    style: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
        </svg>
    ),
    bestPractice: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v4"/><path d="m6.8 15-3.5 2"/><path d="m20.7 17-3.5-2"/>
            <path d="M6.8 9 3.3 7"/><path d="m20.7 7-3.5 2"/><circle cx="12" cy="12" r="4"/>
        </svg>
    ),
    performance: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
        </svg>
    ),
    accessibility: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="4" r="2"/><path d="m7 21 3-9"/><path d="m17 21-3-9"/>
            <path d="M12 12H6a2 2 0 0 0-2 2v0a2 2 0 0 0 2 2h0"/><path d="M12 12h6a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2h0"/>
            <path d="M12 12V6"/>
        </svg>
    ),
    search: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
        </svg>
    ),
    filter: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
        </svg>
    ),
    check: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
        </svg>
    ),
    arrowRight: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
        </svg>
    ),
    close: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
        </svg>
    ),
    javascript: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M0 0h24v24H0V0zm22.034 18.276c-.175-1.095-.888-2.015-3.003-2.873-.736-.345-1.554-.585-1.797-1.14-.091-.33-.105-.51-.046-.705.15-.646.915-.84 1.515-.66.39.12.75.42.976.9 1.034-.676 1.034-.676 1.755-1.125-.27-.42-.404-.601-.586-.78-.63-.705-1.469-1.065-2.834-1.034l-.705.089c-.676.165-1.32.525-1.71 1.005-1.14 1.291-.811 3.541.569 4.471 1.365 1.02 3.361 1.244 3.616 2.205.24 1.17-.87 1.545-1.966 1.41-.811-.18-1.26-.586-1.755-1.336l-1.83 1.051c.21.48.45.689.81 1.109 1.74 1.756 6.09 1.666 6.871-1.004.029-.09.24-.705.074-1.65l.046.067zm-8.983-7.245h-2.248c0 1.938-.009 3.864-.009 5.805 0 1.232.063 2.363-.138 2.711-.33.689-1.18.601-1.566.48-.396-.196-.597-.466-.83-.855-.063-.105-.11-.196-.127-.196l-1.825 1.125c.305.63.75 1.172 1.324 1.517.855.51 2.004.675 3.207.405.783-.226 1.458-.691 1.811-1.411.51-.93.402-2.07.397-3.346.012-2.054 0-4.109 0-6.179l.004-.056z"/>
        </svg>
    ),
    typescript: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M1.125 0C.502 0 0 .502 0 1.125v21.75C0 23.498.502 24 1.125 24h21.75c.623 0 1.125-.502 1.125-1.125V1.125C24 .502 23.498 0 22.875 0zm17.363 9.75c.612 0 1.154.037 1.627.111a6.38 6.38 0 0 1 1.306.34v2.458a3.95 3.95 0 0 0-.643-.361 5.093 5.093 0 0 0-.717-.26 5.453 5.453 0 0 0-1.426-.2c-.3 0-.573.028-.819.086a2.1 2.1 0 0 0-.623.242c-.17.104-.3.229-.393.374a.888.888 0 0 0-.14.49c0 .196.053.373.156.529.104.156.252.304.443.444s.423.276.696.41c.273.135.582.274.926.416.47.197.892.407 1.266.628.374.222.695.473.963.753.268.279.472.598.614.957.142.359.214.776.214 1.253 0 .657-.125 1.21-.373 1.656a3.033 3.033 0 0 1-1.012 1.085 4.38 4.38 0 0 1-1.487.596c-.566.12-1.163.18-1.79.18a9.916 9.916 0 0 1-1.84-.164 5.544 5.544 0 0 1-1.512-.493v-2.63a5.033 5.033 0 0 0 3.237 1.2c.333 0 .624-.03.872-.09.249-.06.456-.144.623-.25.166-.108.29-.234.373-.38a1.023 1.023 0 0 0-.074-1.089 2.12 2.12 0 0 0-.537-.5 5.597 5.597 0 0 0-.807-.444 27.72 27.72 0 0 0-1.007-.436c-.918-.383-1.602-.852-2.053-1.405-.45-.553-.676-1.222-.676-2.005 0-.614.123-1.141.369-1.582.246-.441.58-.804 1.004-1.089a4.494 4.494 0 0 1 1.47-.629 7.536 7.536 0 0 1 1.77-.201zm-15.113.188h9.563v2.166H9.506v9.646H6.789v-9.646H3.375z"/>
        </svg>
    ),
    python: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M14.25.18l.9.2.73.26.59.3.45.32.34.34.25.34.16.33.1.3.04.26.02.2-.01.13V8.5l-.05.63-.13.55-.21.46-.26.38-.3.31-.33.25-.35.19-.35.14-.33.1-.3.07-.26.04-.21.02H8.77l-.69.05-.59.14-.5.22-.41.27-.33.32-.27.35-.2.36-.15.37-.1.35-.07.32-.04.27-.02.21v3.06H3.17l-.21-.03-.28-.07-.32-.12-.35-.18-.36-.26-.36-.36-.35-.46-.32-.59-.28-.73-.21-.88-.14-1.05-.05-1.23.06-1.22.16-1.04.24-.87.32-.71.36-.57.4-.44.42-.33.42-.24.4-.16.36-.1.32-.05.24-.01h.16l.06.01h8.16v-.83H6.18l-.01-2.75-.02-.37.05-.34.11-.31.17-.28.25-.26.31-.23.38-.2.44-.18.51-.15.58-.12.64-.1.71-.06.77-.04.84-.02 1.27.05zm-6.3 1.98l-.23.33-.08.41.08.41.23.34.33.22.41.09.41-.09.33-.22.23-.34.08-.41-.08-.41-.23-.33-.33-.22-.41-.09-.41.09zm13.09 3.95l.28.06.32.12.35.18.36.27.36.35.35.47.32.59.28.73.21.88.14 1.04.05 1.23-.06 1.23-.16 1.04-.24.86-.32.71-.36.57-.4.45-.42.33-.42.24-.4.16-.36.09-.32.05-.24.02-.16-.01h-8.22v.82h5.84l.01 2.76.02.36-.05.34-.11.31-.17.29-.25.25-.31.24-.38.2-.44.17-.51.15-.58.13-.64.09-.71.07-.77.04-.84.01-1.27-.04-1.07-.14-.9-.2-.73-.25-.59-.3-.45-.33-.34-.34-.25-.34-.16-.33-.1-.3-.04-.25-.02-.2.01-.13v-5.34l.05-.64.13-.54.21-.46.26-.38.3-.32.33-.24.35-.2.35-.14.33-.1.3-.06.26-.04.21-.02.13-.01h5.84l.69-.05.59-.14.5-.21.41-.28.33-.32.27-.35.2-.36.15-.36.1-.35.07-.32.04-.28.02-.21V6.07h2.09l.14.01zm-6.47 14.25l-.23.33-.08.41.08.41.23.33.33.23.41.08.41-.08.33-.23.23-.33.08-.41-.08-.41-.23-.33-.33-.23-.41-.08-.41.08z"/>
        </svg>
    ),
    java: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8.851 18.56s-.917.534.653.714c1.902.218 2.874.187 4.969-.211 0 0 .552.346 1.321.646-4.699 2.013-10.633-.118-6.943-1.149M8.276 15.933s-1.028.761.542.924c2.032.209 3.636.227 6.413-.308 0 0 .384.389.987.602-5.679 1.661-12.007.13-7.942-1.218M13.116 11.475c1.158 1.333-.304 2.533-.304 2.533s2.939-1.518 1.589-3.418c-1.261-1.772-2.228-2.652 3.007-5.688 0-.001-8.216 2.051-4.292 6.573M19.33 20.504s.679.559-.747.991c-2.712.822-11.288 1.069-13.669.033-.856-.373.75-.89 1.254-.998.527-.114.828-.093.828-.093-.953-.671-6.156 1.317-2.643 1.887 9.58 1.553 17.462-.7 14.977-1.82M9.292 13.21s-4.362 1.036-1.544 1.412c1.189.159 3.561.123 5.77-.062 1.806-.152 3.618-.477 3.618-.477s-.637.272-1.098.587c-4.429 1.165-12.986.623-10.522-.568 2.082-1.006 3.776-.892 3.776-.892M17.116 17.584c4.503-2.34 2.421-4.589.968-4.285-.355.074-.515.138-.515.138s.132-.207.385-.297c2.875-1.011 5.086 2.981-.928 4.562 0-.001.07-.062.09-.118M14.401 0s2.494 2.494-2.365 6.33c-3.896 3.077-.889 4.832 0 6.836-2.274-2.053-3.943-3.858-2.824-5.539 1.644-2.469 6.197-3.665 5.189-7.627M9.734 23.924c4.322.277 10.959-.153 11.116-2.198 0 0-.302.775-3.572 1.391-3.688.694-8.239.613-10.937.168 0-.001.553.457 3.393.639"/>
        </svg>
    )
};

const categoryConfig = {
    SECURITY: { icon: Icons.security, label: 'Security', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' },
    NAMING: { icon: Icons.naming, label: 'Naming Conventions', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)' },
    STYLE: { icon: Icons.style, label: 'Code Style', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
    BEST_PRACTICE: { icon: Icons.bestPractice, label: 'Best Practices', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
    PERFORMANCE: { icon: Icons.performance, label: 'Performance', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
    ACCESSIBILITY: { icon: Icons.accessibility, label: 'Accessibility', color: '#ec4899', bg: 'rgba(236, 72, 153, 0.1)' }
};

const languageConfig = {
    javascript: { icon: Icons.javascript, label: 'JavaScript', color: '#f7df1e' },
    typescript: { icon: Icons.typescript, label: 'TypeScript', color: '#3178c6' },
    python: { icon: Icons.python, label: 'Python', color: '#3776ab' },
    java: { icon: Icons.java, label: 'Java', color: '#ed8b00' }
};

const severityConfig = {
    WARNING: { bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b', border: 'rgba(245, 158, 11, 0.3)' },
    CRITICAL: { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444', border: 'rgba(239, 68, 68, 0.3)' }
};

export default function RuleTemplatesPage() {
    const router = useRouter();
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('ALL');
    const [selectedLanguage, setSelectedLanguage] = useState('all');
    const [selectedTemplates, setSelectedTemplates] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedTemplate, setExpandedTemplate] = useState(null);

    const [supportedLanguages, setSupportedLanguages] = useState([]);

    useEffect(() => {
        fetchTemplates();
    }, [selectedLanguage]);

    const fetchTemplates = async () => {
        try {
            // Use generated format with language for Tree-sitter queries
            // Or abstract format for language-independent rules
            const format = selectedLanguage !== 'all' ? 'generated' : 'abstract';
            const langParam = selectedLanguage !== 'all' ? `&language=${selectedLanguage}` : '';
            const res = await fetch(`/api/rules/templates?format=${format}${langParam}`);
            const data = await res.json();
            if (data.success) {
                // API returns 'rules' for abstract format, 'templates' for generated format
                setTemplates(data.rules || data.templates || []);
                if (data.supportedLanguages) {
                    setSupportedLanguages(data.supportedLanguages);
                }
            } else {
                setError('Failed to load templates');
            }
        } catch (err) {
            setError('Error connecting to server');
        } finally {
            setLoading(false);
        }
    };

    const toggleTemplate = (templateId) => {
        setSelectedTemplates(prev => 
            prev.includes(templateId)
                ? prev.filter(id => id !== templateId)
                : [...prev, templateId]
        );
    };

    const selectAllInCategory = (category) => {
        const categoryTemplates = filteredTemplates.filter(t => t.category === category);
        const categoryIds = categoryTemplates.map(t => t.id);
        const allSelected = categoryIds.every(id => selectedTemplates.includes(id));
        
        if (allSelected) {
            setSelectedTemplates(prev => prev.filter(id => !categoryIds.includes(id)));
        } else {
            setSelectedTemplates(prev => [...new Set([...prev, ...categoryIds])]);
        }
    };

    const filteredTemplates = templates.filter(t => {
        const matchesCategory = selectedCategory === 'ALL' || t.category === selectedCategory;
        // For abstract rules (no language property), they apply to all languages
        // For generated rules (have language property), filter by language
        const matchesLanguage = selectedLanguage === 'all' || !t.language || t.language === selectedLanguage;
        const matchesSearch = searchQuery === '' || 
            t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (t.displayName && t.displayName.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (t.tags && t.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())));
        return matchesCategory && matchesLanguage && matchesSearch;
    });

    const handleApplySelected = () => {
        localStorage.setItem('selectedTemplates', JSON.stringify(selectedTemplates));
        router.push('/rules?fromTemplates=true');
    };

    if (loading) {
        return (
            <div style={{ 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center', 
                justifyContent: 'center',
                height: '60vh',
                gap: '16px'
            }}>
                <div style={{
                    width: '48px',
                    height: '48px',
                    border: '3px solid var(--border)',
                    borderTopColor: 'var(--accent)',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                }} />
                <p style={{ color: 'var(--text-muted)' }}>Loading rule templates...</p>
                <style jsx>{`
                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center', 
                justifyContent: 'center',
                height: '60vh',
                gap: '16px'
            }}>
                <div style={{ 
                    width: '64px', 
                    height: '64px', 
                    borderRadius: '50%',
                    background: 'rgba(239, 68, 68, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ef4444'
                }}>
                    {Icons.close}
                </div>
                <p style={{ color: '#ef4444', fontWeight: '500' }}>{error}</p>
            </div>
        );
    }

    return (
        <div style={{ paddingBottom: '100px' }}>
            {/* Header */}
            <div style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, var(--accent) 0%, #8b5cf6 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white'
                    }}>
                        {Icons.style}
                    </div>
                    <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '700' }}>Rule Templates</h1>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '15px', maxWidth: '600px' }}>
                    Choose from 50 industry-standard compliance rules. Pre-validated queries ensure accurate detection.
                </p>
            </div>

            {/* Stats Cards */}
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', 
                gap: '12px',
                marginBottom: '24px'
            }}>
                {Object.entries(categoryConfig).map(([key, config]) => {
                    const count = templates.filter(t => t.category === key).length;
                    return (
                        <button
                            key={key}
                            onClick={() => setSelectedCategory(selectedCategory === key ? 'ALL' : key)}
                            style={{
                                padding: '16px',
                                borderRadius: '12px',
                                border: selectedCategory === key ? `2px solid ${config.color}` : '1px solid var(--border)',
                                background: selectedCategory === key ? config.bg : 'var(--card)',
                                cursor: 'pointer',
                                textAlign: 'left',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <div style={{ color: config.color, marginBottom: '8px' }}>{config.icon}</div>
                            <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text)' }}>{count}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{config.label}</div>
                        </button>
                    );
                })}
            </div>

            {/* Search & Filters */}
            <div style={{ 
                display: 'flex', 
                gap: '12px', 
                marginBottom: '24px',
                flexWrap: 'wrap',
                alignItems: 'center',
                padding: '16px',
                background: 'var(--card)',
                borderRadius: '12px',
                border: '1px solid var(--border)'
            }}>
                {/* Search */}
                <div style={{ 
                    position: 'relative', 
                    flex: '1',
                    minWidth: '250px'
                }}>
                    <div style={{
                        position: 'absolute',
                        left: '14px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--text-muted)'
                    }}>
                        {Icons.search}
                    </div>
                    <input
                        type="text"
                        placeholder="Search rules by name, description, or tag..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '12px 16px 12px 44px',
                            borderRadius: '8px',
                            border: '1px solid var(--border)',
                            background: 'var(--bg)',
                            color: 'var(--text)',
                            fontSize: '14px',
                            outline: 'none'
                        }}
                    />
                </div>

                {/* Language Filter */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Language:</span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                        {['all', 'javascript', 'typescript', 'python', 'java'].map(lang => (
                            <button
                                key={lang}
                                onClick={() => setSelectedLanguage(lang)}
                                style={{
                                    padding: '8px 12px',
                                    borderRadius: '6px',
                                    border: selectedLanguage === lang ? '1px solid var(--accent)' : '1px solid transparent',
                                    background: selectedLanguage === lang ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                                    color: selectedLanguage === lang ? 'var(--accent)' : 'var(--text-muted)',
                                    cursor: 'pointer',
                                    fontSize: '13px',
                                    fontWeight: '500',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                            >
                                {lang !== 'all' && languageConfig[lang]?.icon}
                                {lang === 'all' ? 'All' : languageConfig[lang]?.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Results Header */}
            <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '16px'
            }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                    Showing <strong style={{ color: 'var(--text)' }}>{filteredTemplates.length}</strong> of {templates.length} rules
                </span>
                {selectedCategory !== 'ALL' && (
                    <button
                        onClick={() => setSelectedCategory('ALL')}
                        style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: '1px solid var(--border)',
                            background: 'transparent',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            fontSize: '13px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                    >
                        {Icons.close} Clear filter
                    </button>
                )}
            </div>

            {/* Rules by Category */}
            {Object.entries(categoryConfig).map(([category, config]) => {
                const categoryTemplates = filteredTemplates.filter(t => t.category === category);
                if (categoryTemplates.length === 0) return null;

                const allSelected = categoryTemplates.every(t => selectedTemplates.includes(t.id));
                const someSelected = categoryTemplates.some(t => selectedTemplates.includes(t.id));

                return (
                    <div key={category} style={{ marginBottom: '32px' }}>
                        {/* Category Header */}
                        <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '12px', 
                            marginBottom: '16px'
                        }}>
                            <div style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '10px',
                                background: config.bg,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: config.color
                            }}>
                                {config.icon}
                            </div>
                            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>{config.label}</h2>
                            <span style={{ 
                                padding: '4px 10px',
                                borderRadius: '20px',
                                background: config.bg,
                                color: config.color,
                                fontSize: '13px',
                                fontWeight: '600'
                            }}>
                                {categoryTemplates.length}
                            </span>
                            <button
                                onClick={() => selectAllInCategory(category)}
                                style={{
                                    marginLeft: 'auto',
                                    padding: '8px 16px',
                                    borderRadius: '8px',
                                    border: allSelected ? 'none' : '1px solid var(--border)',
                                    background: allSelected ? 'var(--accent)' : 'transparent',
                                    color: allSelected ? 'white' : 'var(--text-muted)',
                                    fontSize: '13px',
                                    fontWeight: '500',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                {allSelected && Icons.check}
                                {allSelected ? 'All Selected' : someSelected ? 'Select Remaining' : 'Select All'}
                            </button>
                        </div>

                        {/* Rules Grid */}
                        <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', 
                            gap: '12px' 
                        }}>
                            {categoryTemplates.map(template => {
                                const isSelected = selectedTemplates.includes(template.id);
                                const severityStyle = severityConfig[template.severity];
                                // For abstract rules (no language), show "All Languages"
                                const langConfig = template.language ? languageConfig[template.language] : null;
                                const isAbstractRule = !template.language;

                                return (
                                    <div
                                        key={template.id}
                                        onClick={() => toggleTemplate(template.id)}
                                        style={{
                                            padding: '16px',
                                            borderRadius: '12px',
                                            border: isSelected 
                                                ? '2px solid var(--accent)' 
                                                : '1px solid var(--border)',
                                            background: isSelected 
                                                ? 'rgba(99, 102, 241, 0.05)' 
                                                : 'var(--card)',
                                            cursor: 'pointer',
                                            transition: 'all 0.15s ease',
                                            position: 'relative'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!isSelected) e.currentTarget.style.borderColor = 'var(--accent)';
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!isSelected) e.currentTarget.style.borderColor = 'var(--border)';
                                        }}
                                    >
                                        {/* Checkbox */}
                                        <div style={{
                                            position: 'absolute',
                                            top: '16px',
                                            right: '16px',
                                            width: '22px',
                                            height: '22px',
                                            borderRadius: '6px',
                                            border: isSelected 
                                                ? 'none' 
                                                : '2px solid var(--border)',
                                            background: isSelected ? 'var(--accent)' : 'transparent',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'white',
                                            transition: 'all 0.15s ease'
                                        }}>
                                            {isSelected && Icons.check}
                                        </div>

                                        {/* Title - use displayName if available */}
                                        <h3 style={{ 
                                            margin: '0 0 8px 0', 
                                            fontSize: '15px', 
                                            fontWeight: '600',
                                            paddingRight: '32px'
                                        }}>
                                            {template.displayName || template.name}
                                        </h3>

                                        {/* Description */}
                                        <p style={{ 
                                            margin: '0 0 12px 0', 
                                            fontSize: '13px', 
                                            color: 'var(--text-muted)',
                                            lineHeight: '1.5',
                                            display: '-webkit-box',
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden'
                                        }}>
                                            {template.description}
                                        </p>

                                        {/* Meta Row */}
                                        <div style={{ 
                                            display: 'flex', 
                                            alignItems: 'center',
                                            gap: '8px',
                                            flexWrap: 'wrap'
                                        }}>
                                            {/* Language Badge */}
                                            <span style={{
                                                padding: '4px 10px',
                                                borderRadius: '6px',
                                                fontSize: '12px',
                                                fontWeight: '500',
                                                background: isAbstractRule ? 'rgba(99, 102, 241, 0.1)' : 'var(--bg)',
                                                color: isAbstractRule ? 'var(--accent)' : (langConfig?.color || 'var(--text-muted)'),
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '5px',
                                                border: isAbstractRule ? '1px solid var(--accent)' : '1px solid var(--border)'
                                            }}>
                                                {langConfig?.icon}
                                                {isAbstractRule ? '🌍 All Languages' : template.language}
                                            </span>

                                            {/* Severity Badge */}
                                            <span style={{
                                                padding: '4px 10px',
                                                borderRadius: '6px',
                                                fontSize: '11px',
                                                fontWeight: '600',
                                                background: severityStyle.bg,
                                                color: severityStyle.text,
                                                border: `1px solid ${severityStyle.border}`,
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.5px'
                                            }}>
                                                {template.severity}
                                            </span>

                                            {/* Tags */}
                                            {template.tags.slice(0, 2).map(tag => (
                                                <span key={tag} style={{
                                                    padding: '4px 8px',
                                                    borderRadius: '4px',
                                                    fontSize: '11px',
                                                    color: 'var(--text-muted)',
                                                    background: 'var(--bg)'
                                                }}>
                                                    #{tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}

            {/* Empty State */}
            {filteredTemplates.length === 0 && (
                <div style={{ 
                    textAlign: 'center', 
                    padding: '80px 20px',
                    background: 'var(--card)',
                    borderRadius: '16px',
                    border: '1px solid var(--border)'
                }}>
                    <div style={{ 
                        width: '64px', 
                        height: '64px', 
                        borderRadius: '50%',
                        background: 'var(--bg)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 16px',
                        color: 'var(--text-muted)'
                    }}>
                        {Icons.search}
                    </div>
                    <h3 style={{ margin: '0 0 8px 0', fontWeight: '600' }}>No rules found</h3>
                    <p style={{ color: 'var(--text-muted)', margin: '0 0 20px 0' }}>
                        Try adjusting your search or filters
                    </p>
                    <button
                        onClick={() => {
                            setSelectedCategory('ALL');
                            setSelectedLanguage('all');
                            setSearchQuery('');
                        }}
                        style={{
                            padding: '10px 20px',
                            borderRadius: '8px',
                            border: '1px solid var(--border)',
                            background: 'transparent',
                            color: 'var(--text)',
                            cursor: 'pointer',
                            fontWeight: '500'
                        }}
                    >
                        Clear All Filters
                    </button>
                </div>
            )}

            {/* Floating Action Bar */}
            {selectedTemplates.length > 0 && (
                <div style={{
                    position: 'fixed',
                    bottom: '24px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    padding: '12px 20px',
                    borderRadius: '16px',
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    zIndex: 100,
                    backdropFilter: 'blur(10px)'
                }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        background: 'var(--accent)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: '700',
                        fontSize: '16px'
                    }}>
                        {selectedTemplates.length}
                    </div>
                    <span style={{ fontWeight: '500', color: 'var(--text)' }}>
                        rules selected
                    </span>
                    <div style={{ width: '1px', height: '24px', background: 'var(--border)' }} />
                    <button
                        onClick={() => setSelectedTemplates([])}
                        style={{
                            padding: '10px 16px',
                            borderRadius: '8px',
                            border: '1px solid var(--border)',
                            background: 'transparent',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            fontWeight: '500',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                    >
                        {Icons.close} Clear
                    </button>
                    <button
                        onClick={handleApplySelected}
                        style={{
                            padding: '10px 24px',
                            borderRadius: '8px',
                            border: 'none',
                            background: 'linear-gradient(135deg, var(--accent) 0%, #8b5cf6 100%)',
                            color: 'white',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)'
                        }}
                    >
                        Apply to Project {Icons.arrowRight}
                    </button>
                </div>
            )}
        </div>
    );
}
