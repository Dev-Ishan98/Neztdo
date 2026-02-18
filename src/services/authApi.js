import axiosInstance from "../api/axiosInstance";
import { API_ENDPOINTS } from "../api/endpoints";

export const checkUserExistsApi = async (data) =>
    await axiosInstance.get(API_ENDPOINTS.USER_EXISTS, { params: data });

export const requestOtpApi = async (data) =>
    await axiosInstance.post(API_ENDPOINTS.OTP_REQUEST, data);

export const verifyOtpApi = async (data) =>
    await axiosInstance.post(API_ENDPOINTS.OTP_VERIFY, data);

export const registerUserApi = async (data) =>
    await axiosInstance.post(API_ENDPOINTS.USER_REGISTER, data);

export const loginUserApi = async (data) =>
    await axiosInstance.post(API_ENDPOINTS.USER_LOGIN, data);
