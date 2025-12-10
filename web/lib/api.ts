const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const api = {
  async handleResponse(response: Response) {
    if (!response.ok) {
      const error = await response.json();
      const errorMessage = error.details 
        ? `${error.message}: ${JSON.stringify(error.details)}` 
        : (error.message || 'Something went wrong');
      throw new Error(errorMessage);
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

  async submitResponse(slug: string, answers: any, metadata?: any) {
    return this.post(`/campaigns/public/${slug}/response`, { answers, metadata });
  },

  async getCampaignResponses(id: string, token: string) {
    return this.get(`/campaigns/${id}/responses`, token);
  },

  async getCampaignAnalytics(id: string, token: string) {
    return this.get(`/campaigns/${id}/analytics`, token);
  },

  async getCampaigns(workspaceId: string, token: string) {
    return this.get(`/campaigns?workspaceId=${workspaceId}`, token);
  },

  async getCampaign(id: string, token: string) {
    return this.get(`/campaigns/${id}`, token);
  },

  async deleteCampaign(id: string, token: string) {
    const response = await fetch(`${API_URL}/campaigns/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    return this.handleResponse(response);
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

  async clearContext(workspaceId: string, token: string) {
    const response = await fetch(`${API_URL}/context`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ workspaceId })
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

  async getWorkspace(id: string, token: string) {
      return this.get(`/workspaces/${id}`, token);
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

  async getDashboardStats(workspaceId: string, token: string) {
    return this.get(`/workspaces/dashboard?workspaceId=${workspaceId}`, token);
  },

  async getWorkspaceHealth(workspaceId: string, token: string) {
    return this.get(`/workspaces/${workspaceId}/health`, token);
  },

  // Domains
  async addDomain(workspaceId: string, domain: string, token: string) {
    return this.post(`/workspaces/${workspaceId}/domains`, { domain }, token);
  },

  async getDomains(workspaceId: string, token: string) {
    return this.get(`/workspaces/${workspaceId}/domains`, token);
  },

  async verifyDomain(workspaceId: string, domainId: string, token: string) {
    return this.post(`/workspaces/${workspaceId}/domains/${domainId}/verify`, {}, token);
  },

  async deleteDomain(workspaceId: string, domainId: string, token: string) {
    const response = await fetch(`${API_URL}/workspaces/${workspaceId}/domains/${domainId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    });
    return this.handleResponse(response);
  },

  // AI Integration
  async analyzeContext(contextText: string, token: string, workspaceId?: string, recommendations?: string[]) {
    return this.post('/ai/analyze-context', { contextText, workspaceId, recommendations }, token);
  },

  async chat(message: string | any[], context: string, token: string) {
    const payload = Array.isArray(message) ? { messages: message, context } : { message, context };
    return this.post('/campaigns/chat', payload, token);
  },

  async generateStrategy(contextSummary: any, token: string, workspaceId?: string) {
    return this.post('/ai/generate-strategy', { contextSummary, workspaceId }, token);
  },

  async generateSurvey(contextSummary: any, strategy: any, userInstruction: string = "", token: string) {
    return this.post('/ai/generate-survey', { contextSummary, strategy, userInstruction }, token);
  },

  async chatWithContext(context: string, messages: any[], workspaceId: string, token: string) {
    return this.post('/ai/chat', { context, messages, workspaceId }, token);
  },

  async analyzeCompetitor(competitorName: string, industry: string, token: string) {
    return this.post('/ai/analyze-competitor', { competitorName, industry }, token);
  },

  async generateTheme(prompt: string, token: string) {
    return this.post('/ai/generate-theme', { prompt }, token);
  },

  async generateGapAnalysis(workspaceId: string, token: string) {
    return this.post('/ai/generate-gap-analysis', { workspaceId }, token);
  },

  async updateSurvey(campaignId: string, data: any, token: string) {
    return this.put(`/campaigns/${campaignId}/survey`, data, token);
  },

  async generateInsights(campaignId: string, token: string) {
    return this.post(`/campaigns/${campaignId}/insights`, {}, token);
  },

  async getInsights(campaignId: string, token: string) {
    return this.get(`/campaigns/${campaignId}/insights`, token);
  },
};
