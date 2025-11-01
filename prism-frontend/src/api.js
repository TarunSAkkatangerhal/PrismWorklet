// src/api.js
import axios from "axios";

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:8000",
  withCredentials: true,
});

// Shared refresh state across interceptors
let isRefreshing = false;

const processQueue = (error, token = null) => {
  const queue = pendingQueue.slice();
  pendingQueue.length = 0; // Clear the queue
  
  queue.forEach(promise => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });
};

const pendingQueue = [];

// Attach token from localStorage for every request (instance-specific)
API.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers = config.headers || {};
      if (!config.headers["Authorization"]) {
        config.headers["Authorization"] = `Bearer ${token}`;
      }
    }
  } catch (_) {
    // ignore storage errors
  }
  return config;
});

// Handle 401s by refreshing via the same API instance, then retrying original request
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error?.config || {};
    const status = error?.response?.status;
    const url = originalRequest?.url || "";
    const isAuthEndpoint = url.includes("/auth/login") || url.includes("/auth/refresh");

    if (status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        // Queue this request while refresh is in progress
        return new Promise((resolve, reject) => {
          pendingQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers["Authorization"] = `Bearer ${token}`;
            return API(originalRequest);
          })
          .catch(err => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const doRefresh = async () => {
        const refresh = localStorage.getItem("refresh_token");
        if (!refresh) throw new Error("No refresh token");
        const res = await API.post("/auth/refresh", { refresh_token: refresh });
        const newAccess = res.data?.access_token;
        const newRefresh = res.data?.refresh_token;
        if (!newAccess || !newRefresh) throw new Error("Invalid refresh response");
        localStorage.setItem("access_token", newAccess);
        localStorage.setItem("refresh_token", newRefresh);
        return newAccess;
      };

      try {
        const token = await doRefresh();
        processQueue(null, token);
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers["Authorization"] = `Bearer ${token}`;
        return API(originalRequest);
      } catch (e) {
        processQueue(e, null);
        try { localStorage.clear(); } catch {}
        if (typeof window !== "undefined") {
          window.location.assign("/");
        }
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// Optional: also set up global axios with the same behavior for legacy callers
export const setupGlobalAxiosInterceptors = () => {
  axios.interceptors.request.use((config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers = config.headers || {};
      if (!config.headers["Authorization"]) {
        config.headers["Authorization"] = `Bearer ${token}`;
      }
    }
    return config;
  });

  axios.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error?.config || {};
      const status = error?.response?.status;
      const url = originalRequest?.url || "";
      const isAuthEndpoint = url.includes("/auth/login") || url.includes("/auth/refresh");

      if (status === 401 && !originalRequest._retry && !isAuthEndpoint) {
        if (isRefreshing) {
          // Queue this request while refresh is in progress
          return new Promise((resolve, reject) => {
            pendingQueue.push({ resolve, reject });
          })
            .then(token => {
              originalRequest.headers = originalRequest.headers || {};
              originalRequest.headers["Authorization"] = `Bearer ${token}`;
              return axios(originalRequest);
            })
            .catch(err => {
              return Promise.reject(err);
            });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const refresh = localStorage.getItem("refresh_token");
          if (!refresh) throw new Error("No refresh token");
          
          const res = await API.post("/auth/refresh", { refresh_token: refresh });
          const newAccess = res.data?.access_token;
          const newRefresh = res.data?.refresh_token;
          if (!newAccess || !newRefresh) throw new Error("Invalid refresh response");
          
          localStorage.setItem("access_token", newAccess);
          localStorage.setItem("refresh_token", newRefresh);
          processQueue(null, newAccess);
          
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers["Authorization"] = `Bearer ${newAccess}`;
          return axios(originalRequest);
        } catch (e) {
          processQueue(e, null);
          try { localStorage.clear(); } catch {}
          if (typeof window !== "undefined") {
            window.location.assign("/");
          }
          return Promise.reject(error);
        } finally {
          isRefreshing = false;
        }
      }

      return Promise.reject(error);
    }
  );
};

export default API;
