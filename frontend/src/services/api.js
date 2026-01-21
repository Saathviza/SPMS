import axios from 'axios';

// Create axios instance
const api = axios.create({
    baseURL: 'http://localhost:4000/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to attach JWT token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add auth services
export const authService = {
    login: async (email, password) => {
        const response = await api.post('/auth/login', { email, password });
        return response.data;
    },
    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('user');
    },
    getCurrentUser: () => {
        return JSON.parse(localStorage.getItem('user'));
    }
};

// Add scout services
export const scoutService = {
    getDashboardConfig: async (scoutId) => {
        const response = await api.get(`/scout/dashboard/${scoutId}`);
        return response.data;
    },
    getProfile: async (scoutId) => {
        const response = await api.get(`/scout/profile/${scoutId}`);
        return response.data;
    },
    getBadges: async (scoutId) => {
        const response = await api.get(`/scout/badges/${scoutId}`);
        return response.data;
    },
    getActivities: async (scoutId) => {
        const response = await api.get(`/scout/activities/${scoutId}`);
        return response.data;
    }
};

export default api;
