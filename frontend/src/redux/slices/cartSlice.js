
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  cartItems: [],
  restaurant: {},
  loading: false,
  error: null,
  deliveryInfo: {},
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    cartRequest: (state) => {
      state.loading = true;
      state.error = null;
    },

    cartSuccess: (state, action) => {
      state.loading = false;
      state.error = null;
      state.cartItems = action.payload?.items || [];
      state.restaurant = action.payload?.restaurant || {};
    },

    cartFail: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },

    updateCartSuccess: (state, action) => {
      state.loading = false;
      state.error = null;
      state.cartItems = action.payload?.items || [];
      state.restaurant = action.payload?.restaurant || state.restaurant;
    },

    removeCartSuccess: (state, action) => {
      state.loading = false;
      state.error = null;

      // The action receives data.cart directly.
      state.cartItems = action.payload?.items || [];
      state.restaurant = action.payload?.restaurant || {};
    },

    clearCart: (state) => {
      state.cartItems = [];
      state.restaurant = {};
      state.loading = false;
      state.error = null;
    },

    clearErrors: (state) => {
      state.error = null;
    },

    saveDeliveryInfo: (state, action) => {
      state.deliveryInfo = action.payload;
    },
  },
});

export const {
  cartRequest,
  cartSuccess,
  cartFail,
  updateCartSuccess,
  removeCartSuccess,
  clearCart,
  clearErrors,
  saveDeliveryInfo,
} = cartSlice.actions;

export default cartSlice.reducer;
