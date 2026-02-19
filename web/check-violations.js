const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const violations = await prisma.violation.findMany();
    console.log(`Found ${violations.length} violations in DB:`);
    violations.forEach(v => {
        console.log(` - ${v.filePath} Line ${v.lineNumber}: ${v.message.substring(0, 60)}...`);
    });

    const analyses = await prisma.analysis.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5
    });
    console.log(`\nRecent analyses:`);
    analyses.forEach(a => {
        console.log(` - ${a.id} | Status: ${a.status} | PR: ${a.prNumber}`);
    });
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
