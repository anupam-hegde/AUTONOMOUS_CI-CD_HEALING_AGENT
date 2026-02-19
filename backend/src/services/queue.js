/**
 * BullMQ Job Queue Service
 * 
 * Migrated from the compliance system's queue setup.
 * Manages the agent job queue for processing healing runs.
 */
const { Queue } = require('bullmq');
require('dotenv').config();

const connection = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
};

const QUEUES = {
    AGENT: 'agent-healing',
};

// Create queue instances
const agentQueue = new Queue(QUEUES.AGENT, { connection });

/**
 * Add a new agent healing run to the queue
 */
async function queueAgentRun(runData) {
    const job = await agentQueue.add('heal-repo', runData, {
        attempts: 1,                // Agent manages its own retries internally
        removeOnComplete: false,    // Keep results for dashboard
        removeOnFail: false,
    });

    console.log(`[Queue] Agent run queued: ${job.id}`);
    return job;
}

/**
 * Get queue statistics
 */
async function getQueueStats() {
    const waiting = await agentQueue.getWaiting();
    const active = await agentQueue.getActive();
    const completed = await agentQueue.getCompleted();
    const failed = await agentQueue.getFailed();

    return {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
    };
}

/**
 * Close all queue connections
 */
async function closeQueues() {
    await agentQueue.close();
    console.log('[Queue] All queues closed');
}

module.exports = {
    connection,
    QUEUES,
    agentQueue,
    queueAgentRun,
    getQueueStats,
    closeQueues,
};
