// ==================================================
// PROMPT PLAYGROUND
// ==================================================

const generateButton = document.getElementById("generate-btn");
const responseOutput = document.getElementById("response-output");

const latencyMetric = document.getElementById("latency-metric");
const promptTokensMetric = document.getElementById("prompt-tokens-metric");
const completionTokensMetric = document.getElementById("completion-tokens-metric");
const totalTokensMetric = document.getElementById("total-tokens-metric");

const templateSelect = document.getElementById("template-select");
const templateVariables = document.getElementById("template-variables");
const techniqueSelect = document.getElementById("technique-select");
const techniqueDetails = document.getElementById("technique-details");
const fewShotExamples = document.getElementById("few-shot-examples");
const exampleRows = document.getElementById("example-rows");
const addExampleButton = document.getElementById("add-example-button");
const negativePromptingControls = document.getElementById("negative-prompting-controls");
const negativeInstructions = document.getElementById("negative-instructions");
const selfConsistencyControls = document.getElementById("self-consistency-controls");
const selfConsistencyRuns = document.getElementById("self-consistency-runs");
const selfConsistencyRunsValue = document.getElementById("self-consistency-runs-value");
const saveCurrentPromptButton = document.getElementById("save-current-prompt");

const techniqueInfo = {
    "Zero-Shot": {
        title: "Zero-Shot Prompting",
        description: "Ask the model to complete a task directly, without giving examples.",
        use: "Best for clear, well-defined tasks such as drafting, translating, or summarizing."
    },
    "Few-Shot": {
        title: "Few-Shot Prompting",
        description: "Show input/output examples before asking the model to complete the task.",
        use: "Useful when the desired classification, style, or structure needs to be demonstrated."
    },
    "Chain-of-Thought": {
        title: "Chain-of-Thought",
        description: "Ask the model to work through a problem in clear intermediate steps.",
        use: "Useful for math, logic, and multi-step reasoning tasks."
    },
    "Self-Consistency": {
        title: "Self-Consistency",
        description: "Run the same prompt several times and compare the responses for agreement.",
        use: "Useful when a repeated answer or consensus increases confidence."
    },
    "Role-Based": {
        title: "Role-Based Prompting",
        description: "Give the model a role or professional perspective before the task.",
        use: "Useful for adapting expertise, tone, and point of view."
    },
    "Output Format Control": {
        title: "Output Format Control",
        description: "Specify the exact response structure, such as JSON, a table, or a list.",
        use: "Useful when the response needs to be easy to parse or reuse."
    },
    "Instruction Decomposition": {
        title: "Instruction Decomposition",
        description: "Break a larger task into ordered, explicit instructions.",
        use: "Useful for analyses and workflows with several required parts."
    },
    "Negative Prompting": {
        title: "Negative Prompting",
        description: "State what the model should avoid in its response.",
        use: "Useful for setting exclusions such as no jargon, no markdown, or a word limit."
    }
};

function highlightRenderedCode(container) {
    if (typeof hljs === "undefined" || !container) {
        return;
    }

    container.querySelectorAll("pre code").forEach(block => {
        hljs.highlightElement(block);
    });
}


// ==================================================
// LOAD TEMPLATES
// ==================================================

async function loadTemplates() {

    try {

        const result =
            await getTemplates();

        templateSelect.innerHTML = `
            <option value="">
                Select a template...
            </option>
        `;

        result.templates.forEach(template => {

            const option =
                document.createElement("option");

            option.value =
                template.id;

            option.textContent =
                template.name;

            templateSelect.appendChild(
                option
            );
        });

    } catch (error) {

        console.error(
            "Failed to load templates:",
            error
        );
    }
}


// ==================================================
// CREATE VARIABLE INPUTS
// ==================================================

const variableFieldConfig = {
    topic: { placeholder: "e.g., Sustainable travel for beginners", helper: "The main subject the response should cover." },
    audience: { placeholder: "e.g., First-time travelers", helper: "Who the response should be written for." },
    tone: { type: "select", options: ["Professional and friendly", "Casual and conversational", "Formal", "Persuasive", "Technical"], helper: "Choose the voice for the response." },
    length: { type: "number", min: 1, placeholder: "e.g., 500", helper: "Approximate length in words." },
    recipient: { placeholder: "e.g., Hiring Manager", helper: "Who should receive the email." },
    subject: { placeholder: "e.g., Interview follow-up", helper: "The email subject or topic." },
    purpose: { type: "textarea", placeholder: "e.g., Request an update about my application", helper: "Explain what the message should accomplish." },
    platform: { type: "select", options: ["LinkedIn", "Instagram", "X (Twitter)", "Facebook"], helper: "Choose where the post will be published." },
    product: { placeholder: "e.g., Noise-cancelling headphones", helper: "Name the product to describe." },
    features: { type: "textarea", placeholder: "e.g., 30-hour battery, lightweight design, Bluetooth 5.3", helper: "List the features or benefits to highlight." },
    customer: { placeholder: "e.g., Remote professionals", helper: "Describe the intended customer." },
    style: { type: "select", options: ["Concise and persuasive", "Detailed and informative", "Premium", "Friendly"], helper: "Choose the writing style." },
    language: { type: "select", options: ["Python", "JavaScript", "Java", "C++", "TypeScript", "Other"], helper: "Select the programming language." },
    code: { type: "textarea", placeholder: "Paste the code you want to explain or review", helper: "Include the complete relevant code snippet." },
    requirement: { type: "textarea", placeholder: "e.g., returns the total price after applying a discount", helper: "Describe exactly what the function should do." },
    method: { type: "select", options: ["GET", "POST", "PUT", "PATCH", "DELETE"], helper: "Choose the HTTP method." },
    endpoint: { placeholder: "e.g., /api/users/{id}", helper: "Enter the API route." },
    categories: { placeholder: "e.g., Positive, Negative, Neutral", helper: "Enter the allowed categories, separated by commas." },
    text: { type: "textarea", placeholder: "Paste or write the text to process", helper: "Provide the text for the selected template." },
    problem: { type: "textarea", placeholder: "e.g., If 3 books cost $24, what do 5 books cost?", helper: "Enter the complete math problem." },
    count: { type: "number", min: 1, placeholder: "e.g., 5", helper: "How many key points should be returned." },
    transcript: { type: "textarea", placeholder: "Paste the meeting transcript or notes", helper: "Include enough context to identify decisions and action items." },
    source_language: { type: "select", label: "Source Language", options: ["English", "Hindi", "Spanish", "French", "German", "Other"], helper: "The language of the original text." },
    target_language: { type: "select", label: "Target Language", options: ["English", "Hindi", "Spanish", "French", "German", "Other"], helper: "The language to translate into." }
};

function toReadableLabel(variable) {
    return variable
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replace(/[_-]+/g, " ")
        .replace(/\b\w/g, letter => letter.toUpperCase());
}

function getVariableConfig(variable) {
    return {
        type: "text",
        placeholder: `Enter ${toReadableLabel(variable).toLowerCase()}...`,
        helper: "Required to complete this template.",
        ...variableFieldConfig[variable]
    };
}

