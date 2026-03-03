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

export const getProjectTaskTypesApi = async ({ queryKey }) => {
    const [, params] = queryKey;
    return await axiosInstance.get(API_ENDPOINTS.PROJECT_TASK_TYPE_ALL, { params });
};

export const addProjectTaskTypeApi = async (data) =>
    await axiosInstance.post(API_ENDPOINTS.PROJECT_TASK_TYPE_ADD, data);

export const updateProjectTaskTypeApi = async (data) =>
    await axiosInstance.post(API_ENDPOINTS.PROJECT_TASK_TYPE_UPDATE, data);

export const getProjectDetailApi = async (params) =>
    await axiosInstance.get(API_ENDPOINTS.PROJECT_DETAIL, { params });

export const getProjectByCodeApi = async (params) =>
    await axiosInstance.get(API_ENDPOINTS.PROJECT_ALL, { params });

export const getProjectDashboardStatsApi = async (params) =>
    await axiosInstance.get(API_ENDPOINTS.PROJECT_DASHBOARD_STATS, { params });

export const getProjectMemberProgressApi = async (params) =>
    await axiosInstance.get(API_ENDPOINTS.PROJECT_MEMBER_PROGRESS, { params });
