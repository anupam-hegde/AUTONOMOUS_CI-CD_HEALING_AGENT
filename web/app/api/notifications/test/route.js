import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

const prisma = new PrismaClient();

/**
 * POST /api/notifications/test
 * Send a test notification to verify configuration
 */
export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.githubId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { type, destination } = await request.json();

        if (type === 'slack' && destination) {
            const result = await sendSlackNotification(destination, {
                text: '✅ Compliance System Test',
                blocks: [
                    {
                        type: 'section',
                        text: {
                            type: 'mrkdwn',
                            text: '*Compliance System Connected!*\nYour Slack integration is working correctly. You will receive notifications here when compliance checks complete.'
                        }
                    }
                ]
            });

            return NextResponse.json({ 
                success: result.ok,
                message: result.ok ? 'Test notification sent!' : 'Failed to send'
            });
        }

        return NextResponse.json({ error: 'Invalid notification type' }, { status: 400 });
    } catch (error) {
        console.error('Error sending test notification:', error);
        return NextResponse.json(
            { error: 'Failed to send notification', details: error.message },
            { status: 500 }
        );
    }
}

/**
 * Send Slack notification
 */
async function sendSlackNotification(webhookUrl, payload) {
    try {
        const res = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        return { ok: res.ok };
    } catch (error) {
        console.error('Slack notification error:', error);
        return { ok: false };
    }
}

/**
 * Send analysis result notification
 * Called by worker after analysis completes
 */
export async function sendAnalysisNotification(analysisId, webhookUrl) {
    const analysis = await prisma.analysis.findUnique({
        where: { id: analysisId },
        include: {
            project: true,
            violations: true,
        }
    });

    if (!analysis) return;

    const statusEmoji = analysis.status === 'PASSED' ? '✅' : '❌';
    const statusText = analysis.status === 'PASSED' ? 'Passed' : 'Failed';
    
    const payload = {
        text: `${statusEmoji} Compliance Check ${statusText}: ${analysis.project.repoOwner}/${analysis.project.repoName}`,
        blocks: [
            {
                type: 'header',
                text: {
                    type: 'plain_text',
                    text: `${statusEmoji} Compliance Check ${statusText}`
                }
            },
            {
                type: 'section',
                fields: [
                    {
                        type: 'mrkdwn',
                        text: `*Repository:*\n${analysis.project.repoOwner}/${analysis.project.repoName}`
                    },
                    {
                        type: 'mrkdwn',
                        text: `*Branch:*\n${analysis.branch || 'N/A'}`
                    },
                    {
                        type: 'mrkdwn',
                        text: `*Violations:*\n${analysis.violations?.length || 0}`
                    },
                    {
                        type: 'mrkdwn',
                        text: `*Commit:*\n\`${analysis.commitSha?.slice(0, 7) || 'N/A'}\``
                    }
                ]
            }
        ]
    };

    // Add violation details if failed
    if (analysis.violations?.length > 0) {
        const violationList = analysis.violations.slice(0, 5).map(v => 
            `• \`${v.filePath}:${v.lineNumber}\` - ${v.message}`
        ).join('\n');

        payload.blocks.push({
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: `*Violations:*\n${violationList}${analysis.violations.length > 5 ? `\n...and ${analysis.violations.length - 5} more` : ''}`
            }
        });
    }

    return sendSlackNotification(webhookUrl, payload);
}
