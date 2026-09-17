from flask import Blueprint, jsonify

from models.database import ExecutionHistory


history_bp = Blueprint("history", __name__)


@history_bp.route("/api/history", methods=["GET"])
def get_history():
    try:
        executions = ExecutionHistory.query.order_by(
            ExecutionHistory.created_at.desc()
        ).all()

        history = []

        for execution in executions:
            history.append({
                "id": execution.id,
                "prompt": execution.prompt,
                "system_prompt": execution.system_prompt,
                "response": execution.response,
                "parameters": {
                    "temperature": execution.temperature,
                    "top_p": execution.top_p,
                    "max_tokens": execution.max_tokens
                },
                "metrics": {
                    "prompt_tokens": execution.prompt_tokens,
                    "completion_tokens": execution.completion_tokens,
                    "total_tokens": execution.total_tokens,
                    "latency_seconds": execution.latency_seconds
                },
                "created_at": execution.created_at.isoformat()
            })

        return jsonify({
            "status": "success",
            "history": history
        })

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500