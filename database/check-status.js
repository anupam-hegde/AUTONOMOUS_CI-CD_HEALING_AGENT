const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkStatus() {
    try {
        // Check analyses
        const analyses = await prisma.analysis.findMany({
            orderBy: { createdAt: 'desc' },
            take: 5,
            include: {
                project: true,
                violations: true
            }
        });

        console.log('=== Recent Analyses ===');
        if (analyses.length === 0) {
            console.log('No analyses found - webhook may not be receiving events');
        } else {
            analyses.forEach(a => {
                console.log(`- PR #${a.prNumber} | Status: ${a.status} | Project: ${a.project.repoName} | Violations: ${a.violations.length}`);
            });
        }

        // Check rules
        const rules = await prisma.rule.findMany({
            where: { isActive: true },
            include: { project: true }
        });

        console.log('\n=== Active Rules ===');
        console.log(`Total: ${rules.length} rules`);
        rules.forEach(r => {
            console.log(`- ${r.description.substring(0, 50)}... (${r.project.repoName})`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkStatus();
