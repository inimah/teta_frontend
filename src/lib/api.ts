import axios from "axios";

const _apiUrl = import.meta.env.VITE_API_BASE_URL
  || ((import.meta.env.VITE_API_URL || "").replace(/\/$/, "") + "/api")
  || "/api";

const api = axios.create({
  baseURL: _apiUrl,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      localStorage.removeItem("authToken");
      localStorage.removeItem("authUser");
      if (location.pathname.startsWith("/admin")) {
        window.location.href = "/admin/login?expired=1";
      }
    }
    return Promise.reject(err);
  }
);

export default api;
