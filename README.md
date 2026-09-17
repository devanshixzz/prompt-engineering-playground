# Prompt Engineering Playground

A Flask and vanilla JavaScript application for testing prompt techniques, tuning Gemini parameters, comparing responses, and managing reusable prompts.

## Setup

1. Create and activate a Python virtual environment.
2. Install dependencies:

   ```powershell
   pip install -r requirements.txt
   ```

3. Copy `.env.example` to `.env` and set `GEMINI_API_KEY`.
4. Start the backend from the `backend` directory:

   ```powershell
   python app.py
   ```

5. Serve the `frontend` directory with a static web server and open it in a browser. The frontend calls the Flask API at `http://127.0.0.1:5000/api`.

## Architecture

- `backend/app.py` configures Flask, CORS, and SQLite.
- `backend/routes/` contains API endpoints for generation, templates, prompt-library CRUD, and execution history.
- `backend/services/llm_service.py` sends server-side requests to Google Gemini.
- `backend/data/templates.json` contains 19 built-in prompt templates.
- `frontend/` contains the responsive HTML, CSS, and vanilla JavaScript interface.

## Implemented Prompt Techniques

- Zero-Shot Prompting
- Few-Shot Prompting with editable input/output examples
- Chain-of-Thought
- Self-Consistency (3-5 runs with normalized majority analysis)
- Role-Based Prompting
- Output Format Control
- Instruction Decomposition
- Negative Prompting

## Main Features

- System prompt and user prompt editor
- Temperature, top-p, and max-token controls
- Markdown output with code syntax highlighting
- Side-by-side prompt comparison
- Prompt library: save, load, edit, and delete prompts
- Execution history with prompt reloading
- Parameter sweep and structured-output parser/validator
- Response latency and token metrics

## API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/generate` | Generate one response or run Self-Consistency mode |
| POST | `/api/compare` | Generate responses for two prompts |
| POST | `/api/sweep` | Run a prompt across parameter values |
| GET | `/api/templates` | List built-in templates |
| GET | `/api/templates/{id}` | Get one template |
| POST/GET | `/api/prompts` | Create or list saved prompts |
| PUT/DELETE | `/api/prompts/{id}` | Update or delete a saved prompt |
| GET | `/api/history` | List execution history |
| GET | `/api/health` | Check backend/API-key configuration |

## Notes

Keep the Gemini API key in `.env`; it is never sent to the browser. Self-Consistency uses repeated Gemini calls, so it consumes more time and tokens than a normal generation.
