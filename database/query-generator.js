/**
 * QUERY GENERATOR SERVICE
 * ========================
 * Generates Tree-sitter queries by combining:
 * - AbstractRule (what to detect)
 * - LanguageAdapter (how to detect in specific language)
 * 
 * This is the core of the language-independent architecture.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ============================================================
// QUERY GENERATOR CLASS
// ============================================================

class QueryGenerator {
    constructor() {
        this.adaptersCache = new Map();
        this.rulesCache = new Map();
    }

    /**
     * Load all language adapters into cache
     */
    async loadAdapters() {
        const adapters = await prisma.languageAdapter.findMany({
            where: { isActive: true }
        });
        
        for (const adapter of adapters) {
            this.adaptersCache.set(adapter.language, adapter);
        }
        
        return adapters;
    }

    /**
     * Load all abstract rules into cache
     */
    async loadRules() {
        const rules = await prisma.abstractRule.findMany({
            where: { isActive: true }
        });
        
        for (const rule of rules) {
            this.rulesCache.set(rule.name, rule);
        }
        
        return rules;
    }

    /**
     * Get adapter for a language
     */
    getAdapter(language) {
        return this.adaptersCache.get(language);
    }

    /**
     * Get rule by name
     */
    getRule(name) {
        return this.rulesCache.get(name);
    }

    /**
     * Generate Tree-sitter query for a rule in a specific language
     * 
     * @param {Object} rule - AbstractRule object
     * @param {Object} adapter - LanguageAdapter object
     * @returns {string} - Generated Tree-sitter query
     */
    generateQuery(rule, adapter) {
        const patternConfig = rule.patternConfig;
        const queryTemplates = adapter.queryTemplates;
        const templateKey = patternConfig.templateKey;

        // Get the appropriate template
        let template = queryTemplates[templateKey];
        
        if (!template) {
            // Fallback: try to find a matching template
            template = this.findFallbackTemplate(rule, adapter);
            if (!template) {
                console.warn(`No template found for ${templateKey} in ${adapter.language}`);
                return null;
            }
        }

        // Replace placeholders in template
        let query = this.interpolateTemplate(template, patternConfig, adapter);
        
        // Handle language-specific configurations
        if (patternConfig.languageSpecific) {
            const langConfig = patternConfig.languageSpecific[adapter.language];
            if (langConfig) {
                query = this.applyLanguageSpecificConfig(query, langConfig, adapter);
            }
        }

        return query;
    }

    /**
     * Interpolate template with pattern config values
     */
    interpolateTemplate(template, config, adapter) {
        let result = template;
        
        // Replace {{name}} placeholders
        if (config.functionNames) {
            // Multiple function names - generate multiple queries
            const queries = config.functionNames.map(name => 
                template.replace(/\{\{name\}\}/g, name)
            );
            result = queries.join('\n');
        }
        
        // Replace {{pattern}} placeholders
        if (config.variablePattern) {
            result = result.replace(/\{\{pattern\}\}/g, config.variablePattern);
        }
        if (config.pattern) {
            result = result.replace(/\{\{pattern\}\}/g, config.pattern);
        }
        
        // Replace {{object}} and {{method}} for member expressions
        if (config.object) {
            result = result.replace(/\{\{object\}\}/g, config.object);
        }
        if (config.method) {
            result = result.replace(/\{\{method\}\}/g, config.method);
        }
        
        // Replace {{operator}} for binary expressions
        if (config.operator) {
            result = result.replace(/\{\{operator\}\}/g, config.operator);
        }
        
        return result.trim();
    }

    /**
     * Apply language-specific configuration
     */
    applyLanguageSpecificConfig(query, langConfig, adapter) {
        let result = query;
        
        if (langConfig.object) {
            result = result.replace(/\{\{object\}\}/g, langConfig.object);
        }
        if (langConfig.method) {
            result = result.replace(/\{\{method\}\}/g, langConfig.method);
        }
        if (langConfig.function) {
            result = result.replace(/\{\{name\}\}/g, langConfig.function);
        }
        
        return result;
    }

    /**
     * Find a fallback template based on pattern type
     */
    findFallbackTemplate(rule, adapter) {
        const templates = adapter.queryTemplates;
        const patternType = rule.patternType;
        
        // Map pattern types to likely template keys
        const fallbackMap = {
            'FUNCTION_CALL': ['FUNCTION_CALL_SIMPLE', 'FUNCTION_CALL_MEMBER'],
            'ASSIGNMENT': ['ASSIGNMENT_WITH_STRING', 'ASSIGNMENT_ANY'],
            'FUNCTION_DECLARATION': ['FUNCTION_DECLARATION_NAME'],
            'CLASS_DECLARATION': ['CLASS_DECLARATION_NAME'],
            'TRY_CATCH': ['TRY_CATCH_EMPTY'],
            'IMPORT': ['IMPORT_FROM', 'IMPORT_MODULE'],
            'COMMENT': ['COMMENT_PATTERN'],
            'BINARY_EXPRESSION': ['BINARY_LOOSE_EQUALITY', 'BINARY_EXPRESSION_OP']
        };
        
        const possibleKeys = fallbackMap[patternType] || [];
        
        for (const key of possibleKeys) {
            if (templates[key]) {
                return templates[key];
            }
        }
        
        return null;
    }

    /**
     * Generate and store queries for all rules in all languages
     */
    async generateAllQueries() {
        await this.loadAdapters();
        await this.loadRules();
        
        const results = {
            generated: 0,
            skipped: 0,
            errors: 0
        };

        console.log('🔄 Generating queries for all rule+language combinations...\n');

        for (const rule of this.rulesCache.values()) {
            for (const adapter of this.adaptersCache.values()) {
                try {
                    // Check if rule is language-specific and doesn't apply
                    const config = rule.patternConfig;
                    if (config.languages && !config.languages.includes(adapter.language)) {
                        results.skipped++;
                        continue;
                    }

                    const query = this.generateQuery(rule, adapter);
                    
                    if (!query) {
                        results.skipped++;
                        continue;
                    }

                    // Store in database
                    await prisma.generatedQuery.upsert({
                        where: {
                            ruleId_languageId: {
                                ruleId: rule.id,
                                languageId: adapter.id
                            }
                        },
                        update: {
                            treeSitterQuery: query,
                            generatedAt: new Date()
                        },
                        create: {
                            ruleId: rule.id,
                            languageId: adapter.id,
                            treeSitterQuery: query
                        }
                    });

                    results.generated++;
                    
                } catch (error) {
                    console.error(`  ❌ Error generating ${rule.name} for ${adapter.language}:`, error.message);
                    results.errors++;
                }
            }
        }

        return results;
    }

    /**
     * Get all generated queries for a language
     */
    async getQueriesForLanguage(language) {
        const adapter = await prisma.languageAdapter.findUnique({
            where: { language }
        });

        if (!adapter) {
            throw new Error(`No adapter found for language: ${language}`);
        }

        const queries = await prisma.generatedQuery.findMany({
            where: { languageId: adapter.id },
            include: {
                rule: true
            }
        });

        return queries.map(q => ({
            ruleName: q.rule.name,
            ruleDisplayName: q.rule.displayName,
            category: q.rule.category,
            severity: q.rule.severity,
            treeSitterQuery: q.treeSitterQuery
        }));
    }

    /**
     * Get query for a specific rule in a specific language
     */
    async getQueryForRule(ruleName, language) {
        const rule = await prisma.abstractRule.findUnique({
            where: { name: ruleName }
        });

        const adapter = await prisma.languageAdapter.findUnique({
            where: { language }
        });

        if (!rule || !adapter) {
            return null;
        }

        const query = await prisma.generatedQuery.findUnique({
            where: {
                ruleId_languageId: {
                    ruleId: rule.id,
                    languageId: adapter.id
                }
            }
        });

        return query?.treeSitterQuery;
    }
}

// ============================================================
// MAIN - Generate queries when run directly
// ============================================================

async function main() {
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║           QUERY GENERATOR                                    ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    const generator = new QueryGenerator();

    try {
        const results = await generator.generateAllQueries();
        
        console.log('\n' + '─'.repeat(50));
        console.log('📊 Results:');
        console.log(`  ✅ Generated: ${results.generated} queries`);
        console.log(`  ⏭️  Skipped: ${results.skipped} (language-specific rules)`);
        console.log(`  ❌ Errors: ${results.errors}`);
        
        // Show sample queries
        console.log('\n📝 Sample Generated Queries:\n');
        
        const languages = ['javascript', 'python', 'java'];
        const sampleRules = ['no-eval', 'no-console-log', 'no-empty-catch'];
        
        for (const ruleName of sampleRules) {
            console.log(`\n━━━ ${ruleName.toUpperCase()} ━━━`);
            for (const lang of languages) {
                const query = await generator.getQueryForRule(ruleName, lang);
                if (query) {
                    console.log(`\n  🔤 ${lang}:`);
                    console.log(`  ${query.split('\n').map(l => '     ' + l).join('\n')}`);
                }
            }
        }

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = { QueryGenerator };
