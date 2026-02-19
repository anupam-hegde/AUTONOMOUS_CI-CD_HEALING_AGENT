/**
 * CI/CD Healing Agent - Backend Entry Point
 * 
 * Express server that provides:
 * - REST API to trigger the healing agent
 * - Status endpoints for the React dashboard
 * - WebSocket support for real-time updates
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// ============================================================
// API ROUTES
// ============================================================

/**
 * POST /api/agent/run
 * Trigger the healing agent for a given repository
 * Body: { repoUrl, teamName, leaderName }
 */
app.post('/api/agent/run', async (req, res) => {
    const { repoUrl, teamName, leaderName } = req.body;

    if (!repoUrl || !teamName || !leaderName) {
        return res.status(400).json({
            error: 'Missing required fields: repoUrl, teamName, leaderName'
        });
    }

    const runId = uuidv4();
    const branchName = generateBranchName(teamName, leaderName);

    try {
        // TODO: Queue agent job via BullMQ (Phase 2-3)
        // For now, return acknowledgment
        const agentRun = {
            id: runId,
            repoUrl,
            teamName,
            leaderName,
            branchName,
            status: 'QUEUED',
            startedAt: new Date().toISOString(),
        };

        console.log(`[API] Agent run queued: ${runId}`);
        console.log(`[API] Repo: ${repoUrl}`);
        console.log(`[API] Branch: ${branchName}`);

        res.json({
            success: true,
            run: agentRun,
        });
    } catch (error) {
        console.error('[API] Error starting agent run:', error);
        res.status(500).json({ error: 'Failed to start agent run' });
    }
});

/**
 * GET /api/agent/status/:runId
 * Get the current status of an agent run
 */
app.get('/api/agent/status/:runId', async (req, res) => {
    const { runId } = req.params;

    try {
        // TODO: Fetch from database (Phase 1.2)
        res.json({
            id: runId,
            status: 'PENDING',
            message: 'Agent run status endpoint ready - database integration pending',
        });
    } catch (error) {
        console.error('[API] Error fetching status:', error);
        res.status(500).json({ error: 'Failed to fetch status' });
    }
});

/**
 * GET /api/agent/results/:runId
 * Get complete results for a finished agent run
 */
app.get('/api/agent/results/:runId', async (req, res) => {
    const { runId } = req.params;

    try {
        // TODO: Fetch from database (Phase 1.2)
        res.json({
            id: runId,
            message: 'Results endpoint ready - database integration pending',
        });
    } catch (error) {
        console.error('[API] Error fetching results:', error);
        res.status(500).json({ error: 'Failed to fetch results' });
    }
});

/**
 * GET /api/health
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
    });
});

// ============================================================
// HELPERS
// ============================================================

/**
 * Generate branch name per hackathon requirements:
 * TEAM_NAME_LEADER_NAME_AI_Fix (all uppercase, underscores, no special chars)
 */
function generateBranchName(teamName, leaderName) {
    const sanitize = (str) =>
        str.toUpperCase()
            .replace(/[^A-Z0-9\s]/g, '')
            .trim()
            .replace(/\s+/g, '_');

    return `${sanitize(teamName)}_${sanitize(leaderName)}_AI_Fix`;
}

// ============================================================
// START SERVER
// ============================================================

app.listen(PORT, () => {
    console.log('========================================');
    console.log('  CI/CD Healing Agent Backend');
    console.log('========================================');
    console.log(`  Server running on http://localhost:${PORT}`);
    console.log(`  Health check: http://localhost:${PORT}/api/health`);
    console.log('========================================');
});

module.exports = app;
