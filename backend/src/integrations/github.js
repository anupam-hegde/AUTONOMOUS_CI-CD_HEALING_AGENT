/**
 * GitHub API Client
 * 
 * Migrated and extended from the compliance system's GitHub integration.
 * Adds: repo cloning, branch creation, CI/CD monitoring capabilities.
 */
const { Octokit } = require('octokit');

class GitHubClient {
    constructor(token) {
        this.token = token || process.env.GITHUB_TOKEN;
        this.octokit = null;
    }

    /**
     * Initialize authenticated Octokit instance
     */
    async init() {
        this.octokit = new Octokit({
            auth: this.token,
        });
        return this;
    }

    // ============================================================
    // REPOSITORY OPERATIONS (existing, from compliance system)
    // ============================================================

    /**
     * Get file content at a specific ref
     */
    async getFileContent(owner, repo, path, ref = 'main') {
        const { data } = await this.octokit.rest.repos.getContent({
            owner,
            repo,
            path,
            ref,
        });
        return Buffer.from(data.content, 'base64').toString('utf-8');
    }

    /**
     * Get repository info
     */
    async getRepoInfo(owner, repo) {
        const { data } = await this.octokit.rest.repos.get({ owner, repo });
        return {
            defaultBranch: data.default_branch,
            language: data.language,
            private: data.private,
            fullName: data.full_name,
        };
    }

    // ============================================================
    // BRANCH OPERATIONS (new for hackathon)
    // ============================================================

    /**
     * Create a new branch from the default branch
     */
    async createBranch(owner, repo, branchName, fromBranch = 'main') {
        // Get the SHA of the source branch
        const { data: ref } = await this.octokit.rest.git.getRef({
            owner,
            repo,
            ref: `heads/${fromBranch}`,
        });

        // Create new branch
        await this.octokit.rest.git.createRef({
            owner,
            repo,
            ref: `refs/heads/${branchName}`,
            sha: ref.object.sha,
        });

        console.log(`[GitHub] Created branch: ${branchName} from ${fromBranch}`);
        return branchName;
    }

    // ============================================================
    // COMMIT OPERATIONS (extended from compliance system)
    // ============================================================

    /**
     * Commit a file change to a branch with [AI-AGENT] prefix
     */
    async commitFile(owner, repo, branch, path, content, message) {
        // Ensure [AI-AGENT] prefix
        const commitMessage = message.startsWith('[AI-AGENT]')
            ? message
            : `[AI-AGENT] ${message}`;

        // Get current file SHA
        let fileSha = null;
        try {
            const { data: existing } = await this.octokit.rest.repos.getContent({
                owner, repo, path, ref: branch,
            });
            fileSha = existing.sha;
        } catch (e) {
            // File doesn't exist yet — new file
        }

        await this.octokit.rest.repos.createOrUpdateFileContents({
            owner,
            repo,
            path,
            message: commitMessage,
            content: Buffer.from(content).toString('base64'),
            sha: fileSha,
            branch,
        });

        console.log(`[GitHub] Committed: ${commitMessage}`);
    }

    // ============================================================
    // CI/CD MONITORING (new for hackathon)
    // ============================================================

    /**
     * Get the latest workflow run for a branch
     */
    async getLatestWorkflowRun(owner, repo, branch) {
        const { data } = await this.octokit.rest.actions.listWorkflowRunsForRepo({
            owner,
            repo,
            branch,
            per_page: 1,
        });

        if (data.workflow_runs.length === 0) return null;

        const run = data.workflow_runs[0];
        return {
            id: run.id,
            status: run.status,           // queued, in_progress, completed
            conclusion: run.conclusion,   // success, failure, cancelled, etc.
            createdAt: run.created_at,
            updatedAt: run.updated_at,
            htmlUrl: run.html_url,
        };
    }

    /**
     * Wait for a workflow run to complete (polling)
     */
    async waitForWorkflowCompletion(owner, repo, runId, timeoutMs = 300000, pollIntervalMs = 10000) {
        const startTime = Date.now();

        while (Date.now() - startTime < timeoutMs) {
            const { data: run } = await this.octokit.rest.actions.getWorkflowRun({
                owner, repo, run_id: runId,
            });

            if (run.status === 'completed') {
                return {
                    status: run.status,
                    conclusion: run.conclusion,
                    completedAt: run.updated_at,
                };
            }

            console.log(`[GitHub] Workflow ${runId} still ${run.status}... waiting`);
            await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
        }

        throw new Error(`Workflow run ${runId} timed out after ${timeoutMs}ms`);
    }

    // ============================================================
    // CHECK RUNS (existing, from compliance system)
    // ============================================================

    /**
     * Create a check run on a commit
     */
    async createCheckRun(owner, repo, headSha, name, status, conclusion, output) {
        await this.octokit.rest.checks.create({
            owner,
            repo,
            name,
            head_sha: headSha,
            status,
            conclusion,
            output: {
                title: output.title,
                summary: output.summary,
                text: output.text || '',
            },
        });
    }

    // ============================================================
    // UTILITIES
    // ============================================================

    /**
     * Parse a GitHub repo URL into owner and repo name
     * Supports: https://github.com/owner/repo, https://github.com/owner/repo.git
     */
    static parseRepoUrl(url) {
        const match = url.match(/github\.com\/([^/]+)\/([^/.]+)/);
        if (!match) throw new Error(`Invalid GitHub URL: ${url}`);
        return { owner: match[1], repo: match[2] };
    }
}

module.exports = GitHubClient;
