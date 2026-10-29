
import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faIndianRupeeSign } from "@fortawesome/free-solid-svg-icons";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  addItemToCart,
  updateCartQuantity,
  removeItemFromCart,
} from "../redux/actions/cartActions";
import axios from "axios";
import { getMenus } from "../redux/actions/menuActions";

const Fooditem = ({ fooditem, restaurant }) => {
  const [busy, setBusy] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { user } = useSelector((state) => state.user);
  const isAuthenticated = !!user;
  const { cartItems } = useSelector((state) => state.cart);

  const foodId = String(fooditem._id);

  const cartItem = cartItems.find((item) => {
    const itemId =
      typeof item.foodItem === "object"
        ? item.foodItem?._id
        : item.foodItem;

    return String(itemId) === foodId;
  });

  const quantity = cartItem?.quantity || 0;
  const showButtons = quantity > 0;

  const runCartAction = async (action) => {
    if (busy) return;

    setBusy(true);
    try {
      await dispatch(action);
    } finally {
      setBusy(false);
    }
  };

  const addToCartHandler = async () => {
    if (!isAuthenticated) {
      navigate("/users/login");
      return;
    }

    await runCartAction(
      addItemToCart(fooditem._id, restaurant, 1)
    );
  };

  const increaseQty = async () => {
    if (quantity >= fooditem.stock) {
      alert("Exceeded stock limit");
      return;
    }

    await runCartAction(
      updateCartQuantity(fooditem._id, quantity + 1)
    );
  };

  const decreaseQty = async () => {
    if (quantity > 1) {
      await runCartAction(
        updateCartQuantity(fooditem._id, quantity - 1)
      );
    } else if (quantity === 1) {
      await runCartAction(
        removeItemFromCart(fooditem._id)
      );
    }
  };

  return (
    <div className="col-sm-12 col-md-6 col-lg-3 my-3">
      <div className="card p-3 rounded">
        <img
          className="card-img-top mx-auto food-image"
          src={fooditem.images?.[0]?.url || "/images/placeholder.png"}
          alt={fooditem.name}
        />

        <div className="card-body d-flex flex-column">
          <h5 className="card-title">{fooditem.name}</h5>

          <p className="fooditem_des">{fooditem.description}</p>

          <p className="card-text">
            <FontAwesomeIcon icon={faIndianRupeeSign} size="xs" />
            {fooditem.price}
          </p>

          {user?.role !== "admin" && (
            !showButtons ? (
              <button
                id={`cart_btn_${foodId}`}
                className="btn btn-primary ml-4"
                disabled={busy || fooditem.stock === 0}
                onClick={addToCartHandler}
              >
                {busy ? "Adding..." : "Add to Cart"}
              </button>
            ) : (
              <div className="stockCounter d-inline">
                <button
                  type="button"
                  className="btn btn-danger minus"
                  disabled={busy}
                  onClick={decreaseQty}
                >
                  −
                </button>

                <input
                  type="number"
                  className="form-control count d-inline"
                  value={quantity}
                  readOnly
                />

                <button
                  type="button"
                  className="btn btn-primary plus"
                  disabled={busy}
                  onClick={increaseQty}
                >
                  +
                </button>
              </div>
            )
          )}

          <hr />

          <p>
            Status:{" "}
            <span
              className={
                fooditem.stock > 0 ? "greenColor" : "redColor"
              }
            >
              {fooditem.stock > 0 ? "In Stock" : "Out of Stock"}
            </span>
          </p>

          {isAuthenticated && user?.role === "admin" && (
            <button
              className="btn btn-danger btn-sm mt-2"
              onClick={async () => {
                if (!window.confirm("Delete this food item?")) return;

                try {
                  await axios.delete(
                    `/api/v1/eats/item/${fooditem._id}`,
                    { withCredentials: true }
                  );

                  if (restaurant) {
                    dispatch(getMenus(restaurant));
                  }
                } catch (err) {
                  console.error(err);
                  alert(
                    err.response?.data?.message ||
                    "Unable to delete item"
                  );
                }
              }}
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Fooditem;
