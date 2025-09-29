// src/api.js
import axios from "axios";

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://127.0.0.1:8000",
  withCredentials: true,
});

// Shared refresh state across interceptors
let isRefreshing = false;
let refreshPromise = null;
const pendingQueue = [];

const processQueue = (token) => {
  while (pendingQueue.length) {
    const next = pendingQueue.shift();
    if (next) next(token);
  }
};

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
      originalRequest._retry = true;

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
        if (!isRefreshing) {
          isRefreshing = true;
          refreshPromise = doRefresh()
            .then((token) => {
              processQueue(token);
              return token;
            })
            .finally(() => {
              isRefreshing = false;
              refreshPromise = null;
            });
        }

        const token = await refreshPromise;
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers["Authorization"] = `Bearer ${token}`;
        return API(originalRequest);
      } catch (e) {
        processQueue(null);
        try { localStorage.clear(); } catch {}
        if (typeof window !== "undefined") {
          window.location.assign("/");
        }
        return Promise.reject(error);
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
        originalRequest._retry = true;

        try {
          if (!isRefreshing) {
            isRefreshing = true;
            refreshPromise = API.post("/auth/refresh", { refresh_token: localStorage.getItem("refresh_token") })
              .then((res) => {
                const newAccess = res.data?.access_token;
                const newRefresh = res.data?.refresh_token;
                if (!newAccess || !newRefresh) throw new Error("Invalid refresh response");
                localStorage.setItem("access_token", newAccess);
                localStorage.setItem("refresh_token", newRefresh);
                processQueue(newAccess);
                return newAccess;
              })
              .finally(() => {
                isRefreshing = false;
                refreshPromise = null;
              });
          }

          const token = await refreshPromise;
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers["Authorization"] = `Bearer ${token}`;
          return axios(originalRequest);
        } catch (e) {
          processQueue(null);
          try { localStorage.clear(); } catch {}
          if (typeof window !== "undefined") {
            window.location.assign("/");
          }
          return Promise.reject(error);
        }
      }

      return Promise.reject(error);
    }
  );
};

export default API;
