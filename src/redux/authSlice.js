import { createSlice } from "@reduxjs/toolkit";
import { getLocalStorageData } from "../utils/localStorageHelper";

const initialState = {
  token: getLocalStorageData("token"),
  data: getLocalStorageData("data"),
  userId: getLocalStorageData("userId"),
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setToken(state, action) {
      state.token = action.payload;
    },
    setData(state, action) {
      state.data = action.payload;
    },
    setUserId(state, action) {
      state.userId = action.payload;
    },

    logOut(state) {
      state.token = null;
      state.data = null;
      state.userId = null;
      localStorage.clear();
      window.location.replace("/sign-up");
    },
  },
});

export const {
  setToken,
  logOut,
  setData,
  setUserId,
} = authSlice.actions;

export default authSlice.reducer;
