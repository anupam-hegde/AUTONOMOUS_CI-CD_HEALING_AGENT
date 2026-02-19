import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/rules/templates
 * Fetches rules using the new language-independent architecture
 * 
 * Query params:
 * - category: Filter by category (SECURITY, NAMING, STYLE, etc.)
 * - language: Filter by language (javascript, python, java, typescript)
 * - format: 'abstract' returns language-independent rules, 'generated' returns language-specific queries
 */
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');
        const language = searchParams.get('language');
        const format = searchParams.get('format') || 'abstract'; // 'abstract' or 'generated'

        // Format: Abstract rules (language-independent)
        if (format === 'abstract') {
            const where = {
                isActive: true,
                ...(category && { category })
            };

            const abstractRules = await prisma.abstractRule.findMany({
                where,
                orderBy: [
                    { category: 'asc' },
                    { severity: 'asc' },
                    { name: 'asc' }
                ],
                select: {
                    id: true,
                    name: true,
                    displayName: true,
                    description: true,
                    category: true,
                    severity: true,
                    patternType: true,
                    patternConfig: true,
                    tags: true
                }
            });

            // Group by category
            const grouped = abstractRules.reduce((acc, rule) => {
                if (!acc[rule.category]) {
                    acc[rule.category] = [];
                }
                acc[rule.category].push(rule);
                return acc;
            }, {});

            // Get supported languages
            const languages = await prisma.languageAdapter.findMany({
                where: { isActive: true },
                select: {
                    language: true,
                    displayName: true,
                    fileExtensions: true
                }
            });

            return NextResponse.json({
                success: true,
                format: 'abstract',
                rules: abstractRules,
                grouped,
                count: abstractRules.length,
                supportedLanguages: languages
            });
        }

        // Format: Generated queries (language-specific)
        if (format === 'generated') {
            if (!language) {
                return NextResponse.json(
                    { error: 'Language parameter required for generated format' },
                    { status: 400 }
                );
            }

            const where = {
                language: {
                    language: language  // Filter by LanguageAdapter's language field
                },
                ...(category && {
                    rule: { category }
                })
            };

            const generatedQueries = await prisma.generatedQuery.findMany({
                where,
                include: {
                    rule: {
                        select: {
                            name: true,
                            displayName: true,
                            description: true,
                            category: true,
                            severity: true,
                            tags: true
                        }
                    },
                    language: {
                        select: {
                            language: true,
                            displayName: true,
                            fileExtensions: true
                        }
                    }
                },
                orderBy: [
                    { rule: { category: 'asc' } },
                    { rule: { name: 'asc' } }
                ]
            });

            // Transform to flattened format
            const templates = generatedQueries.map(gq => ({
                id: gq.id,
                name: gq.rule.name,
                displayName: gq.rule.displayName,
                description: gq.rule.description,
                category: gq.rule.category,
                severity: gq.rule.severity,
                language: gq.language.language,
                treeSitterQuery: gq.treeSitterQuery,
                tags: gq.rule.tags,
                languageDisplayName: gq.language.displayName,
                fileExtensions: gq.language.fileExtensions
            }));

            // Group by category
            const grouped = templates.reduce((acc, template) => {
                if (!acc[template.category]) {
                    acc[template.category] = [];
                }
                acc[template.category].push(template);
                return acc;
            }, {});

            return NextResponse.json({
                success: true,
                format: 'generated',
                language,
                templates,
                grouped,
                count: templates.length
            });
        }

        return NextResponse.json(
            { error: 'Invalid format. Use "abstract" or "generated"' },
            { status: 400 }
        );

    } catch (error) {
        console.error('Error fetching rules:', error);
        return NextResponse.json(
            { error: 'Failed to fetch rules', details: error.message },
            { status: 500 }
        );
    }
}

/**
 * GET /api/rules/templates/languages
 * Returns all supported languages with their adapters
 */
export async function OPTIONS(request) {
    try {
        const adapters = await prisma.languageAdapter.findMany({
            where: { isActive: true },
            select: {
                language: true,
                displayName: true,
                fileExtensions: true,
                treeSitterGrammar: true,
                namingConvention: true,
                _count: {
                    select: { generatedQueries: true }
                }
            }
        });

        return NextResponse.json({
            success: true,
            languages: adapters.map(a => ({
                ...a,
                queryCount: a._count.generatedQueries
            }))
        });
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to fetch languages' },
            { status: 500 }
        );
    }
}
