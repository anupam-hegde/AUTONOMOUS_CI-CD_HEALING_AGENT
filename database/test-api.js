/**
 * TEST: Language-Independent Rule Architecture
 * ============================================
 * Tests the API endpoints with the new architecture
 */

const BASE_URL = 'http://localhost:3000/api/rules/templates';

async function testAPI() {
    console.log('╔══════════════════════════════════════════════════════════════════╗');
    console.log('║       LANGUAGE-INDEPENDENT ARCHITECTURE - API TEST              ║');
    console.log('╚══════════════════════════════════════════════════════════════════╝\n');

    // Test 1: Fetch abstract rules (language-independent)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('TEST 1: Fetch Abstract Rules (format=abstract)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    try {
        const res1 = await fetch(`${BASE_URL}?format=abstract`);
        const data1 = await res1.json();
        
        console.log(`✅ Success! Found ${data1.count} abstract rules`);
        console.log(`\n📊 Rules by Category:`);
        for (const [cat, rules] of Object.entries(data1.grouped)) {
            console.log(`   ${cat}: ${rules.length} rules`);
        }
        console.log(`\n🌍 Supported Languages:`);
        for (const lang of data1.supportedLanguages) {
            console.log(`   • ${lang.displayName} (${lang.fileExtensions.join(', ')})`);
        }
        console.log(`\n📋 Sample Rules:`);
        data1.rules.slice(0, 5).forEach(r => {
            console.log(`   [${r.severity}] ${r.name}: ${r.description.slice(0, 60)}...`);
        });
    } catch (e) {
        console.log(`❌ Error: ${e.message}`);
    }

    // Test 2: Fetch generated queries for JavaScript
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('TEST 2: Fetch Generated Queries for JavaScript (format=generated)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    try {
        const res2 = await fetch(`${BASE_URL}?format=generated&language=javascript`);
        const data2 = await res2.json();
        
        console.log(`✅ Success! Found ${data2.count} generated queries for JavaScript`);
        console.log(`\n📋 Sample Queries:`);
        data2.templates.slice(0, 3).forEach(t => {
            console.log(`\n   📌 ${t.displayName}`);
            console.log(`      Category: ${t.category} | Severity: ${t.severity}`);
            console.log(`      Query Preview: ${t.treeSitterQuery.slice(0, 80)}...`);
        });
    } catch (e) {
        console.log(`❌ Error: ${e.message}`);
    }

    // Test 3: Fetch generated queries for Python
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('TEST 3: Fetch Generated Queries for Python');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    try {
        const res3 = await fetch(`${BASE_URL}?format=generated&language=python`);
        const data3 = await res3.json();
        
        console.log(`✅ Success! Found ${data3.count} generated queries for Python`);
        console.log(`\n📊 Rules by Category:`);
        for (const [cat, rules] of Object.entries(data3.grouped)) {
            console.log(`   ${cat}: ${rules.length} rules`);
        }
    } catch (e) {
        console.log(`❌ Error: ${e.message}`);
    }

    // Test 4: Filter by category
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('TEST 4: Filter Security Rules for Java');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    try {
        const res4 = await fetch(`${BASE_URL}?format=generated&language=java&category=SECURITY`);
        const data4 = await res4.json();
        
        console.log(`✅ Success! Found ${data4.count} security rules for Java`);
        data4.templates.slice(0, 5).forEach(t => {
            console.log(`   🔒 ${t.name}: ${t.severity}`);
        });
    } catch (e) {
        console.log(`❌ Error: ${e.message}`);
    }

    // Test 5: Compare same rule across languages
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('TEST 5: Compare "no-eval" Rule Across Languages');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const languages = ['javascript', 'python', 'java', 'typescript'];
    for (const lang of languages) {
        try {
            const res = await fetch(`${BASE_URL}?format=generated&language=${lang}`);
            const data = await res.json();
            const evalRule = data.templates.find(t => t.name === 'no-eval');
            
            if (evalRule) {
                console.log(`\n   🌍 ${lang.toUpperCase()}:`);
                console.log(`      ${evalRule.treeSitterQuery.split('\n')[0]}...`);
            } else {
                console.log(`\n   🌍 ${lang.toUpperCase()}: No eval rule`);
            }
        } catch (e) {
            console.log(`   ❌ ${lang}: ${e.message}`);
        }
    }

    console.log('\n' + '═'.repeat(70));
    console.log('                    API TEST COMPLETE');
    console.log('═'.repeat(70));
}

// Check if server is running first
async function main() {
    console.log('⏳ Checking if server is running...\n');
    
    try {
        await fetch(BASE_URL, { method: 'HEAD' });
        await testAPI();
    } catch (e) {
        console.log('❌ Server not running. Start the web server first:');
        console.log('   cd web && npm run dev');
        console.log('\nOr test directly with the database:\n');
        await testDirect();
    }
}

// Direct database test (fallback)
async function testDirect() {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    try {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('DIRECT DATABASE TEST');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        
        // Test 1: Abstract Rules
        const rules = await prisma.abstractRule.findMany();
        console.log(`📋 Abstract Rules: ${rules.length}`);
        
        // Test 2: Language Adapters
        const adapters = await prisma.languageAdapter.findMany();
        console.log(`🌍 Language Adapters: ${adapters.length}`);
        adapters.forEach(a => console.log(`   • ${a.displayName}`));
        
        // Test 3: Generated Queries
        const queries = await prisma.generatedQuery.findMany({
            include: { rule: true, language: true }
        });
        console.log(`🔄 Generated Queries: ${queries.length}`);
        
        // Count per language
        const byLang = queries.reduce((acc, q) => {
            acc[q.language.language] = (acc[q.language.language] || 0) + 1;
            return acc;
        }, {});
        console.log(`\n   Queries per Language:`);
        Object.entries(byLang).forEach(([lang, count]) => {
            console.log(`   • ${lang}: ${count} queries`);
        });
        
        // Sample query comparison
        console.log(`\n📌 Sample: "no-eval" across languages:`);
        const noEvalQueries = queries.filter(q => q.rule.name === 'no-eval');
        noEvalQueries.forEach(q => {
            console.log(`\n   ${q.language.displayName}:`);
            console.log(`   ${q.treeSitterQuery.split('\n').slice(0, 3).join('\n   ')}`);
        });
        
        console.log('\n✅ Direct test complete!');
        
    } catch (e) {
        console.error('❌ Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
