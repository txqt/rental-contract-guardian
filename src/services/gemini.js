// src/services/gemini.js
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Gemini client. The API key should be provided via Vite env variable.
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

/**
 * Helper to convert a File to a Base64 string.
 * @param {File} file 
 * @returns {Promise<string>}
 */
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = error => reject(error);
    });
}

/**
 * Analyze a rental contract file using Gemini multimodal capabilities.
 * @param {File} file - The uploaded contract file (PDF, DOC, DOCX).
 * @returns {Promise<string>} - The analysis text returned by Gemini.
 */
export async function analyzeContract(file) {
    // Convert the File to a Base64 string for the API.
    const base64Data = await fileToBase64(file);

    // Create a Gemini model instance (use Gemini 1.5 Flash for speed).
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Prepare the content parts directly.
    const result = await model.generateContent([
        "Analyze the following rental contract and provide a summary of key terms, risks, and any unusual clauses.",
        { inlineData: { mimeType: file.type, data: base64Data } }
    ]);

    const response = await result.response;
    return response.text();
}
