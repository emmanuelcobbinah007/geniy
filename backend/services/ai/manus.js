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
            const response = await axios.post(`${this.baseUrl}/tasks`, {
                prompt: instruction, // Changed from instruction to prompt
                mode: "agent"
            }, {
                headers: {
                    'API_KEY': this.apiKey, // Changed from X-API-Key
                    'Content-Type': 'application/json'
                }
            });
            return response.data;
        } catch (error) {
            console.error("Manus API Error:", error);
            // Don't throw, just return null so we don't break the main flow if agent fails
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
            console.error("Manus API Error:", error);
            return null;
        }
    }
    async runTask(instruction) {
        const task = await this.createTask(instruction);
        if (!task || !task.id) return null;

        // Poll for result
        let attempts = 0;
        const maxAttempts = 30; // 30 * 2s = 60s timeout

        while (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            const result = await this.getTaskResult(task.id);

            if (result && result.status === 'completed') {
                return result.output; // Assuming output contains the data
            }
            if (result && result.status === 'failed') {
                console.error("Manus Task Failed:", result.error);
                return null;
            }
            attempts++;
        }
        return null; // Timeout
    }
}

module.exports = new ManusService();
