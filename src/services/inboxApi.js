import axiosInstance from "../api/axiosInstance";
import { API_ENDPOINTS } from "../api/endpoints";

/**
 * Fetch all inbox notifications for a user.
 * Params: { assignee_id, page, per_page, order_by, sort }
 */
export const getInboxApi = async ({ queryKey }) => {
    const [, params] = queryKey;
    return await axiosInstance.get(API_ENDPOINTS.GET_INBOX, { params });
};

export const acceptMemberInvitationApi = async (data) =>
    await axiosInstance.post(API_ENDPOINTS.MEMBER_INVITE_ACCEPT, data);

export const declineMemberInvitationApi = async (data) =>
    await axiosInstance.post(API_ENDPOINTS.MEMBER_INVITE_DECLINE, data);

export const acceptTaskApi = async (data) =>
    await axiosInstance.post(API_ENDPOINTS.TASK_ACCEPT, data);

export const rejectTaskApi = async (data) =>
    await axiosInstance.post(API_ENDPOINTS.TASK_REJECT, data);

export const resolveTaskApi = async (data) =>
    await axiosInstance.post(API_ENDPOINTS.TASK_RESOLVE, data);

export const requestTaskEffortChangeApi = async (data) =>
    await axiosInstance.post(API_ENDPOINTS.TASK_EFFORT_CHANGE_REQUEST, data);

export const approveTaskEffortChangeApi = async (data) =>
    await axiosInstance.post(API_ENDPOINTS.TASK_EFFORT_CHANGE_APPROVE, data);

export const resubmitTaskEffortChangeApi = async (data) =>
    await axiosInstance.post(API_ENDPOINTS.TASK_EFFORT_CHANGE_RESUBMIT, data);

/**
 * Placeholder for accepting/declining invitations or tasks.
 * These might need specific endpoints depending on the backend implementation.
 * For now, we'll assume they might use existing or dedicated endpoints.
 */

// Example: Accept member invitation
// export const acceptMemberInvitationApi = async (data) =>
//     await axiosInstance.post(API_ENDPOINTS.MEMBER_INVITATION_RESOLVE, data);
