/**
 * GitHub API Client
 * Handles all GitHub API interactions for the compliance system.
 */
const { Octokit } = require('octokit');

class GitHubClient {
    constructor(installationId) {
        this.installationId = installationId;
        this.octokit = null;
    }

    /**
     * Initialize authenticated Octokit instance using App installation
     */
    async init() {
        // In production, authenticate as GitHub App installation
        // const app = new App({ appId, privateKey });
        // this.octokit = await app.getInstallationOctokit(this.installationId);

        // For development, use personal access token
        this.octokit = new Octokit({
            auth: process.env.GITHUB_TOKEN
        });

        return this;
    }

    /**
     * Get list of files changed in a PR
     */
    async getPRFiles(owner, repo, prNumber) {
        const { data } = await this.octokit.rest.pulls.listFiles({
            owner,
            repo,
            pull_number: prNumber,
        });

        return data.map(file => ({
            filename: file.filename,
            status: file.status, // added, modified, removed
            additions: file.additions,
            deletions: file.deletions,
            patch: file.patch,
        }));
    }

    /**
     * Get file content at a specific ref (commit SHA)
     */
    async getFileContent(owner, repo, path, ref) {
        const { data } = await this.octokit.rest.repos.getContent({
            owner,
            repo,
            path,
            ref,
        });

        // Decode base64 content
        return Buffer.from(data.content, 'base64').toString('utf-8');
    }

    /**
     * Post a review comment on a PR
     */
    async createReviewComment(owner, repo, prNumber, body, commitId, path, line) {
        await this.octokit.rest.pulls.createReviewComment({
            owner,
            repo,
            pull_number: prNumber,
            body,
            commit_id: commitId,
            path,
            line,
        });
    }

    /**
     * Post a PR review with multiple comments
     */
    async createReview(owner, repo, prNumber, commitId, comments, event = 'COMMENT') {
        await this.octokit.rest.pulls.createReview({
            owner,
            repo,
            pull_number: prNumber,
            commit_id: commitId,
            event, // 'APPROVE', 'REQUEST_CHANGES', 'COMMENT'
            comments: comments.map(c => ({
                path: c.path,
                line: c.line,
                body: c.body,
            })),
        });
    }

    /**
     * Update PR status check
     */
    async createCheckRun(owner, repo, headSha, name, status, conclusion, output) {
        await this.octokit.rest.checks.create({
            owner,
            repo,
            name,
            head_sha: headSha,
            status, // 'queued', 'in_progress', 'completed'
            conclusion, // 'success', 'failure', 'neutral', 'cancelled', 'action_required'
            output: {
                title: output.title,
                summary: output.summary,
                text: output.text,
            },
        });
    }

    /**
     * Commit a file to a branch (for auto-fix)
     */
    async commitFile(owner, repo, branch, path, content, message) {
        // Get current file to get its SHA
        let fileSha;
        try {
            const { data: existing } = await this.octokit.rest.repos.getContent({
                owner,
                repo,
                path,
                ref: branch,
            });
            fileSha = existing.sha;
        } catch (e) {
            // File doesn't exist yet
            fileSha = null;
        }

        await this.octokit.rest.repos.createOrUpdateFileContents({
            owner,
            repo,
            path,
            message,
            content: Buffer.from(content).toString('base64'),
            sha: fileSha,
            branch,
        });
    }
}

module.exports = GitHubClient;