function createVariableInputs(template) {

    templateVariables.innerHTML = "";

    if (
        !template.variables ||
        template.variables.length === 0
    ) {
        return;
    }

    const heading = document.createElement("div");
    heading.className = "template-variables-heading";
    heading.innerHTML = "<div><h3>Template variables</h3><p>Complete the required fields to personalize this template.</p></div><span>Required fields</span>";
    templateVariables.appendChild(heading);

    template.variables.forEach(variable => {

        if (
            variable === "examples" &&
            template.technique === "Few-Shot"
        ) {
            return;
        }

        const config = getVariableConfig(variable);
        const labelText = config.label || toReadableLabel(variable);
        const group = document.createElement("div");
        group.className = `variable-group${config.type === "textarea" ? " variable-long" : ""}`;

        const label = document.createElement("label");
        label.htmlFor = `template-variable-${variable}`;
        label.innerHTML = `${labelText}<span>Required</span>`;

        let input;

        if (config.type === "textarea") {
            input = document.createElement("textarea");
            input.rows = variable === "code" || variable === "transcript" ? 6 : 3;
        } else if (config.type === "select") {
            input = document.createElement("select");
            const defaultOption = document.createElement("option");
            defaultOption.value = "";
            defaultOption.textContent = `Select ${labelText.toLowerCase()}...`;
            defaultOption.disabled = true;
            defaultOption.selected = true;
            input.appendChild(defaultOption);

            config.options.forEach(optionText => {
                const option = document.createElement("option");
                option.value = optionText;
                option.textContent = optionText;
                input.appendChild(option);
            });
        } else {
            input = document.createElement("input");
            input.type = config.type;
            if (config.min) {
                input.min = config.min;
            }
        }

        input.id = `template-variable-${variable}`;
        input.className = "template-variable-input";
        input.dataset.variable = variable;
        input.dataset.label = labelText;
        input.placeholder = config.placeholder || "";
        input.required = true;
        input.addEventListener("input", () => group.classList.remove("has-error"));
        input.addEventListener("change", () => group.classList.remove("has-error"));

        const helper = document.createElement("p");
        helper.className = "variable-helper";
        helper.textContent = config.helper;

        group.appendChild(label);
        group.appendChild(input);
        group.appendChild(helper);
        templateVariables.appendChild(group);
    });
}


// ==================================================
// REPLACE TEMPLATE VARIABLES
// ==================================================

function replaceTemplateVariables(templateText) {

    let finalPrompt =
        templateText;

    const inputs =
        document.querySelectorAll(
            ".template-variable-input"
        );

    inputs.forEach(input => {

        const variable =
            input.dataset.variable;

        const value =
            input.value.trim();

        const placeholder =
            `{{${variable}}}`;

        finalPrompt =
            finalPrompt
                .split(placeholder)
                .join(value);
    });

    if (
        techniqueSelect &&
        techniqueSelect.value === "Few-Shot"
    ) {
        const examples = getFewShotExamples();
        const examplesPlaceholder = "{{examples}}";

        finalPrompt = finalPrompt.includes(examplesPlaceholder)
            ? finalPrompt.split(examplesPlaceholder).join(examples)
            : examples
                ? `${finalPrompt}\n\nExamples:\n${examples}`
                : finalPrompt;
    }

    return finalPrompt;
}

function validateTemplateVariables() {
    const inputs = document.querySelectorAll(".template-variable-input");

    for (const input of inputs) {
        const group = input.closest(".variable-group");

        if (!input.value.trim()) {
            group.classList.add("has-error");
            input.focus();
            return `Please fill in ${input.dataset.label}.`;
        }
    }

    if (techniqueSelect && techniqueSelect.value === "Few-Shot") {
        const rows = Array.from(exampleRows.children);
        const completeRows = rows.filter(row => {
            const input = row.querySelector(".few-shot-input").value.trim();
            const output = row.querySelector(".few-shot-output").value.trim();
            return input && output;
        });

        const hasIncompleteRow = rows.some(row => {
            const input = row.querySelector(".few-shot-input").value.trim();
            const output = row.querySelector(".few-shot-output").value.trim();
            return Boolean(input) !== Boolean(output);
        });

        if (completeRows.length < 2 || hasIncompleteRow) {
            fewShotExamples.classList.add("has-error");
            return "Please complete at least two Few-Shot examples with both an input and output.";
        }
    }

    return null;
}

function addNegativeInstructions(prompt) {

    if (
        !techniqueSelect ||
        techniqueSelect.value !== "Negative Prompting" ||
        !negativeInstructions.value.trim()
    ) {
        return prompt;
    }

    return `${prompt}\n\nDo not do the following:\n${negativeInstructions.value.trim()}`;
}


// ==================================================
// TEMPLATE SELECTION
// ==================================================

if (templateSelect) {

    templateSelect.addEventListener(
        "change",
        async () => {

            const templateId =
                templateSelect.value;

            if (!templateId) {

                templateVariables.innerHTML =
                    "";

                return;
            }

            try {

                const response =
                    await fetch(
                        `${API_BASE_URL}/templates/${templateId}`
                    );

                const result =
                    await response.json();

                if (!response.ok) {

                    throw new Error(
                        result.message ||
                        "Failed to load template."
                    );
                }

                const template =
                    result.template;

                promptInput.value =
                    template.prompt;

                if (techniqueSelect) {
                    techniqueSelect.value = template.technique || "";
                    updateTechniqueUI();
                }

                createVariableInputs(
                    template
                );


                // Apply recommended parameters

                if (
                    template.recommended_parameters
                ) {

                    const parameters =
                        template.recommended_parameters;

                    if (
                        parameters.temperature !==
                        undefined
                    ) {

                        temperature.value =
                            parameters.temperature;

                        temperatureValue.textContent =
                            parameters.temperature;
                    }

                    if (
                        parameters.top_p !==
                        undefined
                    ) {

                        topP.value =
                            parameters.top_p;

                        topPValue.textContent =
                            parameters.top_p;
                    }

                    if (
                        parameters.max_tokens !==
                        undefined
                    ) {

                        maxTokens.value =
                            parameters.max_tokens;

                        maxTokensValue.textContent =
                            parameters.max_tokens;
                    }
                }

                updatePromptStats();

            } catch (error) {

                console.error(
                    "Failed to load template:",
                    error
                );
            }
        }
    );
}


// ==================================================
// GENERATE RESPONSE
// ==================================================

if (generateButton) {

    generateButton.addEventListener(
        "click",
        async () => {

            const templateText =
                promptInput.value.trim();

            if (!templateText) {

                responseOutput.innerHTML = `
                    <p class="error-message">
                        Please enter a prompt first.
                    </p>
                `;

                return;
            }


            // Replace variables

            let prompt =
                replaceTemplateVariables(
                    templateText
                );

            prompt = addNegativeInstructions(prompt);

            const useSelfConsistency =
                techniqueSelect &&
                techniqueSelect.value === "Self-Consistency";


            generateButton.disabled =
                true;

            generateButton.textContent =
                "Generating...";


            responseOutput.innerHTML = `
                <p>
                    Generating response...
                </p>
            `;


            try {

                const systemPromptElement =
                    document.getElementById(
                        "system-prompt"
                    );

                const result =
                    await generateResponse({

                        prompt:
                            prompt,

                        system_prompt:
                            systemPromptElement
                                ? systemPromptElement.value.trim() ||
                                  null
                                : null,

                        temperature:
                            parseFloat(
                                temperature.value
                            ),

                        top_p:
                            parseFloat(
                                topP.value
                            ),

                        max_tokens:
                            parseInt(
                                maxTokens.value
                            ),

                        self_consistency:
                            useSelfConsistency,

                        runs:
                            useSelfConsistency
                                ? parseInt(selfConsistencyRuns.value)
                                : undefined
                    });


                if (useSelfConsistency) {

                    const runs = result.responses.map((response, index) => `
                        <div class="consistency-run">
                            <h3>Run ${index + 1}</h3>
                            ${marked.parse(response)}
                        </div>
                    `).join("");

                    responseOutput.innerHTML = `
                        <div class="self-consistency-output">
                            <div class="consistency-summary">
                                <h3>Self-Consistency: ${result.consistency.percentage}%</h3>
                                <p>${result.consistency.most_common_count} of ${result.consistency.total_runs} response(s) matched after normalization.</p>
                                <h3>Most Common Response</h3>
                                ${marked.parse(result.consistency.most_common_response)}
                            </div>
                            ${runs}
                        </div>
                    `;

                } else {

                    // Render Markdown
                    responseOutput.innerHTML =
                        marked.parse(
                            result.response
                        );
                }

                highlightRenderedCode(responseOutput);

                // Store the raw AI response for the Output Parser
                window.lastAIResponse = useSelfConsistency
                    ? result.consistency.most_common_response
                    : result.response;


                // Update metrics
                latencyMetric.textContent =
                    `${result.metrics.latency_seconds}s`;

                promptTokensMetric.textContent =
                    result.metrics.prompt_tokens;

                completionTokensMetric.textContent =
                    result.metrics.completion_tokens;

                totalTokensMetric.textContent =
                    result.metrics.total_tokens;

            } catch (error) {

                responseOutput.innerHTML = `
                    <p class="error-message">
                        ${escapeHtml(
                            error.message
                        )}
                    </p>
                `;

            } finally {

                generateButton.disabled =
                    false;

                generateButton.textContent =
                    "Generate Response";
            }
        }
    );
}


