// /api/fatsecret.ts
// Vercel Serverless Function to securely proxy requests to the Fatsecret API.

// This function runs on the server, not in the user's browser.
// It can safely access environment variables without exposing them to the client.

// A simple in-memory cache to store the access token for its duration.
let tokenCache = {
  accessToken: '',
  expiresAt: 0,
};

// Function to get a valid access token, either from cache or by fetching a new one.
async function getAccessToken() {
  const now = Date.now();
  // If we have a valid token in cache, return it.
  if (tokenCache.accessToken && now < tokenCache.expiresAt) {
    return tokenCache.accessToken;
  }

  // Otherwise, fetch a new token from the Fatsecret API.
  const clientId = process.env.FATSECRET_CLIENT_ID;
  const clientSecret = process.env.FATSECRET_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('API credentials are not configured on the server.');
  }

  const tokenResponse = await fetch('https://oauth.fatsecret.com/connect/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
    },
    body: 'grant_type=client_credentials&scope=basic',
  });

  if (!tokenResponse.ok) {
    throw new Error('Failed to authenticate with Fatsecret API.');
  }

  const tokenData = await tokenResponse.json();
  
  // Cache the new token along with its expiry time (expires_in is in seconds).
  // We subtract 60 seconds as a safety buffer.
  tokenCache = {
    accessToken: tokenData.access_token,
    expiresAt: now + (tokenData.expires_in - 60) * 1000,
  };

  return tokenCache.accessToken;
}

// The main serverless function handler that Vercel will execute.
export default async function handler(request: Request) {
  try {
    const url = new URL(request.url);
    const searchQuery = url.searchParams.get('search');

    if (!searchQuery) {
      return new Response(JSON.stringify({ error: 'Search query is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get a valid access token.
    const accessToken = await getAccessToken();

    // Use the token to search for foods.
    const searchUrl = `https://platform.fatsecret.com/rest/server.api?method=foods.search&search_expression=${encodeURIComponent(searchQuery)}&format=json&region=KR&language=ko`;
    
    const searchResponse = await fetch(searchUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!searchResponse.ok) {
      throw new Error('Failed to fetch data from Fatsecret.');
    }

    const searchData = await searchResponse.json();
    
    // Return the search results to the client.
    return new Response(JSON.stringify(searchData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[FATSECRET API ERROR]', (error as Error).message);
    return new Response(JSON.stringify({ error: 'An internal server error occurred.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
