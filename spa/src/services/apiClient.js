import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Optionally, add a request interceptor to inject auth token
apiClient.interceptors.request.use((config) => {
  const userStr = localStorage.getItem('userData');
  if (userStr) {
    const user = JSON.parse(userStr);
    if (user.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
  }
  return config;
}, (error) => Promise.reject(error));

export default apiClient;