// ==================================================
// SIDEBAR NAVIGATION
// ==================================================

document
    .querySelectorAll(".nav-item")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const screen =
                    button.dataset.screen;


                // Remove active state

                document
                    .querySelectorAll(".nav-item")
                    .forEach(item => {

                        item.classList.remove(
                            "active"
                        );
                    });

                button.classList.add(
                    "active"
                );


                // Hide all screens

                document
                    .querySelectorAll(".screen")
                    .forEach(section => {

                        section.classList.remove(
                            "active"
                        );
                    });


                // Show selected screen

                const selectedScreen =
                    document.getElementById(
                        `${screen}-screen`
                    );

                if (selectedScreen) {

                    selectedScreen.classList.add(
                        "active"
                    );
                }


                updateScreenHeader(
                    screen
                );


                // Reload Prompt Library

                if (screen === "library") {

                    loadPromptLibrary();
                }


                // Reload Execution History

                if (screen === "history") {

                    loadExecutionHistory();
                }
            }
        );
    });


// ==================================================
// SCREEN HEADER
// ==================================================

function updateScreenHeader(screen) {

    const title =
        document.getElementById(
            "screen-title"
        );

    const description =
        document.getElementById(
            "screen-description"
        );

    const screens = {

        playground: {

            title:
                "Prompt Playground",

            description:
                "Experiment with prompts and LLM parameters."
        },

        comparison: {

            title:
                "Prompt Comparison",

            description:
                "Compare different prompts and configurations."
        },

        sweep: {

            title:
                "Parameter Sweep",

            description:
                "Test a prompt across different parameter values."
        },

        library: {

            title:
                "Prompt Library",

            description:
                "Manage and reuse your saved prompts."
        },

        history: {

            title:
                "Execution History",

            description:
                "Review your previous prompt executions."
        }
    };


    if (!screens[screen]) {
        return;
    }


    title.textContent =
        screens[screen].title;

    description.textContent =
        screens[screen].description;
}


// ==================================================
// COPY RESPONSE
// ==================================================

const copyResponseButton =
    document.getElementById(
        "copy-response"
    );

if (copyResponseButton) {

    copyResponseButton.addEventListener(
        "click",
        async () => {

            const text =
                responseOutput.textContent.trim();

            if (!text) {
                return;
            }

            try {

                await navigator.clipboard.writeText(
                    text
                );

                copyResponseButton.textContent =
                    "Copied!";

                setTimeout(() => {

                    copyResponseButton.textContent =
                        "Copy";

                }, 1500);

            } catch (error) {

                console.error(
                    "Failed to copy response:",
                    error
                );
            }
        }
    );
}


// ==================================================
// INITIAL SETUP
// ==================================================

updateTechniqueUI();
loadTemplates();


// ==================================================
// COMPARISON
// ==================================================

const compareButton =
    document.getElementById(
        "compare-button"
    );

if (compareButton) {

    compareButton.addEventListener(
        "click",
        async () => {

            const promptA =
                document
                    .getElementById(
                        "comparison-prompt-a"
                    )
                    .value
                    .trim();

            const promptB =
                document
                    .getElementById(
                        "comparison-prompt-b"
                    )
                    .value
                    .trim();


            const outputA =
                document.getElementById(
                    "comparison-output-a"
                );

            const outputB =
                document.getElementById(
                    "comparison-output-b"
                );


            if (!promptA || !promptB) {

                alert(
                    "Please enter both Prompt A and Prompt B."
                );

                return;
            }


            compareButton.disabled =
                true;

            compareButton.textContent =
                "Comparing...";


            outputA.innerHTML =
                "<p>Generating response...</p>";

            outputB.innerHTML =
                "<p>Generating response...</p>";


            try {

                const result =
                    await comparePrompts({

                        prompt_a:
                            promptA,

                        prompt_b:
                            promptB,

                        temperature_a:
                            parseFloat(
                                document
                                    .getElementById(
                                        "comparison-temperature-a"
                                    )
                                    .value
                            ),

                        top_p_a:
                            parseFloat(
                                document
                                    .getElementById(
                                        "comparison-top-p-a"
                                    )
                                    .value
                            ),

                        max_tokens_a:
                            parseInt(
                                document
                                    .getElementById(
                                        "comparison-max-tokens-a"
                                    )
                                    .value
                            ),

                        temperature_b:
                            parseFloat(
                                document
                                    .getElementById(
                                        "comparison-temperature-b"
                                    )
                                    .value
                            ),

                        top_p_b:
                            parseFloat(
                                document
                                    .getElementById(
                                        "comparison-top-p-b"
                                    )
                                    .value
                            ),

                        max_tokens_b:
                            parseInt(
                                document
                                    .getElementById(
                                        "comparison-max-tokens-b"
                                    )
                                    .value
                            )
                    });


                // Render Markdown

                outputA.innerHTML =
                    marked.parse(
                        result.prompt_a.response
                    );

                outputB.innerHTML =
                    marked.parse(
                        result.prompt_b.response
                    );


                // Metrics A

                document
                    .getElementById(
                        "comparison-metrics-a"
                    )
                    .innerHTML = `

                        <div class="metric">

                            <span>
                                Latency
                            </span>

                            <strong>
                                ${result.prompt_a.metrics.latency_seconds}s
                            </strong>

                        </div>

                        <div class="metric">

                            <span>
                                Tokens
                            </span>

                            <strong>
                                ${result.prompt_a.metrics.total_tokens}
                            </strong>

                        </div>
                    `;


                // Metrics B

                document
                    .getElementById(
                        "comparison-metrics-b"
                    )
                    .innerHTML = `

                        <div class="metric">

                            <span>
                                Latency
                            </span>

                            <strong>
                                ${result.prompt_b.metrics.latency_seconds}s
                            </strong>

                        </div>

                        <div class="metric">

                            <span>
                                Tokens
                            </span>

                            <strong>
                                ${result.prompt_b.metrics.total_tokens}
                            </strong>

                        </div>
                    `;

            } catch (error) {

                outputA.innerHTML = `
                    <div class="error-message">
                        ${escapeHtml(
                            error.message
                        )}
                    </div>
                `;

                outputB.innerHTML = `
                    <div class="error-message">
                        ${escapeHtml(
                            error.message
                        )}
                    </div>
                `;

            } finally {

                compareButton.disabled =
                    false;

                compareButton.textContent =
                    "Compare Prompts";
            }
        }
    );
}


