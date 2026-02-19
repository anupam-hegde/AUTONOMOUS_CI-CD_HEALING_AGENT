const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    // Get recent analyses with project info
    const analyses = await prisma.analysis.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { project: true }
    });

    console.log('=== Recent Analyses (with repo info) ===');
    for (const a of analyses) {
        console.log(`PR #${a.prNumber} | ${a.status} | Repo: ${a.project.repoOwner}/${a.project.repoName} | Created: ${a.createdAt}`);
    }

    // Check projects
    console.log('\n=== Projects ===');
    const projects = await prisma.project.findMany();
    for (const p of projects) {
        const ruleCount = await prisma.rule.count({ where: { projectId: p.id, isActive: true } });
        console.log(`${p.repoOwner}/${p.repoName} - ${ruleCount} active rules - GitHub Repo ID: ${p.githubRepoId}`);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
