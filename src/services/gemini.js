// src/services/gemini.js
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = error => reject(error);
    });
}

/**
 * Clean and parse JSON from Gemini response which might contain Markdown code blocks
 * @param {string} text 
 * @returns {Object}
 */
function parseGeminiResponse(text) {
    try {
        // First try direct parse
        return JSON.parse(text);
    } catch (e) {
        // Try removing markdown code blocks
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            try {
                return JSON.parse(jsonMatch[0]);
            } catch (e2) {
                console.error("Failed to parse extracted JSON:", e2);
            }
        }
        throw new Error("Invalid JSON format from AI");
    }
}

/**
 * Analyze a rental contract file using Gemini.
 * @param {File} file - The uploaded contract file
 * @param {string} language - 'vi' or 'en'
 * @param {string} modelName - Gemini model to use
 * @returns {Promise<Object>} Returns structured analysis data
 */
export async function analyzeContract(file, language = 'vi', modelName = 'gemini-2.5-flash') {
    const base64Data = await fileToBase64(file);

    // For structured output, we prefer models that handle JSON well.
    // Flash models are good, Pro models are better for reasoning.
    const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = language === 'vi'
        ? `Bạn là chuyên gia luật và bất động sản tại Việt Nam. Hãy phân tích hợp đồng thuê nhà này dựa trên **Bộ Luật Dân Sự 2015** và **Luật Nhà Ở 2023**.

        Trả về kết quả dưới dạng JSON với cấu trúc sau:
        {
            "risk_score": 0-100, // 0-30: An toàn, 30-70: Cần xem xét, 70-100: Rủi ro cao
            "summary": {
                "landlord": "Tên chủ nhà",
                "tenant": "Tên người thuê",
                "address": "Địa chỉ",
                "rent_price": "Giá thuê",
                "deposit": "Tiền cọc",
                "duration": "Thời hạn",
                "dates": "Ngày bắt đầu - kết thúc"
            },
            "plain_english_summary": [
                "Tóm tắt điểm 1 dễ hiểu...",
                "Tóm tắt điểm 2..."
            ],
            "dangerous_clauses": [
                {
                    "clause": "Tên điều khoản rủi ro",
                    "original_text": "Trích dẫn nguyên văn câu trong hợp đồng",
                    "reason": "Tại sao nguy hiểm (dựa trên luật VN)",
                    "severity": "high/medium/low",
                    "suggestion": "Gợi ý sửa đổi"
                }
            ],
            "missing_clauses": [
                {
                    "clause": "Tên điều khoản thiếu",
                    "importance": "Tại sao cần thiết"
                }
            ],
            "legal_comparison": "Đánh giá chung so với quy định pháp luật hiện hành...",
            "legal_references": [
                {
                    "text": "Tên văn bản luật (kèm điều khoản nếu có)",
                    "url": "Link trích dẫn (ưu tiên thuvienphapluat.vn)"
                }
            ]
        }
        
        Lưu ý:
        - Đánh giá khắt khe các điều khoản về tiền cọc, tăng giá, và chấm dứt hợp đồng.
        - Phát hiện các điều khoản "gài bẫy" hoặc mập mờ (ví dụ: "chi phí hợp lý", "theo thỏa thuận sau").
        - Cung cấp link Phải chính xác hoặc dẫn về trang văn bản gốc.`
        : `You are a legal and real estate expert in Vietnam. Analyze this rental contract based on **Vietnam Civil Code 2015** and **Law on Housing 2023**.

        Return the result as JSON with the following structure:
        {
            "risk_score": 0-100, // 0-30: Safe, 30-70: Warning, 70-100: High Risk
            "summary": {
                "landlord": "Name",
                "tenant": "Name",
                "address": "Address",
                "rent_price": "Price",
                "deposit": "Deposit",
                "duration": "Duration",
                "dates": "Start - End"
            },
            "plain_english_summary": [
                "Simple summary point 1...",
                "Simple summary point 2..."
            ],
            "dangerous_clauses": [
                {
                    "clause": "Risk clause name",
                    "original_text": "Exact quote from contract",
                    "reason": "Why it is risky (based on VN law)",
                    "severity": "high/medium/low",
                    "suggestion": "Suggestion for modification"
                }
            ],
            "missing_clauses": [
                {
                    "clause": "Missing clause name",
                    "importance": "Why it is needed"
                }
            ],
            "legal_comparison": "General assessment against current laws...",
            "legal_references": [
                {
                    "text": "Law name (and article if applicable)",
                    "url": "Citation link"
                }
            ]
        }`;

    const result = await model.generateContent([
        prompt,
        { inlineData: { mimeType: file.type, data: base64Data } }
    ]);

    const response = await result.response;
    const text = response.text();
    return parseGeminiResponse(text);
}

/**
 * Chat about the contract using context from analysis.
 * @param {string} question - User's question
 * @param {string} contractContext - Previous analysis result
 * @param {string} language - 'vi' or 'en'
 * @param {string} modelName - Gemini model to use
 * @returns {Promise<string>}
 */
export async function chatWithContract(question, contractContext, language = 'vi', modelName = 'gemini-2.5-flash') {
    const model = genAI.getGenerativeModel({ model: modelName });

    const systemPrompt = language === 'vi'
        ? `Bạn là trợ lý AI chuyên nghiệp tư vấn về hợp đồng thuê nhà. 

🎯 NHIỆM VỤ:
- Trả lời câu hỏi dựa trên phân tích hợp đồng dưới đây
- Cung cấp thông tin chính xác, hữu ích
- Giải thích rõ ràng, dễ hiểu
- Đưa ra lời khuyên thực tế nếu cần

📄 PHÂN TÍCH HỢP ĐỒNG:
${contractContext}

⚡ HƯỚNG DẪN TRẢ LỜI:
- Ngắn gọn, súc tích (2-4 đoạn)
- Sử dụng emoji phù hợp
- Nếu thông tin không có trong hợp đồng, nói rõ
- Đưa ra cảnh báo nếu phát hiện vấn đề
- Trả lời bằng tiếng Việt`
        : `You are a professional AI assistant specializing in rental contract consultation.

🎯 TASKS:
- Answer questions based on contract analysis below
- Provide accurate, helpful information
- Explain clearly and simply
- Give practical advice when needed

📄 CONTRACT ANALYSIS:
${contractContext}

⚡ RESPONSE GUIDELINES:
- Keep it concise (2-4 paragraphs)
- Use appropriate emojis
- If information is not in contract, state clearly
- Provide warnings if issues detected
- Respond in English`;

    const result = await model.generateContent([
        systemPrompt,
        `\n\n❓ ${language === 'vi' ? 'CÂU HỎI' : 'QUESTION'}: ${question}`
    ]);

    const response = await result.response;
    return response.text();
}