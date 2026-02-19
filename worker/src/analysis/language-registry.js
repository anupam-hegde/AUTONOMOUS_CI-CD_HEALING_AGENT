const Parser = require('tree-sitter');
const JavaScript = require('tree-sitter-javascript');
const Java = require('tree-sitter-java');
const Python = require('tree-sitter-python');

/**
 * Registry Pattern to manage supported languages.
 * Decouples the "use" of a parser from its initialization.
 */
class LanguageRegistry {
    constructor() {
        this.parsers = new Map();
        this.languages = new Map();

        this._register('javascript', JavaScript);
        this._register('java', Java);
        this._register('python', Python);
        // Add typescript, go, etc. here easily in future
    }

    _register(name, languageModule) {
        this.languages.set(name, languageModule);
    }

    /**
     * Returns a ready-to-use parser instance for the given language.
     * reuses instances for performance.
     */
    getParser(languageName) {
        if (!this.languages.has(languageName)) {
            throw new Error(`Language '${languageName}' is not supported yet.`);
        }

        if (!this.parsers.has(languageName)) {
            const parser = new Parser();
            parser.setLanguage(this.languages.get(languageName));
            this.parsers.set(languageName, parser);
        }

        return this.parsers.get(languageName);
    }

    /**
     * Returns the raw Language object (needed for compiling queries).
     */
    getLanguage(languageName) {
        if (!this.languages.has(languageName)) {
            throw new Error(`Language '${languageName}' is not supported.`);
        }
        return this.languages.get(languageName);
    }
}

// Singleton instance
module.exports = new LanguageRegistry();
