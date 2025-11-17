/**
 * API Service Layer
 * Handles all communication with the backend API
 */

const API_BASE = '/api';

// Helper function for API calls
async function apiCall(endpoint, options = {}) {
  console.log(`API Call: ${endpoint}`, options);
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// Authentication API
export const authAPI = {
  login: async (username, password) => {
    return apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },

  logout: async () => {
    return apiCall('/auth/logout', {
      method: 'POST',
    });
  },

  check: async () => {
    return apiCall('/auth/check');
  },
};

// Employees API
export const employeesAPI = {
  getAll: async () => {
    return apiCall('/employees');
  },

  save: async (employees) => {
    return apiCall('/employees', {
      method: 'POST',
      body: JSON.stringify(employees),
    });
  },
};

// Templates API
export const templatesAPI = {
  getAll: async () => {
    return apiCall('/templates');
  },

  save: async (templates) => {
    return apiCall('/templates', {
      method: 'POST',
      body: JSON.stringify(templates),
    });
  },
};

// Schedules API
export const schedulesAPI = {
  getAll: async () => {
    return apiCall('/schedules');
  },

  save: async (schedules) => {
    return apiCall('/schedules', {
      method: 'POST',
      body: JSON.stringify(schedules),
    });
  },
};

// Vacations API
export const vacationsAPI = {
  getAll: async () => {
    return apiCall('/vacations');
  },

  save: async (vacations) => {
    return apiCall('/vacations', {
      method: 'POST',
      body: JSON.stringify(vacations),
    });
  },
};

// Public API (read-only)
export const publicAPI = {
  getEmployees: async () => {
    return apiCall('/public/employees');
  },

  getSchedules: async () => {
    return apiCall('/public/schedules');
  },

  getTemplates: async () => {
    return apiCall('/public/templates');
  },

  getVacations: async () => {
    return apiCall('/public/vacations');
  },
};

