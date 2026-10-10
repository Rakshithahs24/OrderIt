
import api from "../../utils/api";

import {
  loginRequest,
  loginSuccess,
  loginFail,
  loadUserFail,
  logoutSuccess,
  logoutFail,
  updateRequest,
  updateSuccess,
  updateFail,
  updateReset,
  clearErrors,
} from "../slices/userSlice";

// =====================================================
// LOGIN
// =====================================================
export const login = (email, password) => async (dispatch) => {
  try {
    dispatch(loginRequest());

    const { data } = await api.post("/v1/users/login", {
      email,
      password,
    });

    dispatch(loginSuccess(data.data.user));
  } catch (error) {
    console.error(
      "LOGIN ERROR:",
      error.response?.data || error.message
    );

    dispatch(
      loginFail(
        error.response?.data?.message ||
          error.response?.data?.errMessage ||
          error.message
      )
    );
  }
};

// =====================================================
// REGISTER
// =====================================================
export const register = (userData) => async (dispatch) => {
  try {
    dispatch(loginRequest());

    const { data } = await api.post(
      "/v1/users/signup",
      userData,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    dispatch(loginSuccess(data.data.user));
  } catch (error) {
    console.error(
      "REGISTER ERROR:",
      error.response?.data || error.message
    );

    dispatch(
      loginFail(
        error.response?.data?.message ||
          error.response?.data?.errMessage ||
          error.message
      )
    );
  }
};

// =====================================================
// LOAD LOGGED-IN USER
// =====================================================
export const loadUser = () => async (dispatch) => {
  try {
    dispatch(loginRequest());

    const { data } = await api.get("/v1/users/me");

    console.log("LOAD USER RESPONSE:", data);

    dispatch(loginSuccess(data.user));
  } catch (error) {
    console.error(
      "LOAD USER ERROR:",
      error.response?.data || error.message
    );

    dispatch(
      loadUserFail(
        error.response?.data?.message ||
          error.response?.data?.errMessage ||
          error.message
      )
    );
  }
};

// =====================================================
// UPDATE PROFILE
// =====================================================
export const updateProfile = (userData) => async (dispatch) => {
  try {
    dispatch(updateRequest());

    const { data } = await api.put(
      "/v1/users/me/update",
      userData
    );

    console.log("PROFILE UPDATE RESPONSE:", data);

    dispatch(updateSuccess(data.success));
  } catch (error) {
    console.error(
      "PROFILE UPDATE ERROR:",
      error.response?.data || error.message
    );

    dispatch(
      updateFail(
        error.response?.data?.message ||
          error.response?.data?.errMessage ||
          error.message
      )
    );
  }
};

// =====================================================
// LOGOUT
// =====================================================
export const logout = () => async (dispatch) => {
  try {
    await api.get("/v1/users/logout");

    dispatch(logoutSuccess());
  } catch (error) {
    console.error(
      "LOGOUT ERROR:",
      error.response?.data || error.message
    );

    dispatch(
      logoutFail(
        error.response?.data?.message ||
          error.response?.data?.errMessage ||
          error.message
      )
    );
  }
};