// ==================================================
// OUTPUT RATINGS
// ==================================================

function setupRating(
    ratingId,
    valueId
) {

    const ratingContainer =
        document.getElementById(
            ratingId
        );

    const ratingValue =
        document.getElementById(
            valueId
        );


    if (
        !ratingContainer ||
        !ratingValue
    ) {
        return;
    }


    const stars =
        ratingContainer.querySelectorAll(
            "button"
        );


    stars.forEach(star => {

        star.addEventListener(
            "click",
            () => {

                const rating =
                    Number(
                        star.dataset.rating
                    );


                stars.forEach(item => {

                    const itemRating =
                        Number(
                            item.dataset.rating
                        );


                    if (
                        itemRating <=
                        rating
                    ) {

                        item.classList.add(
                            "active"
                        );

                    } else {

                        item.classList.remove(
                            "active"
                        );
                    }
                });


                ratingValue.textContent =
                    `${rating}/5`;
            }
        );
    });
}


setupRating(
    "rating-a",
    "rating-value-a"
);

setupRating(
    "rating-b",
    "rating-value-b"
);


// ==================================================
// PARAMETER SWEEP
// ==================================================

const sweepButton =
    document.getElementById(
        "sweep-button"
    );

if (sweepButton) {

    sweepButton.addEventListener(
        "click",
        async () => {

            const prompt =
                document
                    .getElementById(
                        "sweep-prompt"
                    )
                    .value
                    .trim();

            const parameter =
                document
                    .getElementById(
                        "sweep-parameter"
                    )
                    .value;

            const valuesInput =
                document
                    .getElementById(
                        "sweep-values"
                    )
                    .value
                    .trim();

            const output =
                document.getElementById(
                    "sweep-output"
                );

            const resultCount =
                document.getElementById(
                    "sweep-result-count"
                );


            if (!prompt) {

                alert(
                    "Please enter a prompt."
                );

                return;
            }


            if (!valuesInput) {

                alert(
                    "Please enter parameter values."
                );

                return;
            }


            // Convert comma-separated values

            const values =
                valuesInput
                    .split(",")
                    .map(
                        value =>
                            value.trim()
                    )
                    .filter(
                        value =>
                            value !== ""
                    )
                    .map(
                        value =>
                            Number(value)
                    );


            if (
                values.length === 0 ||
                values.some(
                    value =>
                        Number.isNaN(value)
                )
            ) {

                alert(
                    "Please enter valid comma-separated numbers."
                );

                return;
            }


            sweepButton.disabled =
                true;

            sweepButton.textContent =
                "Running Sweep...";


            output.innerHTML =
                "<p>Running parameter sweep...</p>";

            resultCount.textContent =
                "";


            try {

                const result =
                    await runParameterSweep({

                        prompt:
                            prompt,

                        parameter:
                            parameter,

                        values:
                            values,

                        temperature:
                            parseFloat(
                                document
                                    .getElementById(
                                        "sweep-temperature"
                                    )
                                    .value
                            ),

                        top_p:
                            parseFloat(
                                document
                                    .getElementById(
                                        "sweep-top-p"
                                    )
                                    .value
                            ),

                        max_tokens:
                            parseInt(
                                document
                                    .getElementById(
                                        "sweep-max-tokens"
                                    )
                                    .value
                            )
                    });


                resultCount.textContent =
                    `${result.results.length} runs`;

                output.innerHTML =
                    "";


                result.results.forEach(
                    (item, index) => {

                        const card =
                            document.createElement(
                                "div"
                            );

                        card.className =
                            "sweep-result-card";


                        card.innerHTML = `

                            <div class="sweep-result-header">

                                <h3>
                                    Run ${index + 1}
                                </h3>

                                <span class="sweep-result-value">

                                    ${escapeHtml(
                                        item.parameter
                                    )}:

                                    ${escapeHtml(
                                        String(
                                            item.value
                                        )
                                    )}

                                </span>

                            </div>


                            <div class="sweep-result-output">

                                ${marked.parse(
                                    item.response
                                )}

                            </div>


                            <div class="sweep-result-metrics">

                                <div class="sweep-metric">

                                    Latency:

                                    <strong>
                                        ${item.metrics.latency_seconds}s
                                    </strong>

                                </div>


                                <div class="sweep-metric">

                                    Prompt Tokens:

                                    <strong>
                                        ${item.metrics.prompt_tokens}
                                    </strong>

                                </div>


                                <div class="sweep-metric">

                                    Completion Tokens:

                                    <strong>
                                        ${item.metrics.completion_tokens}
                                    </strong>

                                </div>


                                <div class="sweep-metric">

                                    Total Tokens:

                                    <strong>
                                        ${item.metrics.total_tokens}
                                    </strong>

                                </div>

                            </div>
                        `;


                        output.appendChild(
                            card
                        );
                    }
                );

            } catch (error) {

                output.innerHTML = `
                    <div class="error-message">
                        ${escapeHtml(
                            error.message
                        )}
                    </div>
                `;

            } finally {

                sweepButton.disabled =
                    false;

                sweepButton.textContent =
                    "Run Parameter Sweep";
            }
        }
    );
}


// ==================================================
// PROMPT LIBRARY
// ==================================================

let libraryPrompts = [];

let editingPromptId =
    null;


const libraryList =
    document.getElementById(
        "library-list"
    );

const newPromptButton =
    document.getElementById(
        "new-prompt-button"
    );

const promptFormPanel =
    document.getElementById(
        "prompt-form-panel"
    );

const savePromptButton =
    document.getElementById(
        "save-prompt-button"
    );

const cancelPromptButton =
    document.getElementById(
        "cancel-prompt-button"
    );

if (saveCurrentPromptButton) {
    saveCurrentPromptButton.addEventListener("click", () => {
        const currentPrompt = promptInput.value.trim();

        if (!currentPrompt) {
            alert("Please enter a prompt before saving it to the library.");
            return;
        }

        document.querySelector('.nav-item[data-screen="library"]').click();
        newPromptButton.click();

        document.getElementById("library-prompt-name").value =
            "Playground Prompt";
        document.getElementById("library-prompt-text").value = currentPrompt;
        document.getElementById("library-temperature").value = temperature.value;
        document.getElementById("library-top-p").value = topP.value;
        document.getElementById("library-max-tokens").value = maxTokens.value;
    });
}


// ==================================================
// LOAD PROMPT LIBRARY
// ==================================================

async function loadPromptLibrary() {

    if (!libraryList) {
        return;
    }


    libraryList.innerHTML = `
        <div class="empty-state">
            Loading prompts...
        </div>
    `;


    try {

        const result =
            await getPrompts();

        libraryPrompts =
            result.prompts || [];


        renderPromptLibrary(
            libraryPrompts
        );

    } catch (error) {

        libraryList.innerHTML = `
            <div class="error-message">
                ${escapeHtml(
                    error.message
                )}
            </div>
        `;
    }
}


// ==================================================
// RENDER PROMPT LIBRARY
// ==================================================

