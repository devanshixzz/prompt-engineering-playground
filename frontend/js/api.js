const API_BASE_URL = "http://116.202.210.102:39701/api";


async function generateResponse(data) {
    const response = await fetch(`${API_BASE_URL}/generate`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.message || "Failed to generate response.");
    }

    return result;
}


async function getTemplates() {
    const response = await fetch(`${API_BASE_URL}/templates`);

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.message || "Failed to load templates.");
    }

    return result;
}


async function getHistory() {
    const response = await fetch(`${API_BASE_URL}/history`);

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.message || "Failed to load history.");
    }

    return result;
}


async function getPrompts() {
    const response = await fetch(`${API_BASE_URL}/prompts`);

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.message || "Failed to load prompts.");
    }

    return result;
}

async function createPrompt(data) {
    const response = await fetch(`${API_BASE_URL}/prompts`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.message || "Failed to save prompt.");
    }

    return result;
}


async function updatePrompt(id, data) {
    const response = await fetch(`${API_BASE_URL}/prompts/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.message || "Failed to update prompt.");
    }

    return result;
}


async function deletePrompt(id) {
    const response = await fetch(`${API_BASE_URL}/prompts/${id}`, {
        method: "DELETE"
    });

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.message || "Failed to delete prompt.");
    }

    return result;
}

async function comparePrompts(data) {
    const response = await fetch(`${API_BASE_URL}/compare`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.message || "Failed to compare prompts.");
    }

    return result;
}

async function runParameterSweep(data) {
    const response = await fetch(`${API_BASE_URL}/sweep`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.message || "Failed to run parameter sweep.");
    }

    return result;
}