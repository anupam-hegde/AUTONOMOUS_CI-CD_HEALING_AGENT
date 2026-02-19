/**
 * Jira Integration Service
 * Creates tickets for CRITICAL compliance violations.
 */
class JiraService {
    constructor() {
        this.baseUrl = process.env.JIRA_HOST; // e.g., https://myorg.atlassian.net
        this.email = process.env.JIRA_EMAIL;
        this.token = process.env.JIRA_API_TOKEN;
    }

    /**
     * Creates a ticket for a list of violations.
     * Only creates ONE ticket per Analysis Run to avoid flooding.
     */
    async createComplianceTicket(projectKey, prNumber, criticalViolations) {
        if (criticalViolations.length === 0) return null;

        const summary = `Compliance Blockers detected in PR #${prNumber}`;
        const description = this._formatDescription(prNumber, criticalViolations);

        console.log(`[Jira] Creating ticket in ${projectKey}: ${summary}`);

        // TOD0: Implement actual fetch call to Jira API
        // const response = await fetch(`${this.baseUrl}/rest/api/3/issue`, ...);

        return "JIRA-123"; // Mock Ticket ID
    }

    _formatDescription(prNumber, violations) {
        let desc = `The following critical compliance issues were found in PR #${prNumber}:\n\n`;

        violations.forEach(v => {
            desc += `*   **${v.message}**\n`;
            desc += `    File: ${v.filePath}:${v.line}\n`;
            desc += `    Rule ID: ${v.ruleId}\n\n`;
        });

        desc += `Please resolve these issues to pass the compliance check.`;
        return desc;
    }
}

module.exports = new JiraService();