function renderPromptLibrary(
    prompts
) {

    if (!prompts.length) {

        libraryList.innerHTML = `
            <div class="empty-state">
                No saved prompts found.
            </div>
        `;

        return;
    }


    libraryList.innerHTML =
        "";


    prompts.forEach(prompt => {

        const card =
            document.createElement(
                "div"
            );

        card.className =
            "library-card";


        const tags =
            prompt.tags
                ? prompt.tags
                    .split(",")
                    .map(
                        tag =>
                            tag.trim()
                    )
                    .filter(
                        tag =>
                            tag
                    )
                : [];


        card.innerHTML = `

            <div class="library-card-header">

                <div class="library-card-title">

                    ${escapeHtml(
                        prompt.name
                    )}

                </div>

                <span class="library-card-category">

                    ${escapeHtml(
                        prompt.category ||
                        "Other"
                    )}

                </span>

            </div>


            <div class="library-card-description">

                ${escapeHtml(
                    prompt.description ||
                    "No description provided."
                )}

            </div>


            <div class="library-card-tags">

                ${
                    tags
                        .map(
                            tag => `
                                <span class="library-tag">
                                    ${escapeHtml(
                                        tag
                                    )}
                                </span>
                            `
                        )
                        .join("")
                }

            </div>


            <div class="library-card-actions">

                <button
                    type="button"
                    class="load-prompt"
                    data-id="${prompt.id}"
                >
                    Load
                </button>


                <button
                    type="button"
                    class="edit-prompt"
                    data-id="${prompt.id}"
                >
                    Edit
                </button>


                <button
                    type="button"
                    class="delete-prompt"
                    data-id="${prompt.id}"
                >
                    Delete
                </button>

            </div>
        `;


        libraryList.appendChild(
            card
        );
    });
}


// ==================================================
// ESCAPE HTML
// ==================================================

function escapeHtml(value) {

    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );
}


// ==================================================
// OPEN NEW PROMPT FORM
// ==================================================

if (newPromptButton) {

    newPromptButton.addEventListener(
        "click",
        () => {

            editingPromptId =
                null;


            document
                .getElementById(
                    "prompt-form-title"
                )
                .textContent =
                "Save Prompt";


            savePromptButton.textContent =
                "Save Prompt";


            clearPromptForm();


            promptFormPanel.classList.remove(
                "hidden"
            );


            promptFormPanel.scrollIntoView({
                behavior:
                    "smooth"
            });
        }
    );
}


// ==================================================
// CANCEL PROMPT FORM
// ==================================================

if (cancelPromptButton) {

    cancelPromptButton.addEventListener(
        "click",
        () => {

            promptFormPanel.classList.add(
                "hidden"
            );


            editingPromptId =
                null;


            clearPromptForm();
        }
    );
}


// ==================================================
// CLEAR PROMPT FORM
// ==================================================

function clearPromptForm() {

    document.getElementById(
        "library-prompt-name"
    ).value =
        "";

    document.getElementById(
        "library-prompt-category"
    ).value =
        "";

    document.getElementById(
        "library-prompt-description"
    ).value =
        "";

    document.getElementById(
        "library-prompt-tags"
    ).value =
        "";

    document.getElementById(
        "library-prompt-text"
    ).value =
        "";

    document.getElementById(
        "library-temperature"
    ).value =
        0.7;

    document.getElementById(
        "library-top-p"
    ).value =
        0.9;

    document.getElementById(
        "library-max-tokens"
    ).value =
        1000;
}


// ==================================================
// SAVE / UPDATE PROMPT
// ==================================================

if (savePromptButton) {

    savePromptButton.addEventListener(
        "click",
        async () => {

            const name =
                document
                    .getElementById(
                        "library-prompt-name"
                    )
                    .value
                    .trim();


            const category =
                document
                    .getElementById(
                        "library-prompt-category"
                    )
                    .value;


            const description =
                document
                    .getElementById(
                        "library-prompt-description"
                    )
                    .value
                    .trim();


            const tags =
                document
                    .getElementById(
                        "library-prompt-tags"
                    )
                    .value
                    .trim();


            const prompt =
                document
                    .getElementById(
                        "library-prompt-text"
                    )
                    .value
                    .trim();


            if (!name) {

                alert(
                    "Please enter a prompt name."
                );

                return;
            }


            if (!prompt) {

                alert(
                    "Please enter the prompt text."
                );

                return;
            }


            const data = {

                name:
                    name,

                description:
                    description,

                category:
                    category,

                tags:
                    tags,

                prompt:
                    prompt,

                parameters: {
                    temperature: parseFloat(
                        document
                            .getElementById(
                                "library-temperature"
                            )
                            .value
                    ),

                    top_p: parseFloat(
                        document
                            .getElementById(
                                "library-top-p"
                            )
                            .value
                    ),

                    max_tokens: parseInt(
                        document
                            .getElementById(
                                "library-max-tokens"
                            )
                            .value
                    )
                }
            };


            savePromptButton.disabled =
                true;

            savePromptButton.textContent =
                "Saving...";


            const wasEditing =
                Boolean(
                    editingPromptId
                );


            try {

                if (wasEditing) {

                    await updatePrompt(
                        editingPromptId,
                        data
                    );

                } else {

                    await createPrompt(
                        data
                    );
                }


                promptFormPanel.classList.add(
                    "hidden"
                );


                editingPromptId =
                    null;


                clearPromptForm();


                await loadPromptLibrary();

            } catch (error) {

                alert(
                    error.message
                );

            } finally {

                savePromptButton.disabled =
                    false;

                savePromptButton.textContent =
                    "Save Prompt";
            }
        }
    );
}


// ==================================================
// LOAD / EDIT / DELETE PROMPT
// ==================================================

if (libraryList) {

    libraryList.addEventListener(
        "click",
        async event => {

            const button =
                event.target.closest(
                    "button"
                );


            if (!button) {
                return;
            }


            const id =
                Number(
                    button.dataset.id
                );


            const prompt =
                libraryPrompts.find(
                    item =>
                        item.id === id
                );


            if (!prompt) {
                return;
            }


            // ==========================================
            // LOAD PROMPT INTO PLAYGROUND
            // ==========================================

            if (
                button.classList.contains(
                    "load-prompt"
                )
            ) {

                document.getElementById(
                    "prompt-input"
                ).value =
                    prompt.prompt;


                document.getElementById(
                    "temperature"
                ).value =
                    prompt.parameters?.temperature ??
                    0.7;


                document.getElementById(
                    "temperature-value"
                ).textContent =
                    prompt.parameters?.temperature ??
                    0.7;


                document.getElementById(
                    "top-p"
                ).value =
                    prompt.parameters?.top_p ??
                    0.9;


                document.getElementById(
                    "top-p-value"
                ).textContent =
                    prompt.parameters?.top_p ??
                    0.9;


                document.getElementById(
                    "max-tokens"
                ).value =
                    prompt.parameters?.max_tokens ??
                    1000;


                document.getElementById(
                    "max-tokens-value"
                ).textContent =
                    prompt.parameters?.max_tokens ??
                    1000;


                updatePromptStats();


                // Switch to Playground

                document
                    .querySelectorAll(
                        ".nav-item"
                    )
                    .forEach(item => {

                        item.classList.remove(
                            "active"
                        );
                    });


                const playgroundNav =
                    document.querySelector(
                        '[data-screen="playground"]'
                    );


                if (playgroundNav) {

                    playgroundNav.classList.add(
                        "active"
                    );
                }


                document
                    .querySelectorAll(
                        ".screen"
                    )
                    .forEach(section => {

                        section.classList.remove(
                            "active"
                        );
                    });


                const playgroundScreen =
                    document.getElementById(
                        "playground-screen"
                    );


                if (playgroundScreen) {

                    playgroundScreen.classList.add(
                        "active"
                    );
                }


                updateScreenHeader(
                    "playground"
                );


                window.scrollTo({

                    top:
                        0,

                    behavior:
                        "smooth"
                });


                return;
            }


            // ==========================================
            // EDIT PROMPT
            // ==========================================

            if (
                button.classList.contains(
                    "edit-prompt"
                )
            ) {

                editingPromptId =
                    id;


                document
                    .getElementById(
                        "prompt-form-title"
                    )
                    .textContent =
                    "Edit Prompt";


                savePromptButton.textContent =
                    "Update Prompt";


                document.getElementById(
                    "library-prompt-name"
                ).value =
                    prompt.name || "";


                document.getElementById(
                    "library-prompt-category"
                ).value =
                    prompt.category || "";


                document.getElementById(
                    "library-prompt-description"
                ).value =
                    prompt.description || "";


                document.getElementById(
                    "library-prompt-tags"
                ).value =
                    prompt.tags || "";


                document.getElementById(
                    "library-prompt-text"
                ).value =
                    prompt.prompt || "";


                document.getElementById(
                    "library-temperature"
                ).value =
                    prompt.parameters?.temperature ??
                    0.7;


                document.getElementById(
                    "library-top-p"
                ).value =
                    prompt.parameters?.top_p ??
                    0.9;


                document.getElementById(
                    "library-max-tokens"
                ).value =
                    prompt.parameters?.max_tokens ??
                    1000;


                promptFormPanel.classList.remove(
                    "hidden"
                );


                promptFormPanel.scrollIntoView({
                    behavior:
                        "smooth"
                });


                return;
            }


            // ==========================================
            // DELETE PROMPT
            // ==========================================

            if (
                button.classList.contains(
                    "delete-prompt"
                )
            ) {

                const confirmed =
                    confirm(
                        `Delete "${prompt.name}"?`
                    );


                if (!confirmed) {
                    return;
                }


                try {

                    await deletePrompt(
                        id
                    );

                    await loadPromptLibrary();

                } catch (error) {

                    alert(
                        error.message
                    );
                }
            }
        }
    );
}


