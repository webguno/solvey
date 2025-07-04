
from flask import Flask, request, jsonify, render_template, send_from_directory
from flask_cors import CORS
import requests
import json
import os

app = Flask(__name__)
CORS(app)

# Secure API key - store in environment variable or here
API_KEY = "AIzaSyCsN2y9y6n8OlEmoKMTcvbxMMaxoasLkA8"
API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"

@app.route('/')
def home():
    return send_from_directory('.', 'index.html')

@app.route('/style.css')
def serve_css():
    return send_from_directory('.', 'style.css')

@app.route('/script.js')
def serve_js():
    return send_from_directory('.', 'script.js')

@app.route('/api/generate', methods=['POST'])
def generate_content():
    try:
        data = request.get_json()
        prompt_text = data.get('prompt')
        
        if not prompt_text:
            return jsonify({'error': 'Prompt is required'}), 400
        
        request_body = {
            "contents": [{
                "parts": [{
                    "text": prompt_text
                }]
            }]
        }
        
        response = requests.post(
            API_URL,
            headers={
                'Content-Type': 'application/json',
                'X-goog-api-key': API_KEY
            },
            json=request_body
        )
        
        if not response.ok:
            error_data = response.json()
            return jsonify({'error': f'API call failed: {error_data.get("error", {}).get("message", "Unknown error")}'}), 500
        
        result = response.json()
        
        try:
            generated_text = result['candidates'][0]['content']['parts'][0]['text']
            return jsonify({'text': generated_text})
        except (KeyError, IndexError):
            return jsonify({'error': 'Could not generate a valid response'}), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
