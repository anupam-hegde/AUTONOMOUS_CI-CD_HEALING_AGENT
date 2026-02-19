/**
 * ABSTRACT RULES SEED
 * ====================
 * 50 Language-Independent Compliance Rules
 * 
 * Each rule defines WHAT to detect (not HOW).
 * The LanguageAdapter handles the language-specific Tree-sitter queries.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ============================================================
// ABSTRACT RULES - Language Independent
// ============================================================

const ABSTRACT_RULES = [
    // ========================================================
    // SECURITY RULES (15)
    // ========================================================
    {
        name: 'no-eval',
        displayName: 'No Dynamic Code Execution',
        description: 'Prevent use of eval(), exec(), or similar functions that execute arbitrary code. These functions are dangerous because they can execute malicious code if user input is passed to them.',
        category: 'SECURITY',
        severity: 'CRITICAL',
        patternType: 'FUNCTION_CALL',
        patternConfig: {
            templateKey: 'FUNCTION_CALL_SIMPLE',
            functionNames: ['eval', 'exec', 'compile', 'execfile'],
            matchAny: true
        },
        tags: ['security', 'owasp', 'injection', 'critical']
    },
    {
        name: 'no-hardcoded-secrets',
        displayName: 'No Hardcoded Secrets',
        description: 'Prevent hardcoded API keys, passwords, tokens, or credentials in source code. Secrets should be stored in environment variables or secure vaults.',
        category: 'SECURITY',
        severity: 'CRITICAL',
        patternType: 'ASSIGNMENT',
        patternConfig: {
            templateKey: 'ASSIGNMENT_WITH_STRING',
            variablePattern: '(?i)(password|passwd|pwd|secret|api_?key|apikey|token|auth|credential|private_?key)'
        },
        tags: ['security', 'secrets', 'credentials', 'owasp']
    },
    {
        name: 'no-hardcoded-urls',
        displayName: 'No Hardcoded URLs',
        description: 'Avoid hardcoding URLs in source code. Use configuration files or environment variables for URLs that may change between environments.',
        category: 'SECURITY',
        severity: 'WARNING',
        patternType: 'LITERAL',
        patternConfig: {
            templateKey: 'ASSIGNMENT_WITH_STRING',
            variablePattern: '(?i)(url|endpoint|api_?url|base_?url|host)',
            valuePattern: 'https?://'
        },
        tags: ['security', 'configuration', 'environment']
    },
    {
        name: 'no-innerHTML',
        displayName: 'No innerHTML Assignment',
        description: 'Avoid using innerHTML as it can lead to XSS vulnerabilities. Use textContent or sanitized methods instead.',
        category: 'SECURITY',
        severity: 'CRITICAL',
        patternType: 'MEMBER_ACCESS',
        patternConfig: {
            templateKey: 'FUNCTION_CALL_CHAINED',
            propertyName: 'innerHTML',
            method: 'innerHTML'
        },
        tags: ['security', 'xss', 'owasp', 'dom']
    },
    {
        name: 'no-document-write',
        displayName: 'No document.write',
        description: 'Avoid document.write() as it can overwrite the entire document and is vulnerable to XSS attacks.',
        category: 'SECURITY',
        severity: 'CRITICAL',
        patternType: 'FUNCTION_CALL',
        patternConfig: {
            templateKey: 'FUNCTION_CALL_MEMBER',
            object: 'document',
            method: 'write'
        },
        tags: ['security', 'xss', 'dom', 'browser']
    },
    {
        name: 'no-sql-string-concat',
        displayName: 'No SQL String Concatenation',
        description: 'Never build SQL queries through string concatenation. Use parameterized queries or prepared statements to prevent SQL injection.',
        category: 'SECURITY',
        severity: 'CRITICAL',
        patternType: 'LITERAL',
        patternConfig: {
            templateKey: 'ASSIGNMENT_WITH_STRING',
            variablePattern: '(?i)(sql|query|stmt)',
            valuePattern: '(SELECT|INSERT|UPDATE|DELETE|DROP)'
        },
        tags: ['security', 'sql-injection', 'owasp', 'database']
    },
    {
        name: 'no-shell-injection',
        displayName: 'No Shell Command Injection Risk',
        description: 'Avoid executing shell commands with user input. Use safe alternatives or properly sanitize inputs.',
        category: 'SECURITY',
        severity: 'CRITICAL',
        patternType: 'FUNCTION_CALL',
        patternConfig: {
            templateKey: 'FUNCTION_CALL_SIMPLE',
            functionNames: ['system', 'popen', 'subprocess', 'shell_exec', 'exec'],
            matchAny: true
        },
        tags: ['security', 'injection', 'shell', 'owasp']
    },
    {
        name: 'no-unsafe-regex',
        displayName: 'No Potentially Unsafe Regex',
        description: 'Avoid regex patterns that could lead to ReDoS (Regular Expression Denial of Service) attacks.',
        category: 'SECURITY',
        severity: 'WARNING',
        patternType: 'FUNCTION_CALL',
        patternConfig: {
            templateKey: 'FUNCTION_CALL_SIMPLE',
            functionNames: ['RegExp'],
            checkArguments: true
        },
        tags: ['security', 'regex', 'redos', 'dos']
    },
    {
        name: 'no-weak-crypto',
        displayName: 'No Weak Cryptography',
        description: 'Avoid using weak or deprecated cryptographic algorithms like MD5 or SHA1 for security purposes.',
        category: 'SECURITY',
        severity: 'CRITICAL',
        patternType: 'FUNCTION_CALL',
        patternConfig: {
            templateKey: 'FUNCTION_CALL_SIMPLE',
            functionNames: ['md5', 'sha1', 'MD5', 'SHA1'],
            matchAny: true
        },
        tags: ['security', 'cryptography', 'hashing', 'owasp']
    },
    {
        name: 'no-disabled-ssl-verify',
        displayName: 'No Disabled SSL Verification',
        description: 'Never disable SSL certificate verification. This makes connections vulnerable to man-in-the-middle attacks.',
        category: 'SECURITY',
        severity: 'CRITICAL',
        patternType: 'ASSIGNMENT',
        patternConfig: {
            templateKey: 'ASSIGNMENT_ANY',
            variablePattern: '(?i)(verify_?ssl|ssl_?verify|check_?hostname|CERT_NONE)'
        },
        tags: ['security', 'ssl', 'tls', 'https']
    },
    {
        name: 'no-cors-wildcard',
        displayName: 'No CORS Wildcard',
        description: 'Avoid using wildcard (*) for CORS Access-Control-Allow-Origin. Specify exact allowed origins.',
        category: 'SECURITY',
        severity: 'WARNING',
        patternType: 'ASSIGNMENT',
        patternConfig: {
            templateKey: 'ASSIGNMENT_WITH_STRING',
            variablePattern: '(?i)(cors|origin|allow_?origin)',
            valuePattern: '^\\*$'
        },
        tags: ['security', 'cors', 'web', 'headers']
    },
    {
        name: 'no-jwt-none-algorithm',
        displayName: 'No JWT None Algorithm',
        description: 'Never allow "none" algorithm in JWT verification. This bypasses signature verification.',
        category: 'SECURITY',
        severity: 'CRITICAL',
        patternType: 'ASSIGNMENT',
        patternConfig: {
            templateKey: 'ASSIGNMENT_WITH_STRING',
            variablePattern: '(?i)(algorithm|alg)',
            valuePattern: 'none'
        },
        tags: ['security', 'jwt', 'authentication', 'owasp']
    },
    {
        name: 'no-open-redirect',
        displayName: 'Potential Open Redirect',
        description: 'Validate redirect URLs to prevent open redirect vulnerabilities that can be used in phishing attacks.',
        category: 'SECURITY',
        severity: 'WARNING',
        patternType: 'FUNCTION_CALL',
        patternConfig: {
            templateKey: 'FUNCTION_CALL_CHAINED',
            method: 'redirect'
        },
        tags: ['security', 'redirect', 'owasp', 'phishing']
    },
    {
        name: 'no-insecure-random',
        displayName: 'No Insecure Random',
        description: 'Use cryptographically secure random number generators for security-sensitive operations.',
        category: 'SECURITY',
        severity: 'WARNING',
        patternType: 'FUNCTION_CALL',
        patternConfig: {
            templateKey: 'FUNCTION_CALL_MEMBER',
            object: 'Math',
            method: 'random'
        },
        tags: ['security', 'random', 'cryptography']
    },
    {
        name: 'no-xml-external-entities',
        displayName: 'No XML External Entities',
        description: 'Disable external entity processing in XML parsers to prevent XXE attacks.',
        category: 'SECURITY',
        severity: 'CRITICAL',
        patternType: 'FUNCTION_CALL',
        patternConfig: {
            templateKey: 'FUNCTION_CALL_SIMPLE',
            functionNames: ['parseXML', 'XMLParser', 'DOMParser'],
            matchAny: true
        },
        tags: ['security', 'xxe', 'xml', 'owasp']
    },

    // ========================================================
    // NAMING CONVENTION RULES (10)
    // ========================================================
    {
        name: 'function-naming-convention',
        displayName: 'Function Naming Convention',
        description: 'Function names should follow the language convention (camelCase for JS/Java, snake_case for Python).',
        category: 'NAMING',
        severity: 'WARNING',
        patternType: 'FUNCTION_DECLARATION',
        patternConfig: {
            templateKey: 'FUNCTION_DECLARATION_NAME',
            // Pattern checked at runtime based on language convention
            conventionViolation: true
        },
        tags: ['naming', 'convention', 'readability']
    },
    {
        name: 'class-naming-convention',
        displayName: 'Class Naming Convention',
        description: 'Class names should use PascalCase (UpperCamelCase) in all languages.',
        category: 'NAMING',
        severity: 'WARNING',
        patternType: 'CLASS_DECLARATION',
        patternConfig: {
            templateKey: 'CLASS_DECLARATION_NAME',
            pattern: '^[a-z]|_',  // Matches non-PascalCase
            matchViolation: true
        },
        tags: ['naming', 'convention', 'class']
    },
    {
        name: 'constant-naming-convention',
        displayName: 'Constant Naming Convention',
        description: 'Constants should use SCREAMING_SNAKE_CASE (all uppercase with underscores).',
        category: 'NAMING',
        severity: 'WARNING',
        patternType: 'ASSIGNMENT',
        patternConfig: {
            templateKey: 'ASSIGNMENT_ANY',
            pattern: '^[A-Z][A-Z0-9_]*$',
            isConstant: true,
            matchViolation: true
        },
        tags: ['naming', 'convention', 'constant']
    },
    {
        name: 'no-single-letter-names',
        displayName: 'No Single Letter Variable Names',
        description: 'Avoid single-letter variable names except for loop counters (i, j, k). Use descriptive names.',
        category: 'NAMING',
        severity: 'WARNING',
        patternType: 'ASSIGNMENT',
        patternConfig: {
            templateKey: 'ASSIGNMENT_ANY',
            pattern: '^[a-zA-Z]$',
            excludeLoopCounters: true
        },
        tags: ['naming', 'readability', 'maintainability']
    },
    {
        name: 'no-abbreviated-names',
        displayName: 'No Cryptic Abbreviations',
        description: 'Avoid cryptic abbreviations in variable and function names. Use clear, descriptive names.',
        category: 'NAMING',
        severity: 'WARNING',
        patternType: 'ASSIGNMENT',
        patternConfig: {
            templateKey: 'ASSIGNMENT_ANY',
            pattern: '^(tmp|temp|str|num|val|cnt|idx|ptr|buf|arr|obj|fn|cb|err|res|req|ctx)$'
        },
        tags: ['naming', 'readability', 'maintainability']
    },
    {
        name: 'boolean-naming-convention',
        displayName: 'Boolean Naming Convention',
        description: 'Boolean variables should have names that indicate true/false state (is*, has*, can*, should*).',
        category: 'NAMING',
        severity: 'WARNING',
        patternType: 'ASSIGNMENT',
        patternConfig: {
            templateKey: 'ASSIGNMENT_ANY',
            pattern: '^(is|has|can|should|will|did|was|are|does|do)_?[A-Z]',
            invertMatch: true,
            booleanOnly: true
        },
        tags: ['naming', 'boolean', 'readability']
    },
    {
        name: 'no-hungarian-notation',
        displayName: 'No Hungarian Notation',
        description: 'Avoid Hungarian notation prefixes (strName, intCount, bIsValid). Modern IDEs make type prefixes unnecessary.',
        category: 'NAMING',
        severity: 'WARNING',
        patternType: 'ASSIGNMENT',
        patternConfig: {
            templateKey: 'ASSIGNMENT_ANY',
            pattern: '^(str|int|bool|obj|arr|fn|num|dbl|flt|chr|b|i|s|n|o|a)[A-Z]'
        },
        tags: ['naming', 'convention', 'legacy']
    },
    {
        name: 'file-naming-convention',
        displayName: 'File Naming Convention',
        description: 'File names should follow consistent convention (kebab-case or snake_case for files, PascalCase for components).',
        category: 'NAMING',
        severity: 'WARNING',
        patternType: 'IMPORT',
        patternConfig: {
            templateKey: 'IMPORT_FROM',
            pattern: '[A-Z].*[a-z]|[a-z].*[A-Z].*\\.',
            checkFileNames: true
        },
        tags: ['naming', 'files', 'organization']
    },
    {
        name: 'max-identifier-length',
        displayName: 'Maximum Identifier Length',
        description: 'Variable and function names should not exceed 40 characters. Long names suggest code smell.',
        category: 'NAMING',
        severity: 'WARNING',
        patternType: 'ASSIGNMENT',
        patternConfig: {
            templateKey: 'ASSIGNMENT_ANY',
            pattern: '.{41,}',
            maxLength: 40
        },
        tags: ['naming', 'length', 'readability']
    },
    {
        name: 'no-misleading-names',
        displayName: 'No Misleading Names',
        description: 'Avoid names that are similar to reserved words or could be confused with built-in functions.',
        category: 'NAMING',
        severity: 'WARNING',
        patternType: 'ASSIGNMENT',
        patternConfig: {
            templateKey: 'ASSIGNMENT_ANY',
            pattern: '(?i)^(string|object|array|function|class|number|boolean|list|dict|map|set)$'
        },
        tags: ['naming', 'clarity', 'reserved']
    },

    // ========================================================
    // CODE STYLE RULES (10)
    // ========================================================
    {
        name: 'no-console-log',
        displayName: 'No Console Statements',
        description: 'Remove console.log/print/System.out statements before production. Use proper logging frameworks.',
        category: 'STYLE',
        severity: 'WARNING',
        patternType: 'FUNCTION_CALL',
        patternConfig: {
            templateKey: 'CONSOLE_ANY',
            languageSpecific: {
                javascript: { object: 'console' },
                typescript: { object: 'console' },
                python: { function: 'print' },
                java: { pattern: 'System.out' }
            }
        },
        tags: ['style', 'debug', 'production', 'logging']
    },
    {
        name: 'no-debugger',
        displayName: 'No Debugger Statements',
        description: 'Remove debugger statements before committing code. They pause execution in browsers.',
        category: 'STYLE',
        severity: 'CRITICAL',
        patternType: 'LITERAL',
        patternConfig: {
            templateKey: 'DEBUGGER_STATEMENT'
        },
        tags: ['style', 'debug', 'production']
    },
    {
        name: 'no-commented-code',
        displayName: 'No Commented Out Code',
        description: 'Remove commented-out code blocks. Use version control to track deleted code instead.',
        category: 'STYLE',
        severity: 'WARNING',
        patternType: 'COMMENT',
        patternConfig: {
            templateKey: 'COMMENT_PATTERN',
            pattern: '(function|class|if|for|while|return|const|let|var|def|public|private)\\s*[\\(\\{]'
        },
        tags: ['style', 'cleanup', 'comments']
    },
    {
        name: 'no-todo-comments',
        displayName: 'No TODO/FIXME Comments',
        description: 'TODO and FIXME comments should be converted to tracked issues before merging to main.',
        category: 'STYLE',
        severity: 'WARNING',
        patternType: 'COMMENT',
        patternConfig: {
            templateKey: 'COMMENT_PATTERN',
            pattern: '(?i)(TODO|FIXME|HACK|XXX|BUG)'
        },
        tags: ['style', 'comments', 'tracking']
    },
    {
        name: 'no-magic-numbers',
        displayName: 'No Magic Numbers',
        description: 'Replace magic numbers with named constants that explain their purpose.',
        category: 'STYLE',
        severity: 'WARNING',
        patternType: 'LITERAL',
        patternConfig: {
            templateKey: 'LITERAL_MAGIC_NUMBER',
            excludeValues: [0, 1, -1, 2, 10, 100, 1000],
            excludeContexts: ['array_index', 'loop_counter']
        },
        tags: ['style', 'readability', 'maintainability']
    },
    {
        name: 'no-nested-ternary',
        displayName: 'No Nested Ternary',
        description: 'Avoid nested ternary operators. Use if-else statements for better readability.',
        category: 'STYLE',
        severity: 'WARNING',
        patternType: 'CONDITIONAL',
        patternConfig: {
            templateKey: 'NESTED_TERNARY',
            maxDepth: 1
        },
        tags: ['style', 'readability', 'complexity']
    },
    {
        name: 'max-function-length',
        displayName: 'Maximum Function Length',
        description: 'Functions should not exceed 50 lines. Long functions should be split into smaller ones.',
        category: 'STYLE',
        severity: 'WARNING',
        patternType: 'FUNCTION_DECLARATION',
        patternConfig: {
            templateKey: 'FUNCTION_DECLARATION_NAME',
            maxLines: 50,
            pattern: '.*'
        },
        tags: ['style', 'complexity', 'maintainability']
    },
    {
        name: 'max-parameters',
        displayName: 'Maximum Function Parameters',
        description: 'Functions should have at most 4 parameters. Use objects for multiple related parameters.',
        category: 'STYLE',
        severity: 'WARNING',
        patternType: 'FUNCTION_DECLARATION',
        patternConfig: {
            templateKey: 'FUNCTION_DECLARATION_NAME',
            maxParameters: 4,
            pattern: '.*'
        },
        tags: ['style', 'complexity', 'api-design']
    },
    {
        name: 'consistent-return',
        displayName: 'Consistent Return',
        description: 'Functions should either always return a value or never return a value.',
        category: 'STYLE',
        severity: 'WARNING',
        patternType: 'FUNCTION_DECLARATION',
        patternConfig: {
            templateKey: 'FUNCTION_DECLARATION_NAME',
            checkReturns: true,
            pattern: '.*'
        },
        tags: ['style', 'consistency', 'returns']
    },
    {
        name: 'no-var-keyword',
        displayName: 'No var Keyword (JS/TS)',
        description: 'Use let or const instead of var. var has function scope and can cause unexpected behavior.',
        category: 'STYLE',
        severity: 'WARNING',
        patternType: 'ASSIGNMENT',
        patternConfig: {
            templateKey: 'VAR_DECLARATION',
            languageSpecific: true,
            languages: ['javascript', 'typescript']
        },
        tags: ['style', 'es6', 'scoping']
    },

    // ========================================================
    // BEST PRACTICE RULES (10)
    // ========================================================
    {
        name: 'no-empty-catch',
        displayName: 'No Empty Catch Blocks',
        description: 'Catch blocks should handle errors properly, not swallow them silently.',
        category: 'BEST_PRACTICE',
        severity: 'WARNING',
        patternType: 'TRY_CATCH',
        patternConfig: {
            templateKey: 'TRY_CATCH_EMPTY'
        },
        tags: ['best-practice', 'error-handling', 'debugging']
    },
    {
        name: 'no-bare-except',
        displayName: 'No Bare Except Clauses',
        description: 'Catch specific exception types rather than catching all exceptions.',
        category: 'BEST_PRACTICE',
        severity: 'WARNING',
        patternType: 'TRY_CATCH',
        patternConfig: {
            templateKey: 'TRY_CATCH_EMPTY',
            catchAll: true
        },
        tags: ['best-practice', 'error-handling', 'specificity']
    },
    {
        name: 'use-strict-equality',
        displayName: 'Use Strict Equality',
        description: 'Use === and !== instead of == and != to avoid type coercion bugs.',
        category: 'BEST_PRACTICE',
        severity: 'WARNING',
        patternType: 'BINARY_EXPRESSION',
        patternConfig: {
            templateKey: 'BINARY_LOOSE_EQUALITY',
            operators: ['==', '!='],
            languageSpecific: true,
            languages: ['javascript', 'typescript']
        },
        tags: ['best-practice', 'equality', 'type-safety']
    },
    {
        name: 'no-async-without-await',
        displayName: 'No Async Without Await',
        description: 'Async functions should contain at least one await expression.',
        category: 'BEST_PRACTICE',
        severity: 'WARNING',
        patternType: 'FUNCTION_DECLARATION',
        patternConfig: {
            templateKey: 'ASYNC_FUNCTION',
            requiresAwait: true
        },
        tags: ['best-practice', 'async', 'promises']
    },
    {
        name: 'no-unused-variables',
        displayName: 'No Unused Variables',
        description: 'Remove variables that are declared but never used.',
        category: 'BEST_PRACTICE',
        severity: 'WARNING',
        patternType: 'ASSIGNMENT',
        patternConfig: {
            templateKey: 'UNUSED_VARIABLE',
            checkUsage: true
        },
        tags: ['best-practice', 'cleanup', 'maintainability']
    },
    {
        name: 'no-duplicate-imports',
        displayName: 'No Duplicate Imports',
        description: 'Combine imports from the same module into a single import statement.',
        category: 'BEST_PRACTICE',
        severity: 'WARNING',
        patternType: 'IMPORT',
        patternConfig: {
            templateKey: 'IMPORT_FROM',
            checkDuplicates: true,
            pattern: '.*'
        },
        tags: ['best-practice', 'imports', 'organization']
    },
    {
        name: 'prefer-const',
        displayName: 'Prefer Const',
        description: 'Use const for variables that are never reassigned.',
        category: 'BEST_PRACTICE',
        severity: 'WARNING',
        patternType: 'ASSIGNMENT',
        patternConfig: {
            templateKey: 'LET_WITHOUT_REASSIGN',
            languageSpecific: true,
            languages: ['javascript', 'typescript']
        },
        tags: ['best-practice', 'immutability', 'es6']
    },
    {
        name: 'no-array-mutate',
        displayName: 'Prefer Immutable Array Methods',
        description: 'Prefer immutable array methods (map, filter, reduce) over mutating methods (push, pop, splice).',
        category: 'BEST_PRACTICE',
        severity: 'WARNING',
        patternType: 'FUNCTION_CALL',
        patternConfig: {
            templateKey: 'FUNCTION_CALL_CHAINED',
            methods: ['push', 'pop', 'shift', 'unshift', 'splice', 'reverse', 'sort'],
            matchAny: true
        },
        tags: ['best-practice', 'immutability', 'functional']
    },
    {
        name: 'no-floating-promises',
        displayName: 'No Floating Promises',
        description: 'Promises should be awaited, returned, or have .catch() handler.',
        category: 'BEST_PRACTICE',
        severity: 'WARNING',
        patternType: 'FUNCTION_CALL',
        patternConfig: {
            templateKey: 'FLOATING_PROMISE',
            checkHandling: true
        },
        tags: ['best-practice', 'async', 'error-handling']
    },
    {
        name: 'no-mutable-default-args',
        displayName: 'No Mutable Default Arguments',
        description: 'Avoid using mutable objects (lists, dicts) as default function arguments in Python.',
        category: 'BEST_PRACTICE',
        severity: 'WARNING',
        patternType: 'FUNCTION_DECLARATION',
        patternConfig: {
            templateKey: 'MUTABLE_DEFAULT_ARG',
            languageSpecific: true,
            languages: ['python']
        },
        tags: ['best-practice', 'python', 'gotchas']
    },

    // ========================================================
    // PERFORMANCE RULES (5)
    // ========================================================
    {
        name: 'no-sync-io',
        displayName: 'No Synchronous I/O',
        description: 'Avoid synchronous I/O operations that block the event loop. Use async alternatives.',
        category: 'PERFORMANCE',
        severity: 'WARNING',
        patternType: 'FUNCTION_CALL',
        patternConfig: {
            templateKey: 'FUNCTION_CALL_SIMPLE',
            functionNames: ['readFileSync', 'writeFileSync', 'existsSync', 'readdirSync'],
            matchAny: true
        },
        tags: ['performance', 'async', 'io', 'blocking']
    },
    {
        name: 'no-regex-in-loop',
        displayName: 'No Regex Creation in Loop',
        description: 'Create regex patterns outside of loops to avoid repeated compilation overhead.',
        category: 'PERFORMANCE',
        severity: 'WARNING',
        patternType: 'LOOP',
        patternConfig: {
            templateKey: 'REGEX_IN_LOOP',
            checkNested: true
        },
        tags: ['performance', 'regex', 'loops', 'optimization']
    },
    {
        name: 'no-unnecessary-await-in-loop',
        displayName: 'No Sequential Await in Loop',
        description: 'Use Promise.all() for independent async operations instead of awaiting in a loop.',
        category: 'PERFORMANCE',
        severity: 'WARNING',
        patternType: 'LOOP',
        patternConfig: {
            templateKey: 'AWAIT_IN_LOOP',
            checkSequential: true
        },
        tags: ['performance', 'async', 'parallelization']
    },
    {
        name: 'no-expensive-operations-in-render',
        displayName: 'No Expensive Operations in Render',
        description: 'Avoid expensive computations or side effects in render methods. Use memoization.',
        category: 'PERFORMANCE',
        severity: 'WARNING',
        patternType: 'FUNCTION_DECLARATION',
        patternConfig: {
            templateKey: 'FUNCTION_DECLARATION_NAME',
            pattern: '^render',
            checkExpensiveOps: true
        },
        tags: ['performance', 'react', 'rendering', 'memoization']
    },
    {
        name: 'prefer-lazy-loading',
        displayName: 'Consider Lazy Loading',
        description: 'Large imports should use dynamic import() for code splitting and lazy loading.',
        category: 'PERFORMANCE',
        severity: 'WARNING',
        patternType: 'IMPORT',
        patternConfig: {
            templateKey: 'IMPORT_FROM',
            pattern: '(lodash|moment|dayjs|rxjs|antd|@mui)',
            suggestDynamic: true
        },
        tags: ['performance', 'bundling', 'lazy-loading']
    }
];

// ============================================================
// SEED FUNCTION
// ============================================================

async function seedAbstractRules() {
    console.log('📋 Seeding Abstract Rules...\n');
    
    let created = 0;
    let updated = 0;
    let errors = 0;

    for (const rule of ABSTRACT_RULES) {
        try {
            const result = await prisma.abstractRule.upsert({
                where: { name: rule.name },
                update: {
                    displayName: rule.displayName,
                    description: rule.description,
                    category: rule.category,
                    severity: rule.severity,
                    patternType: rule.patternType,
                    patternConfig: rule.patternConfig,
                    tags: rule.tags,
                    isActive: true,
                    updatedAt: new Date()
                },
                create: {
                    name: rule.name,
                    displayName: rule.displayName,
                    description: rule.description,
                    category: rule.category,
                    severity: rule.severity,
                    patternType: rule.patternType,
                    patternConfig: rule.patternConfig,
                    tags: rule.tags,
                    isActive: true
                }
            });
            
            const icon = {
                SECURITY: '🔒',
                NAMING: '📝',
                STYLE: '🎨',
                BEST_PRACTICE: '✨',
                PERFORMANCE: '⚡'
            }[rule.category];
            
            console.log(`  ${icon} ${rule.displayName}`);
            created++;
        } catch (error) {
            console.log(`  ❌ ${rule.name}: ${error.message}`);
            errors++;
        }
    }

    console.log('\n' + '─'.repeat(50));
    console.log(`📊 Results: ${created} rules created/updated, ${errors} errors`);
    
    return { created, errors };
}

// ============================================================
// MAIN
// ============================================================

async function main() {
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║           ABSTRACT RULES SEED                                ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    try {
        const result = await seedAbstractRules();
        
        console.log('\n✅ Abstract rules seeded successfully!');
        
        // Group by category for summary
        const byCategory = ABSTRACT_RULES.reduce((acc, rule) => {
            acc[rule.category] = (acc[rule.category] || 0) + 1;
            return acc;
        }, {});
        
        console.log('\nRules by category:');
        for (const [category, count] of Object.entries(byCategory)) {
            const icon = {
                SECURITY: '🔒',
                NAMING: '📝',
                STYLE: '🎨',
                BEST_PRACTICE: '✨',
                PERFORMANCE: '⚡'
            }[category];
            console.log(`  ${icon} ${category}: ${count} rules`);
        }
        
    } catch (error) {
        console.error('❌ Error seeding rules:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = { ABSTRACT_RULES, seedAbstractRules };
