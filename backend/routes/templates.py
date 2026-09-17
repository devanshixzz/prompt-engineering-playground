import json
import os

from flask import Blueprint, jsonify


templates_bp = Blueprint("templates", __name__)


def load_templates():
    file_path = os.path.join(
        os.path.dirname(os.path.dirname(__file__)),
        "data",
        "templates.json"
    )

    with open(file_path, "r", encoding="utf-8") as file:
        return json.load(file)


@templates_bp.route("/api/templates", methods=["GET"])
def get_templates():
    try:
        templates = load_templates()

        return jsonify({
            "status": "success",
            "templates": templates
        })

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


@templates_bp.route("/api/templates/<template_id>", methods=["GET"])
def get_template(template_id):
    try:
        templates = load_templates()

        for template in templates:
            if template["id"] == template_id:
                return jsonify({
                    "status": "success",
                    "template": template
                })

        return jsonify({
            "status": "error",
            "message": "Template not found."
        }), 404

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500