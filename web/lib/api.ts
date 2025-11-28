const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const api = {
  async handleResponse(response: Response) {
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Something went wrong');
    }
    return response.json();
  },

  async get(endpoint: string, token?: string) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'GET',
      headers,
    });

    return this.handleResponse(response);
  },

  async post(endpoint: string, data: any, token?: string) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    return this.handleResponse(response);
  },

  async put(endpoint: string, data: any, token?: string) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });

    return this.handleResponse(response);
  },

  // Campaigns & Surveys
  async createCampaign(data: any, token: string) {
    return this.post('/campaigns', data, token);
  },

  async getSurveyBySlug(slug: string) {
    return this.get(`/campaigns/public/${slug}`);
  },

  async submitResponse(slug: string, answers: any) {
    return this.post(`/campaigns/public/${slug}/response`, { answers });
  },

  async getCampaignResponses(id: string, token: string) {
    return this.get(`/campaigns/${id}/responses`, token);
  },

  async getCampaigns(workspaceId: string, token: string) {
    return this.get(`/campaigns?workspaceId=${workspaceId}`, token);
  },

  async getCampaign(id: string, token: string) {
    return this.get(`/campaigns/${id}`, token);
  },

  // Context
  async getContext(workspaceId: string, token: string) {
    return this.get(`/context?workspaceId=${workspaceId}`, token);
  },

  async updateContext(workspaceId: string, businessContext: string, token: string) {
    return this.put("/context", { businessContext, workspaceId }, token);
  },

  async uploadDocument(workspaceId: string, file: File, token: string) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("workspaceId", workspaceId);
    
    const response = await fetch(`${API_URL}/context/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
    return this.handleResponse(response);
  },

  // Settings
  async updateUser(data: any, token: string) {
    return this.put("/auth/me", data, token);
  },

  async updateWorkspace(id: string, name: string, token: string) {
    return this.put(`/workspaces/${id}`, { name }, token);
  },

  async createWorkspace(name: string, token: string) {
    return this.post("/workspaces", { name }, token);
  },

  async getWorkspaceMembers(id: string, token: string) {
    return this.get(`/workspaces/${id}/members`, token);
  },

  async addMember(workspaceId: string, email: string, token: string) {
    return this.post(`/workspaces/${workspaceId}/members`, { email }, token);
  },

  // AI Integration
  async analyzeContext(contextText: string, token: string) {
    return this.post('/ai/analyze-context', { contextText }, token);
  },

  async generateStrategy(contextSummary: any, token: string) {
    return this.post('/ai/generate-strategy', { contextSummary }, token);
  },

  async generateSurvey(contextSummary: any, strategy: any, token: string) {
    return this.post('/ai/generate-survey', { contextSummary, strategy }, token);
  },
};
