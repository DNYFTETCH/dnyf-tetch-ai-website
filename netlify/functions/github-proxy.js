// Netlify Function for GitHub API Proxy
exports.handler = async function(event, context) {
  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }
  
  // Get path from query parameters
  const { path } = event.queryStringParameters;
  
  if (!path) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing path parameter' })
    };
  }
  
  try {
    // Construct GitHub API URL
    const url = `https://api.github.com/${path}`;
    
    // Make request to GitHub API
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'DNYF-TETCH-Website',
        // Add GitHub token if available (for higher rate limits)
        ...(process.env.GITHUB_TOKEN && {
          'Authorization': `token ${process.env.GITHUB_TOKEN}`
        })
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
        'Cache-Control': 'public, max-age=300', // 5 minutes cache
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(data)
    };
  } catch (error) {
    console.error('GitHub proxy error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Failed to fetch from GitHub',
        message: error.message
      })
    };
  }
};