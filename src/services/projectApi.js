import axiosInstance from "../api/axiosInstance";
import { API_ENDPOINTS } from "../api/endpoints";

export const createProjectApi = async (data) =>
    await axiosInstance.post(API_ENDPOINTS.PROJECT_CREATE, data);

export const getAllProjectsApi = async ({ pageParam = 1, queryKey }) => {
    const [, params] = queryKey;
    return await axiosInstance.get(API_ENDPOINTS.PROJECT_ALL, {
        params: {
            ...params,
            page: pageParam,
        },
    });
};
