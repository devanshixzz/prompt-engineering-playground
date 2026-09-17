import time

from flask import Blueprint, request, jsonify

from services.llm_service import LLMService
from services.token_counter import count_tokens
from models.database import db, ExecutionHistory


generate_bp = Blueprint("generate", __name__)

llm_service = LLMService()


def normalize_response(response):
    return " ".join((response or "").lower().split())


@generate_bp.route("/api/generate", methods=["POST"])
def generate():
    try:
        data = request.get_json()

        if not data or not data.get("prompt"):
            return jsonify({
                "status": "error",
                "message": "Prompt is required."
            }), 400

        prompt = data["prompt"]

        temperature = data.get("temperature", 0.7)
        top_p = data.get("top_p", 0.9)
        max_tokens = data.get("max_tokens", 1000)
        system_prompt = data.get("system_prompt")
        use_self_consistency = data.get("self_consistency", False)

        try:
            runs = int(data.get("runs", 3))
        except (TypeError, ValueError):
            return jsonify({
                "status": "error",
                "message": "Self-consistency runs must be a number from 3 to 5."
            }), 400

        if use_self_consistency and runs not in range(3, 6):
            return jsonify({
                "status": "error",
                "message": "Self-consistency runs must be between 3 and 5."
            }), 400

        start_time = time.time()

        if use_self_consistency:
            responses = []

            for run_number in range(runs):
                try:
                    responses.append(llm_service.generate(
                        user_prompt=prompt,
                        system_prompt=system_prompt,
                        temperature=temperature,
                        top_p=top_p,
                        max_tokens=max_tokens
                    ))
                except Exception as e:
                    return jsonify({
                        "status": "error",
                        "message": f"Self-consistency run {run_number + 1} failed: {str(e)}"
                    }), 502

            normalized_responses = [normalize_response(item) for item in responses]
            counts = {}

            for item in normalized_responses:
                counts[item] = counts.get(item, 0) + 1

            most_common_normalized, most_common_count = max(
                counts.items(),
                key=lambda item: item[1]
            )
            most_common_index = normalized_responses.index(most_common_normalized)
            response = responses[most_common_index]
            consistency = {
                "percentage": round((most_common_count / runs) * 100),
                "most_common_count": most_common_count,
                "total_runs": runs,
                "most_common_response": response
            }

        else:
            response = llm_service.generate(
                user_prompt=prompt,
                system_prompt=system_prompt,
                temperature=temperature,
                top_p=top_p,
                max_tokens=max_tokens
            )

        latency = round(time.time() - start_time, 2)

        prompt_tokens = count_tokens(prompt) * (runs if use_self_consistency else 1)
        completion_tokens = (
            sum(count_tokens(item) for item in responses)
            if use_self_consistency
            else count_tokens(response)
        )
        total_tokens = prompt_tokens + completion_tokens

        # Save execution to database
        execution = ExecutionHistory(
            prompt=prompt,
            system_prompt=system_prompt,
            response=response,
            temperature=temperature,
            top_p=top_p,
            max_tokens=max_tokens,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            total_tokens=total_tokens,
            latency_seconds=latency
        )

        db.session.add(execution)
        db.session.commit()

        response_data = {
            "status": "success",
            "response": response,
            "metrics": {
                "latency_seconds": latency,
                "prompt_tokens": prompt_tokens,
                "completion_tokens": completion_tokens,
                "total_tokens": total_tokens
            },
            "execution_id": execution.id
        }

        if use_self_consistency:
            response_data["responses"] = responses
            response_data["consistency"] = consistency

        return jsonify(response_data)

    except Exception as e:
        db.session.rollback()

        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500
        