// ==================================================
// LIBRARY SEARCH
// ==================================================

const librarySearch =
    document.getElementById(
        "library-search"
    );

if (librarySearch) {

    librarySearch.addEventListener(
        "input",
        () => {

            filterLibrary();
        }
    );
}


// ==================================================
// LIBRARY CATEGORY FILTER
// ==================================================

const libraryCategoryFilter =
    document.getElementById(
        "library-category-filter"
    );

if (libraryCategoryFilter) {

    libraryCategoryFilter.addEventListener(
        "change",
        () => {

            filterLibrary();
        }
    );
}


// ==================================================
// FILTER LIBRARY
// ==================================================

function filterLibrary() {

    if (
        !librarySearch ||
        !libraryCategoryFilter
    ) {
        return;
    }


    const searchTerm =
        librarySearch.value
            .toLowerCase()
            .trim();


    const category =
        libraryCategoryFilter.value;


    const filtered =
        libraryPrompts.filter(
            prompt => {

                const matchesSearch =
                    !searchTerm ||

                    (prompt.name || "")
                        .toLowerCase()
                        .includes(
                            searchTerm
                        ) ||

                    (prompt.description || "")
                        .toLowerCase()
                        .includes(
                            searchTerm
                        ) ||

                    (prompt.tags || "")
                        .toLowerCase()
                        .includes(
                            searchTerm
                        ) ||

                    (prompt.prompt || "")
                        .toLowerCase()
                        .includes(
                            searchTerm
                        );


                const matchesCategory =
                    !category ||
                    prompt.category ===
                    category;


                return (
                    matchesSearch &&
                    matchesCategory
                );
            }
        );


    renderPromptLibrary(
        filtered
    );
}


// ==================================================
// EXECUTION HISTORY
// ==================================================

let executionHistory = [];


// ==================================================
// LOAD EXECUTION HISTORY
// ==================================================

async function loadExecutionHistory() {

    const historyList =
        document.getElementById(
            "history-list"
        );


    if (!historyList) {
        return;
    }


    historyList.innerHTML = `
        <div class="empty-state">
            Loading execution history...
        </div>
    `;


    try {

        const result =
            await getHistory();


        executionHistory =
            result.history || [];


        renderExecutionHistory(
            executionHistory
        );

    } catch (error) {

        console.error(
            "Failed to load execution history:",
            error
        );


        historyList.innerHTML = `
            <div class="error-message">

                Failed to load execution history.

                <br>

                ${escapeHtml(
                    error.message
                )}

            </div>
        `;
    }
}


// ==================================================
// RENDER EXECUTION HISTORY
// ==================================================

function renderExecutionHistory(
    history
) {

    const historyList =
        document.getElementById(
            "history-list"
        );


    if (!historyList) {
        return;
    }


    if (!history.length) {

        historyList.innerHTML = `
            <div class="empty-state">

                No execution history yet.

                <br>

                Generate a prompt from the
                Playground to see it here.

            </div>
        `;

        return;
    }


    historyList.innerHTML =
        history.map(
            execution => {

                const createdAt =
                    execution.created_at

                        ? new Date(
                            execution.created_at
                        ).toLocaleString()

                        : "Unknown date";


                const prompt =
                escapeHtml(
                    (execution.prompt || "").trim()
                );


                const response =
                    execution.response || "";


                const metrics =
                    execution.metrics || {};


                const parameters =
                    execution.parameters || {};


                return `

                    <div
                        class="history-card"
                        data-history-id="${execution.id}"
                    >


                        <!-- ==========================
                             HEADER
                             ========================== -->

                        <div class="history-card-header">

                            <div class="history-card-title">

                                Execution ${execution.id}

                            </div>


                            <div class="history-card-date">

                                ${escapeHtml(
                                    createdAt
                                )}

                            </div>

                        </div>


                        <!-- ==========================
                             PROMPT
                             ========================== -->

                        <div class="history-prompt-box">

                            <div class="history-section-label">Prompt</div>


                            <div class="history-prompt-text">${prompt}</div>

                        </div>


                        <!-- ==========================
                             RESPONSE
                             ========================== -->

                        <div class="history-response-box">

                            <div class="history-section-label">

                                Response

                            </div>


                            <div class="history-response-content">

                                ${
                                    typeof marked !==
                                    "undefined"

                                        ? marked.parse(
                                            response
                                        )

                                        : escapeHtml(
                                            response
                                        ).replace(
                                            /\n/g,
                                            "<br>"
                                        )
                                }

                            </div>

                        </div>


                        <!-- ==========================
                             METRICS
                             ========================== -->

                        <div class="history-metrics">

                            <span class="history-metric">

                                Prompt tokens:
                                ${metrics.prompt_tokens ?? 0}

                            </span>


                            <span class="history-metric">

                                Completion tokens:
                                ${metrics.completion_tokens ?? 0}

                            </span>


                            <span class="history-metric">

                                Total tokens:
                                ${metrics.total_tokens ?? 0}

                            </span>


                            <span class="history-metric">

                                Latency:
                                ${Number(
                                    metrics.latency_seconds ??
                                    0
                                ).toFixed(2)}s

                            </span>


                            <span class="history-metric">

                                Temperature:
                                ${parameters.temperature ?? 0.7}

                            </span>


                            <span class="history-metric">

                                Top-p:
                                ${parameters.top_p ?? 0.9}

                            </span>


                            <span class="history-metric">

                                Max tokens:
                                ${parameters.max_tokens ?? 1000}

                            </span>

                        </div>


                        <!-- ==========================
                             ACTIONS
                             ========================== -->

                        <div class="history-card-actions">

                            <button
                                type="button"
                                class="load-history"
                                data-id="${execution.id}"
                            >
                                Load Prompt
                            </button>

                            <button
                                type="button"
                                class="rerun-history"
                                data-id="${execution.id}"
                            >
                                Re-run
                            </button>


                            <button
                                type="button"
                                class="copy-history"
                                data-id="${execution.id}"
                            >
                                Copy Response
                            </button>

                        </div>

                    </div>

                `;
            }
        ).join("");


    attachHistoryActions();
}


