import axios, { AxiosInstance } from 'axios';

export interface CustomContext {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  subContexts: any[];
  createdAt: number;
  updatedAt: number;
}

export interface CreateContextData {
  name: string;
  description?: string;
  icon?: string;
  sub_contexts: any[];
}

export interface UpdateContextData {
  name?: string;
  description?: string;
  icon?: string;
  sub_contexts?: any[];
}

class ContextsAPI {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: '/api/contexts',
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  async getAllContexts(): Promise<CustomContext[]> {
    const response = await this.client.get<CustomContext[]>('/');
    return response.data;
  }

  async getContext(id: string): Promise<CustomContext> {
    const response = await this.client.get<CustomContext>(`/${id}`);
    return response.data;
  }

  async createContext(data: CreateContextData): Promise<CustomContext> {
    const response = await this.client.post<CustomContext>('/', data);
    return response.data;
  }

  async updateContext(id: string, data: UpdateContextData): Promise<CustomContext> {
    const response = await this.client.put<CustomContext>(`/${id}`, data);
    return response.data;
  }

  async deleteContext(id: string): Promise<{ message: string }> {
    const response = await this.client.delete(`/${id}`);
    return response.data;
  }

  async bulkCreateContexts(contexts: any[]): Promise<{ message: string; contexts: CustomContext[] }> {
    const response = await this.client.post('/bulk', { contexts });
    return response.data;
  }
}

export const contextsAPI = new ContextsAPI();
