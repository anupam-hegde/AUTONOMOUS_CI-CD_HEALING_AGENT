const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addPythonRules() {
    const project = await prisma.project.findFirst({
        where: { repoOwner: 'Harsha-codie', repoName: 'practicee' }
    });

    if (!project) {
        console.log('❌ Project not found');
        return;
    }

    // Check existing Python rules
    const existingPython = await prisma.rule.findMany({
        where: { projectId: project.id, language: 'python' }
    });

    console.log(`\n📋 Existing Python rules: ${existingPython.length}`);
    existingPython.forEach(r => console.log(`   - ${r.description}`));

    if (existingPython.length > 0) {
        console.log('\n✅ Python rules already exist!');
        return;
    }

    // Add Python rules
    const pythonRules = [
        {
            description: 'Prevent hardcoded API keys, passwords, tokens, or credentials in Python code',
            language: 'python',
            treeSitterQuery: '(assignment) @assign',
            severity: 'CRITICAL'
        },
        {
            description: 'Avoid using weak or deprecated cryptographic algorithms like MD5 or SHA1 in Python',
            language: 'python',
            treeSitterQuery: '(call) @call',
            severity: 'WARNING'
        },
        {
            description: 'Avoid hardcoding URLs in Python source code',
            language: 'python',
            treeSitterQuery: '(string) @url',
            severity: 'WARNING'
        },
        {
            description: 'Use cryptographically secure random number generators instead of random module',
            language: 'python',
            treeSitterQuery: '(call) @random',
            severity: 'WARNING'
        },
        {
            description: 'Avoid using eval() or exec() which can execute arbitrary code',
            language: 'python',
            treeSitterQuery: '(call function: (identifier) @func)',
            severity: 'CRITICAL'
        },
        {
            description: 'Avoid using pickle for untrusted data - security risk',
            language: 'python',
            treeSitterQuery: '(call) @pickle',
            severity: 'CRITICAL'
        }
    ];

    console.log('\n🚀 Adding Python rules...');
    for (const rule of pythonRules) {
        await prisma.rule.create({
            data: {
                projectId: project.id,
                ...rule
            }
        });
        console.log(`   ✓ ${rule.description.substring(0, 50)}...`);
    }

    console.log('\n✅ Python rules added successfully!');
}

addPythonRules().catch(console.error).finally(() => prisma.$disconnect());