// ==================================================
// HISTORY ACTIONS
// ==================================================

function attachHistoryActions() {


    // ==================================================
    // LOAD PROMPT
    // ==================================================

    document
        .querySelectorAll(
            ".load-history"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const id =
                        Number(
                            button.dataset.id
                        );


                    const execution =
                        executionHistory.find(
                            item =>
                                item.id ===
                                id
                        );


                    if (!execution) {
                        return;
                    }


                    // ----------------------------------
                    // Load prompt
                    // ----------------------------------

                    const promptInput =
                        document.getElementById(
                            "prompt-input"
                        );


                    if (promptInput) {

                        promptInput.value =
                            execution.prompt ||
                            "";

                        updatePromptStats();
                    }


                    // ----------------------------------
                    // Load system prompt
                    // ----------------------------------

                    const systemPrompt =
                        document.getElementById(
                            "system-prompt"
                        );


                    if (systemPrompt) {

                        systemPrompt.value =
                            execution.system_prompt ||
                            "";
                    }


                    // ----------------------------------
                    // Load temperature
                    // ----------------------------------

                    const temperature =
                        document.getElementById(
                            "temperature"
                        );


                    const temperatureValue =
                        document.getElementById(
                            "temperature-value"
                        );


                    if (temperature) {

                        temperature.value =
                            execution.parameters
                                ?.temperature ??
                            0.7;
                    }


                    if (temperatureValue) {

                        temperatureValue.textContent =
                            execution.parameters
                                ?.temperature ??
                            0.7;
                    }


                    // ----------------------------------
                    // Load top-p
                    // ----------------------------------

                    const topP =
                        document.getElementById(
                            "top-p"
                        );


                    const topPValue =
                        document.getElementById(
                            "top-p-value"
                        );


                    if (topP) {

                        topP.value =
                            execution.parameters
                                ?.top_p ??
                            0.9;
                    }


                    if (topPValue) {

                        topPValue.textContent =
                            execution.parameters
                                ?.top_p ??
                            0.9;
                    }


                    // ----------------------------------
                    // Load max tokens
                    // ----------------------------------

                    const maxTokens =
                        document.getElementById(
                            "max-tokens"
                        );


                    const maxTokensValue =
                        document.getElementById(
                            "max-tokens-value"
                        );


                    if (maxTokens) {

                        maxTokens.value =
                            execution.parameters
                                ?.max_tokens ??
                            1000;
                    }


                    if (maxTokensValue) {

                        maxTokensValue.textContent =
                            execution.parameters
                                ?.max_tokens ??
                            1000;
                    }


                    // ==================================
                    // SWITCH TO PLAYGROUND
                    // ==================================

                    document
                        .querySelectorAll(
                            ".nav-item"
                        )
                        .forEach(item => {

                            item.classList.remove(
                                "active"
                            );
                        });


                    const playgroundNav =
                        document.querySelector(
                            '[data-screen="playground"]'
                        );


                    if (playgroundNav) {

                        playgroundNav.classList.add(
                            "active"
                        );
                    }

                    document
                        .querySelectorAll(
                            ".screen"
                        )
                        .forEach(section => {

                            section.classList.remove(
                                "active"
                            );
                        });


                    const playgroundScreen =
                        document.getElementById(
                            "playground-screen"
                        );


                    if (playgroundScreen) {

                        playgroundScreen.classList.add(
                            "active"
                        );
                    }


                    updateScreenHeader(
                        "playground"
                    );


                    window.scrollTo({

                        top:
                            0,

                        behavior:
                            "smooth"
                    });
                }
            );
        });


    document
        .querySelectorAll(
            ".rerun-history"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const card =
                        button.closest(
                            ".history-card"
                        );

                    card.querySelector(
                        ".load-history"
                    ).click();

                    generateButton.click();
                }
            );
        });


    // ==================================================
    // COPY RESPONSE
    // ==================================================

    document
        .querySelectorAll(
            ".copy-history"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                async () => {

                    const id =
                        Number(
                            button.dataset.id
                        );


                    const execution =
                        executionHistory.find(
                            item =>
                                item.id ===
                                id
                        );


                    if (!execution) {
                        return;
                    }


                    try {

                        await navigator.clipboard.writeText(
                            execution.response ||
                            ""
                        );


                        const originalText =
                            button.textContent;


                        button.textContent =
                            "Copied!";


                        setTimeout(() => {

                            button.textContent =
                                originalText;

                        }, 1200);

                    } catch (error) {

                        console.error(
                            "Failed to copy response:",
                            error
                        );
                    }
                }
            );
        });
}


// ==================================================
// HISTORY SEARCH
// ==================================================

const historySearch =
    document.getElementById(
        "history-search"
    );


if (historySearch) {

    historySearch.addEventListener(
        "input",
        () => {

            const searchTerm =
                historySearch.value
                    .toLowerCase()
                    .trim();


            if (!searchTerm) {

                renderExecutionHistory(
                    executionHistory
                );

                return;
            }


            const filteredHistory =
                executionHistory.filter(
                    execution => {

                        const prompt =
                            (
                                execution.prompt ||
                                ""
                            ).toLowerCase();


                        const response =
                            (
                                execution.response ||
                                ""
                            ).toLowerCase();


                        return (

                            prompt.includes(
                                searchTerm
                            )

                            ||

                            response.includes(
                                searchTerm
                            )

                        );
                    }
                );


            renderExecutionHistory(
                filteredHistory
            );
        }
    );
}


// ==================================================
// REFRESH HISTORY
// ==================================================

const refreshHistoryButton =
    document.getElementById(
        "refresh-history-button"
    );


if (refreshHistoryButton) {

    refreshHistoryButton.addEventListener(
        "click",
        async () => {

            refreshHistoryButton.disabled =
                true;


            refreshHistoryButton.textContent =
                "Refreshing...";


            try {

                await loadExecutionHistory();

            } finally {

                refreshHistoryButton.disabled =
                    false;

                refreshHistoryButton.textContent =
                    "Refresh";
            }
        }
    );
}

// ==================================================
// OUTPUT PARSER
// ==================================================

const parseOutputButton =
    document.getElementById("parse-output-button");

const validateOutputButton =
    document.getElementById("validate-output-button");

const parserFormat =
    document.getElementById("parser-format");

const jsonSchema =
    document.getElementById("json-schema");

const parsedOutput =
    document.getElementById("parsed-output");

const parserStatus =
    document.getElementById("parser-status");


// --------------------------------------------------
// Parse Output
// --------------------------------------------------

