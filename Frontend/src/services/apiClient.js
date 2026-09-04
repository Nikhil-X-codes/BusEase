import axios from "axios";

const API_BASE = import.meta.env.VITE_BASE_URL;
const client = axios.create({ withCredentials: true, timeout: 10000 });
const rawClient = axios.create({ baseURL: API_BASE, withCredentials: true, timeout: 10000 });
let refreshPromise;

const notify = (message, type = "error") => window.dispatchEvent(new CustomEvent("app:toast", { detail: { message, type } }));
const isAuthRequest = (url = "") => /\/users\/(login|register|refresh-token|logout)/.test(url);

client.interceptors.response.use((response) => response, async (error) => {
  const config = error.config || {};
  const status = error.response?.status;
  if (status === 401 && !config._authRetry && !isAuthRequest(config.url)) {
    config._authRetry = true;
    try {
      refreshPromise ||= rawClient.post("/users/refresh-token");
      await refreshPromise;
      refreshPromise = null;
      return client(config);
    } catch (refreshError) {
      refreshPromise = null;
      window.dispatchEvent(new Event("auth:expired"));
      notify("Your session has expired. Please sign in again.");
      return Promise.reject(refreshError);
    }
  }

  if (!config._networkRetry && (!error.response || status >= 500)) {
    config._networkRetry = 0;
  }
  if (config._networkRetry !== undefined && config._networkRetry < 3 && (!error.response || status >= 500)) {
    config._networkRetry += 1;
    await new Promise((resolve) => setTimeout(resolve, 250 * (2 ** config._networkRetry)));
    return client(config);
  }

  const messages = {
    403: "You do not have permission to perform this action.",
    404: "The requested resource was not found.",
    409: "This action conflicts with another change.",
    429: "Too many requests. Please wait and try again.",
    500: "Something went wrong. Please try again later.",
  };
  notify(!error.response ? "Connection lost. Please check your internet." : messages[status] || error.response.data?.message || "Request failed.");
  return Promise.reject(error);
});

export default client;
