const promptInput = document.getElementById("prompt-input");
const promptCounter = document.getElementById("prompt-counter");
const tokenCounter = document.getElementById("token-counter");

const temperature = document.getElementById("temperature");
const temperatureValue = document.getElementById("temperature-value");

const topP = document.getElementById("top-p");
const topPValue = document.getElementById("top-p-value");

const maxTokens = document.getElementById("max-tokens");
const maxTokensValue = document.getElementById("max-tokens-value");


function updatePromptStats() {
    const text = promptInput.value;

    promptCounter.textContent = `${text.length} characters`;

    // Rough client-side token estimate.
    const estimatedTokens = text.trim()
        ? Math.ceil(text.trim().length / 4)
        : 0;

    tokenCounter.textContent = `Estimated tokens: ${estimatedTokens}`;
}


promptInput.addEventListener("input", updatePromptStats);


temperature.addEventListener("input", () => {
    temperatureValue.textContent = temperature.value;
});


topP.addEventListener("input", () => {
    topPValue.textContent = topP.value;
});


maxTokens.addEventListener("input", () => {
    maxTokensValue.textContent = maxTokens.value;
});


document.getElementById("clear-prompt").addEventListener("click", () => {
    promptInput.value = "";
    updatePromptStats();
});