const engine = require('./src/analysis/engine');

async function runTest() {
    const code = `
    class User {
      isValid() { return true; }
    }
    
    // Violation: snake_case function is banned
    function calculate_total() {
      return 100;
    }

    const MAX_limit = 50; // Violation: Constant naming
  `;

    // Example "AI Generated" Tree-sitter Query
    // Matches function declarations with underscores (snake_case)
    const snakeCaseRule = {
        id: 'no-snake-case',
        message: 'Function names must use camelCase.',
        treeSitterQuery: `
      (function_declaration 
        name: (identifier) @name 
        (#match? @name "_")
      )
    `
    };

    console.log("Running Analysis...");
    const results = await engine.analyze(code, 'javascript', [snakeCaseRule]);

    console.log("Results:", JSON.stringify(results, null, 2));
}

runTest();
