/**
 * PR Analysis Orchestrator
 * Coordinates the full analysis flow: fetch -> parse -> analyze -> report
 */
const GitHubClient = require('./integrations/github');
const engine = require('./analysis/engine');
const aiBridge = require('./analysis/ai-bridge');
const jiraService = require('./integrations/jira');

class AnalysisOrchestrator {
    constructor(installationId) {
        this.github = new GitHubClient(installationId);
    }

    /**
     * Run full analysis on a PR
     */
    async analyzePR({ owner, repo, prNumber, headSha, rules }) {
        console.log(`[Orchestrator] Starting analysis for ${owner}/${repo}#${prNumber}`);

        await this.github.init();

        // Step 1: Get changed files
        const files = await this.github.getPRFiles(owner, repo, prNumber);
        console.log(`[Orchestrator] Found ${files.length} changed files`);

        // Filter to supported file types
        const supportedExtensions = {
            '.js': 'javascript',
            '.jsx': 'javascript',
            '.ts': 'javascript', // Tree-sitter uses same parser for TS
            '.java': 'java',
            '.py': 'python',
        };

        const analyzableFiles = files.filter(f => {
            const ext = '.' + f.filename.split('.').pop();
            return supportedExtensions[ext] && f.status !== 'removed';
        });

        console.log(`[Orchestrator] ${analyzableFiles.length} files to analyze`);

        // Step 2: Analyze each file
        const allViolations = [];

        for (const file of analyzableFiles) {
            const ext = '.' + file.filename.split('.').pop();
            const language = supportedExtensions[ext];

            // Fetch file content
            const content = await this.github.getFileContent(owner, repo, file.filename, headSha);

            // Get rules for this language
            const languageRules = rules.filter(r => r.language === language);

            if (languageRules.length === 0) continue;

            // Run analysis
            const violations = await engine.analyze(content, language, languageRules);

            // Add file context to violations
            violations.forEach(v => {
                v.filePath = file.filename;
                allViolations.push(v);
            });
        }

        console.log(`[Orchestrator] Found ${allViolations.length} total violations`);

        // Step 3: Generate AI explanations and fixes
        for (const violation of allViolations) {
            const rule = rules.find(r => r.id === violation.ruleId);
            if (rule) {
                violation.explanation = await aiBridge.explainViolation(rule.description, violation.snippet);
                violation.suggestedFix = await aiBridge.suggestFix(rule.description, violation.snippet);
            }
        }

        // Step 4: Post results to GitHub
        await this.postResults(owner, repo, prNumber, headSha, allViolations);

        // Step 5: Create Jira ticket for critical violations
        const criticalViolations = allViolations.filter(v => {
            const rule = rules.find(r => r.id === v.ruleId);
            return rule?.severity === 'CRITICAL';
        });

        if (criticalViolations.length > 0) {
            await jiraService.createComplianceTicket('COMP', prNumber, criticalViolations);
        }

        return {
            filesAnalyzed: analyzableFiles.length,
            totalViolations: allViolations.length,
            criticalViolations: criticalViolations.length,
        };
    }

    /**
     * Post analysis results to GitHub
     */
    async postResults(owner, repo, prNumber, commitId, violations) {
        if (violations.length === 0) {
            // All good - create success check
            await this.github.createCheckRun(owner, repo, commitId, 'CodeGuard Compliance', 'completed', 'success', {
                title: '✅ All compliance checks passed',
                summary: 'No violations detected.',
            });
            return;
        }

        // Create review comments for each violation
        const comments = violations.map(v => ({
            path: v.filePath,
            line: v.line,
            body: `### ⚠️ ${v.message}\n\n${v.explanation}\n\n**Suggested Fix:**\n\`\`\`\n${v.suggestedFix}\n\`\`\``,
        }));

        // Post review
        const event = violations.some(v => v.severity === 'CRITICAL') ? 'REQUEST_CHANGES' : 'COMMENT';
        await this.github.createReview(owner, repo, prNumber, commitId, comments, event);

        // Create check run
        const conclusion = violations.some(v => v.severity === 'CRITICAL') ? 'failure' : 'neutral';
        await this.github.createCheckRun(owner, repo, commitId, 'CodeGuard Compliance', 'completed', conclusion, {
            title: `Found ${violations.length} compliance issue${violations.length > 1 ? 's' : ''}`,
            summary: `${violations.length} violation(s) detected across the changed files.`,
        });
    }
}

module.exports = AnalysisOrchestrator;
