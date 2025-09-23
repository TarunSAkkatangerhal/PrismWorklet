import API from "../api";

export const getAllWorklets = async () => {
  const response = await API.get("/worklets");
  return response.data;
};

export const getWorkletById = async (id) => {
  const response = await API.get(`/worklets/${id}`);
  return response.data;
};
