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
                instruction: instruction,
                mode: "agent"
            }, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
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
                    'Authorization': `Bearer ${this.apiKey}`
                }
            });
            return response.data;
        } catch (error) {
            console.error("Manus API Error:", error);
            return null;
        }
    }
}

module.exports = new ManusService();
