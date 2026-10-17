
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

    dispatch(cartSuccess(data.data));
    console.log("CART API:", data.data);
  } catch (error) {
    dispatch(
      cartFail(
        error.response?.data?.message || "Failed to fetch cart"
      )
    );
  }
};

// Add item to cart
export const addItemToCart =
  (foodItemId, restaurantId, quantity) =>
  async (dispatch, getState) => {
    try {
      dispatch(cartRequest());

      const { user } = getState().user;

      if (!user?._id) {
        dispatch(cartFail("Please log in to add items to your cart"));
        return;
      }

      const { data } = await api.post("/v1/eats/cart/add-to-cart", {
        userId: user._id,
        foodItemId,
        restaurantId,
        quantity,
      });

      dispatch(cartSuccess(data.cart));
    } catch (error) {
      dispatch(
        cartFail(
          error.response?.data?.message || "Failed to add item to cart"
        )
      );
    }
  };

// Update cart item quantity
export const updateCartQuantity =
  (foodItemId, quantity) => async (dispatch, getState) => {
    try {
      const { user } = getState().user;

      if (!user?._id) {
        dispatch(cartFail("Please log in to update your cart"));
        return;
      }

      const { data } = await api.post("/v1/eats/cart/update-cart-item", {
        userId: user._id,
        foodItemId,
        quantity,
      });

      dispatch(updateCartSuccess(data.cart));
    } catch (error) {
      dispatch(
        cartFail(
          error.response?.data?.message ||
            "Failed to update cart quantity"
        )
      );
    }
  };

// Remove item from cart
export const removeItemFromCart =
  (foodItemId) => async (dispatch, getState) => {
    try {
      const { user } = getState().user;

      if (!user?._id) {
        dispatch(cartFail("Please log in to remove cart items"));
        return;
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
        // Backend returned the updated cart.
        dispatch(removeCartSuccess(data.cart));
      } else {
        // Backend deleted the cart because the last item was removed.
        dispatch(
          cartSuccess({
            items: [],
            restaurant: null,
          })
        );
      }
    } catch (error) {
      dispatch(
        cartFail(
          error.response?.data?.message || "Failed to remove cart item"
        )
      );
    }
  };
