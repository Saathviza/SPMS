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
    getPublicGroups: async () => {
        const response = await api.get('/auth/groups');
        return response.data;
    },
    login: async (email, password, role) => {
        const response = await api.post('/auth/login', { email, password, role });
        return response.data;
    },
    registerScout: async (data) => {
        let headers = {};
        if (data instanceof FormData) {
            headers['Content-Type'] = 'multipart/form-data';
        }
        const response = await api.post('/auth/register', data, { headers });
        return response.data;
    },
    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('user');
    },
    getCurrentUser: () => {
        try {
            const userStr = localStorage.getItem('user');
            if (!userStr || userStr === 'undefined') return null;
            return JSON.parse(userStr);
        } catch (e) {
            console.error("Error parsing user data:", e);
            return null;
        }
    },
    requestPasswordReset: async (email) => {
        const response = await api.post('/auth/password-recovery', { email });
        return response.data;
    }
};

// Add scout services (FIXED)
export const scoutService = {
    // ✅ Dashboard uses JWT, NOT ID
    getDashboardConfig: async () => {
        const response = await api.get('/scout/dashboard');
        return response.data;
    },

    // ✅ Profile is ID-based (correct)
    getProfile: async (scoutId) => {
        const response = await api.get(`/scout/profile/${scoutId}`);
        return response.data;
    },

    updateProfile: async (scoutId, profileData) => {
        const response = await api.put(`/scout/profile/${scoutId}`, profileData);
        return response.data;
    },

    // ✅ Badges are ID-based (correct)
    getBadges: async (scoutId) => {
        const response = await api.get(`/scout/badges/${scoutId}`);
        return response.data;
    },

    // ✅ USE TOKEN-BASED ACTIVITIES (cleaner & safer)
    getMyActivities: async () => {
        const response = await api.get('/activities/my-activities');
        return response.data;
    },

    getActivities: async (scoutId) => {
        const response = await api.get(`/scout/activities/${scoutId}`);
        return response.data;
    },

    getBadgeSyllabus: async (badgeId) => {
        const response = await api.get(`/scout/badges/${badgeId}/syllabus`);
        return response.data;
    }
};


// Add leader services
// Add leader services
export const leaderService = {
    getScouts: async () => {
        const response = await api.get('/leader/scouts');
        return response.data;
    },
    getPendingActivities: async () => {
        const response = await api.get(`/leader/pending-activities?t=${Date.now()}`);
        return response.data;
    },
    approveActivity: async (data) => {
        const response = await api.post('/leader/approve-activity', data);
        return response.data;
    },
    rejectActivity: async (data) => {
        const response = await api.post('/leader/reject-activity', data);
        return response.data;
    },
    getReportFile: async (type) => {
        const response = await api.get(`/leader/reports/file/${encodeURIComponent(type)}`);
        return response.data;
    }
};

// Add admin services
export const adminService = {
    getStats: async () => {
        const response = await api.get('/admin/stats');
        return response.data;
    },
    getAllScouts: async () => {
        const response = await api.get('/admin/scouts');
        return response.data;
    },
    getUsers: async () => {
        const response = await api.get('/admin/users');
        return response.data;
    },
    getGroups: async () => {
        const response = await api.get('/admin/groups');
        return response.data;
    },
    getGroupRoster: async (groupId) => {
        const response = await api.get(`/admin/groups/${groupId}/roster`);
        return response.data;
    },
    getLogs: async () => {
        const response = await api.get('/admin/logs');
        return response.data;
    },
    checkEligibility: async (scoutId) => {
        const response = await api.get(`/admin/check-eligibility/${scoutId}`);
        return response.data;
    },
    manageActivity: async (data) => {
        const response = await api.post('/admin/manage-activity', data);
        return response.data;
    },
    manageBadge: async (data) => {
        const response = await api.post('/admin/manage-badge', data);
        return response.data;
    },
    addLeader: async (data) => {
        const response = await api.post('/admin/add-leader', data);
        return response.data;
    }
};

// Add general activity services
export const activityService = {
    getAll: async () => {
        const response = await api.get('/activities');
        return response.data;
    },
    register: async (data) => {
        const response = await api.post('/activities/register', data);
        return response.data;
    },
    submitNotes: async (data) => {
        const response = await api.post('/activities/submit-notes', data);
        return response.data;
    },
    submitProof: async (formData) => {
        const response = await api.post('/activities/submit-proof', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    }
};

// Add examiner services
export const examinerService = {
    getPendingBadges: async () => {
        const response = await api.get('/examiner/pending-badges');
        return response.data;
    },
    approveBadge: async (data) => {
        const response = await api.post('/examiner/approve-badge', data);
        return response.data;
    },
    rejectBadge: async (data) => {
        const response = await api.post('/examiner/reject-badge', data);
        return response.data;
    },
    getScoutDetails: async (scoutId) => {
        const response = await api.get(`/examiner/scout/${scoutId}`);
        return response.data;
    }
};

// Add badge apply service to scoutService
scoutService.applyForBadge = async (badgeId, notes = '') => {
    // Resolve scout_id inside controller or just pass badge_id
    const response = await api.post('/badges/submit', { badge_id: badgeId, notes });
    return response.data;
};

export default api;