@generate_bp.route("/api/compare", methods=["POST"])
def compare():
    try:
        data = request.get_json()

        if not data:
            return jsonify({
                "status": "error",
                "message": "Request data is required."
            }), 400

        prompt_a = data.get("prompt_a")
        prompt_b = data.get("prompt_b")

        if not prompt_a or not prompt_b:
            return jsonify({
                "status": "error",
                "message": "Both Prompt A and Prompt B are required."
            }), 400

        # Parameters for Prompt A
        temperature_a = data.get("temperature_a", 0.7)
        top_p_a = data.get("top_p_a", 0.9)
        max_tokens_a = data.get("max_tokens_a", 1000)

        # Parameters for Prompt B
        temperature_b = data.get("temperature_b", 0.7)
        top_p_b = data.get("top_p_b", 0.9)
        max_tokens_b = data.get("max_tokens_b", 1000)

        # -------------------------
        # Generate Prompt A
        # -------------------------

        start_a = time.time()

        response_a = llm_service.generate(
            user_prompt=prompt_a,
            temperature=temperature_a,
            top_p=top_p_a,
            max_tokens=max_tokens_a
        )

        latency_a = round(time.time() - start_a, 2)

        prompt_tokens_a = count_tokens(prompt_a)
        completion_tokens_a = count_tokens(response_a)
        total_tokens_a = prompt_tokens_a + completion_tokens_a

        # -------------------------
        # Generate Prompt B
        # -------------------------

        start_b = time.time()

        response_b = llm_service.generate(
            user_prompt=prompt_b,
            temperature=temperature_b,
            top_p=top_p_b,
            max_tokens=max_tokens_b
        )

        latency_b = round(time.time() - start_b, 2)

        prompt_tokens_b = count_tokens(prompt_b)
        completion_tokens_b = count_tokens(response_b)
        total_tokens_b = prompt_tokens_b + completion_tokens_b

        return jsonify({
            "status": "success",

            "prompt_a": {
                "response": response_a,
                "metrics": {
                    "latency_seconds": latency_a,
                    "prompt_tokens": prompt_tokens_a,
                    "completion_tokens": completion_tokens_a,
                    "total_tokens": total_tokens_a
                }
            },

            "prompt_b": {
                "response": response_b,
                "metrics": {
                    "latency_seconds": latency_b,
                    "prompt_tokens": prompt_tokens_b,
                    "completion_tokens": completion_tokens_b,
                    "total_tokens": total_tokens_b
                }
            }
        })

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@generate_bp.route("/api/sweep", methods=["POST"])
def sweep():
    try:
        data = request.get_json()

        if not data:
            return jsonify({
                "status": "error",
                "message": "Request data is required."
            }), 400

        prompt = data.get("prompt")
        parameter = data.get("parameter")
        values = data.get("values", [])

        if not prompt:
            return jsonify({
                "status": "error",
                "message": "Prompt is required."
            }), 400

        if parameter not in ["temperature", "top_p", "max_tokens"]:
            return jsonify({
                "status": "error",
                "message": "Invalid parameter. Use temperature, top_p, or max_tokens."
            }), 400

        if not values:
            return jsonify({
                "status": "error",
                "message": "At least one parameter value is required."
            }), 400

        # Fixed parameters
        temperature = data.get("temperature", 0.7)
        top_p = data.get("top_p", 0.9)
        max_tokens = data.get("max_tokens", 1000)

        results = []

        for value in values:

            # Change only the parameter being swept
            current_temperature = temperature
            current_top_p = top_p
            current_max_tokens = max_tokens

            if parameter == "temperature":
                current_temperature = float(value)

            elif parameter == "top_p":
                current_top_p = float(value)

            elif parameter == "max_tokens":
                current_max_tokens = int(value)

            start_time = time.time()

            response = llm_service.generate(
                user_prompt=prompt,
                temperature=current_temperature,
                top_p=current_top_p,
                max_tokens=current_max_tokens
            )

            latency = round(time.time() - start_time, 2)

            prompt_tokens = count_tokens(prompt)
            completion_tokens = count_tokens(response)
            total_tokens = prompt_tokens + completion_tokens

            results.append({
                "parameter": parameter,
                "value": value,
                "response": response,
                "metrics": {
                    "latency_seconds": latency,
                    "prompt_tokens": prompt_tokens,
                    "completion_tokens": completion_tokens,
                    "total_tokens": total_tokens
                }
            })

        return jsonify({
            "status": "success",
            "parameter": parameter,
            "results": results
        })

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500
