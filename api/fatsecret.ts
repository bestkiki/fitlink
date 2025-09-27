// FIX: The line below was an uncommented file path causing a TypeScript parsing error. It has been converted to a comment.
// /api/fatsecret.ts
// Vercel Serverless Function to securely proxy requests to the Fatsecret API.
// This version is compatible with the Vercel Node.js runtime and uses the correct GET method.

import type { VercelRequest, VercelResponse } from '@vercel/node';

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

  const clientId = process.env.FATSECRET_CLIENT_ID;
  const clientSecret = process.env.FATSECRET_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('API credentials are not configured on the server.');
  }

  // Node.js 'btoa' is available in modern Vercel runtimes.
  const basicAuth = btoa(`${clientId}:${clientSecret}`);

  const tokenResponse = await fetch('https://oauth.fatsecret.com/connect/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${basicAuth}`,
    },
    body: 'grant_type=client_credentials&scope=basic',
  });

  if (!tokenResponse.ok) {
    console.error('Fatsecret auth failed:', await tokenResponse.text());
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
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // FIX: Changed method to GET to align with older API specs that seem more reliable.
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
  
  try {
    // FIX: Read search query from the query string for GET method.
    const searchQuery = req.query.search as string;

    if (!searchQuery) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    // Get a valid access token.
    const accessToken = await getAccessToken();

    // FIX: Prepare the query parameters for the GET request.
    const searchParams = new URLSearchParams({
        method: 'foods.search',
        search_expression: searchQuery,
        format: 'json',
        region: 'KR',
        language: 'ko',
    });
    
    const searchUrl = `https://platform.fatsecret.com/rest/server.api?${searchParams.toString()}`;
    
    const searchResponse = await fetch(searchUrl, {
      method: 'GET', // Explicitly use GET
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!searchResponse.ok) {
      console.error('Fatsecret search failed:', await searchResponse.text());
      throw new Error('Failed to fetch data from Fatsecret.');
    }

    const searchData = await searchResponse.json();
    
    // Return the search results to the client.
    return res.status(200).json(searchData);

  } catch (error) {
    console.error('[FATSECRET API ERROR]', (error as Error).message);
    return res.status(500).json({ error: 'An internal server error occurred.' });
  }
}
