import axios from "axios";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const predictStartup = async (payload) => {
  console.log("[predictStartup] request", payload);
  const response = await axios.post(`${API}/predict`, payload);
  console.log("[predictStartup] response", response.data);
  return response.data;
};
