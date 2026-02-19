const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addFriendRepo() {
    const repoOwner = 'SathvikHegade';
    const repoName = 'Secure_Note';
    
    console.log(`\n🚀 Adding ${repoOwner}/${repoName} to CodeGuard...\n`);

    // Check if already exists
    let project = await prisma.project.findFirst({
        where: { repoOwner, repoName }
    });

    if (project) {
        console.log('✅ Project already exists!');
        const rulesCount = await prisma.rule.count({ where: { projectId: project.id } });
        console.log(`   Rules: ${rulesCount}`);
        if (rulesCount > 0) return;
        console.log('   Adding rules...');
    } else {

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
    const project = await prisma.project.create({
        data: {
            ownerId: user.id,
            repoName: repoName,
            repoOwner: repoOwner,
            repoUrl: `https://github.com/${repoOwner}/${repoName}`,
            githubRepoId: 999999999, // Placeholder
        }
    });

    console.log('✅ Project created:', project.id);

    // Add security rules (language-agnostic)
    const rules = [
        {
            description: 'Never disable SSL certificate verification. This makes connections vulnerable to man-in-the-middle attacks.',
            language: 'javascript',
            treeSitterQuery: '(pair key: (property_identifier) @key value: (false) @val)',
            severity: 'CRITICAL'
        },
        {
            description: 'Prevent hardcoded API keys, passwords, tokens, or credentials in source code. Secrets should be stored in environment variables or secure vaults.',
            language: 'javascript',
            treeSitterQuery: '(variable_declarator name: (identifier) @name value: (string) @value)',
            severity: 'CRITICAL'
        },
        {
            description: 'Avoid using weak or deprecated cryptographic algorithms like MD5 or SHA1 for security purposes.',
            language: 'javascript',
            treeSitterQuery: '(call_expression function: (member_expression) @func arguments: (arguments (string) @algo))',
            severity: 'WARNING'
        },
        {
            description: 'Avoid hardcoding URLs in source code. Use configuration files or environment variables for URLs that may change between environments.',
            language: 'javascript',
            treeSitterQuery: '(string) @url',
            severity: 'WARNING'
        },
        {
            description: 'Use cryptographically secure random number generators for security-sensitive operations.',
            language: 'javascript',
            treeSitterQuery: '(call_expression function: (member_expression object: (identifier) @obj property: (property_identifier) @prop))',
            severity: 'WARNING'
        },
        {
            description: 'Avoid document.write() as it can overwrite the entire document and is vulnerable to XSS attacks.',
            language: 'javascript',
            treeSitterQuery: '(call_expression function: (member_expression object: (identifier) @obj property: (property_identifier) @prop))',
            severity: 'CRITICAL'
        },
        {
            description: 'Avoid using eval() or exec() which can execute arbitrary code',
            language: 'javascript',
            treeSitterQuery: '(call_expression function: (identifier) @func)',
            severity: 'CRITICAL'
        },
        {
            description: 'Avoid using pickle for untrusted data - security risk',
            language: 'python',
            treeSitterQuery: '(call) @pickle',
            severity: 'CRITICAL'
        }
    ];

    console.log('\n📝 Adding security rules...');
    for (const rule of rules) {
        await prisma.rule.create({
            data: {
                projectId: project.id,
                ...rule
            }
        });
        console.log(`   ✓ ${rule.description.substring(0, 50)}...`);
    }

    console.log('\n🎉 Done! Project ready for PR analysis.');
    console.log(`   Repo: ${repoOwner}/${repoName}`);
    console.log(`   Rules: ${rules.length}`);
}

addFriendRepo().catch(console.error).finally(() => prisma.$disconnect());
