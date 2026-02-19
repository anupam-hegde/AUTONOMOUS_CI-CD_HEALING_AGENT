const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('\n📋 Rules for Harsha-codie/practicee:\n');
    
    const project = await prisma.project.findFirst({
        where: { repoOwner: 'Harsha-codie', repoName: 'practicee' },
        include: { rules: true }
    });

    if (!project) {
        console.log('❌ Project not found!');
        return;
    }

    console.log(`Project ID: ${project.id}`);
    console.log(`Rules: ${project.rules.length}\n`);

    for (const rule of project.rules) {
        console.log(`Rule: ${rule.description}`);
        console.log(`  Language: ${rule.language}`);
        console.log(`  Active: ${rule.isActive}`);
        console.log(`  Query: ${rule.treeSitterQuery.substring(0, 80)}...`);
        console.log('');
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
