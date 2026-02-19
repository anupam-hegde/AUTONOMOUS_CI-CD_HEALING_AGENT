/**
 * Worker Process
 * Processes jobs from the BullMQ queues
 */
const { Worker } = require('bullmq');
const { PrismaClient } = require('@prisma/client');
const { connection, QUEUES } = require('./queue');
const AnalysisOrchestrator = require('./orchestrator');
require('dotenv').config();

const prisma = new PrismaClient();

/**
 * Process PR analysis jobs
 */
function createAnalysisWorker() {
    const worker = new Worker(QUEUES.ANALYSIS, async (job) => {
        const startTime = Date.now();
        console.log(`[Worker] Processing job ${job.id}: ${job.name}`);
        
        try {
            if (job.name === 'analyze-pr') {
                return await processPRAnalysis(job);
            } else if (job.name === 'manual-analysis') {
                return await processManualAnalysis(job);
            }
            
            throw new Error(`Unknown job type: ${job.name}`);
        } catch (error) {
            console.error(`[Worker] Job ${job.id} failed:`, error.message);
            throw error;
        } finally {
            const duration = Date.now() - startTime;
            console.log(`[Worker] Job ${job.id} completed in ${duration}ms`);
        }
    }, {
        connection,
        concurrency: parseInt(process.env.WORKER_CONCURRENCY || '2'),
        limiter: {
            max: 10,
            duration: 60000, // Max 10 jobs per minute (rate limiting)
        },
    });
    
    worker.on('completed', (job, result) => {
        console.log(`[Worker] Job ${job.id} completed successfully`);
    });
    
    worker.on('failed', (job, error) => {
        console.error(`[Worker] Job ${job.id} failed:`, error.message);
    });
    
    worker.on('error', (error) => {
        console.error('[Worker] Worker error:', error);
    });
    
    return worker;
}

/**
 * Process a PR analysis job
 */
async function processPRAnalysis(job) {
    const { owner, repo, prNumber, headSha, installationId, projectId } = job.data;
    
    // Update progress
    await job.updateProgress(10);
    
    // Create analysis record in database
    const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: { rules: { where: { isActive: true } } }
    });
    
    if (!project) {
        throw new Error(`Project not found: ${projectId}`);
    }
    
    // Create analysis record
    const analysis = await prisma.analysis.create({
        data: {
            projectId,
            commitSha: headSha,
            prNumber,
            status: 'RUNNING',
            startedAt: new Date(),
        }
    });
    
    await job.updateProgress(20);
    
    try {
        // Run the orchestrator
        const orchestrator = new AnalysisOrchestrator(installationId);
        const result = await orchestrator.analyzePR({
            owner,
            repo,
            prNumber,
            headSha,
            rules: project.rules,
        });
        
        await job.updateProgress(80);
        
        // Update analysis record with results
        await prisma.analysis.update({
            where: { id: analysis.id },
            data: {
                status: result.totalViolations > 0 ? 'FAILED' : 'PASSED',
                completedAt: new Date(),
            }
        });
        
        await job.updateProgress(100);
        
        return {
            analysisId: analysis.id,
            ...result,
        };
    } catch (error) {
        // Mark analysis as failed
        await prisma.analysis.update({
            where: { id: analysis.id },
            data: {
                status: 'FAILED',
                completedAt: new Date(),
            }
        });
        throw error;
    }
}

/**
 * Process manual analysis job
 */
async function processManualAnalysis(job) {
    const { projectId, branch, userId } = job.data;
    
    await job.updateProgress(10);
    
    // Get project with rules
    const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: { rules: { where: { isActive: true } } }
    });
    
    if (!project) {
        throw new Error(`Project not found: ${projectId}`);
    }
    
    // Create analysis record
    const analysis = await prisma.analysis.create({
        data: {
            projectId,
            branch,
            status: 'RUNNING',
            startedAt: new Date(),
        }
    });
    
    await job.updateProgress(20);
    
    try {
        // For manual analysis, we'd need to fetch files from the branch
        // This is a simplified version - full implementation would clone/fetch repo
        const orchestrator = new AnalysisOrchestrator(project.installationId);
        
        // Simplified: analyze HEAD of branch
        const result = await orchestrator.analyzeBranch({
            owner: project.repoOwner,
            repo: project.repoName,
            branch,
            rules: project.rules,
        });
        
        await job.updateProgress(80);
        
        // Update analysis
        await prisma.analysis.update({
            where: { id: analysis.id },
            data: {
                status: result.totalViolations > 0 ? 'FAILED' : 'PASSED',
                completedAt: new Date(),
            }
        });
        
        await job.updateProgress(100);
        
        return {
            analysisId: analysis.id,
            ...result,
        };
    } catch (error) {
        await prisma.analysis.update({
            where: { id: analysis.id },
            data: {
                status: 'FAILED',
                completedAt: new Date(),
            }
        });
        throw error;
    }
}

/**
 * Create notification worker
 */
function createNotificationWorker() {
    const worker = new Worker(QUEUES.NOTIFICATIONS, async (job) => {
        const { type, channel, payload } = job.data;
        
        console.log(`[NotificationWorker] Sending ${type} notification`);
        
        if (type === 'slack') {
            await sendSlackNotification(channel, payload);
        } else if (type === 'email') {
            await sendEmailNotification(channel, payload);
        }
        
        return { sent: true };
    }, {
        connection,
        concurrency: 5,
    });
    
    return worker;
}

/**
 * Send Slack notification
 */
async function sendSlackNotification(webhookUrl, payload) {
    if (!webhookUrl) {
        console.log('[Notification] No Slack webhook configured, skipping');
        return;
    }
    
    await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            text: payload.message,
            attachments: payload.attachments || [],
        }),
    });
}

/**
 * Send email notification (placeholder)
 */
async function sendEmailNotification(email, payload) {
    // Would integrate with SendGrid, SES, etc.
    console.log(`[Notification] Would send email to ${email}:`, payload.subject);
}

module.exports = {
    createAnalysisWorker,
    createNotificationWorker,
};
