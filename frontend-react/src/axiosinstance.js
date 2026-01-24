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
        if (error.response && error.response.status === 401 && !originalRequest.retry) {
            originalRequest.retry = true;
                const refreshToken = localStorage.getItem('refresh_token');
                try {
                    // Use plain axios to avoid triggering interceptors on refresh
                    const response = await axiosInstance.post(`/token/refresh/`, {
                        refresh: refreshToken
                    });
                    
                    localStorage.setItem('access_token', response.data.access);
                    //localStorage.setItem('refresh_token', response.data.refresh);

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
