from flask import Flask, request, jsonify
import subprocess
import tempfile
import os

app = Flask(__name__)

MODEL_PATH = "/models/ggml-large-v3.bin"


@app.route("/health")
def health():
    return {"status": "ok"}


@app.route("/transcribe", methods=["POST"])
def transcribe():
    if "audio" not in request.files:
        return jsonify({"error": "No audio file"}), 400

    audio = request.files["audio"]

    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        audio.save(tmp.name)
        tmp_path = tmp.name

    try:
        result = subprocess.run(
            ["whisper-cli", "-m", MODEL_PATH, "-l", "ja", "-f", tmp_path, "-otxt"],
            capture_output=True, text=True, timeout=60
        )
        transcription = result.stdout.strip()
        return jsonify({"text": transcription})
    finally:
        os.unlink(tmp_path)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=9000)
