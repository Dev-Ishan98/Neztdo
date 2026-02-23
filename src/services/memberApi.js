import axiosInstance from "../api/axiosInstance";
import { API_ENDPOINTS } from "../api/endpoints";

export const inviteMemberApi = async (data) =>
    await axiosInstance.post(API_ENDPOINTS.MEMBER_INVITE, data);

export const requestToByMemberApi = async (data) =>
    await axiosInstance.post(API_ENDPOINTS.MEMBER_REQUEST, data);

export const getAllMembersByOwnerApi = async ({ pageParam = 1, queryKey }) => {
    const [, params] = queryKey;
    return await axiosInstance.post(API_ENDPOINTS.MEMBERS_ALL_BY_OWNER, {
        ...params,
        page: pageParam,
    });
};

export const cancelInvitationApi = async (data) =>
    await axiosInstance.post(API_ENDPOINTS.MEMBER_INVITE_CANCEL, data);

export const removeInvitationApi = async (data) =>
    await axiosInstance.post(API_ENDPOINTS.MEMBER_INVITE_REMOVE, data);

export const changeMemberNicknameApi = async (data) =>
    await axiosInstance.post(API_ENDPOINTS.MEMBER_CHANGE_NICKNAME, data);

export const removeMemberApi = async (data) =>
    await axiosInstance.post(API_ENDPOINTS.MEMBER_REMOVE, data);

export const assignMemberToProjectApi = async (data) =>
    await axiosInstance.post(API_ENDPOINTS.MEMBER_ASSIGN_TO_PROJECT, data);
