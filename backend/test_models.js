import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function list() {
  const models = ["gemini-3.5-flash", "gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-flash-latest"];
  for (const m of models) {
    try {
      const model = genAI.getGenerativeModel({ model: m });
      const res = await model.generateContent("hello");
      console.log(`SUCCESS: ${m}`);
    } catch (err) {
      console.log(`FAIL: ${m} - ${err.message}`);
    }
  }
}
list();
