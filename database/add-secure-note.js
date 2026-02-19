const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const repoOwner = 'SathvikHegade';
    const repoName = 'Secure_Note';
    
    console.log(`\n🚀 Adding ${repoOwner}/${repoName} to CodeGuard...\n`);

    // Check if project exists
    let project = await prisma.project.findFirst({
        where: { repoOwner, repoName }
    });

    if (!project) {
        // Get or create user
        let user = await prisma.user.findFirst();
        if (!user) {
            user = await prisma.user.create({
                data: {
                    githubId: 'codeguard-admin',
                    name: 'CodeGuard Admin',
                    email: 'admin@codeguard.dev'
                }
            });
        }

        // Create project
        project = await prisma.project.create({
            data: {
                ownerId: user.id,
                repoName: repoName,
                repoOwner: repoOwner,
                repoUrl: `https://github.com/${repoOwner}/${repoName}`,
                githubRepoId: 999999999,
            }
        });
        console.log('✅ Project created:', project.id);
    } else {
        console.log('✅ Project exists:', project.id);
    }

    // Check existing rules
    const existingRules = await prisma.rule.count({ where: { projectId: project.id } });
    console.log(`   Current rules: ${existingRules}`);
    
    if (existingRules > 0) {
        console.log('   Rules already exist, skipping...');
        return;
    }

    // Add security rules
    const rules = [
        { description: 'Hardcoded API keys/passwords/tokens', language: 'javascript', treeSitterQuery: '(variable_declarator)', severity: 'CRITICAL' },
        { description: 'Weak crypto (MD5/SHA1)', language: 'javascript', treeSitterQuery: '(call_expression)', severity: 'WARNING' },
        { description: 'Hardcoded URLs', language: 'javascript', treeSitterQuery: '(string)', severity: 'WARNING' },
        { description: 'Insecure random (Math.random)', language: 'javascript', treeSitterQuery: '(call_expression)', severity: 'WARNING' },
        { description: 'eval/exec usage', language: 'javascript', treeSitterQuery: '(call_expression)', severity: 'CRITICAL' },
        { description: 'document.write() usage', language: 'javascript', treeSitterQuery: '(call_expression)', severity: 'CRITICAL' },
        { description: 'SSL verification disabled', language: 'javascript', treeSitterQuery: '(pair)', severity: 'CRITICAL' },
        { description: 'Pickle deserialization risk', language: 'python', treeSitterQuery: '(call)', severity: 'CRITICAL' }
    ];

    console.log('\n📝 Adding security rules...');
    for (const rule of rules) {
        await prisma.rule.create({ data: { projectId: project.id, ...rule } });
        console.log(`   ✓ ${rule.description}`);
    }

    console.log(`\n🎉 Done! ${repoOwner}/${repoName} is ready.`);
    console.log('   Your friend can now create a PR to test CodeGuard!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
