import axios, { AxiosInstance } from 'axios';

export interface UserProfile {
  id: string;
  name: string;
  language_profile: any;
  generation_settings: any;
  created_at: number;
  updated_at: number;
}

export interface CreateProfileData {
  name: string;
  language_profile: any;
  generation_settings: any;
}

export interface UpdateProfileData {
  name?: string;
  language_profile?: any;
  generation_settings?: any;
}

class ProfilesAPI {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: '/api/profiles',
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  async getAllProfiles(): Promise<UserProfile[]> {
    const response = await this.client.get<UserProfile[]>('/');
    return response.data;
  }

  async getProfile(id: string): Promise<UserProfile> {
    const response = await this.client.get<UserProfile>(`/${id}`);
    return response.data;
  }

  async createProfile(data: CreateProfileData): Promise<UserProfile> {
    const response = await this.client.post<UserProfile>('/', data);
    return response.data;
  }

  async updateProfile(id: string, data: UpdateProfileData): Promise<UserProfile> {
    const response = await this.client.put<UserProfile>(`/${id}`, data);
    return response.data;
  }

  async deleteProfile(id: string): Promise<{ message: string }> {
    const response = await this.client.delete(`/${id}`);
    return response.data;
  }

  async bulkCreateProfiles(profiles: any[]): Promise<{ message: string; profiles: UserProfile[] }> {
    const response = await this.client.post('/bulk', { profiles });
    return response.data;
  }
}

export const profilesAPI = new ProfilesAPI();
