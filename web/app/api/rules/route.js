import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

const prisma = new PrismaClient();

/**
 * GET /api/rules
 * Fetch all rules for the current user's projects
 */
export async function GET(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.githubId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const projectId = searchParams.get('projectId');

        // Find user by githubId
        const user = await prisma.user.findUnique({
            where: { githubId: String(session.user.githubId) }
        });

        // If projectId is specified, get rules for that project
        // Otherwise get all rules for the user
        const where = projectId 
            ? { projectId }
            : user ? { project: { ownerId: user.id } } : { id: 'none' };

        const rules = await prisma.rule.findMany({
            where,
            include: {
                project: {
                    select: {
                        id: true,
                        repoName: true,
                        repoOwner: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({
            success: true,
            rules,
            count: rules.length
        });
    } catch (error) {
        console.error('Error fetching rules:', error);
        return NextResponse.json(
            { error: 'Failed to fetch rules', details: error.message },
            { status: 500 }
        );
    }
}

/**
 * POST /api/rules
 * Create one or more new rules
 * Supports creating from templates (batch) or single rule creation
 */
export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.githubId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Find user by githubId
        const user = await prisma.user.findUnique({
            where: { githubId: String(session.user.githubId) }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const body = await request.json();
        
        // Support both single rule and batch creation
        const { rules, projectId, rule } = body;

        if (!projectId) {
            return NextResponse.json(
                { error: 'Project ID is required' },
                { status: 400 }
            );
        }

        // Verify user owns the project
        const project = await prisma.project.findFirst({
            where: {
                id: projectId,
                ownerId: user.id
            }
        });

        if (!project) {
            return NextResponse.json(
                { error: 'Project not found or unauthorized' },
                { status: 404 }
            );
        }

        // Batch creation from templates
        if (rules && Array.isArray(rules)) {
            const createdRules = await prisma.rule.createMany({
                data: rules.map(r => ({
                    projectId,
                    description: r.description || r.displayName || r.name,
                    language: r.language || 'javascript',
                    treeSitterQuery: r.treeSitterQuery || '',
                    severity: r.severity || 'WARNING',
                    isActive: true,
                    aiExplanation: r.aiExplanation || `Created from template: ${r.name}`
                })),
                skipDuplicates: true
            });

            return NextResponse.json({
                success: true,
                count: createdRules.count,
                message: `Created ${createdRules.count} rules`
            });
        }

        // Single rule creation
        if (rule) {
            const createdRule = await prisma.rule.create({
                data: {
                    projectId,
                    description: rule.description,
                    language: rule.language || 'javascript',
                    treeSitterQuery: rule.treeSitterQuery || '',
                    severity: rule.severity || 'WARNING',
                    isActive: true,
                    aiExplanation: rule.aiExplanation || ''
                }
            });

            return NextResponse.json({
                success: true,
                rule: createdRule
            });
        }

        return NextResponse.json(
            { error: 'No rule data provided' },
            { status: 400 }
        );

    } catch (error) {
        console.error('Error creating rules:', error);
        return NextResponse.json(
            { error: 'Failed to create rules', details: error.message },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/rules
 * Update an existing rule
 */
export async function PUT(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.githubId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Find user by githubId
        const user = await prisma.user.findUnique({
            where: { githubId: String(session.user.githubId) }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const { id, description, language, treeSitterQuery, severity, isActive, aiExplanation } = await request.json();

        if (!id) {
            return NextResponse.json(
                { error: 'Rule ID is required' },
                { status: 400 }
            );
        }

        // Verify user owns the rule's project
        const existingRule = await prisma.rule.findFirst({
            where: { id },
            include: { project: true }
        });

        if (!existingRule || existingRule.project.ownerId !== user.id) {
            return NextResponse.json(
                { error: 'Rule not found or unauthorized' },
                { status: 404 }
            );
        }

        const updatedRule = await prisma.rule.update({
            where: { id },
            data: {
                ...(description !== undefined && { description }),
                ...(language !== undefined && { language }),
                ...(treeSitterQuery !== undefined && { treeSitterQuery }),
                ...(severity !== undefined && { severity }),
                ...(isActive !== undefined && { isActive }),
                ...(aiExplanation !== undefined && { aiExplanation })
            }
        });

        return NextResponse.json({
            success: true,
            rule: updatedRule
        });

    } catch (error) {
        console.error('Error updating rule:', error);
        return NextResponse.json(
            { error: 'Failed to update rule', details: error.message },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/rules
 * Delete a rule or all rules
 */
export async function DELETE(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.githubId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Find user by githubId
        const user = await prisma.user.findUnique({
            where: { githubId: String(session.user.githubId) }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const deleteAll = searchParams.get('deleteAll');

        // Delete ALL rules for user's projects
        if (deleteAll === 'true') {
            // Get all user's project IDs
            const userProjects = await prisma.project.findMany({
                where: { ownerId: user.id },
                select: { id: true }
            });
            const projectIds = userProjects.map(p => p.id);

            // Delete all rules in those projects
            const result = await prisma.rule.deleteMany({
                where: {
                    projectId: { in: projectIds }
                }
            });

            return NextResponse.json({
                success: true,
                count: result.count,
                message: `Deleted ${result.count} rules`
            });
        }

        if (!id) {
            return NextResponse.json(
                { error: 'Rule ID is required' },
                { status: 400 }
            );
        }

        // Verify user owns the rule's project
        const existingRule = await prisma.rule.findFirst({
            where: { id },
            include: { project: true }
        });

        if (!existingRule || existingRule.project.ownerId !== user.id) {
            return NextResponse.json(
                { error: 'Rule not found or unauthorized' },
                { status: 404 }
            );
        }

        await prisma.rule.delete({
            where: { id }
        });

        return NextResponse.json({
            success: true,
            message: 'Rule deleted'
        });

    } catch (error) {
        console.error('Error deleting rule:', error);
        return NextResponse.json(
            { error: 'Failed to delete rule', details: error.message },
            { status: 500 }
        );
    }
}
