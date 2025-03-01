import { axiosInstance } from './axiosInstance';

export interface User {
  id: string;
  email: string;
  name: string;
}

interface SessionData {
  token: string;
  expiryTime: number;
  user: User;
}

class AuthService {
  private readonly TOKEN_KEY = import.meta.env.VITE_TOKEN_KEY || 'pdf_manager_auth_token';
  private readonly SESSION_DURATION = Number(import.meta.env.VITE_TOKEN_EXPIRY || 86400) * 1000; // Convert seconds to milliseconds

  async login(username: string, password: string): Promise<{ token: string; user: User }> {
    try {
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);

      const response = await axiosInstance.post('/api/v1/auth/token', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      
      const token = response.data.access_token;
      const user = await this.validateToken(token);
      this.setSession(token, user);
      
      return { token, user };
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  async validateToken(token: string): Promise<User> {
    try {
      const response = await axiosInstance.get('/api/v1/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      console.error('Token validation failed:', error);
      this.clearSession();
      throw error;
    }
  }

  private setSession(token: string, user: User): void {
    try {
      const expiryTime = new Date().getTime() + this.SESSION_DURATION;
      const sessionData: SessionData = {
        token,
        expiryTime,
        user,
      };

      localStorage.setItem(this.TOKEN_KEY, JSON.stringify(sessionData));
      
      // Set default Authorization header for all future requests
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } catch (error) {
      console.error('Failed to set session:', error);
      throw error;
    }
  }

  getSession(): { token: string; user: User } | null {
    try {
      const sessionData = localStorage.getItem(this.TOKEN_KEY);
      if (!sessionData) return null;

      const { token, expiryTime, user } = JSON.parse(sessionData) as SessionData;

      // Check if session has expired
      if (new Date().getTime() > expiryTime) {
        this.clearSession();
        return null;
      }

      // Refresh the session duration
      this.setSession(token, user);
      return { token, user };
    } catch (error) {
      console.error('Failed to get session:', error);
      this.clearSession();
      return null;
    }
  }

  isAuthenticated(): boolean {
    return !!this.getSession();
  }

  private clearSession(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    delete axiosInstance.defaults.headers.common['Authorization'];
  }

  logout(): void {
    try {
      this.clearSession();
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  }
}

export const authService = new AuthService();
