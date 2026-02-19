const { Octokit } = require('octokit');

const githubToken = process.env.GITHUB_TOKEN; // Use environment variable, never hardcode tokens
const octokit = new Octokit({ auth: githubToken });

async function main() {
    const owner = 'Harshwardhan-Deshmukh03';
    const repo = 'DevPulse';
    const prNumber = 3;

    try {
        // First check if we can access the PR
        console.log('Checking PR access...');
        const { data: pr } = await octokit.rest.pulls.get({
            owner,
            repo,
            pull_number: prNumber
        });
        console.log('PR Title:', pr.title);
        console.log('PR State:', pr.state);
        console.log('Head SHA:', pr.head.sha);

        // Check existing comments
        console.log('\nExisting PR comments:');
        const { data: comments } = await octokit.rest.issues.listComments({
            owner,
            repo,
            issue_number: prNumber
        });
        console.log(`Found ${comments.length} comments`);
        comments.forEach(c => {
            console.log(`  - ${c.user.login}: ${c.body.substring(0, 50)}...`);
        });

        // Try to post a test comment
        console.log('\nPosting test comment...');
        const { data: newComment } = await octokit.rest.issues.createComment({
            owner,
            repo,
            issue_number: prNumber,
            body: '## 🔍 CodeGuard Test Comment\n\nThis is a test comment from CodeGuard to verify GitHub API access.'
        });
        console.log('Comment posted! ID:', newComment.id);
        console.log('URL:', newComment.html_url);

    } catch (error) {
        console.error('Error:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
    }
}

main();
