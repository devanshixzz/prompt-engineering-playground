// ==========================================
// Output Parser Utilities
// ==========================================

// Detect the likely format of an LLM response
function detectOutputFormat(text) {
    if (!text || !text.trim()) {
        return "empty";
    }

    const trimmed = text.trim();

    // JSON
    try {
        JSON.parse(trimmed);
        return "json";
    } catch (error) {
        // Not valid JSON
    }

    // Code block
    if (/```[\s\S]*```/.test(trimmed)) {
        return "code";
    }

    // Markdown table
    const lines = trimmed.split("\n").map(line => line.trim());

    if (
        lines.length >= 2 &&
        lines[0].includes("|") &&
        lines[1].includes("|") &&
        /^[-|:\s]+$/.test(lines[1])
    ) {
        return "table";
    }

    // Numbered or bullet list
    const listPattern = /^(\d+[\.\)]|[-*+])\s+/;

    if (lines.some(line => listPattern.test(line))) {
        return "list";
    }

    return "text";
}


// ==========================================
// JSON Parsing
// ==========================================

function parseJSONOutput(text) {
    if (!text || !text.trim()) {
        return {
            success: false,
            message: "No output available to parse."
        };
    }

    let cleaned = text.trim();

    // Remove markdown JSON code fences
    cleaned = cleaned
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

    try {
        const parsed = JSON.parse(cleaned);

        return {
            success: true,
            data: parsed,
            formatted: JSON.stringify(parsed, null, 2)
        };
    } catch (error) {
        return {
            success: false,
            message: "The output is not valid JSON.",
            error: error.message
        };
    }
}


// ==========================================
// JSON Schema Validation
// ==========================================

function validateJSONSchema(data, schemaText) {
    if (!schemaText || !schemaText.trim()) {
        return {
            success: false,
            message: "Please provide a JSON schema."
        };
    }

    let schema;

    try {
        schema = JSON.parse(schemaText);
    } catch (error) {
        return {
            success: false,
            message: "The schema itself is not valid JSON."
        };
    }

    // Basic client-side schema validation.
    // Full jsonschema validation will be handled by the backend.
    if (!schema.type) {
        return {
            success: false,
            message: "Schema must contain a 'type' property."
        };
    }

    if (schema.type === "object" && schema.required) {
        if (typeof data !== "object" || data === null || Array.isArray(data)) {
            return {
                success: false,
                message: "Expected the output to be a JSON object."
            };
        }

        const missingFields = schema.required.filter(
            field => !(field in data)
        );

        if (missingFields.length > 0) {
            return {
                success: false,
                message: `Missing required fields: ${missingFields.join(", ")}`
            };
        }
    }

    return {
        success: true,
        message: "JSON output passed the basic schema check."
    };
}


// ==========================================
// Markdown Table Parsing
// ==========================================

function parseMarkdownTable(text) {
    const lines = text
        .trim()
        .split("\n")
        .map(line => line.trim())
        .filter(Boolean);

    if (lines.length < 2) {
        return {
            success: false,
            message: "Not enough rows for a Markdown table."
        };
    }

    const headers = lines[0]
        .split("|")
        .map(cell => cell.trim())
        .filter(Boolean);

    const separator = lines[1];

    if (!separator.includes("-")) {
        return {
            success: false,
            message: "Invalid Markdown table separator."
        };
    }

    const rows = lines.slice(2).map(line =>
        line
            .split("|")
            .map(cell => cell.trim())
            .filter(Boolean)
    );

    return {
        success: true,
        headers,
        rows
    };
}


// ==========================================
// Code Block Detection
// ==========================================

function extractCodeBlocks(text) {
    if (!text) {
        return [];
    }

    const blocks = [];

    const regex = /```(\w*)\s*([\s\S]*?)```/g;

    let match;

    while ((match = regex.exec(text)) !== null) {
        blocks.push({
            language: match[1] || "text",
            code: match[2].trim()
        });
    }

    return blocks;
}


// ==========================================
// List Extraction
// ==========================================

function extractListItems(text) {
    if (!text) {
        return [];
    }

    const lines = text.split("\n");

    return lines
        .map(line => line.trim())
        .filter(line => /^(\d+[\.\)]|[-*+])\s+/.test(line))
        .map(line =>
            line.replace(/^(\d+[\.\)]|[-*+])\s+/, "").trim()
        );
}


// ==========================================
// HTML Escaping
// ==========================================

function escapeParserHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}