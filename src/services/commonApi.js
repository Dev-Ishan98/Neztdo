import axiosInstance from "../api/axiosInstance";
import { API_ENDPOINTS } from "../api/endpoints";

export const getCountriesApi = async () =>
    await axiosInstance.get(API_ENDPOINTS.COUNTRIES_MASTER_DATA);

export const getProjectColorsApi = async () =>
    await axiosInstance.get(API_ENDPOINTS.PROJECT_COLORS);

export const getUserRolesApi = async () =>
    await axiosInstance.get(API_ENDPOINTS.MASTER_DATA_USER_ROLES);

export const getUserPermissionsApi = async () =>
    await axiosInstance.get(API_ENDPOINTS.MASTER_DATA_USER_PERMISSIONS);
