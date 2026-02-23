import axiosInstance from "../api/axiosInstance";
import { API_ENDPOINTS } from "../api/endpoints";

/**
 * Upload a single file (multipart/form-data).
 * Body: { file, file_size, file_name }
 * Returns: { file_url, ... }
 */
export const uploadFileApi = async (formData) =>
    await axiosInstance.post(API_ENDPOINTS.FILE_UPLOAD, formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });

/**
 * Fetch project members by project ID.
 * Body: { project_id, page, per_page, order_by, sort, search }
 */
export const getProjectMembersApi = async ({ queryKey }) => {
    const [, params] = queryKey;
    return await axiosInstance.post(API_ENDPOINTS.MEMBERS_ALL_BY_PROJECT, params);
};

/**
 * Create a plan task.
 */
export const createPlanTaskApi = async (data) =>
    await axiosInstance.post(API_ENDPOINTS.TASK_PLAN_CREATE, data);

/**
 * Update a task (called right after plan/create).
 */
export const updateTaskApi = async (data) =>
    await axiosInstance.post(API_ENDPOINTS.TASK_UPDATE, data);
