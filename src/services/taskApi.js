import axiosInstance from "../api/axiosInstance";
import { API_ENDPOINTS } from "../api/endpoints";

/**
 * Upload a single file (multipart/form-data).
 */
export const uploadFileApi = async (formData) =>
    await axiosInstance.post(API_ENDPOINTS.FILE_UPLOAD, formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });

/**
 * Fetch project members by project ID.
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

/**
 * Fetch all tasks for a project.
 * Params: { project_id, project_owner_id, page, per_page, order_by, sort }
 */
export const getAllTasksApi = async ({ queryKey }) => {
    const [, params] = queryKey;
    return await axiosInstance.get(API_ENDPOINTS.TASK_ALL, { params });
};

/**
 * Fetch task details.
 * Params: { task_id, viewer_id }
 */
export const getTaskDetailsApi = async ({ queryKey }) => {
    const [, params] = queryKey;
    return await axiosInstance.get(API_ENDPOINTS.TASK_DETAILS, { params });
};

/**
 * Fetch task history / activity.
 * Params: { task_id, page, per_page, order_by, sort }
 */
export const getTaskHistoryApi = async ({ queryKey }) => {
    const [, params] = queryKey;
    return await axiosInstance.get(API_ENDPOINTS.TASK_HISTORY_ALL, { params });
};

/**
 * Change a task's status.
 * Body: { task_id, task_status, status_change_reason?, updated_by }
 */
export const changeTaskStatusApi = async (data) =>
    await axiosInstance.post(API_ENDPOINTS.TASK_STATUS_CHANGE, data);
