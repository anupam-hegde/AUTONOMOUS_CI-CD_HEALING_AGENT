const Parser = require('tree-sitter');
const registry = require('./language-registry');

class AnalysisEngine {
    /**
     * Run a full analysis on a file.
     * @param {string} sourceCode - The raw file content.
     * @param {string} language - The language identifier (e.g., 'javascript').
     * @param {Array<{id: string, treeSitterQuery: string, message: string}>} rules - List of rules to check.
     * @returns {Promise<Array<Violation>>} - List of detected violations.
     */
    async analyze(sourceCode, language, rules) {
        if (!rules || rules.length === 0) return [];

        const violations = [];

        try {
            // 1. Get Parser & Parse Code
            const parser = registry.getParser(language);
            const tree = parser.parse(sourceCode);
            const languageObj = registry.getLanguage(language);

            // 2. Execute Each Rule
            // Note: In production, we might want to combine compatible queries, 
            // but for granular error reporting per-rule execution is safer and clearer.
            for (const rule of rules) {
                try {
                    // Compile the query
                    const query = new Parser.Query(languageObj, rule.treeSitterQuery);

                    // Execute against root node
                    const matches = query.matches(tree.rootNode);

                    // Process matches
                    for (const match of matches) {
                        // By convention, we look for a capture named @target or the first capture
                        const capture = match.captures[0];
                        if (!capture) continue;

                        const node = capture.node;

                        violations.push({
                            ruleId: rule.id,
                            message: rule.message || "Rule violation detected",
                            line: node.startPosition.row + 1, // 1-indexed for humans/GitHub
                            column: node.startPosition.column,
                            snippet: node.text
                        });
                    }
                } catch (queryError) {
                    console.error(`Invalid Query for Rule ${rule.id}:`, queryError.message);
                    // We don't crash the whole analysis for one bad rule.
                    violations.push({
                        ruleId: rule.id,
                        message: `Configuration Error: Invalid Tree-sitter Query. Please update the rule.`,
                        line: 1,
                        isSystemError: true
                    });
                }
            }

        } catch (err) {
            console.error("Analysis Failed:", err);
            throw err;
        }

        return violations;
    }
}

module.exports = new AnalysisEngine();