if (parseOutputButton) {

    parseOutputButton.addEventListener("click", () => {

        const response =
            window.lastAIResponse || "";

        if (!response.trim()) {

            parserStatus.textContent =
                "Generate an AI response first.";

            parserStatus.className =
                "parser-status error";

            return;
        }


        let format =
            parserFormat.value;


        // Auto detect format
        if (format === "auto") {
            format = detectOutputFormat(response);
        }


        // Clear previous result
        parsedOutput.innerHTML = "";

        try {

            // -------------------------------
            // JSON
            // -------------------------------

            if (format === "json") {

                const result =
                    parseJSONOutput(response);

                if (!result.success) {
                    throw new Error(result.message);
                }

                const pre =
                    document.createElement("pre");

                pre.textContent =
                    result.formatted;

                parsedOutput.appendChild(pre);

                parserStatus.textContent =
                    "JSON parsed successfully.";

                parserStatus.className =
                    "parser-status success";

                return;
            }


            // -------------------------------
            // Markdown Table
            // -------------------------------

            if (format === "table") {

                const result =
                    parseMarkdownTable(response);

                if (!result.success) {
                    throw new Error(result.message);
                }


                const table =
                    document.createElement("table");

                table.className =
                    "parsed-table";


                // Header
                const thead =
                    document.createElement("thead");

                const headerRow =
                    document.createElement("tr");


                result.headers.forEach(header => {

                    const th =
                        document.createElement("th");

                    th.textContent =
                        header;

                    headerRow.appendChild(th);

                });

                thead.appendChild(headerRow);
                table.appendChild(thead);


                // Body
                const tbody =
                    document.createElement("tbody");


                result.rows.forEach(row => {

                    const tr =
                        document.createElement("tr");


                    row.forEach(cell => {

                        const td =
                            document.createElement("td");

                        td.textContent =
                            cell;

                        tr.appendChild(td);

                    });


                    tbody.appendChild(tr);

                });


                table.appendChild(tbody);
                parsedOutput.appendChild(table);


                parserStatus.textContent =
                    "Markdown table parsed successfully.";

                parserStatus.className =
                    "parser-status success";

                return;
            }


            // -------------------------------
            // Code Blocks
            // -------------------------------

            if (format === "code") {

                const blocks =
                    extractCodeBlocks(response);


                if (!blocks.length) {
                    throw new Error(
                        "No code blocks were found."
                    );
                }


                blocks.forEach(block => {

                    const container =
                        document.createElement("div");

                    container.className =
                        "parsed-code-block";


                    const header =
                        document.createElement("div");

                    header.className =
                        "parsed-code-header";


                    const language =
                        document.createElement("span");

                    language.textContent =
                        block.language;


                    const copyButton =
                        document.createElement("button");

                    copyButton.textContent =
                        "Copy";


                    copyButton.addEventListener(
                        "click",
                        async () => {

                            await navigator.clipboard.writeText(
                                block.code
                            );

                            copyButton.textContent =
                                "Copied!";

                            setTimeout(() => {

                                copyButton.textContent =
                                    "Copy";

                            }, 1500);

                        }
                    );


                    header.appendChild(language);
                    header.appendChild(copyButton);


                    const pre =
                        document.createElement("pre");

                    const code =
                        document.createElement("code");

                    code.textContent =
                        block.code;

                    pre.appendChild(code);


                    container.appendChild(header);
                    container.appendChild(pre);

                    parsedOutput.appendChild(container);

                });


                parserStatus.textContent =
                    `${blocks.length} code block(s) detected.`;

                parserStatus.className =
                    "parser-status success";

                return;
            }


            // -------------------------------
            // List
            // -------------------------------

            if (format === "list") {

                const items =
                    extractListItems(response);


                if (!items.length) {
                    throw new Error(
                        "No list items were found."
                    );
                }


                const list =
                    document.createElement("ul");

                list.className =
                    "parsed-list";


                items.forEach(item => {

                    const li =
                        document.createElement("li");

                    li.textContent =
                        item;

                    list.appendChild(li);

                });


                parsedOutput.appendChild(list);


                parserStatus.textContent =
                    `${items.length} list item(s) extracted.`;

                parserStatus.className =
                    "parser-status success";

                return;
            }


            // -------------------------------
            // Normal Text
            // -------------------------------

            parsedOutput.innerHTML =
                typeof marked !== "undefined"
                    ? marked.parse(response)
                    : escapeParserHtml(response)
                        .replace(/\n/g, "<br>");


            parserStatus.textContent =
                "Output displayed as text.";

            parserStatus.className =
                "parser-status success";

        } catch (error) {

            parsedOutput.innerHTML = `
                <div class="error-message">
                    ${escapeParserHtml(error.message)}
                </div>
            `;

            parserStatus.textContent =
                "Parsing failed.";

            parserStatus.className =
                "parser-status error";
        }

    });

}


// --------------------------------------------------
// Validate JSON
// --------------------------------------------------

if (validateOutputButton) {

    validateOutputButton.addEventListener("click", () => {

        const response =
            window.lastAIResponse || "";

        if (!response.trim()) {

            parserStatus.textContent =
                "Generate an AI response first.";

            parserStatus.className =
                "parser-status error";

            return;
        }


        const jsonResult =
            parseJSONOutput(response);


        if (!jsonResult.success) {

            parserStatus.textContent =
                jsonResult.message;

            parserStatus.className =
                "parser-status error";

            return;
        }


        const validation =
            validateJSONSchema(
                jsonResult.data,
                jsonSchema.value
            );


        parserStatus.textContent =
            validation.message;

        parserStatus.className =
            validation.success
                ? "parser-status success"
                : "parser-status error";

    });

}


// ==================================================
// PROMPT TECHNIQUES
// ==================================================

function addExampleRow(inputValue = "", outputValue = "") {

    if (!exampleRows || exampleRows.children.length >= 5) {
        return;
    }

    const row = document.createElement("div");
    row.className = "example-row";
    row.innerHTML = `
        <button type="button" class="remove-example-button">Remove</button>
        <label>Example ${exampleRows.children.length + 1} Input</label>
        <input type="text" class="few-shot-input" placeholder="Input" value="${escapeHtml(inputValue)}">
        <label>Example ${exampleRows.children.length + 1} Output</label>
        <input type="text" class="few-shot-output" placeholder="Output" value="${escapeHtml(outputValue)}">
    `;

    row.querySelector(".remove-example-button").addEventListener("click", () => {
        row.remove();
        updateExampleLabels();
    });

    exampleRows.appendChild(row);
}

function updateExampleLabels() {
    if (!exampleRows) {
        return;
    }

    Array.from(exampleRows.children).forEach((row, index) => {
        const labels = row.querySelectorAll("label");
        labels[0].textContent = `Example ${index + 1} Input`;
        labels[1].textContent = `Example ${index + 1} Output`;
    });
}

function getFewShotExamples() {

    if (!exampleRows) {
        return "";
    }

    return Array.from(exampleRows.children)
        .map((row, index) => {
            const input = row.querySelector(".few-shot-input").value.trim();
            const output = row.querySelector(".few-shot-output").value.trim();

            if (!input && !output) {
                return "";
            }

            return `Example ${index + 1}:\nInput: ${input}\nOutput: ${output}`;
        })
        .filter(Boolean)
        .join("\n\n");
}

function updateTechniqueUI() {

    const technique = techniqueSelect ? techniqueSelect.value : "";
    const info = techniqueInfo[technique];

    techniqueDetails.innerHTML = info
        ? `<strong>${info.title}</strong><br>${info.description}<br><span>Use: ${info.use}</span>`
        : "Select a technique to see how it applies to the current prompt.";

    fewShotExamples.classList.toggle("hidden", technique !== "Few-Shot");
    negativePromptingControls.classList.toggle("hidden", technique !== "Negative Prompting");
    selfConsistencyControls.classList.toggle("hidden", technique !== "Self-Consistency");

    if (technique === "Few-Shot" && exampleRows.children.length === 0) {
        addExampleRow();
        addExampleRow();
    }
}

if (techniqueSelect) {
    techniqueSelect.addEventListener("change", updateTechniqueUI);
}

if (addExampleButton) {
    addExampleButton.addEventListener("click", () => addExampleRow());
}

if (selfConsistencyRuns) {
    selfConsistencyRuns.addEventListener("input", () => {
        selfConsistencyRunsValue.textContent = selfConsistencyRuns.value;
    });
}
