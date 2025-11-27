const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const api = {
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

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Something went wrong');
    }

    return response.json();
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

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Something went wrong');
    }

    return response.json();
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
  }
};
