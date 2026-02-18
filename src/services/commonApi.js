import axiosInstance from "../api/axiosInstance";
import { API_ENDPOINTS } from "../api/endpoints";

export const getCountriesApi = async () =>
    await axiosInstance.get(API_ENDPOINTS.COUNTRIES_MASTER_DATA);
