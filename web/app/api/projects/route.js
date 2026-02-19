import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

const prisma = new PrismaClient();

// GET /api/projects - List user's projects
export async function GET(request) {
    try {
        const session = await getServerSession(authOptions);
        
        if (!session?.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        // Try to find or create user
        let user = null;
        if (session.user.githubId) {
            user = await prisma.user.findUnique({
                where: { githubId: String(session.user.githubId) }
            });
            
            // Auto-create user if they authenticated but don't exist in DB yet
            if (!user) {
                user = await prisma.user.create({
                    data: {
                        githubId: String(session.user.githubId),
                        email: session.user.email,
                        name: session.user.name,
                        avatarUrl: session.user.image
                    }
                });
            }
        }

        if (!user) {
            // User might not exist in DB yet - return empty projects
            return NextResponse.json({ success: true, projects: [] });
        }

        // Get user's projects
        const projects = await prisma.project.findMany({
            where: { ownerId: user.id },
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { rules: true, analyses: true }
                }
            }
        });

        return NextResponse.json({
            success: true,
            projects: projects.map(p => ({
                id: p.id,
                name: p.repoName,
                repoOwner: p.repoOwner,
                repoName: p.repoName,
                repoUrl: p.repoUrl,
                isActive: true,
                createdAt: p.createdAt,
                rulesCount: p._count.rules,
                analysisCount: p._count.analyses
            }))
        });
    } catch (error) {
        console.error('Error fetching projects:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch projects' }, { status: 500 });
    }
}

// POST /api/projects - Create a new project
export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);
        
        if (!session?.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        // Try to find user by githubId, or create if doesn't exist
        let user = null;
        if (session.user.githubId) {
            user = await prisma.user.findUnique({
                where: { githubId: String(session.user.githubId) }
            });
            
            // Auto-create user if they authenticated but don't exist in DB yet
            if (!user) {
                user = await prisma.user.create({
                    data: {
                        githubId: String(session.user.githubId),
                        email: session.user.email,
                        name: session.user.name,
                        avatarUrl: session.user.image
                    }
                });
            }
        }

        if (!user) {
            return NextResponse.json({ success: false, error: 'Could not identify user' }, { status: 401 });
        }

        const body = await request.json();
        const { repoOwner, repoName, repoUrl, githubRepoId, installationId } = body;

        if (!repoOwner || !repoName) {
            return NextResponse.json({ 
                success: false, 
                error: 'Missing required fields: repoOwner, repoName' 
            }, { status: 400 });
        }

        // Generate a unique githubRepoId if not provided (for manual projects)
        // Use a smaller number that fits in INT4 (max ~2.1 billion)
        const finalGithubRepoId = githubRepoId || Math.floor(Math.random() * 2000000000);
        const finalRepoUrl = repoUrl || `https://github.com/${repoOwner}/${repoName}`;

        // Check if project already exists for this repo (by owner/name combo)
        const existing = await prisma.project.findFirst({
            where: {
                ownerId: user.id,
                repoOwner,
                repoName
            }
        });

        if (existing) {
            return NextResponse.json({ 
                success: false, 
                error: 'Project already exists for this repository' 
            }, { status: 400 });
        }

        const project = await prisma.project.create({
            data: {
                repoOwner,
                repoName,
                repoUrl: finalRepoUrl,
                githubRepoId: finalGithubRepoId,
                installationId,
                ownerId: user.id
            }
        });

        return NextResponse.json({
            success: true,
            project: {
                id: project.id,
                repoOwner: project.repoOwner,
                repoName: project.repoName,
                repoUrl: project.repoUrl,
                createdAt: project.createdAt,
                rulesCount: 0,
                analysisCount: 0
            }
        });
    } catch (error) {
        console.error('Error creating project:', error);
        return NextResponse.json({ success: false, error: 'Failed to create project' }, { status: 500 });
    }
}

// DELETE /api/projects - Delete a project
export async function DELETE(request) {
    try {
        const session = await getServerSession(authOptions);
        
        if (!session?.user?.githubId) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { githubId: String(session.user.githubId) }
        });

        if (!user) {
            return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
        }

        const { searchParams } = new URL(request.url);
        const projectId = searchParams.get('id');

        if (!projectId) {
            return NextResponse.json({ success: false, error: 'Project ID required' }, { status: 400 });
        }

        // Verify ownership
        const project = await prisma.project.findFirst({
            where: { id: projectId, ownerId: user.id }
        });

        if (!project) {
            return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
        }

        // Delete project (cascades to rules and analysis results)
        await prisma.project.delete({
            where: { id: projectId }
        });

        return NextResponse.json({ success: true, message: 'Project deleted' });
    } catch (error) {
        console.error('Error deleting project:', error);
        return NextResponse.json({ success: false, error: 'Failed to delete project' }, { status: 500 });
    }
}
