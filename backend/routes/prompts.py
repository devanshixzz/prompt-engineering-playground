from flask import Blueprint, request, jsonify

from models.database import db, Prompt


prompts_bp = Blueprint("prompts", __name__)


@prompts_bp.route("/api/prompts", methods=["POST"])
def create_prompt():
    try:
        data = request.get_json()

        if not data or not data.get("name") or not data.get("prompt"):
            return jsonify({
                "status": "error",
                "message": "Name and prompt are required."
            }), 400

        parameters = data.get("parameters", {})

        new_prompt = Prompt(
            name=data["name"],
            description=data.get("description"),
            category=data.get("category"),
            tags=data.get("tags"),
            prompt=data["prompt"],
            temperature=parameters.get("temperature", 0.7),
            top_p=parameters.get("top_p", 0.9),
            max_tokens=parameters.get("max_tokens", 1000)
        )

        db.session.add(new_prompt)
        db.session.commit()

        return jsonify({
            "status": "success",
            "message": "Prompt saved successfully.",
            "prompt": {
                "id": new_prompt.id,
                "name": new_prompt.name,
                "description": new_prompt.description,
                "category": new_prompt.category,
                "tags": new_prompt.tags,
                "prompt": new_prompt.prompt,
                "parameters": {
                    "temperature": new_prompt.temperature,
                    "top_p": new_prompt.top_p,
                    "max_tokens": new_prompt.max_tokens
                }
            }
        }), 201

    except Exception as e:
        db.session.rollback()

        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


@prompts_bp.route("/api/prompts", methods=["GET"])
def get_prompts():
    try:
        prompts = Prompt.query.order_by(
            Prompt.updated_at.desc()
        ).all()

        result = []

        for prompt in prompts:
            result.append({
                "id": prompt.id,
                "name": prompt.name,
                "description": prompt.description,
                "category": prompt.category,
                "tags": prompt.tags,
                "prompt": prompt.prompt,
                "parameters": {
                    "temperature": prompt.temperature,
                    "top_p": prompt.top_p,
                    "max_tokens": prompt.max_tokens
                },
                "created_at": prompt.created_at.isoformat(),
                "updated_at": prompt.updated_at.isoformat()
            })

        return jsonify({
            "status": "success",
            "prompts": result
        })

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


@prompts_bp.route("/api/prompts/<int:prompt_id>", methods=["PUT"])
def update_prompt(prompt_id):
    try:
        prompt = db.session.get(Prompt, prompt_id)

        if not prompt:
            return jsonify({
                "status": "error",
                "message": "Prompt not found."
            }), 404

        data = request.get_json()

        if not data:
            return jsonify({
                "status": "error",
                "message": "Request body is required."
            }), 400

        if "name" in data:
            prompt.name = data["name"]

        if "description" in data:
            prompt.description = data["description"]

        if "category" in data:
            prompt.category = data["category"]

        if "tags" in data:
            prompt.tags = data["tags"]

        if "prompt" in data:
            prompt.prompt = data["prompt"]

        if "parameters" in data:
            parameters = data["parameters"]

            if "temperature" in parameters:
                prompt.temperature = parameters["temperature"]

            if "top_p" in parameters:
                prompt.top_p = parameters["top_p"]

            if "max_tokens" in parameters:
                prompt.max_tokens = parameters["max_tokens"]

        db.session.commit()

        return jsonify({
            "status": "success",
            "message": "Prompt updated successfully."
        })

    except Exception as e:
        db.session.rollback()

        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


@prompts_bp.route("/api/prompts/<int:prompt_id>", methods=["DELETE"])
def delete_prompt(prompt_id):
    try:
        prompt = db.session.get(Prompt, prompt_id)

        if not prompt:
            return jsonify({
                "status": "error",
                "message": "Prompt not found."
            }), 404

        db.session.delete(prompt)
        db.session.commit()

        return jsonify({
            "status": "success",
            "message": "Prompt deleted successfully."
        })

    except Exception as e:
        db.session.rollback()

        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500