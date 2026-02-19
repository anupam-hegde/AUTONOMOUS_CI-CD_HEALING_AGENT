/**
 * Compliance Worker Entry Point
 * 
 * Starts the BullMQ workers to process analysis and notification jobs.
 * 
 * Usage:
 *   npm start           - Start workers
 *   npm run dev         - Start with nodemon (auto-restart)
 * 
 * Environment Variables:
 *   REDIS_HOST          - Redis host (default: localhost)
 *   REDIS_PORT          - Redis port (default: 6379)
 *   REDIS_PASSWORD      - Redis password (optional)
 *   WORKER_CONCURRENCY  - Number of concurrent jobs (default: 2)
 *   DATABASE_URL        - PostgreSQL connection string
 */
require('dotenv').config();

const { createAnalysisWorker, createNotificationWorker } = require('./src/worker');
const { getQueueStats, closeQueues } = require('./src/queue');

console.log('========================================');
console.log('  Compliance Worker Starting...');
console.log('========================================');
console.log('');

// Validate environment
const requiredEnvVars = ['DATABASE_URL'];
const missingVars = requiredEnvVars.filter(v => !process.env[v]);

if (missingVars.length > 0) {
    console.error('[ERROR] Missing required environment variables:');
    missingVars.forEach(v => console.error(`  - ${v}`));
    console.error('');
    console.error('Create a .env file with these variables or set them in your environment.');
    process.exit(1);
}

// Log configuration
console.log('[Config] Redis:', process.env.REDIS_HOST || 'localhost', ':', process.env.REDIS_PORT || '6379');
console.log('[Config] Concurrency:', process.env.WORKER_CONCURRENCY || '2');
console.log('');

// Start workers
const analysisWorker = createAnalysisWorker();
const notificationWorker = createNotificationWorker();

console.log('[Worker] Analysis worker started');
console.log('[Worker] Notification worker started');
console.log('');
console.log('Waiting for jobs...');
console.log('');

// Health check interval
const healthCheckInterval = setInterval(async () => {
    try {
        const stats = await getQueueStats();
        console.log('[Health] Queue stats:', JSON.stringify(stats.analysis));
    } catch (error) {
        console.error('[Health] Error getting stats:', error.message);
    }
}, 60000); // Every minute

// Graceful shutdown
async function shutdown(signal) {
    console.log('');
    console.log(`[Shutdown] Received ${signal}, shutting down gracefully...`);
    
    clearInterval(healthCheckInterval);
    
    // Close workers first (will finish current jobs)
    await analysisWorker.close();
    await notificationWorker.close();
    console.log('[Shutdown] Workers closed');
    
    // Then close queues
    await closeQueues();
    
    console.log('[Shutdown] Complete');
    process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Unhandled error handling
process.on('unhandledRejection', (reason, promise) => {
    console.error('[ERROR] Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('[ERROR] Uncaught Exception:', error);
    shutdown('uncaughtException');
});
