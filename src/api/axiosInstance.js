import axios from "axios";
import { getLocalStorageData } from "../utils/localStorageHelper";

const baseUrl = import.meta.env.VITE_API_URL;

const axiosInstance = axios.create({
  baseURL: baseUrl,
  timeout: 15000, // Increase timeout for global SaaS
  headers: {
    "Content-Type": "application/json",
    version_no: 1,
    type: "WEB",
  },
});

// Request Interceptor (Handles Authorization)
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getLocalStorageData("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor (Handles success field validation)
axiosInstance.interceptors.response.use(
  (response) => {
    // Check if the response has a success field
    if (response.data && typeof response.data.success === 'boolean') {
      // If success is false, treat it as an error
      if (response.data.success === false) {
        return Promise.reject({
          response: {
            data: response.data
          }
        });
      }
    }

    // Pass successful responses
    return response;
  },
  (error) => {
    // Handle network errors or other axios errors
    return Promise.reject(error);
  }
);

export default axiosInstance;
