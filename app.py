from flask import Flask, render_template, request, send_file
import os
from google import genai
import time

api_key="XYZ"
client = genai.Client(api_key=api_key)

app = Flask(__name__)

global_transaction=False

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/save_audio', methods=['POST'])
def save_audio():
    global global_transaction

    audio_data = request.files['audio']
    file_path="static/audio/recorded_audio.wav"
    if os.path.exists(file_path):
        os.remove(file_path)
    audio_data.save(file_path)

    with open("static/audio/recorded_audio.wav", 'rb') as f:
        audio_data=f.read()

    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=[
            """For the following audio file, if the content is related to technical topics then explain it in a short informative format which is described in a sarcastic manner with satire.
            If the content is related to non-technical topics then make the informative response hurmourous in an satire, sarcastic, mean and rude manner while keeping it short.""",
            genai.types.Part.from_bytes(
                data=audio_data,
                mime_type='audio/mp3'
            )
        ]
    )
    with open("static/prompt/response.txt",'w') as f:
        f.write(response.text)
    
    global_transaction=True

    return "Audio and response saved successfully", 200

@app.route('/get_text', methods=['GET'])
def get_text():
    global global_transaction

    text_path = "static/prompt/response.txt"
    while not global_transaction:
        time.sleep(0.2)
    global_transaction=False

    if os.path.exists(text_path):
        return send_file(text_path, mimetype="text/plain")
    else:
        return "No transcription available", 404

if __name__ == '__main__':
    app.run(debug=True)
