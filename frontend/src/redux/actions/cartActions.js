
import api from "../../utils/api";

import {
  cartRequest,
  cartSuccess,
  cartFail,
  updateCartSuccess,
  removeCartSuccess,
} from "../slices/cartSlice";

// Fetch cart items
export const fetchCartItems = () => async (dispatch) => {
  try {
    dispatch(cartRequest());

    const { data } = await api.get("/v1/eats/cart/get-cart");

    // Backend returns the cart under data.data
    dispatch(cartSuccess(data.data));
    return { success: true, cart: data.data };
  } catch (error) {
    const message =
      error.response?.data?.message || "Failed to fetch cart";

    dispatch(cartFail(message));
    return { success: false, message };
  }
};

// Add an item to the cart
export const addItemToCart =
  (foodItemId, restaurantId, quantity = 1) =>
  async (dispatch, getState) => {
    try {
      dispatch(cartRequest());

      const { user } = getState().user;

      if (!user?._id) {
        const message = "Please log in to add items to your cart";
        dispatch(cartFail(message));
        return { success: false, message };
      }

      const { data } = await api.post("/v1/eats/cart/add-to-cart", {
        userId: user._id,
        foodItemId,
        restaurantId,
        quantity,
      });

      if (!data.cart) {
        throw new Error("The server did not return the updated cart");
      }

      dispatch(cartSuccess(data.cart));
      return { success: true, cart: data.cart };
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to add item to cart";

      dispatch(cartFail(message));
      return { success: false, message };
    }
  };

// Update an item's quantity
export const updateCartQuantity =
  (foodItemId, quantity) => async (dispatch, getState) => {
    try {
      const { user } = getState().user;

      if (!user?._id) {
        const message = "Please log in to update your cart";
        dispatch(cartFail(message));
        return { success: false, message };
      }

      const { data } = await api.post("/v1/eats/cart/update-cart-item", {
        userId: user._id,
        foodItemId,
        quantity,
      });

      if (!data.cart) {
        throw new Error("The server did not return the updated cart");
      }

      dispatch(updateCartSuccess(data.cart));
      return { success: true, cart: data.cart };
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to update cart quantity";

      dispatch(cartFail(message));
      return { success: false, message };
    }
  };

// Remove an item from the cart
export const removeItemFromCart =
  (foodItemId) => async (dispatch, getState) => {
    try {
      const { user } = getState().user;

      if (!user?._id) {
        const message = "Please log in to remove cart items";
        dispatch(cartFail(message));
        return { success: false, message };
      }

      const { data } = await api.delete(
        "/v1/eats/cart/delete-cart-item",
        {
          data: {
            userId: user._id,
            foodItemId,
          },
        }
      );

      if (data.cart) {
        dispatch(removeCartSuccess(data.cart));
        return { success: true, cart: data.cart };
      }

      // The backend deletes the cart after its final item is removed.
      dispatch(
        cartSuccess({
          items: [],
          restaurant: {},
        })
      );

      return { success: true, cart: { items: [], restaurant: {} } };
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to remove cart item";

      dispatch(cartFail(message));
      return { success: false, message };
    }
  };
