import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { Octokit } from '@octokit/rest';
import { createAppAuth } from '@octokit/auth-app';

const prisma = new PrismaClient();

/**
 * POST /api/github/sync
 * Sync repositories from a GitHub App installation
 */
export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.githubId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { installationId } = await request.json();

        if (!installationId) {
            return NextResponse.json(
                { error: 'Installation ID is required' },
                { status: 400 }
            );
        }

        // Find or create user
        let user = await prisma.user.findUnique({
            where: { githubId: String(session.user.githubId) }
        });

        if (!user) {
            user = await prisma.user.create({
                data: {
                    githubId: String(session.user.githubId),
                    email: session.user.email,
                    name: session.user.name,
                }
            });
        }

        // Create Octokit instance authenticated as the installation
        let octokit;
        
        if (process.env.GITHUB_APP_ID && process.env.GITHUB_APP_PRIVATE_KEY) {
            octokit = new Octokit({
                authStrategy: createAppAuth,
                auth: {
                    appId: process.env.GITHUB_APP_ID,
                    privateKey: process.env.GITHUB_APP_PRIVATE_KEY.replace(/\\n/g, '\n'),
                    installationId: parseInt(installationId),
                },
            });
        } else {
            // Fallback for development - use user's token
            return NextResponse.json({
                success: false,
                error: 'GitHub App not configured. Set GITHUB_APP_ID and GITHUB_APP_PRIVATE_KEY.',
            }, { status: 500 });
        }

        // Fetch repositories accessible to this installation
        const { data: repos } = await octokit.apps.listReposAccessibleToInstallation({
            per_page: 100,
        });

        let projectsCreated = 0;
        let projectsSkipped = 0;

        // Create projects for each repo
        for (const repo of repos.repositories) {
            // Check if project already exists
            const existing = await prisma.project.findFirst({
                where: {
                    githubRepoId: String(repo.id),
                }
            });

            if (existing) {
                projectsSkipped++;
                continue;
            }

            // Detect primary language
            const language = detectLanguage(repo.language);

            // Create project
            await prisma.project.create({
                data: {
                    ownerId: user.id,
                    repoOwner: repo.owner.login,
                    repoName: repo.name,
                    githubRepoId: String(repo.id),
                    defaultBranch: repo.default_branch || 'main',
                    language,
                    installationId: String(installationId),
                }
            });

            projectsCreated++;
        }

        return NextResponse.json({
            success: true,
            totalRepos: repos.repositories.length,
            projectsCreated,
            projectsSkipped,
        });

    } catch (error) {
        console.error('Error syncing repos:', error);
        
        // Handle specific GitHub API errors
        if (error.status === 401 || error.status === 403) {
            return NextResponse.json({
                error: 'GitHub authentication failed. The installation may need to be re-authorized.',
            }, { status: 401 });
        }

        return NextResponse.json(
            { error: 'Failed to sync repositories', details: error.message },
            { status: 500 }
        );
    }
}

/**
 * Detect supported language from GitHub's language field
 */
function detectLanguage(githubLang) {
    if (!githubLang) return 'javascript';
    
    const langMap = {
        'JavaScript': 'javascript',
        'TypeScript': 'javascript', // Tree-sitter treats similarly
        'Java': 'java',
        'Python': 'python',
        'Go': 'go',
    };
    
    return langMap[githubLang] || 'javascript';
}
