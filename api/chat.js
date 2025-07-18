const { GoogleGenerativeAI } = require("@google/generative-ai");

// Inisialisasi model Gemini
// API Key akan diambil secara otomatis dari Environment Variables di Vercel
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Fungsi handler utama yang akan dijalankan Vercel
export default async function handler(request, response) {
  // Hanya izinkan metode POST
  if (request.method !== "POST") {
    return response.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    // Ambil riwayat percakapan dari body request
    const { messages } = request.body;

    if (!messages) {
      return response
        .status(400)
        .json({ error: 'Request body harus berisi "messages"' });
    }

    // Mengirim seluruh riwayat ke model Gemini
    const result = await model.generateContent({
      contents: messages,
    });
    const botResponse = await result.response;
    const text = botResponse.text();

    // Kirim balasan dari AI kembali ke frontend
    return response.status(200).json({ response: text });
  } catch (error) {
    console.error(error);
    return response
      .status(500)
      .json({ error: "Gagal mendapatkan respons dari AI" });
  }
}
