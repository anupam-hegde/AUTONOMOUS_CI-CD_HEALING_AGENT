/**
 * MASTER SEED SCRIPT
 * ==================
 * Seeds the entire language-independent rule architecture:
 * 1. Language Adapters (JS, TS, Python, Java)
 * 2. Abstract Rules (50 rules)
 * 3. Generated Queries (rules × languages)
 */

const { PrismaClient } = require('@prisma/client');
const { seedLanguageAdapters, LANGUAGE_ADAPTERS } = require('./seed-language-adapters');
const { seedAbstractRules, ABSTRACT_RULES } = require('./seed-abstract-rules');
const { QueryGenerator } = require('./query-generator');

const prisma = new PrismaClient();

async function main() {
    console.log('╔══════════════════════════════════════════════════════════════════╗');
    console.log('║     LANGUAGE-INDEPENDENT RULE ARCHITECTURE - MASTER SEED        ║');
    console.log('╚══════════════════════════════════════════════════════════════════╝\n');

    const startTime = Date.now();

    try {
        // Step 1: Seed Language Adapters
        console.log('━'.repeat(60));
        console.log('STEP 1: Language Adapters');
        console.log('━'.repeat(60));
        const adapterResults = await seedLanguageAdapters();
        
        // Step 2: Seed Abstract Rules
        console.log('\n' + '━'.repeat(60));
        console.log('STEP 2: Abstract Rules');
        console.log('━'.repeat(60));
        const ruleResults = await seedAbstractRules();
        
        // Step 3: Generate Queries
        console.log('\n' + '━'.repeat(60));
        console.log('STEP 3: Generate Tree-sitter Queries');
        console.log('━'.repeat(60));
        const generator = new QueryGenerator();
        const queryResults = await generator.generateAllQueries();
        
        // Final Summary
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        
        console.log('\n' + '═'.repeat(60));
        console.log('                    FINAL SUMMARY');
        console.log('═'.repeat(60));
        
        console.log(`
┌─────────────────────────────────────────────────────────────┐
│  📊 SEEDING RESULTS                                         │
├─────────────────────────────────────────────────────────────┤
│  🌍 Language Adapters:  ${LANGUAGE_ADAPTERS.length} languages                        │
│     • JavaScript, TypeScript, Python, Java                  │
│                                                             │
│  📋 Abstract Rules:     ${ABSTRACT_RULES.length} rules                             │
│     • 15 Security       • 10 Naming                         │
│     • 10 Style          • 10 Best Practice                  │
│     • 5 Performance                                         │
│                                                             │
│  🔄 Generated Queries:  ${queryResults.generated} queries                          │
│     (${ABSTRACT_RULES.length} rules × ${LANGUAGE_ADAPTERS.length} languages = potential ${ABSTRACT_RULES.length * LANGUAGE_ADAPTERS.length})           │
│     Skipped: ${queryResults.skipped} (language-specific only)                 │
│                                                             │
│  ⏱️  Duration:           ${duration}s                                  │
└─────────────────────────────────────────────────────────────┘
`);

        console.log('✅ Architecture seeded successfully!\n');
        
        // Show architecture diagram
        console.log(`
┌─────────────────────────────────────────────────────────────┐
│                    ARCHITECTURE                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              ABSTRACT RULES (${ABSTRACT_RULES.length})                    │   │
│  │   Language-independent: "No eval", "No secrets"...  │   │
│  └─────────────────────────────────────────────────────┘   │
│                          │                                  │
│          ┌───────────────┼───────────────┐                 │
│          ▼               ▼               ▼                 │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐           │
│  │ JavaScript │  │   Python   │  │    Java    │           │
│  │  Adapter   │  │   Adapter  │  │   Adapter  │           │
│  └────────────┘  └────────────┘  └────────────┘           │
│          │               │               │                 │
│          ▼               ▼               ▼                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           GENERATED QUERIES (${queryResults.generated})                 │   │
│  │   Cached Tree-sitter queries per rule+language      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
`);

        console.log('🚀 Ready to analyze code in JavaScript, TypeScript, Python, and Java!\n');

    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
