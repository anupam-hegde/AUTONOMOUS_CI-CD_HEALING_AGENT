// Test webhook locally
const http = require('http');

const data = JSON.stringify({
    action: "opened",
    pull_request: {
        number: 999,
        head: { sha: "test123abc", ref: "test-branch" },
        base: { sha: "base123abc" }
    },
    repository: {
        full_name: "Harsha-codie/DevPulse",
        name: "DevPulse",
        owner: { login: "Harsha-codie" }
    }
});

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/github/webhook',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'X-GitHub-Event': 'pull_request',
        'X-GitHub-Delivery': 'test-' + Date.now()
    }
};

const req = http.request(options, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
        console.log('Status:', res.statusCode);
        console.log('Response:', body);
    });
});

req.on('error', (error) => {
    console.error('Error:', error);
});

req.write(data);
req.end();
