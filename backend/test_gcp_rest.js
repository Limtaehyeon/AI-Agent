import { GoogleAuth } from 'google-auth-library';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env') });

const projectId = process.env.GCP_PROJECT_ID;
const location = process.env.GCP_LOCATION || 'us-central1';

if (process.env.GCP_KEY_FILE) {
  const keyPath = path.resolve(__dirname, process.env.GCP_KEY_FILE);
  process.env.GOOGLE_APPLICATION_CREDENTIALS = keyPath;
}

async function run() {
  try {
    const auth = new GoogleAuth({
      scopes: 'https://www.googleapis.com/auth/cloud-platform'
    });
    const client = await auth.getClient();
    
    console.log("Credentials loaded successfully.");
    console.log("Service Account Email:", client.email || "No email in client");
    
    const modelResource = `projects/${projectId}/locations/${location}/publishers/google/models/gemini-1.5-flash-002`;
    const url = `https://${location}-aiplatform.googleapis.com/v1/${modelResource}:generateContent`;
    
    console.log(`Sending generateContent POST request to: ${url}`);
    
    const res = await client.request({
      method: 'POST',
      url,
      headers: {
        'Content-Type': 'application/json'
      },
      data: {
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: 'Hello'
              }
            ]
          }
        ]
      }
    });
    
    console.log("\n--- REST API Response ---");
    console.log(JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error("\n--- Error details ---");
    console.error("Status Code:", err.status || err.code);
    console.error("Message:", err.message);
    if (err.response && err.response.data) {
      console.error("Response data:", JSON.stringify(err.response.data, null, 2));
    }
  }
}

run();
