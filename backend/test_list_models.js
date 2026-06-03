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
    
    // We try to list models for this project and location
    // The endpoint is GET https://{location}-aiplatform.googleapis.com/v1/projects/{project}/locations/{location}/models
    const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/models`;
    
    console.log(`Listing models from: ${url}`);
    
    const res = await client.request({
      method: 'GET',
      url
    });
    
    console.log("\n--- List Models Response ---");
    const models = res.data.models || [];
    if (models.length === 0) {
      console.log("No models deployed or registered in this project/location.");
    } else {
      models.forEach(m => {
        console.log(`- Model: ${m.name} (${m.displayName})`);
      });
    }
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
