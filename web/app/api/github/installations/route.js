import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

const prisma = new PrismaClient();

/**
 * GET /api/github/installations
 * List user's GitHub App installations
 */
export async function GET(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.githubId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Find user
        const user = await prisma.user.findUnique({
            where: { githubId: String(session.user.githubId) }
        });

        if (!user) {
            return NextResponse.json({ success: true, installations: [] });
        }

        // Get projects grouped by installation
        const projects = await prisma.project.findMany({
            where: { ownerId: user.id },
            select: {
                installationId: true,
                repoOwner: true,
                createdAt: true,
            }
        });

        // Group by installation ID
        const installationMap = {};
        projects.forEach(p => {
            if (p.installationId) {
                if (!installationMap[p.installationId]) {
                    installationMap[p.installationId] = {
                        id: p.installationId,
                        account: p.repoOwner,
                        repositoryCount: 0,
                        createdAt: p.createdAt,
                    };
                }
                installationMap[p.installationId].repositoryCount++;
            }
        });

        const installations = Object.values(installationMap);

        return NextResponse.json({
            success: true,
            installations
        });
    } catch (error) {
        console.error('Error fetching installations:', error);
        return NextResponse.json(
            { error: 'Failed to fetch installations', details: error.message },
            { status: 500 }
        );
    }
}
