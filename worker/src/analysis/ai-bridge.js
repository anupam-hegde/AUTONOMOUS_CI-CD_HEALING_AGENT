/**
 * AI Bridge Service
 * Connects to LLM to handle "Intelligence" tasks.
 */
class AIBridge {
    constructor() {
        // In production, init Gemini/OpenAI client here
        this.model = "gemini-pro";
    }

    /**
     * Task 1: Configuration Time
     * Converts English requirements to Tree-sitter S-Expressions.
     */
    async generateQuery(language, ruleDescription) {
        const prompt = `
      You are an expert in Tree-sitter Query Syntax (Scheme-like).
      Target Language: ${language}
      Goal: Create a query to match the following rule: "${ruleDescription}"
      
      Requirements:
      1. Return ONLY the raw S-expression. No markdown, no explanations.
      2. Capture the violating node as @target.
      3. Use #match? or #eq? predicates where necessary.
      
      Example Input: "Function names must not be snake_case" (JavaScript)
      Example Output: 
      (function_declaration name: (identifier) @target (#match? @target "_"))
    `;

        // START MOCK RESPONSE
        console.log(`[AI] Generating query for: ${ruleDescription}`);
        // Return a safe dummy query so the app works without an API key
        if (ruleDescription.toLowerCase().includes("camelcase")) {
            return `(identifier) @target (#match? @target "_")`; // Matches underscores (simplified)
        }
        return `(identifier) @target`; // Catch-all default
        // END MOCK RESPONSE
    }

    /**
     * Task 2: Runtime Support
     * Explains why a specific snippet violated a rule.
     */
    async explainViolation(ruleDescription, codeSnippet) {
        const prompt = `
      Rule: ${ruleDescription}
      Violating Code: "${codeSnippet}"
      
      Explain briefly (1 sentence) why this code violates the rule.
    `;

        return `The identifier "${codeSnippet}" contains an underscore, which violates the camelCase rule.`;
    }

    /**
     * Task 3: Auto-Remediation
     * Suggests a code fix.
     */
    async suggestFix(ruleDescription, codeSnippet) {
        const prompt = `
      Rule: ${ruleDescription}
      Bad Code: "${codeSnippet}"
      
      Return ONLY the corrected code snippet.
    `;

        // Mock logic for camelCase
        if (codeSnippet.includes('_')) {
            return codeSnippet.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
        }
        return codeSnippet;
    }
}

module.exports = new AIBridge();
