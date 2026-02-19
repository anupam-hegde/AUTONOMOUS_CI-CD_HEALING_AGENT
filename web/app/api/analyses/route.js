import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';

const prisma = new PrismaClient();

/**
 * GET /api/analyses
 * Fetch analysis history for the user's projects
 */
export async function GET(request) {
    try {
        const session = await getServerSession();
        
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
            return NextResponse.json({ success: true, analyses: [] });
        }

        const { searchParams } = new URL(request.url);
        const projectId = searchParams.get('projectId');
        const limit = parseInt(searchParams.get('limit') || '50');
        const status = searchParams.get('status');

        // Get user's project IDs
        const userProjects = await prisma.project.findMany({
            where: { ownerId: user.id },
            select: { id: true }
        });
        const projectIds = userProjects.map(p => p.id);

        // Build where clause
        const where = {
            projectId: projectId 
                ? projectId 
                : { in: projectIds }
        };

        if (status) {
            where.status = status.toUpperCase();
        }

        // Fetch analyses
        const analyses = await prisma.analysis.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: limit,
            include: {
                project: {
                    select: {
                        id: true,
                        repoName: true,
                        repoOwner: true
                    }
                },
                violations: {
                    select: {
                        id: true,
                        filePath: true,
                        lineNumber: true,
                        message: true
                    }
                }
            }
        });

        return NextResponse.json({
            success: true,
            analyses: analyses.map(a => ({
                id: a.id,
                projectId: a.projectId,
                project: `${a.project.repoOwner}/${a.project.repoName}`,
                prNumber: a.prNumber,
                commitHash: a.commitHash,
                status: a.status,
                violationsCount: a.violations.length,
                violations: a.violations,
                createdAt: a.createdAt
            })),
            count: analyses.length
        });

    } catch (error) {
        console.error('Error fetching analyses:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch analyses' },
            { status: 500 }
        );
    }
}

/**
 * GET /api/analyses/[id]
 * Get details of a specific analysis
 */
export async function POST(request) {
    // This could be used to manually trigger an analysis
    // For now, return not implemented
    return NextResponse.json(
        { success: false, error: 'Manual analysis trigger not yet implemented' },
        { status: 501 }
    );
}
