import axios from 'axios';

const API = axios.create({
  baseURL: process.env.NODE_ENV === 'development' 
    ? 'http://localhost:5000/api/v1' 
    : 'https://your-production-url.com/api/v1',
});

// Add auth token to requests
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default {
  // Auth
  register: (userData) => API.post('/auth/register', userData),
  login: (userData) => API.post('/auth/login', userData),
  
  // User
  getProfile: () => API.get('/users/me'),
  updateProfile: (userData) => API.put('/users/update', userData),
  createAccount: (accountData) => API.post('/users/accounts', accountData),
  
  // Transactions
  sendMoney: (data) => API.post('/transactions/send', data),
  payBill: (data) => API.post('/transactions/bill', data),
  getHistory: () => API.get('/transactions/history'),
};
export const topUpWallet = async (amount, paymentMethod) => {
  try {
    const response = await API.post('/wallet/topup', { 
      amount: parseFloat(amount), 
      paymentMethod 
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to add money');
  }
};
