/**
 * Unified API Client for Standardized Data Access
 * 
 * This module provides a centralized API client with:
 * - Automatic authentication header injection
 * - Standardized error handling and transformations
 * - Multi-tenant context support
 * - Request/response interceptors
 * - TypeScript safety with proper typing
 * - Comprehensive monitoring and metrics collection
 */

// Initialize monitoring middleware globally
const monitoringMiddleware = createMonitoringMiddleware();

import { supabase } from './supabaseClient';
import { createMonitoringMiddleware } from './monitoring';

// API configuration
const DEFAULT_API_BASE = process.env.NEXT_PUBLIC_API_URL || process.env.VITE_API_URL || 'http://localhost:8000';

// Standard error types for consistent error handling
export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export class AuthError extends APIError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401, 'AUTH_ERROR');
    this.name = 'AuthError';
  }
}

export class NetworkError extends APIError {
  constructor(message: string = 'Network request failed') {
    super(message, 0, 'NETWORK_ERROR');
    this.name = 'NetworkError';
  }
}

export class ValidationError extends APIError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

// Request configuration interface
export interface APIRequestConfig {
  baseURL?: string;
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
  orgId?: string; // Multi-tenant context
}

// Response interceptor configuration
export interface APIResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
}

/**
 * Unified API Client class with standardized patterns
 */
export class APIClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;
  private timeout: number;
  private retries: number;

  constructor(config: APIRequestConfig = {}) {
    this.baseURL = config.baseURL || DEFAULT_API_BASE;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...config.headers,
    };
    this.timeout = config.timeout || 30000; // 30 seconds
    this.retries = config.retries || 3;
  }

  /**
   * Get authentication headers from Supabase session
   */
  private async getAuthHeaders(): Promise<Record<string, string>> {
    if (!supabase) {
      console.warn('Supabase not configured, skipping auth headers');
      return {};
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        return {
          'Authorization': `Bearer ${session.access_token}`,
        };
      }
    } catch (error) {
      console.warn('Failed to get auth session:', error);
    }

    return {};
  }

  /**
   * Transform errors into standardized APIError instances
   */
  private transformError(error: any, response?: Response): APIError {
    // Network errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return new NetworkError('Network request failed - please check your connection');
    }

    // Response-based errors
    if (response) {
      const status = response.status;
      const statusText = response.statusText;

      switch (status) {
        case 401:
          return new AuthError('Authentication required - please sign in');
        case 403:
          return new APIError('Access forbidden - insufficient permissions', status, 'FORBIDDEN');
        case 404:
          return new APIError('Resource not found', status, 'NOT_FOUND');
        case 422:
          return new ValidationError('Validation failed', error.details);
        case 429:
          return new APIError('Rate limit exceeded - please try again later', status, 'RATE_LIMIT');
        case 500:
          return new APIError('Internal server error - please try again', status, 'SERVER_ERROR');
        default:
          return new APIError(
            error.message || `Request failed with status ${status}`,
            status,
            'API_ERROR'
          );
      }
    }

    // Generic error fallback
    return new APIError(
      error.message || 'An unknown error occurred',
      0,
      'UNKNOWN_ERROR'
    );
  }

  /**
   * Core request method with retry logic and error handling
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    orgId?: string
  ): Promise<APIResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    let lastError: Error;

    // Add org_id to query params if provided
    const urlWithOrg = orgId ? 
      `${url}${url.includes('?') ? '&' : '?'}org_id=${orgId}` : 
      url;

    for (let attempt = 0; attempt <= this.retries; attempt++) {
      let enhancedConfig: any;
      
      try {
        // Get fresh auth headers for each request
        const authHeaders = await this.getAuthHeaders();
        
        const config: RequestInit = {
          ...options,
          headers: {
            ...this.defaultHeaders,
            ...authHeaders,
            ...options.headers,
          },
        };

        // Apply monitoring middleware onRequest
        enhancedConfig = monitoringMiddleware.onRequest({
          url: urlWithOrg,
          method: config.method || 'GET',
          data: options.body,
          orgId,
          __retryCount: attempt,
        });

        // Add timeout using AbortController
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const response = await fetch(urlWithOrg, {
          ...config,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Handle non-2xx responses
        if (!response.ok) {
          let errorData;
          try {
            errorData = await response.json();
          } catch {
            errorData = { message: response.statusText };
          }
          
          throw this.transformError(errorData, response);
        }

        // Parse response
        let data: T;
        const contentType = response.headers.get('content-type');
        
        if (contentType?.includes('application/json')) {
          data = await response.json();
        } else {
          data = await response.text() as unknown as T;
        }

        const apiResponse = {
          data,
          status: response.status,
          statusText: response.statusText,
        };

        // Apply monitoring middleware onResponse
        monitoringMiddleware.onResponse(apiResponse, enhancedConfig);

        return apiResponse;

      } catch (error) {
        lastError = error as Error;
        
        // Apply monitoring middleware onError
        try {
          monitoringMiddleware.onError(error, enhancedConfig);
        } catch (monitoringError) {
          console.warn('Monitoring error:', monitoringError);
        }
        
        // Don't retry auth errors or client errors (4xx)
        if (error instanceof AuthError || 
            (error instanceof APIError && error.status >= 400 && error.status < 500)) {
          throw error;
        }

        // Log retry attempt
        if (attempt < this.retries) {
          console.warn(`API request failed, retrying... (${attempt + 1}/${this.retries})`, error);
          // Exponential backoff: 1s, 2s, 4s
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    // All retries exhausted
    throw this.transformError(lastError!);
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, orgId?: string): Promise<T> {
    const response = await this.request<T>(endpoint, { method: 'GET' }, orgId);
    return response.data;
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, data?: any, orgId?: string): Promise<T> {
    const response = await this.request<T>(
      endpoint,
      {
        method: 'POST',
        body: data ? JSON.stringify(data) : undefined,
      },
      orgId
    );
    return response.data;
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, data?: any, orgId?: string): Promise<T> {
    const response = await this.request<T>(
      endpoint,
      {
        method: 'PUT',
        body: data ? JSON.stringify(data) : undefined,
      },
      orgId
    );
    return response.data;
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, orgId?: string): Promise<T> {
    const response = await this.request<T>(endpoint, { method: 'DELETE' }, orgId);
    return response.data;
  }

  /**
   * PATCH request
   */
  async patch<T>(endpoint: string, data?: any, orgId?: string): Promise<T> {
    const response = await this.request<T>(
      endpoint,
      {
        method: 'PATCH',
        body: data ? JSON.stringify(data) : undefined,
      },
      orgId
    );
    return response.data;
  }
}

// Default API client instance
export const apiClient = new APIClient();

// Convenience functions that use the default client
export const api = {
  get: <T>(endpoint: string, orgId?: string) => apiClient.get<T>(endpoint, orgId),
  post: <T>(endpoint: string, data?: any, orgId?: string) => apiClient.post<T>(endpoint, data, orgId),
  put: <T>(endpoint: string, data?: any, orgId?: string) => apiClient.put<T>(endpoint, data, orgId),
  delete: <T>(endpoint: string, orgId?: string) => apiClient.delete<T>(endpoint, orgId),
  patch: <T>(endpoint: string, data?: any, orgId?: string) => apiClient.patch<T>(endpoint, data, orgId),
}; 