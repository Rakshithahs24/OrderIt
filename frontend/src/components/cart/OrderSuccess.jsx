
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
  const toastShown = useRef(false);

  const { loading, error, order } = useSelector(
    (state) => state.order
  );

  const searchParams = new URLSearchParams(location.search);
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    if (!sessionId || hasCalled.current) {
      return;
    }

    hasCalled.current = true;
    dispatch(createOrder(sessionId));
  }, [dispatch, sessionId]);

  useEffect(() => {
    if (order && !toastShown.current) {
      toastShown.current = true;

      toast.success("Order placed successfully!", {
        position: "bottom-right",
      });
    }

    if (error) {
      toast.error(error, {
        position: "bottom-right",
      });

      dispatch(clearErrors());
    }
  }, [order, error, dispatch]);

  // Handle a missing Stripe session ID
  if (!sessionId) {
    return (
      <div className="container text-center mt-5">
        <h2>Unable to confirm your order</h2>

        <p>
          The Stripe session ID is missing from this URL.
          Check My Orders before attempting payment again.
        </p>

        <Link
          to="/eats/orders/me/myOrders"
          className="btn btn-primary m-2"
        >
          Check My Orders
        </Link>

        <Link
          to="/"
          className="btn btn-success m-2"
        >
          Continue Shopping
        </Link>
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

          <p>{error}</p>

          <Link
            to="/eats/orders/me/myOrders"
            className="btn btn-primary m-2"
          >
            Check My Orders
          </Link>

          <Link
            to="/"
            className="btn btn-success m-2"
          >
            Continue Shopping
          </Link>
        </>
      ) : order ? (
        <>
          <h2>Your order has been placed successfully!</h2>

          <p>Thank you for ordering with OrderIt.</p>

          <Link
            to="/eats/orders/me/myOrders"
            className="btn btn-primary m-2"
          >
            Go to My Orders
          </Link>

          <Link
            to="/"
            className="btn btn-success m-2"
          >
            Continue Shopping
          </Link>
        </>
      ) : (
        <h2>Confirming your order...</h2>
      )}
    </div>
  );
};

export default OrderSuccess;
