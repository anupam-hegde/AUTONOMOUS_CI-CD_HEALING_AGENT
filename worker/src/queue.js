/**
 * BullMQ Queue Configuration
 * Handles job processing for compliance analysis tasks
 */
const { Queue, Worker, QueueEvents } = require('bullmq');
require('dotenv').config();

// Redis connection - uses environment variables
const connection = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
};

// Queue names
const QUEUES = {
    ANALYSIS: 'compliance-analysis',
    NOTIFICATIONS: 'notifications',
};

// Create the analysis queue
const analysisQueue = new Queue(QUEUES.ANALYSIS, { 
    connection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 1000,
        },
        removeOnComplete: {
            count: 100, // Keep last 100 completed jobs
        },
        removeOnFail: {
            count: 50, // Keep last 50 failed jobs
        },
    },
});

// Create notifications queue
const notificationsQueue = new Queue(QUEUES.NOTIFICATIONS, {
    connection,
    defaultJobOptions: {
        attempts: 2,
        removeOnComplete: true,
        removeOnFail: { count: 20 },
    },
});

/**
 * Add a PR analysis job to the queue
 */
async function queuePRAnalysis(data) {
    const { owner, repo, prNumber, headSha, installationId, projectId } = data;
    
    const jobId = `pr-${owner}-${repo}-${prNumber}-${headSha.slice(0, 7)}`;
    
    const job = await analysisQueue.add('analyze-pr', {
        owner,
        repo,
        prNumber,
        headSha,
        installationId,
        projectId,
        queuedAt: new Date().toISOString(),
    }, {
        jobId,
        priority: 1, // Normal priority
    });
    
    console.log(`[Queue] Added PR analysis job: ${jobId}`);
    return job;
}

/**
 * Add a manual analysis job (analyze specific files/branches)
 */
async function queueManualAnalysis(data) {
    const { projectId, branch, userId } = data;
    
    const jobId = `manual-${projectId}-${Date.now()}`;
    
    const job = await analysisQueue.add('manual-analysis', {
        projectId,
        branch: branch || 'main',
        userId,
        queuedAt: new Date().toISOString(),
    }, {
        jobId,
        priority: 2, // Slightly lower priority than PR analysis
    });
    
    console.log(`[Queue] Added manual analysis job: ${jobId}`);
    return job;
}

/**
 * Add a notification job
 */
async function queueNotification(data) {
    const { type, channel, payload } = data;
    
    await notificationsQueue.add('send-notification', {
        type, // 'slack', 'email'
        channel,
        payload,
        queuedAt: new Date().toISOString(),
    });
    
    console.log(`[Queue] Added notification job: ${type}`);
}

/**
 * Get queue statistics
 */
async function getQueueStats() {
    const [waiting, active, completed, failed] = await Promise.all([
        analysisQueue.getWaitingCount(),
        analysisQueue.getActiveCount(),
        analysisQueue.getCompletedCount(),
        analysisQueue.getFailedCount(),
    ]);
    
    return {
        analysis: { waiting, active, completed, failed },
    };
}

/**
 * Graceful shutdown
 */
async function closeQueues() {
    await analysisQueue.close();
    await notificationsQueue.close();
    console.log('[Queue] All queues closed');
}

module.exports = {
    analysisQueue,
    notificationsQueue,
    queuePRAnalysis,
    queueManualAnalysis,
    queueNotification,
    getQueueStats,
    closeQueues,
    connection,
    QUEUES,
};
