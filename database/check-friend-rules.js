const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const rules = await prisma.rule.findMany({
        where: { project: { repoOwner: 'SathvikHegade', repoName: 'Secure_Note' } }
    });
    
    console.log('\n📋 Rules for SathvikHegade/Secure_Note:', rules.length);
    rules.forEach(rule => console.log(`  - [${rule.severity}] ${rule.description}`));
}

check().finally(() => prisma.$disconnect());
