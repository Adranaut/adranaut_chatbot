import os
import google.generativeai as genai
from flask import Flask, request, jsonify, render_template
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__, template_folder='templates', static_folder='static')

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY tidak ditemukan di file .env")

genai.configure(api_key=GEMINI_API_KEY)

try:
    model = genai.GenerativeModel('gemini-1.5-flash')
except Exception as e:
    raise RuntimeError(f"Gagal menginisialisasi model Gemini: {e}")

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/chat', methods=['POST'])
def handle_chat():
    """
    Endpoint ini sekarang menerima seluruh riwayat percakapan untuk memberikan konteks.
    """
    # Mengambil seluruh data messages yang dikirim dari frontend
    messages = request.json.get('messages')

    if not messages:
        return jsonify({'error': 'Permintaan tidak valid, "messages" tidak ditemukan.'}), 400

    try:
        # Mengirim seluruh riwayat ke model Gemini
        # Gemini secara otomatis akan mengerti mana peran 'user' dan 'model' (bot)
        response = model.generate_content(messages)
        
        bot_response = response.text
        
        return jsonify({'response': bot_response})

    except Exception as e:
        print(f"Terjadi error dari API: {e}")
        return jsonify({'error': f"Gagal mendapatkan respons dari AI: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(debug=True)