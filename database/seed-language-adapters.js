/**
 * LANGUAGE ADAPTERS SEED
 * ======================
 * Seeds the LanguageAdapter table with support for:
 * - JavaScript
 * - TypeScript
 * - Python
 * - Java
 * 
 * Each adapter maps abstract pattern types to language-specific Tree-sitter queries
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ============================================================
// LANGUAGE ADAPTERS
// ============================================================

const LANGUAGE_ADAPTERS = [
    // --------------------------------------------------------
    // JAVASCRIPT
    // --------------------------------------------------------
    {
        language: 'javascript',
        displayName: 'JavaScript',
        fileExtensions: ['.js', '.jsx', '.mjs', '.cjs'],
        treeSitterGrammar: 'tree-sitter-javascript',
        namingConvention: 'camelCase',
        
        nodeTypeMappings: {
            FUNCTION_CALL: 'call_expression',
            FUNCTION_DECLARATION: 'function_declaration',
            ARROW_FUNCTION: 'arrow_function',
            CLASS_DECLARATION: 'class_declaration',
            ASSIGNMENT: 'variable_declarator',
            STRING_LITERAL: 'string',
            TEMPLATE_LITERAL: 'template_string',
            TRY_STATEMENT: 'try_statement',
            CATCH_CLAUSE: 'catch_clause',
            THROW_STATEMENT: 'throw_statement',
            IMPORT_STATEMENT: 'import_statement',
            IDENTIFIER: 'identifier',
            PROPERTY_IDENTIFIER: 'property_identifier',
            MEMBER_EXPRESSION: 'member_expression',
            BINARY_EXPRESSION: 'binary_expression',
            IF_STATEMENT: 'if_statement',
            FOR_STATEMENT: 'for_statement',
            WHILE_STATEMENT: 'while_statement',
            BLOCK: 'statement_block',
            COMMENT: 'comment',
            NUMBER: 'number',
            BOOLEAN: 'true|false',
            NULL: 'null',
            UNDEFINED: 'undefined',
            ARRAY: 'array',
            OBJECT: 'object'
        },
        
        queryTemplates: {
            // Pattern: FUNCTION_CALL - Detect function calls by name
            FUNCTION_CALL_SIMPLE: `
(call_expression
    function: (identifier) @fn_name
    (#eq? @fn_name "{{name}}")) @match`,
            
            FUNCTION_CALL_MEMBER: `
(call_expression
    function: (member_expression
        object: (identifier) @obj
        property: (property_identifier) @method)
    (#eq? @obj "{{object}}")
    (#eq? @method "{{method}}")) @match`,
            
            FUNCTION_CALL_CHAINED: `
(call_expression
    function: (member_expression
        property: (property_identifier) @method)
    (#eq? @method "{{method}}")) @match`,

            // Pattern: ASSIGNMENT - Detect variable assignments
            ASSIGNMENT_WITH_STRING: `
(variable_declarator
    name: (identifier) @var_name
    value: (string) @value
    (#match? @var_name "{{pattern}}")) @match`,
            
            ASSIGNMENT_ANY: `
(variable_declarator
    name: (identifier) @var_name
    (#match? @var_name "{{pattern}}")) @match`,

            // Pattern: FUNCTION_DECLARATION - Detect function definitions
            FUNCTION_DECLARATION_NAME: `
(function_declaration
    name: (identifier) @fn_name
    (#match? @fn_name "{{pattern}}")) @match`,
            
            ARROW_FUNCTION_NAME: `
(variable_declarator
    name: (identifier) @fn_name
    value: (arrow_function)
    (#match? @fn_name "{{pattern}}")) @match`,

            // Pattern: CLASS_DECLARATION
            CLASS_DECLARATION_NAME: `
(class_declaration
    name: (identifier) @class_name
    (#match? @class_name "{{pattern}}")) @match`,

            // Pattern: TRY_CATCH - Empty catch blocks
            TRY_CATCH_EMPTY: `
(catch_clause
    body: (statement_block) @body
    (#match? @body "^\\\\{\\\\s*\\\\}$")) @match`,
            
            TRY_CATCH_NO_RETHROW: `
(catch_clause
    body: (statement_block) @body
    (#not-match? @body "throw")) @match`,

            // Pattern: IMPORT
            IMPORT_FROM: `
(import_statement
    source: (string) @source
    (#match? @source "{{pattern}}")) @match`,

            // Pattern: BINARY_EXPRESSION - Equality checks
            BINARY_LOOSE_EQUALITY: `
(binary_expression
    operator: "=="
    right: (null)) @match`,
            
            BINARY_EXPRESSION_OP: `
(binary_expression
    operator: "{{operator}}") @match`,

            // Pattern: LITERAL - Magic numbers/strings
            LITERAL_MAGIC_NUMBER: `
(number) @num
(#not-match? @num "^[01]$") @match`,

            // Pattern: COMMENT - TODO/FIXME
            COMMENT_PATTERN: `
(comment) @comment
(#match? @comment "{{pattern}}") @match`,

            // Pattern: DEBUGGER
            DEBUGGER_STATEMENT: `(debugger_statement) @match`,

            // Pattern: CONSOLE methods
            CONSOLE_ANY: `
(call_expression
    function: (member_expression
        object: (identifier) @obj
        property: (property_identifier) @method)
    (#eq? @obj "console")) @match`
        }
    },

    // --------------------------------------------------------
    // TYPESCRIPT
    // --------------------------------------------------------
    {
        language: 'typescript',
        displayName: 'TypeScript',
        fileExtensions: ['.ts', '.tsx', '.mts', '.cts'],
        treeSitterGrammar: 'tree-sitter-typescript',
        namingConvention: 'camelCase',
        
        nodeTypeMappings: {
            FUNCTION_CALL: 'call_expression',
            FUNCTION_DECLARATION: 'function_declaration',
            ARROW_FUNCTION: 'arrow_function',
            CLASS_DECLARATION: 'class_declaration',
            INTERFACE_DECLARATION: 'interface_declaration',
            TYPE_ALIAS: 'type_alias_declaration',
            ASSIGNMENT: 'variable_declarator',
            STRING_LITERAL: 'string',
            TEMPLATE_LITERAL: 'template_string',
            TRY_STATEMENT: 'try_statement',
            CATCH_CLAUSE: 'catch_clause',
            IMPORT_STATEMENT: 'import_statement',
            IDENTIFIER: 'identifier',
            PROPERTY_IDENTIFIER: 'property_identifier',
            MEMBER_EXPRESSION: 'member_expression',
            BINARY_EXPRESSION: 'binary_expression',
            TYPE_ANNOTATION: 'type_annotation',
            AS_EXPRESSION: 'as_expression',
            BLOCK: 'statement_block',
            COMMENT: 'comment'
        },
        
        // TypeScript uses same query templates as JavaScript (same AST structure)
        queryTemplates: {
            FUNCTION_CALL_SIMPLE: `
(call_expression
    function: (identifier) @fn_name
    (#eq? @fn_name "{{name}}")) @match`,
            
            FUNCTION_CALL_MEMBER: `
(call_expression
    function: (member_expression
        object: (identifier) @obj
        property: (property_identifier) @method)
    (#eq? @obj "{{object}}")
    (#eq? @method "{{method}}")) @match`,
            
            FUNCTION_CALL_CHAINED: `
(call_expression
    function: (member_expression
        property: (property_identifier) @method)
    (#eq? @method "{{method}}")) @match`,

            ASSIGNMENT_WITH_STRING: `
(variable_declarator
    name: (identifier) @var_name
    value: (string) @value
    (#match? @var_name "{{pattern}}")) @match`,
            
            ASSIGNMENT_ANY: `
(variable_declarator
    name: (identifier) @var_name
    (#match? @var_name "{{pattern}}")) @match`,

            FUNCTION_DECLARATION_NAME: `
(function_declaration
    name: (identifier) @fn_name
    (#match? @fn_name "{{pattern}}")) @match`,

            CLASS_DECLARATION_NAME: `
(class_declaration
    name: (type_identifier) @class_name
    (#match? @class_name "{{pattern}}")) @match`,

            TRY_CATCH_EMPTY: `
(catch_clause
    body: (statement_block) @body
    (#match? @body "^\\\\{\\\\s*\\\\}$")) @match`,

            IMPORT_FROM: `
(import_statement
    source: (string) @source
    (#match? @source "{{pattern}}")) @match`,

            BINARY_LOOSE_EQUALITY: `
(binary_expression
    operator: "=="
    right: (null)) @match`,

            COMMENT_PATTERN: `
(comment) @comment
(#match? @comment "{{pattern}}") @match`,

            DEBUGGER_STATEMENT: `(debugger_statement) @match`,

            CONSOLE_ANY: `
(call_expression
    function: (member_expression
        object: (identifier) @obj
        property: (property_identifier) @method)
    (#eq? @obj "console")) @match`,

            // TypeScript-specific: any type usage
            ANY_TYPE: `
(type_annotation
    (predefined_type) @type
    (#eq? @type "any")) @match`,
            
            // TypeScript-specific: as any cast
            AS_ANY_CAST: `
(as_expression
    (predefined_type) @type
    (#eq? @type "any")) @match`
        }
    },

    // --------------------------------------------------------
    // PYTHON
    // --------------------------------------------------------
    {
        language: 'python',
        displayName: 'Python',
        fileExtensions: ['.py', '.pyw', '.pyi'],
        treeSitterGrammar: 'tree-sitter-python',
        namingConvention: 'snake_case',
        
        nodeTypeMappings: {
            FUNCTION_CALL: 'call',
            FUNCTION_DECLARATION: 'function_definition',
            CLASS_DECLARATION: 'class_definition',
            ASSIGNMENT: 'assignment',
            STRING_LITERAL: 'string',
            TRY_STATEMENT: 'try_statement',
            EXCEPT_CLAUSE: 'except_clause',
            RAISE_STATEMENT: 'raise_statement',
            IMPORT_STATEMENT: 'import_statement',
            IMPORT_FROM: 'import_from_statement',
            IDENTIFIER: 'identifier',
            ATTRIBUTE: 'attribute',
            BINARY_EXPRESSION: 'binary_operator',
            COMPARISON: 'comparison_operator',
            IF_STATEMENT: 'if_statement',
            FOR_STATEMENT: 'for_statement',
            WHILE_STATEMENT: 'while_statement',
            BLOCK: 'block',
            COMMENT: 'comment',
            PASS: 'pass_statement',
            DECORATOR: 'decorator'
        },
        
        queryTemplates: {
            FUNCTION_CALL_SIMPLE: `
(call
    function: (identifier) @fn_name
    (#eq? @fn_name "{{name}}")) @match`,
            
            FUNCTION_CALL_ATTRIBUTE: `
(call
    function: (attribute
        object: (identifier) @obj
        attribute: (identifier) @method)
    (#eq? @obj "{{object}}")
    (#eq? @method "{{method}}")) @match`,
            
            FUNCTION_CALL_CHAINED: `
(call
    function: (attribute
        attribute: (identifier) @method)
    (#eq? @method "{{method}}")) @match`,

            ASSIGNMENT_WITH_STRING: `
(assignment
    left: (identifier) @var_name
    right: (string) @value
    (#match? @var_name "{{pattern}}")) @match`,
            
            ASSIGNMENT_ANY: `
(assignment
    left: (identifier) @var_name
    (#match? @var_name "{{pattern}}")) @match`,

            FUNCTION_DECLARATION_NAME: `
(function_definition
    name: (identifier) @fn_name
    (#match? @fn_name "{{pattern}}")) @match`,

            CLASS_DECLARATION_NAME: `
(class_definition
    name: (identifier) @class_name
    (#match? @class_name "{{pattern}}")) @match`,

            // Python: except with pass (swallowed exception)
            TRY_CATCH_EMPTY: `
(except_clause
    body: (block
        (pass_statement))) @match`,
            
            TRY_CATCH_NO_RERAISE: `
(except_clause
    body: (block) @body
    (#not-match? @body "raise")) @match`,

            IMPORT_MODULE: `
(import_statement
    name: (dotted_name) @module
    (#match? @module "{{pattern}}")) @match`,
            
            IMPORT_FROM_MODULE: `
(import_from_statement
    module_name: (dotted_name) @module
    (#match? @module "{{pattern}}")) @match`,

            COMPARISON_IS_NONE: `
(comparison_operator
    operators: (is)
    (none)) @match`,

            COMMENT_PATTERN: `
(comment) @comment
(#match? @comment "{{pattern}}") @match`,

            // Python print statements
            PRINT_CALL: `
(call
    function: (identifier) @fn
    (#eq? @fn "print")) @match`,

            // Python eval/exec
            EVAL_EXEC: `
(call
    function: (identifier) @fn
    (#match? @fn "^(eval|exec|compile|execfile)$")) @match`,

            // Python: mutable default argument
            MUTABLE_DEFAULT_ARG: `
(default_parameter
    value: [(list) (dictionary) (set)]) @match`
        }
    },

    // --------------------------------------------------------
    // JAVA
    // --------------------------------------------------------
    {
        language: 'java',
        displayName: 'Java',
        fileExtensions: ['.java'],
        treeSitterGrammar: 'tree-sitter-java',
        namingConvention: 'camelCase',
        
        nodeTypeMappings: {
            FUNCTION_CALL: 'method_invocation',
            FUNCTION_DECLARATION: 'method_declaration',
            CONSTRUCTOR: 'constructor_declaration',
            CLASS_DECLARATION: 'class_declaration',
            INTERFACE_DECLARATION: 'interface_declaration',
            ASSIGNMENT: 'variable_declarator',
            STRING_LITERAL: 'string_literal',
            TRY_STATEMENT: 'try_statement',
            CATCH_CLAUSE: 'catch_clause',
            THROW_STATEMENT: 'throw_statement',
            IMPORT_DECLARATION: 'import_declaration',
            IDENTIFIER: 'identifier',
            FIELD_ACCESS: 'field_access',
            BINARY_EXPRESSION: 'binary_expression',
            IF_STATEMENT: 'if_statement',
            FOR_STATEMENT: 'for_statement',
            WHILE_STATEMENT: 'while_statement',
            BLOCK: 'block',
            COMMENT: 'comment',
            LINE_COMMENT: 'line_comment',
            BLOCK_COMMENT: 'block_comment',
            ANNOTATION: 'annotation'
        },
        
        queryTemplates: {
            FUNCTION_CALL_SIMPLE: `
(method_invocation
    name: (identifier) @method_name
    (#eq? @method_name "{{name}}")) @match`,
            
            FUNCTION_CALL_ON_OBJECT: `
(method_invocation
    object: (identifier) @obj
    name: (identifier) @method
    (#eq? @obj "{{object}}")
    (#eq? @method "{{method}}")) @match`,
            
            FUNCTION_CALL_CHAINED: `
(method_invocation
    name: (identifier) @method
    (#eq? @method "{{method}}")) @match`,

            // System.out.println detection
            SYSTEM_OUT_PRINT: `
(method_invocation
    object: (field_access
        object: (identifier) @sys
        field: (identifier) @out)
    name: (identifier) @method
    (#eq? @sys "System")
    (#eq? @out "out")
    (#match? @method "^print")) @match`,

            ASSIGNMENT_WITH_STRING: `
(variable_declarator
    name: (identifier) @var_name
    value: (string_literal) @value
    (#match? @var_name "{{pattern}}")) @match`,
            
            FIELD_WITH_STRING: `
(field_declaration
    declarator: (variable_declarator
        name: (identifier) @var_name
        value: (string_literal) @value)
    (#match? @var_name "{{pattern}}")) @match`,

            FUNCTION_DECLARATION_NAME: `
(method_declaration
    name: (identifier) @method_name
    (#match? @method_name "{{pattern}}")) @match`,

            CLASS_DECLARATION_NAME: `
(class_declaration
    name: (identifier) @class_name
    (#match? @class_name "{{pattern}}")) @match`,

            TRY_CATCH_EMPTY: `
(catch_clause
    body: (block) @body
    (#match? @body "^\\\\{\\\\s*\\\\}$")) @match`,
            
            TRY_CATCH_NO_RETHROW: `
(catch_clause
    body: (block) @body
    (#not-match? @body "throw")) @match`,

            IMPORT_PACKAGE: `
(import_declaration
    (scoped_identifier) @import
    (#match? @import "{{pattern}}")) @match`,

            BINARY_EQUALITY_NULL: `
(binary_expression
    operator: "=="
    right: (null_literal)) @match`,

            COMMENT_PATTERN: `
(line_comment) @comment
(#match? @comment "{{pattern}}") @match`,

            // Java: raw types (no generics)
            RAW_TYPE: `
(object_creation_expression
    type: (type_identifier) @type
    (#not-match? @type "<")) @match`,

            // Java: synchronized blocks
            SYNCHRONIZED_BLOCK: `
(synchronized_statement) @match`,

            // Java: instanceof without pattern
            INSTANCEOF_CHECK: `
(instanceof_expression) @match`
        }
    }
];

// ============================================================
// SEED FUNCTION
// ============================================================

async function seedLanguageAdapters() {
    console.log('🌍 Seeding Language Adapters...\n');
    
    let created = 0;
    let updated = 0;
    let errors = 0;

    for (const adapter of LANGUAGE_ADAPTERS) {
        try {
            const result = await prisma.languageAdapter.upsert({
                where: { language: adapter.language },
                update: {
                    displayName: adapter.displayName,
                    fileExtensions: adapter.fileExtensions,
                    treeSitterGrammar: adapter.treeSitterGrammar,
                    nodeTypeMappings: adapter.nodeTypeMappings,
                    queryTemplates: adapter.queryTemplates,
                    namingConvention: adapter.namingConvention,
                    isActive: true,
                    updatedAt: new Date()
                },
                create: {
                    language: adapter.language,
                    displayName: adapter.displayName,
                    fileExtensions: adapter.fileExtensions,
                    treeSitterGrammar: adapter.treeSitterGrammar,
                    nodeTypeMappings: adapter.nodeTypeMappings,
                    queryTemplates: adapter.queryTemplates,
                    namingConvention: adapter.namingConvention,
                    isActive: true
                }
            });
            
            console.log(`  ✅ ${adapter.displayName} (${adapter.fileExtensions.join(', ')})`);
            console.log(`     📝 ${Object.keys(adapter.queryTemplates).length} query templates`);
            created++;
        } catch (error) {
            console.log(`  ❌ ${adapter.displayName}: ${error.message}`);
            errors++;
        }
    }

    console.log('\n' + '─'.repeat(50));
    console.log(`📊 Results: ${created} adapters created/updated, ${errors} errors`);
    
    return { created, errors };
}

// ============================================================
// MAIN
// ============================================================

async function main() {
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║           LANGUAGE ADAPTERS SEED                             ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    try {
        const result = await seedLanguageAdapters();
        
        console.log('\n✅ Language adapters seeded successfully!');
        console.log('\nSupported languages:');
        
        for (const adapter of LANGUAGE_ADAPTERS) {
            console.log(`  • ${adapter.displayName} (${adapter.language})`);
        }
        
    } catch (error) {
        console.error('❌ Error seeding adapters:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = { LANGUAGE_ADAPTERS, seedLanguageAdapters };
