import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
// Using gemini-2.5-flash model
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

// Pre-defined working query templates for common rules
const QUERY_TEMPLATES = {
    javascript: {
        'snake_case_function': '(function_declaration name: (identifier) @target (#match? @target "_"))',
        'snake_case_variable': '(variable_declarator name: (identifier) @target (#match? @target "_"))',
        'class_lowercase': '(class_declaration name: (identifier) @target (#match? @target "^[a-z]"))',
        'const_uppercase': '(lexical_declaration kind: "const" (variable_declarator name: (identifier) @target (#not-match? @target "^[A-Z_]+$")))',
        'arrow_function': '(arrow_function) @target',
        'console_log': '(call_expression function: (member_expression object: (identifier) @obj property: (property_identifier) @prop (#eq? @obj "console") (#eq? @prop "log"))) @target',
        'any_function': '(function_declaration name: (identifier) @target)',
        'method_definition': '(method_definition name: (property_identifier) @target (#match? @target "_"))',
        // Security rules
        'hardcoded_password': '(pair key: (property_identifier) @key value: (string) @target (#match? @key "(?i)(password|passwd|pwd|secret|token|api_key|apikey|auth|bearer|credential)"))',
        'hardcoded_string_password': '(string (string_fragment) @target (#match? @target "(?i)(password|passwd|pwd|api[_-]?key|secret|token|auth|bearer)"))',
        'assignment_password': '(variable_declarator name: (identifier) @name value: (string) @target (#match? @name "(?i)(password|passwd|pwd|secret|token|api_key|apikey|auth|credential)"))',
    },
    java: {
        'snake_case_method': '(method_declaration name: (identifier) @target (#match? @target "_"))',
        'class_lowercase': '(class_declaration name: (identifier) @target (#match? @target "^[a-z]"))',
        'field_snake_case': '(field_declaration declarator: (variable_declarator name: (identifier) @target (#match? @target "_")))',
        'constant_lowercase': '(field_declaration (modifiers "static" "final") declarator: (variable_declarator name: (identifier) @target (#not-match? @target "^[A-Z_]+$")))',
        // Security rules
        'hardcoded_password': '(variable_declarator name: (identifier) @name value: (string_literal) @target (#match? @name "(?i)(password|passwd|pwd|secret|token|apiKey|auth|credential)"))',
        'hardcoded_string': '(string_literal) @target (#match? @target "(?i)(password|secret|token|api[_-]?key)")',
    },
    python: {
        'camel_case_function': '(function_definition name: (identifier) @target (#match? @target "[A-Z]"))',
        'class_lowercase': '(class_definition name: (identifier) @target (#match? @target "^[a-z]"))',
        'constant_lowercase': '(assignment left: (identifier) @target (#match? @target "^[A-Z_]+$") (#not-match? @target "^[A-Z][A-Z_]*$"))',
        // Security rules
        'hardcoded_password': '(assignment left: (identifier) @name right: (string) @target (#match? @name "(?i)(password|passwd|pwd|secret|token|api_key|apikey|auth|credential)"))',
        'hardcoded_string': '(string (string_content) @target (#match? @target "(?i)(password|secret|token|api[_-]?key)"))',
    }
};

// Security-focused rules (language-agnostic patterns)
const SECURITY_RULES = {
    'hardcoded_password': {
        javascript: '[\n  (pair\n    key: (property_identifier) @key\n    value: (string) @target\n    (#match? @key "(?i)(password|passwd|pwd|secret|token|api_key|apikey|auth|credential)")\n  )\n  (variable_declarator\n    name: (identifier) @name\n    value: (string) @target\n    (#match? @name "(?i)(password|passwd|pwd|secret|token|api_key|apikey|auth|credential)")\n  )\n]',
        java: '(variable_declarator\n  name: (identifier) @name\n  value: (string_literal) @target\n  (#match? @name "(?i)(password|passwd|pwd|secret|token|apiKey|auth|credential)")\n)',
        python: '(assignment\n  left: (identifier) @name\n  right: (string) @target\n  (#match? @name "(?i)(password|passwd|pwd|secret|token|api_key|apikey|auth|credential)")\n)',
    },
    'api_key': {
        javascript: '(variable_declarator\n  name: (identifier) @name\n  value: (string) @target\n  (#match? @name "(?i)(api[_-]?key|apikey|api_secret|client_secret)")\n)',
        java: '(variable_declarator\n  name: (identifier) @name\n  value: (string_literal) @target\n  (#match? @name "(?i)(apiKey|api_key|apiSecret|clientSecret)")\n)',
        python: '(assignment\n  left: (identifier) @name\n  right: (string) @target\n  (#match? @name "(?i)(api[_-]?key|api_secret|client_secret)")\n)',
    }
};

