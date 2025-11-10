import apiClient from './api';
import type { UserRegistrationRequest, UserLoginRequest, AuthenticationResponse, UserProfileResponse } from '../types';

export const authService = {
  /**
   * Register a new user
   */
  async register(data: UserRegistrationRequest): Promise<AuthenticationResponse> {
    const response = await apiClient.post<AuthenticationResponse>('/users/register', data);
    if (response.data.token) {
      localStorage.setItem('auth_token', response.data.token);
    }
    return response.data;
  },

  /**
   * Login user
   */
  async login(data: UserLoginRequest): Promise<AuthenticationResponse> {
    const response = await apiClient.post<AuthenticationResponse>('/users/login', data);
    if (response.data.token) {
      localStorage.setItem('auth_token', response.data.token);
    }
    return response.data;
  },

  /**
   * Logout user
   */
  logout(): void {
    localStorage.removeItem('auth_token');
  },

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<UserProfileResponse> {
    const response = await apiClient.get<UserProfileResponse>('/users/me');
    return response.data;
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem('auth_token');
  },

  /**
   * Get auth token
   */
  getToken(): string | null {
    return localStorage.getItem('auth_token');
  },
};

