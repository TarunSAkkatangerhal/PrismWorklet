import React from "react";
import ReactDOM from "react-dom"; // React 17
import { BrowserRouter } from "react-router-dom";
import axios from "axios";
import App from "./App";
import "./index.css";

// Global Axios auth setup: attach token and refresh on 401
(() => {
  const API_BASE = (process.env.REACT_APP_API_URL as string) || "http://localhost:8000";

  // Attach Authorization header on every request if available
  axios.interceptors.request.use((config) => {
    const access = localStorage.getItem("access_token");
    if (access && config && config.headers && !config.headers["Authorization"]) {
      config.headers["Authorization"] = `Bearer ${access}`;
    }
    return config;
  });

  let isRefreshing = false;
  let refreshPromise: Promise<any> | null = null;
  const pendingQueue: Array<(token: string | null) => void> = [];

  const processQueue = (token: string | null) => {
    while (pendingQueue.length) {
      const next = pendingQueue.shift();
      if (next) next(token);
    }
  };

  axios.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error?.config || {};
      const status = error?.response?.status;

      // Don't try to refresh for auth endpoints themselves
      const url: string = originalRequest?.url || "";
      const isAuthEndpoint = url.includes("/auth/login") || url.includes("/auth/refresh");

      if (status === 401 && !originalRequest._retry && !isAuthEndpoint) {
        originalRequest._retry = true;

        const doRefresh = async () => {
          const refresh = localStorage.getItem("refresh_token");
          if (!refresh) throw new Error("No refresh token");
          const res = await axios.post(`${API_BASE}/auth/refresh`, { refresh_token: refresh });
          const newAccess = res?.data?.access_token;
          const newRefresh = res?.data?.refresh_token;
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

          const token = await (refreshPromise as Promise<string>);
          // Retry original request with new token
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers["Authorization"] = `Bearer ${token}`;
          return axios(originalRequest);
        } catch (e) {
          processQueue(null);
          // Clear auth and redirect to login
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
})();

ReactDOM.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
  document.getElementById("root")
);
