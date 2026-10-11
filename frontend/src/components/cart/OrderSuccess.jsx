
import React, { useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { createOrder } from "../../redux/actions/orderActions";
import { clearErrors } from "../../redux/slices/orderSlice";
import { toast } from "react-toastify";

const OrderSuccess = () => {
  const location = useLocation();
  const dispatch = useDispatch();
  const hasCalled = useRef(false);

  const { loading, error, order } = useSelector(
    (state) => state.order
  );

  const searchParams = new URLSearchParams(location.search);
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    if (!sessionId || hasCalled.current) return;

    hasCalled.current = true;
    dispatch(createOrder(sessionId));
  }, [dispatch, sessionId]);

  useEffect(() => {
    if (order) {
      toast.success("Order placed successfully 🎉", {
        position: "bottom-right",
      });
    }

    if (error) {
      toast.error(error, { position: "bottom-right" });
      dispatch(clearErrors());
    }
  }, [order, error, dispatch]);

  if (!sessionId) {
    return (
      <div className="container text-center mt-5">
        <h2>Unable to confirm your order</h2>
        <p>
          The Stripe session ID is missing. Please check My Orders
          before attempting payment again.
        </p>
        <Link to="/eats/orders/me/myOrders">Check My Orders</Link>
      </div>
    );
  }

  return (
    <div className="container text-center mt-5">
      {loading ? (
        <h2>Confirming your order...</h2>
      ) : error ? (
        <>
          <h2>We couldn't confirm your order</h2>
          <Link to="/eats/orders/me/myOrders">Check My Orders</Link>
        </>
      ) : order ? (
        <>
          <h2>Your order has been placed successfully.</h2>
          <Link to="/eats/orders/me/myOrders">Go to Orders</Link>
        </>
      ) : (
        <h2>Confirming your order...</h2>
      )}
    </div>
  );
};

export default OrderSuccess;
