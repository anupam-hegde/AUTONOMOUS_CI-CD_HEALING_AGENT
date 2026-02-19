const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // First list existing projects
  console.log('\n📋 Existing projects:');
  const projects = await prisma.project.findMany({
    include: { rules: true }
  });
  projects.forEach(p => {
    console.log(`   - ${p.repoOwner}/${p.repoName} (${p.rules.length} rules)`);
  });

  // Check if practicee already exists
  const existing = await prisma.project.findFirst({
    where: { 
      repoOwner: 'Harsha-codie',
      repoName: 'practicee'
    }
  });
  
  if (existing) {
    console.log('\n✅ practicee project already exists!');
    console.log('   ID:', existing.id);
    return existing;
  }

  // Get or create a user
  let user = await prisma.user.findFirst();
  if (!user) {
    console.log('\n👤 Creating user...');
    user = await prisma.user.create({
      data: {
        githubId: 'harsha-codie',
        name: 'Harsha',
        email: 'harsha@example.com'
      }
    });
  }
  console.log('\n👤 Using user:', user.name);

  // Create the project
  console.log('\n🚀 Creating practicee project...');
  const project = await prisma.project.create({
    data: {
      ownerId: user.id,
      repoName: 'practicee',
      repoOwner: 'Harsha-codie',
      repoUrl: 'https://github.com/Harsha-codie/practicee',
      githubRepoId: 123456789, // Placeholder - will be updated by webhook
      installationId: null
    }
  });
  
  console.log('✅ Project created:', project.id);

  // Now create some rules for this project
  console.log('\n📝 Creating compliance rules for practicee...');
  
  const rules = [
    {
      description: 'Variable names must use camelCase',
      language: 'javascript',
      treeSitterQuery: '(variable_declarator name: (identifier) @name)',
      severity: 'WARNING'
    },
    {
      description: 'No console.log statements in production code',
      language: 'javascript', 
      treeSitterQuery: '(call_expression function: (member_expression object: (identifier) @obj property: (property_identifier) @prop) (#eq? @obj "console") (#eq? @prop "log")) @console_log',
      severity: 'WARNING'
    },
    {
      description: 'Functions must have descriptive names (at least 3 characters)',
      language: 'javascript',
      treeSitterQuery: '(function_declaration name: (identifier) @name)',
      severity: 'ERROR'
    },
    {
      description: 'No hardcoded API keys or secrets',
      language: 'javascript',
      treeSitterQuery: '(variable_declarator name: (identifier) @name value: (string) @value)',
      severity: 'ERROR'
    }
  ];

  for (const rule of rules) {
    await prisma.rule.create({
      data: {
        projectId: project.id,
        ...rule
      }
    });
    console.log(`   ✓ Created rule: ${rule.description}`);
  }

  // Show final state
  const finalProject = await prisma.project.findUnique({
    where: { id: project.id },
    include: { rules: true }
  });
  
  console.log('\n🎉 Setup complete!');
  console.log(`   Project: ${finalProject.repoOwner}/${finalProject.repoName}`);
  console.log(`   Rules: ${finalProject.rules.length}`);
  
  return finalProject;
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
