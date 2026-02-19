// Test the detection logic locally

const testContent = `
// Test file with intentional security violations
const API_KEY = "sk-1234567890abcdefghijklmnop";
const password = "supersecret123";
const token = "ghp_abcdefghijklmnopqrstuvwxyz123456";
const apiUrl = "https://api.example.com/v1/users";
const crypto = require('crypto');
const hash = crypto.createHash('md5').update('data').digest('hex');
const weakHash = crypto.createHash('sha1').update('password').digest('hex');
function generateToken() {
    return Math.random().toString(36).substring(2);
}
const agent = new https.Agent({
    rejectUnauthorized: false
});
function updatePage(content) {
    document.write(content);
}
const secret = "my-super-secret-key";
`;

const rules = [
    { description: 'Never disable SSL certificate verification', treeSitterQuery: '' },
    { description: 'Prevent hardcoded API keys, passwords, tokens, or credentials', treeSitterQuery: '' },
    { description: 'Avoid using weak or deprecated cryptographic algorithms like MD5 or SHA1', treeSitterQuery: '' },
    { description: 'Avoid hardcoding URLs in source code', treeSitterQuery: '' },
    { description: 'Use cryptographically secure random number generators', treeSitterQuery: '' },
    { description: 'Avoid document.write() as it can overwrite the entire document', treeSitterQuery: '' },
];

const violations = [];
const lines = testContent.split('\n');

for (const rule of rules) {
    const ruleText = (rule.treeSitterQuery + ' ' + rule.description).toLowerCase();
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNum = i + 1;
        let violation = null;
        
        // SSL/Certificate check
        if (ruleText.includes('ssl') || ruleText.includes('certificate')) {
            if (/rejectUnauthorized\s*:\s*false/i.test(line)) {
                violation = { match: 'rejectUnauthorized: false', type: 'SSL disabled' };
            }
        }
        
        // Hardcoded secrets/credentials
        if (ruleText.includes('api') || ruleText.includes('key') || ruleText.includes('password') || 
            ruleText.includes('token') || ruleText.includes('secret') || ruleText.includes('credential')) {
            if (/(api_?key|apikey|password|secret|token|auth|credential)\s*[=:]\s*["'][^"']{4,}["']/i.test(line)) {
                violation = { match: line.trim().substring(0, 60), type: 'Hardcoded credential' };
            }
            if (/(API_?KEY|PASSWORD|SECRET|TOKEN|AUTH)\s*=\s*["'][^"']+["']/i.test(line)) {
                violation = { match: line.trim().substring(0, 60), type: 'Hardcoded credential' };
            }
            if (/["'](sk-|ghp_|xox[a-z]-|AKIA)[A-Za-z0-9]{10,}["']/i.test(line)) {
                violation = { match: line.trim().substring(0, 60), type: 'API key pattern' };
            }
        }
        
        // Weak crypto (MD5/SHA1)
        if (ruleText.includes('md5') || ruleText.includes('sha1') || ruleText.includes('crypto') || ruleText.includes('weak')) {
            if (/createHash\s*\(\s*["']md5["']/i.test(line)) {
                violation = { match: 'createHash("md5")', type: 'Weak hash MD5' };
            }
            if (/createHash\s*\(\s*["']sha1["']/i.test(line)) {
                violation = { match: 'createHash("sha1")', type: 'Weak hash SHA1' };
            }
        }
        
        // Hardcoded URLs
        if (ruleText.includes('url') || ruleText.includes('hardcod')) {
            if (/["']https?:\/\/[^"'\s]{10,}["']/.test(line) && !line.includes('localhost')) {
                violation = { match: line.trim().substring(0, 60), type: 'Hardcoded URL' };
            }
        }
        
        // Insecure random
        if (ruleText.includes('random') || ruleText.includes('secure')) {
            if (/Math\.random\s*\(/.test(line)) {
                violation = { match: 'Math.random()', type: 'Insecure random' };
            }
        }
        
        // document.write
        if (ruleText.includes('document') || ruleText.includes('write') || ruleText.includes('xss')) {
            if (/document\.write\s*\(/.test(line)) {
                violation = { match: 'document.write()', type: 'XSS risk' };
            }
        }
        
        if (violation) {
            violations.push({
                rule: rule.description.substring(0, 40),
                line: lineNum,
                ...violation
            });
        }
    }
}

console.log('\n=== DETECTION TEST ===\n');
console.log(`Found ${violations.length} violations:\n`);
violations.forEach(v => {
    console.log(`Line ${v.line}: ${v.type}`);
    console.log(`  Rule: ${v.rule}...`);
    console.log(`  Match: ${v.match}`);
    console.log('');
});
