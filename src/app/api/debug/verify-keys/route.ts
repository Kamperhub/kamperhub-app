// src/app/api/debug/verify-keys/route.ts
import { NextRequest, NextResponse } from 'next/server';
import 'server-only';

// This is a simplified test function. In a real scenario, you might use the actual SDK.
async function testGoogleApiKey(apiKey: string): Promise<{ valid: boolean; error: string | null }> {
  // We will test against the Gemini API as it's a good indicator for server-side key validity.
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: "hello" }] }] }),
    });

    const data = await response.json();

    if (response.ok) {
      return { valid: true, error: null };
    }

    // Handle common, specific errors for better debugging feedback.
    if (data.error?.message) {
      if (data.error.message.includes('API key not valid')) {
        return { valid: false, error: 'Key is invalid. Please check the value.' };
      }
      if (data.error.message.includes('API has not been used')) {
        return { valid: false, error: 'Key is valid, but the Generative Language API (Gemini) is not enabled in your Google Cloud project.' };
      }
       if (data.error.message.toLowerCase().includes('http referrer')) {
        return { valid: false, error: 'Key has HTTP referrer restrictions, which is not allowed for server-side keys.' };
      }
      return { valid: false, error: data.error.message };
    }
    
    return { valid: false, error: `Request failed with status ${response.status}.` };

  } catch (error: any) {
    return { valid: false, error: error.message };
  }
}


export async function GET(req: NextRequest) {
  const results: Record<string, any> = {};

  // 1. Test Server-Side GOOGLE_API_KEY (for Genkit/Gemini and Routes API)
  const googleApiKey = process.env.GOOGLE_API_KEY;
  results.GOOGLE_API_KEY = {
    loaded: !!googleApiKey,
    value: googleApiKey ? `${googleApiKey.substring(0, 4)}...${googleApiKey.substring(googleApiKey.length - 4)}` : null,
    testResult: googleApiKey ? await testGoogleApiKey(googleApiKey) : { valid: false, error: 'Key not loaded in environment.' },
  };

  // 2. Test Client-Side NEXT_PUBLIC_FIREBASE_API_KEY
  const firebaseApiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  results.NEXT_PUBLIC_FIREBASE_API_KEY = {
    loaded: !!firebaseApiKey,
    value: firebaseApiKey ? `${firebaseApiKey.substring(0, 4)}...${firebaseApiKey.substring(firebaseApiKey.length - 4)}` : null,
    notes: "This is a client-side key. Its validity is tested when the app loads in the browser, not on the server."
  };
  
  // 3. Test Client-Side NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  results.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = {
    loaded: !!mapsApiKey,
    value: mapsApiKey ? `${mapsApiKey.substring(0, 4)}...${mapsApiKey.substring(mapsApiKey.length - 4)}` : null,
    notes: "This is a client-side key. Its validity is tested when the map tries to load in the browser, not on the server."
  };

  // 4. Check GOOGLE_APPLICATION_CREDENTIALS_JSON
  const credsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  let credsStatus = 'Not loaded.';
  if (credsJson) {
      try {
          const creds = JSON.parse(credsJson);
          credsStatus = `Loaded successfully for project: ${creds.project_id}`;
      } catch (e) {
          credsStatus = 'Loaded, but is not valid JSON. Please re-copy the service account file content.';
      }
  }
   results.GOOGLE_APPLICATION_CREDENTIALS_JSON = {
    loaded: !!credsJson,
    status: credsStatus,
  };

  return NextResponse.json(results);
}
