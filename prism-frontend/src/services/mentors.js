import API from "../api";

export const getAllMentors = async () => {
  const response = await API.get("/mentors");
  return response.data;
};
