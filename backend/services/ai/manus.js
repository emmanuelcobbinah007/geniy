const axios = require('axios');

class ManusService {
    constructor() {
        this.apiKey = process.env.MANUS_API_KEY;
        this.baseUrl = 'https://api.manus.ai/v1'; // Placeholder URL, verify actual endpoint
    }

    async createTask(instruction) {
        if (!this.apiKey) {
            console.warn("Manus API Key missing. Skipping agentic task.");
            return null;
        }

        try {
            console.log("Creating Manus Task with prompt:", instruction.substring(0, 50) + "...");
            const response = await axios.post(`${this.baseUrl}/tasks`, {
                prompt: instruction,
                taskMode: "agent",
                agentProfile: "speed" // Changed to speed for free tier
            }, {
                headers: {
                    'API_KEY': this.apiKey, // Changed from X-API-Key
                    'Content-Type': 'application/json'
                }
            });
            console.log("Manus Task Created:", response.data);
            return response.data;
        } catch (error) {
            console.error("Manus Create Task Error:", error.response ? error.response.data : error.message);
            return null;
        }
    }

    async getTaskResult(taskId) {
        try {
            const response = await axios.get(`${this.baseUrl}/tasks/${taskId}`, {
                headers: {
                    'API_KEY': this.apiKey // Changed from X-API-Key
                }
            });
            return response.data;
        } catch (error) {
            console.error(`Manus Get Task Error for ${taskId}:`, error.response ? error.response.data : error.message);
            return null;
        }
    }
    async runTask(instruction) {
        const task = await this.createTask(instruction);
        if (!task || !task.task_id) return null;

        // Poll for result
        let attempts = 0;
        const maxAttempts = 60; // 60 * 2s = 120s timeout

        while (attempts < maxAttempts) {
            // Wait longer for the first attempt to allow task propagation
            const delay = attempts === 0 ? 5000 : 2000;
            await new Promise(resolve => setTimeout(resolve, delay));
            const result = await this.getTaskResult(task.task_id);

            if (result && result.status === 'completed') {
                let outputStr = "";
                if (typeof result.output === 'string') {
                    outputStr = result.output;
                } else if (typeof result.output === 'object') {
                    outputStr = JSON.stringify(result.output);
                } else {
                    outputStr = String(result.output);
                }

                console.log("Manus Task Completed. Output:", outputStr.substring(0, 100) + "...");
                return outputStr;
            }
            if (result && result.status === 'failed') {
                console.error("Manus Task Failed:", result.error);
                return null;
            }
            if (attempts % 5 === 0) console.log(`Manus Polling Attempt ${attempts}/${maxAttempts}... Status: ${result ? result.status : 'Unknown'}`);
            attempts++;
        }
        return null; // Timeout
    }
}

module.exports = new ManusService();
