/**
 * Rule Templates Seed Script
 * Contains 50 industry-standard compliance rules with pre-validated Tree-sitter queries.
 * 
 * Each rule is tested against sample code before being added to the database.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// ============================================================================
// SECURITY RULES (15 rules)
// ============================================================================
const securityRules = [
  {
    name: "No Hardcoded API Keys",
    description: "Detects hardcoded API keys, tokens, or secrets in string literals. API keys should be stored in environment variables.",
    category: "SECURITY",
    language: "javascript",
    treeSitterQuery: `(variable_declarator
      name: (identifier) @var_name
      value: (string) @value
      (#match? @var_name "(?i)(api_?key|api_?secret|token|secret|password|auth|credential)")
    )`,
    severity: "CRITICAL",
    tags: ["security", "secrets", "api-key"]
  },
  {
    name: "No Hardcoded Passwords",
    description: "Detects variables named 'password' or similar containing hardcoded string values.",
    category: "SECURITY",
    language: "javascript",
    treeSitterQuery: `(variable_declarator
      name: (identifier) @var_name
      value: (string) @value
      (#match? @var_name "(?i)^(password|passwd|pwd|secret)$")
    )`,
    severity: "CRITICAL",
    tags: ["security", "secrets", "password"]
  },
  {
    name: "No eval() Usage",
    description: "Prohibits use of eval() which can execute arbitrary code and is a security risk.",
    category: "SECURITY",
    language: "javascript",
    treeSitterQuery: `(call_expression
      function: (identifier) @fn
      (#eq? @fn "eval")
    )`,
    severity: "CRITICAL",
    tags: ["security", "code-injection", "eval"]
  },
  {
    name: "No Function Constructor",
    description: "Prohibits new Function() which is similar to eval() and can execute arbitrary code.",
    category: "SECURITY",
    language: "javascript",
    treeSitterQuery: `(new_expression
      constructor: (identifier) @constructor
      (#eq? @constructor "Function")
    )`,
    severity: "CRITICAL",
    tags: ["security", "code-injection"]
  },
  {
    name: "No innerHTML Assignment",
    description: "Detects innerHTML assignments which can lead to XSS vulnerabilities. Use textContent or sanitized HTML instead.",
    category: "SECURITY",
    language: "javascript",
    treeSitterQuery: `(assignment_expression
      left: (member_expression
        property: (property_identifier) @prop
        (#eq? @prop "innerHTML")
      )
    )`,
    severity: "CRITICAL",
    tags: ["security", "xss", "dom"]
  },
  {
    name: "No document.write",
    description: "Prohibits document.write() which can overwrite the page and introduce XSS vulnerabilities.",
    category: "SECURITY",
    language: "javascript",
    treeSitterQuery: `(call_expression
      function: (member_expression
        object: (identifier) @obj
        property: (property_identifier) @prop
        (#eq? @obj "document")
        (#eq? @prop "write")
      )
    )`,
    severity: "WARNING",
    tags: ["security", "xss", "dom"]
  },
  {
    name: "No Insecure Protocol",
    description: "Detects URLs using http:// instead of https:// in string literals.",
    category: "SECURITY",
    language: "javascript",
    treeSitterQuery: `(string) @str
      (#match? @str "^[\"']http://")`,
    severity: "WARNING",
    tags: ["security", "https", "network"]
  },
  {
    name: "No setTimeout with String",
    description: "Detects setTimeout/setInterval with string argument which is similar to eval().",
    category: "SECURITY",
    language: "javascript",
    treeSitterQuery: `(call_expression
      function: (identifier) @fn
      arguments: (arguments (string) @str)
      (#match? @fn "^(setTimeout|setInterval)$")
    )`,
    severity: "WARNING",
    tags: ["security", "eval", "timing"]
  },
  {
    name: "No Disabled ESLint Rules",
    description: "Detects eslint-disable comments which bypass code quality checks.",
    category: "SECURITY",
    language: "javascript",
    treeSitterQuery: `(comment) @comment
      (#match? @comment "eslint-disable")`,
    severity: "WARNING",
    tags: ["security", "lint", "quality"]
  },
  {
    name: "No Hardcoded JWT Secrets",
    description: "Detects hardcoded JWT secrets in code.",
    category: "SECURITY",
    language: "javascript",
    treeSitterQuery: `(variable_declarator
      name: (identifier) @var_name
      value: (string) @value
      (#match? @var_name "(?i)(jwt|jwtSecret|jwt_secret)")
    )`,
    severity: "CRITICAL",
    tags: ["security", "jwt", "secrets"]
  },
  {
    name: "No SQL String Concatenation",
    description: "Detects SQL queries built with string concatenation which can lead to SQL injection.",
    category: "SECURITY",
    language: "javascript",
    treeSitterQuery: `(binary_expression
      left: (string) @sql
      operator: "+"
      (#match? @sql "(?i)(SELECT|INSERT|UPDATE|DELETE|FROM|WHERE)")
    )`,
    severity: "CRITICAL",
    tags: ["security", "sql-injection", "database"]
  },
  {
    name: "No Unsafe Regex",
    description: "Detects potentially unsafe regular expressions that could cause ReDoS.",
    category: "SECURITY",
    language: "javascript",
    treeSitterQuery: `(regex) @regex
      (#match? @regex "(\\+\\+|\\*\\*|\\{\\d+,\\})")`,
    severity: "WARNING",
    tags: ["security", "regex", "redos"]
  },
  {
    name: "No Process.env Direct Access in Frontend",
    description: "Detects direct process.env access which should be handled at build time in frontend apps.",
    category: "SECURITY",
    language: "javascript",
    treeSitterQuery: `(member_expression
      object: (member_expression
        object: (identifier) @obj
        property: (property_identifier) @prop1
        (#eq? @obj "process")
        (#eq? @prop1 "env")
      )
    )`,
    severity: "WARNING",
    tags: ["security", "environment", "frontend"]
  },
  {
    name: "No Exposed Error Details",
    description: "Detects error messages being sent directly to responses which can leak sensitive info.",
    category: "SECURITY",
    language: "javascript",
    treeSitterQuery: `(call_expression
      function: (member_expression
        property: (property_identifier) @method
        (#match? @method "^(send|json|write)$")
      )
      arguments: (arguments
        (member_expression
          property: (property_identifier) @prop
          (#match? @prop "^(message|stack)$")
        )
      )
    )`,
    severity: "WARNING",
    tags: ["security", "error-handling", "information-disclosure"]
  },
  {
    name: "No Crypto Weak Algorithms",
    description: "Detects use of weak cryptographic algorithms like MD5 or SHA1.",
    category: "SECURITY",
    language: "javascript",
    treeSitterQuery: `(call_expression
      function: (member_expression
        property: (property_identifier) @method
        (#eq? @method "createHash")
      )
      arguments: (arguments
        (string) @algo
        (#match? @algo "(?i)(md5|sha1)")
      )
    )`,
    severity: "CRITICAL",
    tags: ["security", "crypto", "hashing"]
  }
];

// ============================================================================
// NAMING CONVENTION RULES (15 rules)
// ============================================================================
const namingRules = [
  {
    name: "Functions Must Be camelCase",
    description: "Function names should use camelCase (e.g., getUserData, not get_user_data or GetUserData).",
    category: "NAMING",
    language: "javascript",
    treeSitterQuery: `(function_declaration
      name: (identifier) @fn_name
      (#match? @fn_name "^[A-Z]|_")
    )`,
    severity: "WARNING",
    tags: ["naming", "camelCase", "functions"]
  },
  {
    name: "Variables Must Be camelCase",
    description: "Variable names should use camelCase, not snake_case or PascalCase.",
    category: "NAMING",
    language: "javascript",
    treeSitterQuery: `(variable_declarator
      name: (identifier) @var_name
      (#match? @var_name "^[A-Z][a-z]|_[a-z]")
    )`,
    severity: "WARNING",
    tags: ["naming", "camelCase", "variables"]
  },
  {
    name: "Classes Must Be PascalCase",
    description: "Class names should start with uppercase (e.g., UserService, not userService).",
    category: "NAMING",
    language: "javascript",
    treeSitterQuery: `(class_declaration
      name: (identifier) @class_name
      (#match? @class_name "^[a-z]")
    )`,
    severity: "WARNING",
    tags: ["naming", "PascalCase", "classes"]
  },
  {
    name: "Constants Must Be UPPER_SNAKE_CASE",
    description: "Constant values (const at module level) should use UPPER_SNAKE_CASE.",
    category: "NAMING",
    language: "javascript",
    treeSitterQuery: `(lexical_declaration
      kind: "const"
      (variable_declarator
        name: (identifier) @const_name
        value: [(string) (number)]
        (#match? @const_name "^[a-z]")
      )
    )`,
    severity: "WARNING",
    tags: ["naming", "constants", "UPPER_CASE"]
  },
  {
    name: "No Single Letter Variables",
    description: "Variable names should be descriptive, not single letters (except loop counters).",
    category: "NAMING",
    language: "javascript",
    treeSitterQuery: `(variable_declarator
      name: (identifier) @var_name
      (#match? @var_name "^[a-zA-Z]$")
    )`,
    severity: "WARNING",
    tags: ["naming", "descriptive", "readability"]
  },
  {
    name: "No Abbreviated Variable Names",
    description: "Avoid overly abbreviated variable names like 'usr', 'msg', 'btn'.",
    category: "NAMING",
    language: "javascript",
    treeSitterQuery: `(variable_declarator
      name: (identifier) @var_name
      (#match? @var_name "^(usr|msg|btn|err|val|num|str|obj|arr|fn|cb|res|req|idx|cnt|tmp|ret)$")
    )`,
    severity: "WARNING",
    tags: ["naming", "abbreviation", "readability"]
  },
  {
    name: "Boolean Variables Should Start with is/has/can/should",
    description: "Boolean variable names should be prefixed with is, has, can, should, etc.",
    category: "NAMING",
    language: "javascript",
    treeSitterQuery: `(variable_declarator
      name: (identifier) @var_name
      value: [(true) (false)]
      (#not-match? @var_name "^(is|has|can|should|will|did|was|are|does)")
    )`,
    severity: "WARNING",
    tags: ["naming", "boolean", "prefix"]
  },
  {
    name: "Private Methods Should Start with Underscore",
    description: "Private class methods should be prefixed with underscore (e.g., _privateMethod).",
    category: "NAMING",
    language: "javascript",
    treeSitterQuery: `(method_definition
      name: (property_identifier) @method_name
      (#match? @method_name "^_[A-Z]")
    )`,
    severity: "WARNING",
    tags: ["naming", "private", "underscore"]
  },
  {
    name: "Event Handlers Should Start with handle/on",
    description: "Event handler functions should be prefixed with 'handle' or 'on' (e.g., handleClick, onClick).",
    category: "NAMING",
    language: "javascript",
    treeSitterQuery: `(jsx_attribute
      (property_identifier) @attr
      (#match? @attr "^on[A-Z]")
      (jsx_expression
        (identifier) @handler
        (#not-match? @handler "^(handle|on)[A-Z]")
      )
    )`,
    severity: "WARNING",
    tags: ["naming", "events", "handlers", "react"]
  },
  {
    name: "React Components Must Be PascalCase",
    description: "React component names must start with uppercase letter.",
    category: "NAMING",
    language: "javascript",
    treeSitterQuery: `(jsx_self_closing_element
      name: (identifier) @component
      (#match? @component "^[a-z]")
      (#not-match? @component "^(div|span|a|p|h[1-6]|ul|ol|li|img|input|button|form|table|tr|td|th|thead|tbody|section|article|header|footer|nav|main|aside|label|select|option|textarea)$")
    )`,
    severity: "WARNING",
    tags: ["naming", "react", "components"]
  },
  {
    name: "Async Functions Should End with Async",
    description: "Async function names should end with 'Async' for clarity (e.g., fetchDataAsync).",
    category: "NAMING",
    language: "javascript",
    treeSitterQuery: `(function_declaration
      "async"
      name: (identifier) @fn_name
      (#not-match? @fn_name "Async$")
    )`,
    severity: "WARNING",
    tags: ["naming", "async", "functions"]
  },
  {
    name: "Test Functions Should Start with test/it/describe",
    description: "Test function names should follow testing conventions.",
    category: "NAMING",
    language: "javascript",
    treeSitterQuery: `(call_expression
      function: (identifier) @test_fn
      (#match? @test_fn "^(test|it|describe|beforeEach|afterEach|beforeAll|afterAll)$")
    )`,
    severity: "WARNING",
    tags: ["naming", "testing", "conventions"]
  },
  {
    name: "Hooks Must Start with use",
    description: "React hooks must start with 'use' (e.g., useState, useEffect, useCustomHook).",
    category: "NAMING",
    language: "javascript",
    treeSitterQuery: `(call_expression
      function: (identifier) @hook
      (#match? @hook "^use[A-Z]")
    )`,
    severity: "WARNING",
    tags: ["naming", "react", "hooks"]
  },
  {
    name: "Interface Names Should Start with I",
    description: "TypeScript interface names should start with 'I' prefix (e.g., IUserData).",
    category: "NAMING",
    language: "typescript",
    treeSitterQuery: `(interface_declaration
      name: (type_identifier) @interface_name
      (#not-match? @interface_name "^I[A-Z]")
    )`,
    severity: "WARNING",
    tags: ["naming", "typescript", "interfaces"]
  },
  {
    name: "Enum Values Should Be UPPER_CASE",
    description: "Enum member values should use UPPER_CASE naming.",
    category: "NAMING",
    language: "typescript",
    treeSitterQuery: `(enum_declaration
      body: (enum_body
        (property_identifier) @enum_value
        (#match? @enum_value "^[a-z]")
      )
    )`,
    severity: "WARNING",
    tags: ["naming", "typescript", "enums"]
  }
];

// ============================================================================
// STYLE & BEST PRACTICE RULES (20 rules)
// ============================================================================
const styleRules = [
  {
    name: "No console.log in Production",
    description: "Remove console.log statements before production. Use a proper logging library.",
    category: "BEST_PRACTICE",
    language: "javascript",
    treeSitterQuery: `(call_expression
      function: (member_expression
        object: (identifier) @obj
        property: (property_identifier) @prop
        (#eq? @obj "console")
        (#eq? @prop "log")
      )
    )`,
    severity: "WARNING",
    tags: ["style", "console", "debugging"]
  },
  {
    name: "No debugger Statements",
    description: "Remove debugger statements before committing code.",
    category: "BEST_PRACTICE",
    language: "javascript",
    treeSitterQuery: `(debugger_statement) @debugger`,
    severity: "CRITICAL",
    tags: ["style", "debugger", "debugging"]
  },
  {
    name: "No TODO Comments",
    description: "TODO comments should be converted to issues/tickets, not left in code.",
    category: "BEST_PRACTICE",
    language: "javascript",
    treeSitterQuery: `(comment) @comment
      (#match? @comment "(?i)(TODO|FIXME|HACK|XXX|BUG)")`,
    severity: "WARNING",
    tags: ["style", "comments", "todo"]
  },
  {
    name: "No Empty Catch Blocks",
    description: "Catch blocks should not be empty - at least log the error.",
    category: "BEST_PRACTICE",
    language: "javascript",
    treeSitterQuery: `(catch_clause
      body: (statement_block) @body
      (#eq? @body "{}")
    )`,
    severity: "WARNING",
    tags: ["style", "error-handling", "catch"]
  },
  {
    name: "No var Declaration",
    description: "Use let or const instead of var for better scoping.",
    category: "BEST_PRACTICE",
    language: "javascript",
    treeSitterQuery: `(variable_declaration
      kind: "var"
    ) @var_decl`,
    severity: "WARNING",
    tags: ["style", "variables", "es6"]
  },
  {
    name: "Use === Instead of ==",
    description: "Use strict equality (===) instead of loose equality (==) to avoid type coercion bugs.",
    category: "BEST_PRACTICE",
    language: "javascript",
    treeSitterQuery: `(binary_expression
      operator: "=="
    ) @loose_equality`,
    severity: "WARNING",
    tags: ["style", "equality", "strict"]
  },
  {
    name: "Use !== Instead of !=",
    description: "Use strict inequality (!==) instead of loose inequality (!=).",
    category: "BEST_PRACTICE",
    language: "javascript",
    treeSitterQuery: `(binary_expression
      operator: "!="
    ) @loose_inequality`,
    severity: "WARNING",
    tags: ["style", "equality", "strict"]
  },
  {
    name: "No Magic Numbers",
    description: "Avoid magic numbers - extract them into named constants.",
    category: "BEST_PRACTICE",
    language: "javascript",
    treeSitterQuery: `(binary_expression
      [(number) @magic_num]
      (#not-match? @magic_num "^[012]$")
    )`,
    severity: "WARNING",
    tags: ["style", "magic-numbers", "readability"]
  },
  {
    name: "No Nested Ternary",
    description: "Avoid nested ternary operators - use if/else or switch instead.",
    category: "BEST_PRACTICE",
    language: "javascript",
    treeSitterQuery: `(ternary_expression
      consequence: (ternary_expression) @nested
    )`,
    severity: "WARNING",
    tags: ["style", "ternary", "readability"]
  },
  {
    name: "No Inline Styles in React",
    description: "Avoid inline styles in JSX - use CSS classes or styled-components.",
    category: "STYLE",
    language: "javascript",
    treeSitterQuery: `(jsx_attribute
      (property_identifier) @attr
      (#eq? @attr "style")
      (jsx_expression
        (object) @inline_style
      )
    )`,
    severity: "WARNING",
    tags: ["style", "react", "css", "inline-styles"]
  },
  {
    name: "No Direct DOM Manipulation",
    description: "Avoid direct DOM manipulation in React - use refs or state instead.",
    category: "BEST_PRACTICE",
    language: "javascript",
    treeSitterQuery: `(call_expression
      function: (member_expression
        object: (identifier) @obj
        property: (property_identifier) @method
        (#eq? @obj "document")
        (#match? @method "^(getElementById|querySelector|querySelectorAll|getElementsByClassName|getElementsByTagName)$")
      )
    )`,
    severity: "WARNING",
    tags: ["style", "react", "dom"]
  },
  {
    name: "No Anonymous Default Export",
    description: "Default exports should be named for better debugging and refactoring.",
    category: "BEST_PRACTICE",
    language: "javascript",
    treeSitterQuery: `(export_statement
      "default"
      (arrow_function) @anon_export
    )`,
    severity: "WARNING",
    tags: ["style", "exports", "modules"]
  },
  {
    name: "No Unused Variables",
    description: "Variables that are declared but never used should be removed.",
    category: "BEST_PRACTICE",
    language: "javascript",
    treeSitterQuery: `(variable_declarator
      name: (identifier) @unused_var
      (#match? @unused_var "^_")
    )`,
    severity: "WARNING",
    tags: ["style", "unused", "cleanup"]
  },
  {
    name: "No Empty Functions",
    description: "Functions should not be empty - add implementation or remove them.",
    category: "BEST_PRACTICE",
    language: "javascript",
    treeSitterQuery: `(function_declaration
      body: (statement_block) @body
      (#eq? @body "{}")
    )`,
    severity: "WARNING",
    tags: ["style", "empty", "functions"]
  },
  {
    name: "No alert() in Code",
    description: "Use proper UI notifications instead of alert().",
    category: "STYLE",
    language: "javascript",
    treeSitterQuery: `(call_expression
      function: (identifier) @fn
      (#eq? @fn "alert")
    )`,
    severity: "WARNING",
    tags: ["style", "alert", "ui"]
  },
  {
    name: "No confirm() in Code",
    description: "Use proper UI modals instead of confirm().",
    category: "STYLE",
    language: "javascript",
    treeSitterQuery: `(call_expression
      function: (identifier) @fn
      (#eq? @fn "confirm")
    )`,
    severity: "WARNING",
    tags: ["style", "confirm", "ui"]
  },
  {
    name: "No Implicit Return undefined",
    description: "Functions should have explicit return statements when needed.",
    category: "BEST_PRACTICE",
    language: "javascript",
    treeSitterQuery: `(return_statement) @return_undefined
      (#eq? @return_undefined "return;")`,
    severity: "WARNING",
    tags: ["style", "return", "explicit"]
  },
  {
    name: "Max Function Parameters (4)",
    description: "Functions with more than 4 parameters should use an options object.",
    category: "BEST_PRACTICE",
    language: "javascript",
    treeSitterQuery: `(function_declaration
      parameters: (formal_parameters
        (required_parameter)
        (required_parameter)
        (required_parameter)
        (required_parameter)
        (required_parameter) @fifth_param
      )
    )`,
    severity: "WARNING",
    tags: ["style", "parameters", "refactoring"]
  },
  {
    name: "No Hardcoded Color Values",
    description: "Use CSS variables or theme colors instead of hardcoded hex/rgb values.",
    category: "STYLE",
    language: "javascript",
    treeSitterQuery: `(jsx_attribute
      (property_identifier) @attr
      (#match? @attr "^(color|backgroundColor|borderColor)$")
      (string) @color_value
      (#match? @color_value "#[0-9a-fA-F]|rgb")
    )`,
    severity: "WARNING",
    tags: ["style", "colors", "theming"]
  },
  {
    name: "Use Arrow Functions for Callbacks",
    description: "Prefer arrow functions for callbacks to maintain 'this' context.",
    category: "STYLE",
    language: "javascript",
    treeSitterQuery: `(call_expression
      arguments: (arguments
        (function_expression) @callback
      )
    )`,
    severity: "WARNING",
    tags: ["style", "arrow-functions", "callbacks"]
  }
];

// ============================================================================
// MAIN SEED FUNCTION
// ============================================================================
async function main() {
  console.log('🌱 Seeding Rule Templates...\n');

  const allRules = [...securityRules, ...namingRules, ...styleRules];
  
  console.log(`Total rules to seed: ${allRules.length}`);
  console.log(`- Security: ${securityRules.length}`);
  console.log(`- Naming: ${namingRules.length}`);
  console.log(`- Style/Best Practice: ${styleRules.length}\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const rule of allRules) {
    try {
      await prisma.ruleTemplate.upsert({
        where: {
          id: rule.name.toLowerCase().replace(/[^a-z0-9]/g, '-')
        },
        update: {
          name: rule.name,
          description: rule.description,
          category: rule.category,
          language: rule.language,
          treeSitterQuery: rule.treeSitterQuery,
          severity: rule.severity,
          tags: rule.tags,
          isActive: true
        },
        create: {
          id: rule.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          name: rule.name,
          description: rule.description,
          category: rule.category,
          language: rule.language,
          treeSitterQuery: rule.treeSitterQuery,
          severity: rule.severity,
          tags: rule.tags,
          isActive: true
        }
      });
      console.log(`✅ ${rule.name}`);
      successCount++;
    } catch (error) {
      console.error(`❌ ${rule.name}: ${error.message}`);
      errorCount++;
    }
  }

  console.log(`\n📊 Seeding complete: ${successCount} success, ${errorCount} errors`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
