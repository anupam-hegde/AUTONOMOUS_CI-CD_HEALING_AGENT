import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

const prisma = new PrismaClient();

/**
 * GET /api/dashboard/stats
 * Returns aggregated statistics for the dashboard
 */
export async function GET(request) {
    try {
        const session = await getServerSession(authOptions);
        
        if (!session?.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        // Find user
        let user = null;
        if (session.user.githubId) {
            user = await prisma.user.findUnique({
                where: { githubId: String(session.user.githubId) }
            });
        }

        if (!user) {
            // Return empty stats for new users
            return NextResponse.json({
                success: true,
                stats: {
                    projectsCount: 0,
                    rulesCount: 0,
                    analysesCount: 0,
                    violationsFixed: 0,
                    totalViolations: 0,
                    fixRate: 0
                },
                recentActivity: []
            });
        }

        // Get project IDs for this user
        const projects = await prisma.project.findMany({
            where: { ownerId: user.id },
            select: { id: true }
        });
        const projectIds = projects.map(p => p.id);

        // Count projects
        const projectsCount = projects.length;

        // Count rules across all user's projects
        const rulesCount = await prisma.rule.count({
            where: { projectId: { in: projectIds } }
        });

        // Count analyses
        const analysesCount = await prisma.analysis.count({
            where: { projectId: { in: projectIds } }
        });

        // Count violations
        const violations = await prisma.violation.findMany({
            where: {
                analysis: { projectId: { in: projectIds } }
            },
            select: { id: true }
        });
        const totalViolations = violations.length;

        // For now, we don't track "fixed" status, so estimate based on successful analyses
        const successfulAnalyses = await prisma.analysis.count({
            where: {
                projectId: { in: projectIds },
                status: 'SUCCESS'
            }
        });

        const fixRate = analysesCount > 0 
            ? Math.round((successfulAnalyses / analysesCount) * 100) 
            : 0;

        // Get recent activity (last 10 analyses)
        const recentAnalyses = await prisma.analysis.findMany({
            where: { projectId: { in: projectIds } },
            orderBy: { createdAt: 'desc' },
            take: 10,
            include: {
                project: {
                    select: { repoName: true, repoOwner: true }
                },
                _count: {
                    select: { violations: true }
                }
            }
        });

        const recentActivity = recentAnalyses.map(a => ({
            id: a.id,
            project: `${a.project.repoOwner}/${a.project.repoName}`,
            prNumber: a.prNumber,
            commitHash: a.commitHash?.substring(0, 7),
            status: a.status,
            violationsCount: a._count.violations,
            createdAt: a.createdAt
        }));

        return NextResponse.json({
            success: true,
            stats: {
                projectsCount,
                rulesCount,
                analysesCount,
                totalViolations,
                fixRate
            },
            recentActivity
        });

    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch stats' },
            { status: 500 }
        );
    }
}
