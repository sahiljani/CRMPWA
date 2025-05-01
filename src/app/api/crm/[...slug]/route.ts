// src/app/api/crm/[...slug]/route.ts
import { type NextRequest, NextResponse } from 'next/server';

const CRM_API_BASE_URL = 'https://crm.borderiq.org/api';

async function handler(
    req: NextRequest,
    { params }: { params: { slug: string[] } }
) {
    const { slug } = params;
    const authToken = req.headers.get('authtoken'); // Get token from incoming request

    if (!authToken) {
        return NextResponse.json({ message: 'Authentication token is missing' }, { status: 401 });
    }

    // Construct the target URL for the actual CRM API
    const targetPath = slug.join('/');
    const targetUrl = `${CRM_API_BASE_URL}/${targetPath}`;

    // Prepare options for the fetch call to the target API
    const options: RequestInit = {
        method: req.method,
        headers: {
        'authtoken': authToken, // Pass the token to the target API
        // Copy relevant headers, avoid copying 'host', 'connection', etc.
        'Content-Type': req.headers.get('Content-Type') || 'application/json',
        'Accept': req.headers.get('Accept') || 'application/json',
        },
        // Duplex streaming allows sending request body while receiving response body
        // Useful for large uploads/downloads if needed, but check browser compatibility
        // For simpler requests, you might not need 'half' duplex.
        //@ts-ignore - Property 'duplex' is experimental
        duplex: 'half',
    };

    // Include body only for relevant methods
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
        options.body = req.body;
    }

    try {
        // Make the request to the actual CRM API
        const apiResponse = await fetch(targetUrl, options);

        // Check if the response is valid before creating a NextResponse
         if (!apiResponse.ok && apiResponse.status !== 404) { // Allow 404 to pass through normally
            let errorData;
            try {
                errorData = await apiResponse.json();
            } catch (e) {
                errorData = { message: `CRM API error! Status: ${apiResponse.status}` };
            }
            // Return the error response from the CRM API back to the client
            return NextResponse.json(errorData, { status: apiResponse.status });
        }


        // Stream the response back to the client
        // Use NextResponse to forward the response status, headers, and body
        const responseHeaders = new Headers(apiResponse.headers);
        // Ensure CORS headers are set for the browser client
        responseHeaders.set('Access-Control-Allow-Origin', '*'); // Adjust if needed for specific origins
        responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, authtoken');


        return new NextResponse(apiResponse.body, {
            status: apiResponse.status,
            statusText: apiResponse.statusText,
            headers: responseHeaders,
        });

    } catch (error) {
        console.error('API Proxy Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during proxying.';
        return NextResponse.json({ message: 'API proxy failed', error: errorMessage }, { status: 502 }); // Bad Gateway
    }
}

// Define handlers for each HTTP method
export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
export const PATCH = handler; // Add other methods as needed
export const OPTIONS = async (req: NextRequest) => {
     // Basic OPTIONS handler for CORS preflight requests
    const responseHeaders = new Headers();
    responseHeaders.set('Access-Control-Allow-Origin', '*'); // Adjust if needed
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, authtoken');
    responseHeaders.set('Access-Control-Max-Age', '86400'); // Cache preflight response for 1 day

    return new NextResponse(null, { status: 204, headers: responseHeaders });
};
