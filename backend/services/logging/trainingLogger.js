const fs = require('fs');
const path = require('path');

class TrainingLogger {
    constructor() {
        // storage location: backend/data/training/dataset.jsonl
        this.logDir = path.join(__dirname, '..', '..', 'data', 'training');
        this.logFile = path.join(this.logDir, 'dataset.jsonl');

        // Ensure directory exists
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }

    /**
     * Logs a training example (Input Prompt + Output Completion)
     * @param {string} taskType - e.g., "GENERATE_STRATEGY", "GENERATE_SURVEY"
     * @param {object} inputContext - The context object passed to the AI
     * @param {object} outputResult - The JSON result from the AI
     * @param {string} modelUsed - e.g., "gpt-4o"
     */
    async log(taskType, inputContext, outputResult, modelUsed) {
        const entry = {
            timestamp: new Date().toISOString(),
            taskType,
            model: modelUsed,
            messages: [
                { role: "user", content: JSON.stringify(inputContext) },
                { role: "assistant", content: JSON.stringify(outputResult) }
            ]
        };

        const jsonLine = JSON.stringify(entry) + '\n';

        try {
            // Append asynchronously
            await fs.promises.appendFile(this.logFile, jsonLine, 'utf8');
            // console.log(`[TrainingLogger] Saved ${taskType} example.`);
        } catch (error) {
            console.error(`[TrainingLogger] Failed to save log:`, error);
        }
    }
}

module.exports = new TrainingLogger();
