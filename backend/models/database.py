from flask_sqlalchemy import SQLAlchemy
from datetime import datetime


db = SQLAlchemy()


class ExecutionHistory(db.Model):
    __tablename__ = "execution_history"

    id = db.Column(db.Integer, primary_key=True)

    prompt = db.Column(db.Text, nullable=False)
    system_prompt = db.Column(db.Text, nullable=True)
    response = db.Column(db.Text, nullable=True)

    temperature = db.Column(db.Float, default=0.7)
    top_p = db.Column(db.Float, default=0.9)
    max_tokens = db.Column(db.Integer, default=1000)

    prompt_tokens = db.Column(db.Integer, default=0)
    completion_tokens = db.Column(db.Integer, default=0)
    total_tokens = db.Column(db.Integer, default=0)

    latency_seconds = db.Column(db.Float, default=0)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    

class Prompt(db.Model):
    __tablename__ = "prompts"

    id = db.Column(db.Integer, primary_key=True)

    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    category = db.Column(db.String(100), nullable=True)
    tags = db.Column(db.Text, nullable=True)

    prompt = db.Column(db.Text, nullable=False)

    temperature = db.Column(db.Float, default=0.7)
    top_p = db.Column(db.Float, default=0.9)
    max_tokens = db.Column(db.Integer, default=1000)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )    
    