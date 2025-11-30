import axios, { AxiosInstance } from 'axios';

export interface UserPreferences {
  font_size: number;
  theme_id: string;
  custom_themes: any[] | null;
  selected_model: string | null;
  context_selection: { contextId?: string; subContextId?: string } | null;
  context_order: string[] | null;
  language_primary: string | null;
  language_secondary: string | null;
  preferences_json: any | null;
  api_key_set: boolean;
}

export interface UpdatePreferencesData {
  font_size?: number;
  theme_id?: string;
  custom_themes?: any[] | null;
  selected_model?: string | null;
  context_selection?: { contextId?: string; subContextId?: string } | null;
  context_order?: string[] | null;
  language_primary?: string | null;
  language_secondary?: string | null;
  preferences_json?: any | null;
}

class PreferencesAPI {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: '/api/preferences',
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  async getPreferences(): Promise<UserPreferences> {
    const response = await this.client.get<UserPreferences>('/');
    return response.data;
  }

  async updatePreferences(data: UpdatePreferencesData): Promise<{ message: string; preferences: UserPreferences }> {
    const response = await this.client.put('/', data);
    return response.data;
  }

  async setApiKey(apiKey: string): Promise<{ message: string }> {
    const response = await this.client.post('/api-key', { api_key: apiKey });
    return response.data;
  }

  async getApiKey(): Promise<string> {
    const response = await this.client.get<{ api_key: string }>('/api-key');
    return response.data.api_key;
  }

  async deleteApiKey(): Promise<{ message: string }> {
    const response = await this.client.delete('/api-key');
    return response.data;
  }
}

export const preferencesAPI = new PreferencesAPI();
