// Netlify Function to proxy GitHub API requests
exports.handler = async function(event, context) {
    // Only allow GET requests
    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }
    
    const { path } = event.queryStringParameters;
    
    if (!path) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Missing path parameter' })
        };
    }
    
    try {
        const response = await fetch(`https://api.github.com/${path}`, {
            headers: {
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'DNYF-TETCH-Website',
                'Authorization': process.env.GITHUB_TOKEN ? `token ${process.env.GITHUB_TOKEN}` : ''
            }
        });
        
        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
            },
            body: JSON.stringify(data)
        };
    } catch (error) {
        console.error('GitHub proxy error:', error);
        
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                error: 'Failed to fetch from GitHub',
                message: error.message 
            })
        };
    }
};