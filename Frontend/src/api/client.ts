import axios from 'axios';

let inMemoryAccessToken = '';
const COOKIE_REFRESH_PLACEHOLDER = 'cookie-session';

export const setAccessToken = (token: string) => {
  inMemoryAccessToken = token;
};

export const getAccessToken = () => {
  return inMemoryAccessToken;
};

// Create AXIOS instance pointing to the backend's GraphQL endpoint
export const apiClient = axios.create({
  baseURL: (import.meta as any).env.VITE_API_URL || '/graphql',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Interceptor to inject JWT access token automatically from in-memory store
apiClient.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiration & silent refresh via HttpOnly cookie
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshMutation = `
          mutation {
            refreshToken(input: { refreshToken: "${COOKIE_REFRESH_PLACEHOLDER}" }) {
              success
              data {
                accessToken
              }
            }
          }
        `;
        const res = await axios.post(
          (import.meta as any).env.VITE_API_URL || '/graphql',
          { query: refreshMutation },
          { withCredentials: true }
        );

        console.log("res",res);
        

        const newAccessToken = res.data?.data?.refreshToken?.data?.accessToken;
        if (newAccessToken) {
          setAccessToken(newAccessToken);
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshErr) {
        setAccessToken('');
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Function to run on application startup to perform a silent refresh and restore session
export const bootstrapSession = async (): Promise<boolean> => {
  try {
    const refreshMutation = `
      mutation {
        refreshToken(input: { refreshToken: "${COOKIE_REFRESH_PLACEHOLDER}" }) {
          success
          data {
            accessToken
          }
        }
      }
    `;
    const res = await axios.post(
      (import.meta as any).env.VITE_API_URL || '/graphql',
      { query: refreshMutation },
      { withCredentials: true }
    );
    const newAccessToken = res.data?.data?.refreshToken?.data?.accessToken;
    if (newAccessToken) {
      setAccessToken(newAccessToken);
      return true;
    }
  } catch (error) {
    // Session is expired or invalid, fail silently so user can authenticate
  }
  return false;
};

// Unified helper to execute GraphQL Queries and Mutations
export async function graphqlRequest<T = any>(
  query: string,
  variables?: Record<string, any>,
  isRetry = false
): Promise<T> {
  const response = await apiClient.post('', { query, variables });
  
  if (response.data.errors && response.data.errors.length > 0) {
    const errorMsg = response.data.errors[0].message || 'GraphQL Execution Error';
    
    if ((errorMsg === 'Authentication required' || errorMsg.includes('Authentication required')) && !isRetry) {
      console.log('Authentication error detected in GraphQL response. Attempting silent token refresh...');
      const refreshed = await bootstrapSession();
      if (refreshed) {
        console.log('Silent token refresh succeeded. Retrying GraphQL request...');
        return graphqlRequest<T>(query, variables, true);
      } else {
        console.warn('Silent token refresh failed. Logging out...');
        const { useAppStore } = await import('../store/appStore');
        useAppStore.getState().logout();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    }
    
    throw new Error(errorMsg);
  }
  
  return response.data.data;
}