/**
 * POST /api/rules/generate
 * Converts English rule description to Tree-sitter query using Gemini AI
 */
export async function POST(request) {
    try {
        // Check authentication
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { description, language } = await request.json();

        if (!description || !language) {
            return NextResponse.json(
                { error: 'Missing required fields: description and language' },
                { status: 400 }
            );
        }

        // First try to match a predefined template
        const templateMatch = findMatchingTemplate(description, language);
        if (templateMatch) {
            return NextResponse.json({
                success: true,
                query: templateMatch.query,
                explanation: templateMatch.explanation,
                source: 'template'
            });
        }

        // Generate Tree-sitter query using Gemini with improved prompt
        const prompt = buildOptimizedPrompt(description, language);

        const response = await fetch(GEMINI_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }],
                generationConfig: {
                    temperature: 0.1, // Lower temperature for more precise output
                    maxOutputTokens: 500,
                }
            }),
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error('Gemini API Error:', errorData);
            return NextResponse.json(
                { error: 'Failed to generate query from AI' },
                { status: 500 }
            );
        }

        const data = await response.json();
        
        // Extract the generated query
        let generatedQuery = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        
        // Clean and validate the response
        generatedQuery = cleanQuery(generatedQuery);

        // Generate explanation
        const explanation = `This query matches ${language} code patterns that violate: "${description}"`;

        return NextResponse.json({
            success: true,
            query: generatedQuery,
            explanation: explanation,
            source: 'ai'
        });

    } catch (error) {
        console.error('Error generating rule:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * Find a matching predefined template based on rule description
 */
function findMatchingTemplate(description, language) {
    const desc = description.toLowerCase();
    const templates = QUERY_TEMPLATES[language] || QUERY_TEMPLATES.javascript;
    
    // ==================== SECURITY RULES ====================
    // Hardcoded passwords/secrets/credentials
    if (desc.includes('password') || desc.includes('hardcode') || desc.includes('secret') || 
        desc.includes('credential') || desc.includes('token') && desc.includes('hardcode')) {
        const securityQuery = SECURITY_RULES['hardcoded_password']?.[language] || 
            templates['hardcoded_password'] || templates['assignment_password'];
        return {
            query: securityQuery,
            explanation: 'Detects hardcoded passwords, secrets, tokens, and credentials in variable assignments and object properties. Variables/properties with names containing password, secret, token, credential, api_key, etc. that are assigned string literal values will be flagged.'
        };
    }
    
    // API keys
    if ((desc.includes('api') && desc.includes('key')) || desc.includes('apikey')) {
        const apiKeyQuery = SECURITY_RULES['api_key']?.[language];
        return {
            query: apiKeyQuery,
            explanation: 'Detects hardcoded API keys in variable assignments. Variables with names like api_key, apiKey, api_secret, client_secret that are assigned string values will be flagged.'
        };
    }

    // ==================== NAMING CONVENTION RULES ====================
    // Pattern matching for common rules
    if (desc.includes('function') && (desc.includes('underscore') || desc.includes('snake'))) {
        return {
            query: templates['snake_case_function'] || templates['any_function'],
            explanation: 'Matches function declarations with names containing underscores (snake_case pattern).'
        };
    }
    
    if (desc.includes('variable') && (desc.includes('underscore') || desc.includes('snake'))) {
        return {
            query: templates['snake_case_variable'],
            explanation: 'Matches variable declarations with names containing underscores.'
        };
    }
    
    if (desc.includes('class') && (desc.includes('capital') || desc.includes('uppercase') || desc.includes('lowercase'))) {
        return {
            query: templates['class_lowercase'],
            explanation: 'Matches class declarations that start with a lowercase letter.'
        };
    }
    
    if (desc.includes('method') && (desc.includes('underscore') || desc.includes('snake'))) {
        return {
            query: templates['method_definition'] || templates['snake_case_method'],
            explanation: 'Matches method definitions with names containing underscores.'
        };
    }
    
    if (desc.includes('console') && desc.includes('log')) {
        return {
            query: templates['console_log'],
            explanation: 'Matches console.log() calls in the code.'
        };
    }
    
    if (desc.includes('const') && (desc.includes('upper') || desc.includes('capital'))) {
        return {
            query: templates['const_uppercase'],
            explanation: 'Matches const declarations that are not in UPPER_SNAKE_CASE.'
        };
    }

    return null; // No template match, will use AI
}

/**
 * Build an optimized prompt with examples
 */
function buildOptimizedPrompt(description, language) {
    const examples = getLanguageExamples(language);
    
    return `You are an expert in Tree-sitter query syntax (S-expressions).

TASK: Generate a Tree-sitter query for ${language} to detect: "${description}"

CRITICAL RULES:
1. Return ONLY the S-expression query - no markdown, no explanation, no code blocks
2. Use @target to capture the violating node
3. Use #match? for regex matching, #eq? for exact matching
4. The query must be valid Tree-sitter syntax

CORRECT SYNTAX EXAMPLES for ${language}:
${examples}

COMMON PATTERNS:
- Match identifier with underscore: (#match? @name "_")
- Match lowercase start: (#match? @name "^[a-z]")
- Match uppercase start: (#match? @name "^[A-Z]")
- Exact string match: (#eq? @name "specificName")
- NOT match pattern: (#not-match? @name "pattern")

NOW generate the query for: "${description}"

Return ONLY the query, nothing else:`;
}

/**
 * Get language-specific working examples
 */
function getLanguageExamples(language) {
    const examples = {
        javascript: `
1. Function with underscore in name:
(function_declaration name: (identifier) @target (#match? @target "_"))

2. Class starting with lowercase:
(class_declaration name: (identifier) @target (#match? @target "^[a-z]"))

3. Variable with underscore:
(variable_declarator name: (identifier) @target (#match? @target "_"))

4. Method with underscore:
(method_definition name: (property_identifier) @target (#match? @target "_"))

5. Arrow function (all):
(arrow_function) @target

6. Console.log calls:
(call_expression function: (member_expression object: (identifier) @obj (#eq? @obj "console"))) @target`,

        java: `
1. Method with underscore in name:
(method_declaration name: (identifier) @target (#match? @target "_"))

2. Class starting with lowercase:
(class_declaration name: (identifier) @target (#match? @target "^[a-z]"))

3. Field with underscore:
(field_declaration declarator: (variable_declarator name: (identifier) @target (#match? @target "_")))

4. All method declarations:
(method_declaration name: (identifier) @target)`,

        python: `
1. Function with camelCase (has uppercase):
(function_definition name: (identifier) @target (#match? @target "[A-Z]"))

2. Class starting with lowercase:
(class_definition name: (identifier) @target (#match? @target "^[a-z]"))

3. All function definitions:
(function_definition name: (identifier) @target)

4. Assignment statement:
(assignment left: (identifier) @target)`
    };
    
    return examples[language] || examples.javascript;
}

/**
 * Clean and validate the generated query
 */
function cleanQuery(query) {
    // Remove markdown code blocks
    query = query.replace(/```[\w]*\n?/g, '').replace(/```/g, '');
    
    // Remove any leading/trailing whitespace
    query = query.trim();
    
    // Remove any explanation text that might have been included
    const lines = query.split('\n');
    const queryLines = lines.filter(line => {
        const trimmed = line.trim();
        return trimmed.startsWith('(') || trimmed.startsWith('#') || trimmed.startsWith('@') || 
               trimmed.includes('@target') || trimmed.includes('#match') || trimmed.includes('#eq');
    });
    
    if (queryLines.length > 0) {
        query = queryLines.join('\n');
    }
    
    // If query doesn't start with '(', try to find the query part
    if (!query.startsWith('(')) {
        const match = query.match(/\([^)]*\)/s);
        if (match) {
            query = match[0];
        }
    }
    
    return query;
}
