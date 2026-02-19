import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { Octokit } from 'octokit';

const prisma = new PrismaClient();

// Simple in-memory analysis (no Redis needed)
async function runInlineAnalysis(jobData) {
    const { analysisId, repoOwner, repoName, prNumber, headSha, projectId, installationId } = jobData;
    
    console.log(`[InlineAnalysis] Starting for ${repoOwner}/${repoName}#${prNumber}`);
    
    try {
        // Analysis is already PENDING, we'll update to SUCCESS or FAILURE at the end

        // Get GitHub token - prefer App token, fallback to PAT
        const githubToken = process.env.GITHUB_TOKEN;
        if (!githubToken) {
            throw new Error('GITHUB_TOKEN not configured');
        }

        const octokit = new Octokit({ auth: githubToken });

        // Get changed files
        const { data: files } = await octokit.rest.pulls.listFiles({
            owner: repoOwner,
            repo: repoName,
            pull_number: prNumber,
        });

        console.log(`[InlineAnalysis] Found ${files.length} changed files`);

        // Get rules for this project
        const rules = await prisma.rule.findMany({
            where: { projectId, isActive: true }
        });

        console.log(`[InlineAnalysis] Found ${rules.length} active rules`);

        // Supported extensions
        const extToLang = {
            '.js': 'javascript', '.jsx': 'javascript', '.ts': 'typescript', '.tsx': 'typescript',
            '.py': 'python', '.java': 'java', '.c': 'c', '.cpp': 'cpp', '.go': 'go', '.rs': 'rust'
        };

        const allViolations = [];

        for (const file of files) {
            if (file.status === 'removed') continue;
            
            const ext = '.' + file.filename.split('.').pop();
            const language = extToLang[ext];
            if (!language) continue;

            // Get file content
            let content;
            try {
                const { data } = await octokit.rest.repos.getContent({
                    owner: repoOwner, repo: repoName, path: file.filename, ref: headSha
                });
                content = Buffer.from(data.content, 'base64').toString('utf-8');
                console.log(`[InlineAnalysis] Fetched ${file.filename} (${content.length} chars)`);
            } catch (e) {
                console.log(`[InlineAnalysis] Could not fetch ${file.filename}: ${e.message}`);
                continue;
            }

            // Direct pattern matching for each rule
            // Rules are LANGUAGE-AGNOSTIC - same patterns work for JS, Python, Java, TS
            for (const rule of rules) {
                // Skip only if language is completely incompatible
                // Most security rules (hardcoded secrets, weak crypto, etc.) apply to ALL languages
                const compatibleLanguages = ['javascript', 'typescript', 'python', 'java'];
                if (!compatibleLanguages.includes(language)) {
                    continue;
                }

                const ruleText = (rule.treeSitterQuery + ' ' + rule.description).toLowerCase();
                const lines = content.split('\n');
                
                // Check each line for violations based on rule type
                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i];
                    const lineNum = i + 1;
                    let violation = null;
                    
                    // SSL/Certificate check
                    if (ruleText.includes('ssl') || ruleText.includes('certificate')) {
                        if (/rejectUnauthorized\s*:\s*false/i.test(line)) {
                            violation = { match: 'rejectUnauthorized: false', type: 'SSL disabled' };
                        }
                    }
                    
                    // Hardcoded secrets/credentials
                    if (ruleText.includes('api') || ruleText.includes('key') || ruleText.includes('password') || 
                        ruleText.includes('token') || ruleText.includes('secret') || ruleText.includes('credential')) {
                        // Check for hardcoded secrets
                        if (/(api_?key|apikey|password|secret|token|auth|credential)\s*[=:]\s*["'][^"']{4,}["']/i.test(line)) {
                            violation = { match: line.trim().substring(0, 60), type: 'Hardcoded credential' };
                        }
                        if (/(API_?KEY|PASSWORD|SECRET|TOKEN|AUTH)\s*=\s*["'][^"']+["']/i.test(line)) {
                            violation = { match: line.trim().substring(0, 60), type: 'Hardcoded credential' };
                        }
                        if (/["'](sk-|ghp_|xox[a-z]-|AKIA)[A-Za-z0-9]{10,}["']/i.test(line)) {
                            violation = { match: line.trim().substring(0, 60), type: 'API key pattern' };
                        }
                    }
                    
                    // Weak crypto (MD5/SHA1)
                    if (ruleText.includes('md5') || ruleText.includes('sha1') || ruleText.includes('crypto') || ruleText.includes('weak')) {
                        if (/createHash\s*\(\s*["']md5["']/i.test(line)) {
                            violation = { match: 'createHash("md5")', type: 'Weak hash MD5' };
                        }
                        if (/createHash\s*\(\s*["']sha1["']/i.test(line)) {
                            violation = { match: 'createHash("sha1")', type: 'Weak hash SHA1' };
                        }
                    }
                    
                    // Hardcoded URLs
                    if (ruleText.includes('url') || ruleText.includes('hardcod')) {
                        if (/["']https?:\/\/[^"'\s]{10,}["']/.test(line) && !line.includes('localhost')) {
                            violation = { match: line.trim().substring(0, 60), type: 'Hardcoded URL' };
                        }
                    }
                    
                    // Insecure random
                    if (ruleText.includes('random') || ruleText.includes('secure')) {
                        if (/Math\.random\s*\(/.test(line)) {
                            violation = { match: 'Math.random()', type: 'Insecure random' };
                        }
                        // Python: random.random(), random.randint(), etc.
                        if (/random\.(random|randint|choice|shuffle)\s*\(/.test(line)) {
                            violation = { match: line.trim().substring(0, 50), type: 'Insecure random (Python)' };
                        }
                    }
                    
                    // document.write
                    if (ruleText.includes('document') || ruleText.includes('write') || ruleText.includes('xss')) {
                        if (/document\.write\s*\(/.test(line)) {
                            violation = { match: 'document.write()', type: 'XSS risk' };
                        }
                    }
                    
                    // Python: eval() and exec()
                    if (ruleText.includes('eval') || ruleText.includes('exec') || ruleText.includes('arbitrary')) {
                        if (/\beval\s*\(/.test(line)) {
                            violation = { match: 'eval()', type: 'Dangerous eval()' };
                        }
                        if (/\bexec\s*\(/.test(line)) {
                            violation = { match: 'exec()', type: 'Dangerous exec()' };
                        }
                    }
                    
                    // Python: pickle
                    if (ruleText.includes('pickle')) {
                        if (/pickle\.(load|loads)\s*\(/.test(line)) {
                            violation = { match: line.trim().substring(0, 50), type: 'Insecure pickle usage' };
                        }
                    }
                    
                    // Python: hashlib MD5/SHA1
                    if (ruleText.includes('md5') || ruleText.includes('sha1') || ruleText.includes('crypto') || ruleText.includes('weak')) {
                        // Python hashlib
                        if (/hashlib\.(md5|sha1)\s*\(/.test(line)) {
                            violation = { match: line.trim().substring(0, 50), type: 'Weak hash (Python)' };
                        }
                    }
                    
                    // Add violation if found
                    if (violation) {
                        console.log(`[InlineAnalysis] FOUND: ${file.filename}:${lineNum} - ${violation.type}`);
                        allViolations.push({
                            ruleId: rule.id,
                            ruleName: rule.description.substring(0, 50),
                            message: rule.description,
                            severity: rule.severity,
                            filePath: file.filename,
                            line: lineNum,
                            snippet: violation.match
                        });
                    }
                }
            }
        }

        console.log(`[InlineAnalysis] Found ${allViolations.length} violations`);

        // Create violation records in DB
        for (const v of allViolations) {
            await prisma.violation.create({
                data: {
                    analysisId,
                    ruleId: v.ruleId,
                    filePath: v.filePath,
                    lineNumber: v.line,
                    message: v.message,
                }
            });
        }

        // Post to GitHub PR
        if (allViolations.length > 0) {
            // Group violations by file for PR review
            const reviewComments = allViolations.slice(0, 20).map(v => ({
                path: v.filePath,
                line: v.line,
                body: `⚠️ **${v.ruleName}**\n\n${v.message}\n\n\`\`\`\n${v.snippet}\n\`\`\``
            }));

            try {
                await octokit.rest.pulls.createReview({
                    owner: repoOwner,
                    repo: repoName,
                    pull_number: prNumber,
                    commit_id: headSha,
                    event: 'COMMENT',
                    comments: reviewComments
                });
                console.log('[InlineAnalysis] Posted review comments to PR');
            } catch (reviewError) {
                console.error('[InlineAnalysis] Error posting review:', reviewError.message);
                // Fallback: post a single comment
                try {
                    const body = `## 🔍 CodeGuard Analysis Results\n\nFound **${allViolations.length}** compliance violation(s):\n\n` +
                        allViolations.slice(0, 10).map(v => 
                            `- **${v.filePath}:${v.line}** - ${v.ruleName}`
                        ).join('\n') +
                        (allViolations.length > 10 ? `\n\n...and ${allViolations.length - 10} more` : '');
                    
                    await octokit.rest.issues.createComment({
                        owner: repoOwner,
                        repo: repoName,
                        issue_number: prNumber,
                        body
                    });
                    console.log('[InlineAnalysis] Posted summary comment to PR');
                } catch (commentError) {
                    console.error('[InlineAnalysis] Error posting comment:', commentError.message);
                }
            }
        } else {
            // Post success comment
            try {
                await octokit.rest.issues.createComment({
                    owner: repoOwner,
                    repo: repoName,
                    issue_number: prNumber,
                    body: '## ✅ CodeGuard Analysis Passed\n\nNo compliance violations detected. Great job!'
                });
            } catch (e) {
                console.log('[InlineAnalysis] Could not post success comment:', e.message);
            }
        }

        // Update analysis status
        await prisma.analysis.update({
            where: { id: analysisId },
            data: {
                status: 'SUCCESS',
            }
        });

        console.log(`[InlineAnalysis] Completed. Found ${allViolations.length} violations.`);
        return { violations: allViolations.length };

    } catch (error) {
        console.error('[InlineAnalysis] Error:', error);
        await prisma.analysis.update({
            where: { id: analysisId },
            data: { status: 'FAILURE' }
        });
        throw error;
    }
}

// Extract regex patterns from tree-sitter queries (simplified)
function extractPatternsFromQuery(query) {
    const patterns = [];
    const q = query.toLowerCase();
    
    // ===== SECURITY RULES =====
    
    // SSL certificate verification disabled (rejectUnauthorized: false)
    if (q.includes('ssl') || q.includes('certificate') || q.includes('rejectunauthorized')) {
        patterns.push({ regex: 'rejectUnauthorized\\s*:\\s*false' });
        patterns.push({ regex: 'NODE_TLS_REJECT_UNAUTHORIZED\\s*=\\s*["\']?0' });
    }
    
    // Hardcoded secrets/API keys/passwords/tokens
    if (q.includes('secret') || q.includes('api') || q.includes('key') || 
        q.includes('password') || q.includes('token') || q.includes('credential') ||
        q.includes('hardcoded') || q.includes('hardcode')) {
        // Match: apiKey = "value", api_key: "value", etc.
        patterns.push({ regex: '(api_?key|apikey|secret|password|token|auth|credential)\\s*[=:]\\s*["\'][^"\']{4,}["\']' });
        // Match: const API_KEY = "..."
        patterns.push({ regex: '(API_?KEY|SECRET|PASSWORD|TOKEN|AUTH|CREDENTIAL)\\s*=\\s*["\'][^"\']+["\']' });
        // Match: "sk-...", "ghp_...", "xox..." (common token formats)
        patterns.push({ regex: '["\'](?:sk-|ghp_|xox[a-z]-|AKIA)[A-Za-z0-9]{10,}["\']' });
    }
    
    // Weak cryptographic algorithms (MD5, SHA1)
    if (q.includes('md5') || q.includes('sha1') || q.includes('crypto') || q.includes('weak') || q.includes('deprecated')) {
        patterns.push({ regex: 'createHash\\s*\\(\\s*["\']md5["\']' });
        patterns.push({ regex: 'createHash\\s*\\(\\s*["\']sha1["\']' });
        patterns.push({ regex: '\\.md5\\s*\\(' });
        patterns.push({ regex: '\\.sha1\\s*\\(' });
    }
    
    // Hardcoded URLs
    if (q.includes('url') || q.includes('hardcod')) {
        patterns.push({ regex: '["\']https?://[^"\'\\s]{10,}["\']' });
    }
    
    // Insecure random (Math.random for security)
    if (q.includes('random') || q.includes('secure')) {
        patterns.push({ regex: 'Math\\.random\\s*\\(' });
    }
    
    // document.write (XSS risk)
    if (q.includes('document.write') || q.includes('xss')) {
        patterns.push({ regex: 'document\\.write\\s*\\(' });
    }
    
    // ===== CODE QUALITY RULES =====
    
    // Console.log detection
    if (q.includes('console')) {
        patterns.push({ regex: 'console\\.(log|warn|error|info|debug)\\s*\\(' });
    }
    
    // Eval detection
    if (q.includes('eval')) {
        patterns.push({ regex: '\\beval\\s*\\(' });
    }
    
    // Debugger statements
    if (q.includes('debugger')) {
        patterns.push({ regex: '\\bdebugger\\b' });
    }
    
    // TODO/FIXME comments
    if (q.includes('todo') || q.includes('fixme')) {
        patterns.push({ regex: '(TODO|FIXME|HACK|XXX)' });
    }
    
    // Empty catch blocks
    if (q.includes('catch') && q.includes('empty')) {
        patterns.push({ regex: 'catch\\s*\\([^)]*\\)\\s*\\{\\s*\\}' });
    }
    
    // var usage (prefer let/const)
    if (q.includes('var ')) {
        patterns.push({ regex: '\\bvar\\s+\\w+' });
    }
    
    // == instead of ===
    if (q.includes('===') || q.includes('equality') || q.includes('strict')) {
        patterns.push({ regex: '[^=!]==[^=]' });
    }
    
    console.log(`[PatternExtractor] Query keywords found, generated ${patterns.length} patterns`);
    return patterns;
}

/**
 * GitHub App Webhook Handler
 * Receives events from GitHub when PRs are created/updated.
 */
export async function POST(request) {
    try {
        const signature = request.headers.get('x-hub-signature-256');
        const event = request.headers.get('x-github-event');
        const delivery = request.headers.get('x-github-delivery');

        if (!event) {
            console.error('[Webhook] Missing x-github-event header');
            return NextResponse.json({ error: 'Missing event header' }, { status: 400 });
        }

        const body = await request.text();

        if (!body) {
            console.error('[Webhook] Empty request body');
            return NextResponse.json({ error: 'Empty request body' }, { status: 400 });
        }

        // Verify webhook signature
        if (!verifySignature(body, signature)) {
            console.error('[Webhook] Invalid webhook signature');
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }

        let payload;
        try {
            payload = JSON.parse(body);
        } catch (parseError) {
            console.error('[Webhook] Invalid JSON payload:', parseError.message);
            return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
        }

        console.log(`[Webhook] Received: ${event} (${delivery})`);

        // Handle different event types
        switch (event) {
            case 'pull_request':
                const prResult = await handlePullRequest(payload);
                return NextResponse.json({ 
                    received: true, 
                    event: 'pull_request',
                    ...prResult 
                });
            case 'installation':
                await handleInstallation(payload);
                return NextResponse.json({ received: true, event: 'installation' });
            case 'ping':
                console.log('[Webhook] Ping received - webhook is configured correctly!');
                return NextResponse.json({ received: true, event: 'ping', message: 'Pong!' });
            default:
                console.log(`[Webhook] Ignoring event: ${event}`);
                return NextResponse.json({ received: true, event, ignored: true });
        }
    } catch (error) {
        console.error('[Webhook] Unhandled error:', error);
        return NextResponse.json({ error: 'Internal server error', message: error.message }, { status: 500 });
    }
}

/**
 * Verify GitHub webhook signature
 */
function verifySignature(payload, signature) {
    if (!signature || !process.env.GITHUB_WEBHOOK_SECRET) {
        // In development, allow unsigned webhooks
        if (process.env.NODE_ENV === 'development') return true;
        return false;
    }

    const hmac = crypto.createHmac('sha256', process.env.GITHUB_WEBHOOK_SECRET);
    const digest = 'sha256=' + hmac.update(payload).digest('hex');

    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

/**
 * Handle Pull Request events
 */
async function handlePullRequest(payload) {
    const action = payload.action;
    const pr = payload.pull_request;
    const repo = payload.repository;

    console.log(`[PR] ${action}: ${repo.full_name}#${pr.number}`);

    // Only analyze on open/synchronize (new commits pushed)
    if (!['opened', 'synchronize', 'reopened'].includes(action)) {
        return { status: 'ignored', reason: `Action '${action}' not tracked` };
    }

    try {
        // Find the project in our database
        const project = await prisma.project.findFirst({
            where: {
                repoOwner: repo.owner.login,
                repoName: repo.name,
            },
            include: {
                rules: {
                    where: { isActive: true },
                    select: { id: true }
                }
            }
        });

        if (!project) {
            console.log(`[PR] No project configured for ${repo.full_name}`);
            console.log(`[PR] To add this repo, run: node add-project.js ${repo.owner.login} ${repo.name}`);
            return { 
                status: 'skipped', 
                reason: 'Project not configured',
                repo: repo.full_name,
                hint: 'Add project to database with rules to enable analysis'
            };
        }

        if (project.rules.length === 0) {
            console.log(`[PR] No active rules for ${repo.full_name}`);
            return { 
                status: 'skipped', 
                reason: 'No active rules',
                repo: repo.full_name,
                projectId: project.id
            };
        }

        // Create a pending analysis record
        const analysis = await prisma.analysis.create({
            data: {
                projectId: project.id,
                commitHash: pr.head.sha,
                prNumber: pr.number,
                status: 'PENDING',
            }
        });

        console.log(`[PR] Created analysis ${analysis.id} for PR #${pr.number}`);

        // Queue analysis job
        const jobData = {
            analysisId: analysis.id,
            prNumber: pr.number,
            repoFullName: repo.full_name,
            repoOwner: repo.owner.login,
            repoName: repo.name,
            headSha: pr.head.sha,
            baseSha: pr.base.sha,
            installationId: payload.installation?.id,
            projectId: project.id,
        };

        // Run inline analysis (no Redis needed)
        console.log('[PR] Starting inline analysis...');
        runInlineAnalysis(jobData).catch(err => {
            console.error('[PR] Inline analysis error:', err);
        });
        
        return { 
            status: 'analyzing',
            analysisId: analysis.id,
            repo: repo.full_name,
            pr: pr.number,
            rulesCount: project.rules.length
        };

    } catch (error) {
        console.error('[PR] Error handling PR event:', error);
        return { status: 'error', message: error.message };
    }
}

/**
 * Handle GitHub App installation events
 */
async function handleInstallation(payload) {
    const action = payload.action;
    const installation = payload.installation;
    const sender = payload.sender;

    console.log(`[Installation] ${action} by ${sender.login}`);

    if (action === 'created') {
        // New installation - save to database
        console.log(`[Installation] App installed on: ${installation.account.login}`);
        // TODO: Save installation ID to database
    } else if (action === 'deleted') {
        // Installation removed
        console.log(`[Installation] App uninstalled from: ${installation.account.login}`);
        // TODO: Remove installation from database
    }
}
