const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Rules to add with their Tree-sitter queries
const rulesToAdd = [
    {
        description: 'No eval() - Prevent dynamic code execution that can lead to security vulnerabilities',
        language: 'javascript',
        treeSitterQuery: '(call_expression function: (identifier) @func (#eq? @func "eval")) @violation',
        severity: 'CRITICAL'
    },
    {
        description: 'No hardcoded secrets - API keys, passwords, tokens should use environment variables',
        language: 'javascript', 
        treeSitterQuery: '(variable_declarator name: (identifier) @name (#match? @name "(?i)(password|secret|api_?key|token|credential)") value: (string) @value) @violation',
        severity: 'CRITICAL'
    },
    {
        description: 'No console.log - Remove debug statements before production',
        language: 'javascript',
        treeSitterQuery: '(call_expression function: (member_expression object: (identifier) @obj property: (property_identifier) @prop (#eq? @obj "console") (#eq? @prop "log"))) @violation',
        severity: 'WARNING'
    },
    {
        description: 'No debugger statements - Remove debugger before committing code',
        language: 'javascript',
        treeSitterQuery: '(debugger_statement) @violation',
        severity: 'CRITICAL'
    },
    {
        description: 'No TODO/FIXME comments - Convert to tracked issues before merging',
        language: 'javascript',
        treeSitterQuery: '(comment) @comment (#match? @comment "(?i)(TODO|FIXME|HACK|XXX)")',
        severity: 'WARNING'
    },
    {
        description: 'No empty catch blocks - Handle errors properly, do not swallow them',
        language: 'javascript',
        treeSitterQuery: '(catch_clause body: (statement_block) @body (#eq? @body "{}")) @violation',
        severity: 'WARNING'
    },
    {
        description: 'Prefer const - Use const for variables that are never reassigned',
        language: 'javascript',
        treeSitterQuery: '(lexical_declaration kind: "let" (variable_declarator name: (identifier) @name)) @let_decl',
        severity: 'WARNING'
    }
];

async function addRulesToProject() {
    try {
        // Get the DevPulse project
        const project = await prisma.project.findFirst({
            where: { repoName: 'DevPulse' }
        });

        if (!project) {
            console.log('Project DevPulse not found!');
            return;
        }

        console.log('Found project:', project.id, project.repoName);

        // Add rules to project
        for (const ruleData of rulesToAdd) {
            // Check if similar rule already exists
            const existing = await prisma.rule.findFirst({
                where: {
                    projectId: project.id,
                    description: ruleData.description
                }
            });

            if (existing) {
                console.log(`Rule already exists, skipping: ${ruleData.description.substring(0, 30)}...`);
                continue;
            }

            const rule = await prisma.rule.create({
                data: {
                    projectId: project.id,
                    description: ruleData.description,
                    language: ruleData.language,
                    treeSitterQuery: ruleData.treeSitterQuery,
                    severity: ruleData.severity,
                    isActive: true
                }
            });

            console.log(`✅ Added: ${ruleData.description.substring(0, 50)}...`);
        }

        // Count total rules
        const totalRules = await prisma.rule.count({
            where: { projectId: project.id }
        });

        console.log(`\n🎉 Total rules for DevPulse: ${totalRules}`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

addRulesToProject();
