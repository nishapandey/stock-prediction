import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export const axiosInstance = axios.create({
    baseURL: API_URL,
});

// Add request interceptor to include JWT token
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add response interceptor to handle token refresh
axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        
        // Skip refresh logic for auth endpoints
        const isAuthEndpoint = originalRequest.url?.includes('/token/');
        
        if (error.response && error.response.status === 401 && !originalRequest.retry && !isAuthEndpoint) {
            originalRequest.retry = true;
            const refreshToken = localStorage.getItem('refresh_token');
            
            if (!refreshToken) {
                return Promise.reject(error);
            }
            
            try {
                // Use plain axios to avoid triggering interceptors on refresh
                const response = await axios.post(`${API_URL}/token/refresh/`, {
                    refresh: refreshToken
                });
                
                localStorage.setItem('access_token', response.data.access);

                // Retry original request with new token
                originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
                return axiosInstance(originalRequest);
            } catch (err) {
                // Refresh failed - clear tokens and redirect to login
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                return Promise.reject(err);
            }
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;
