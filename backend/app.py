import os

from dotenv import load_dotenv
load_dotenv()

from flask import Flask, send_from_directory
from flask_cors import CORS

from models.database import db
from routes.generate import generate_bp
from routes.history import history_bp
from routes.templates import templates_bp
from routes.prompts import prompts_bp


app = Flask(__name__)
CORS(app)

FRONTEND_DIR = os.path.join(
    os.path.dirname(os.path.dirname(__file__)),
    "frontend"
)


@app.route("/")
def serve_frontend():
    return send_from_directory(FRONTEND_DIR, "index.html")


@app.route("/<path:path>")
def serve_frontend_files(path):
    return send_from_directory(FRONTEND_DIR, path)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# SQLite database configuration
db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "instance", "prompt_playground.db")
os.makedirs(os.path.dirname(db_path), exist_ok=True)

app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{db_path.replace(os.sep, '/')}"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# Initialize database
db.init_app(app)

# Register routes
app.register_blueprint(generate_bp)
app.register_blueprint(history_bp)
app.register_blueprint(templates_bp)
app.register_blueprint(prompts_bp)


@app.route("/api/health", methods=["GET"])
def health_check():
    return {
        "status": "success",
        "message": "Prompt Playground API is running",
        "gemini_configured": bool(GEMINI_API_KEY)
    }


with app.app_context():
    db.create_all()


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=39701, debug=True)