
import React, { Fragment, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faIndianRupeeSign } from "@fortawesome/free-solid-svg-icons";

import Loader from "../layout/Loader";
import { getOrderDetails } from "../../redux/actions/orderActions";
import { clearErrors } from "../../redux/slices/orderSlice";

const OrderDetails = () => {
  const dispatch = useDispatch();
  const { id } = useParams();

  const { loading, error, order } = useSelector(
    (state) => state.order
  );

  useEffect(() => {
    dispatch(getOrderDetails(id));
  }, [dispatch, id]);

  useEffect(() => {
    if (error) {
      toast.error(error, { position: "bottom-right" });
      dispatch(clearErrors());
    }
  }, [error, dispatch]);

  const {
    _id,
    deliveryInfo = {},
    orderItems = [],
    paymentInfo = {},
    user = {},
    itemsPrice,
    deliveryCharge,
    finalTotal,
    orderStatus,
  } = order || {};

  const deliveryDetails = [
    deliveryInfo?.address,
    deliveryInfo?.city,
    deliveryInfo?.postalCode,
    deliveryInfo?.country,
  ]
    .filter(Boolean)
    .join(", ");

  const isPaid = paymentInfo?.status === "paid";

  if (loading) {
    return <Loader />;
  }

  if (!order || !order._id) {
    return (
      <div className="container mt-5">
        <h3>Order details not available.</h3>
        <Link to="/eats/orders/me/myOrders">
          Back to My Orders
        </Link>
      </div>
    );
  }

  return (
    <Fragment>
      <div className="row d-flex justify-content-between orderdetails">
        <div className="col-12 col-lg-8 mt-1 order-details">
          <h1 className="my-5">Order # {_id}</h1>

          {/* Delivery Information */}
          <h4 className="mb-4">Delivery Info</h4>

          <p>
            <b>Name:</b> {user?.name || "N/A"}
          </p>

          <p>
            <b>Phone:</b> {deliveryInfo?.phoneNo || "N/A"}
          </p>

          <p className="mb-4">
            <b>Address:</b> {deliveryDetails || "N/A"}
          </p>

          {/* Order Totals */}
          <div className="order-summary my-4">
            <p>
              <b>Food Total:</b>{" "}
              <FontAwesomeIcon
                icon={faIndianRupeeSign}
                size="xs"
              />{" "}
              {itemsPrice ?? 0}
            </p>

            <p>
              <b>Delivery Charge:</b>{" "}
              <FontAwesomeIcon
                icon={faIndianRupeeSign}
                size="xs"
              />{" "}
              {deliveryCharge ?? 0}
            </p>

            <p>
              <b>Grand Total:</b>{" "}
              <FontAwesomeIcon
                icon={faIndianRupeeSign}
                size="xs"
              />{" "}
              {finalTotal ?? 0}
            </p>
          </div>

          <hr />

          {/* Payment Status */}
          <h4 className="my-4">
            Payment :{" "}
            <span className={isPaid ? "greenColor" : "redColor"}>
              <b>{isPaid ? "PAID" : "NOT PAID"}</b>
            </span>
          </h4>

          {/* Order Status */}
          <h4 className="my-4">
            Order Status :{" "}
            <span
              className={
                orderStatus === "Delivered"
                  ? "greenColor"
                  : "redColor"
              }
            >
              <b>{orderStatus || "Pending"}</b>
            </span>
          </h4>

          {/* Order Items */}
          <h4 className="my-4">Order Items:</h4>
          <hr />

          <div
            className="cart-item my-1"
            style={{ minHeight: "100px" }}
          >
            {orderItems.length > 0 ? (
              orderItems.map((item) => (
                <div
                  key={item._id}
                  className="row my-5 align-items-center"
                >
                  <div className="col-4 col-lg-2">
                    <img
                      src={item.image}
                      alt={item.name || "Food item"}
                      height="60"
                      width="80"
                      style={{ objectFit: "cover" }}
                    />
                  </div>

                  <div className="col-8 col-lg-5">
                    <Link to="#">{item.name || "Food item"}</Link>
                  </div>

                  <div className="col-6 col-lg-2 mt-3 mt-lg-0">
                    <p>
                      <FontAwesomeIcon
                        icon={faIndianRupeeSign}
                        size="xs"
                      />{" "}
                      {item.price ?? 0}
                    </p>
                  </div>

                  <div className="col-6 col-lg-3 mt-3 mt-lg-0">
                    <p>{item.quantity ?? 0} Item(s)</p>
                  </div>
                </div>
              ))
            ) : (
              <p>No items found for this order.</p>
            )}
          </div>

          <hr />

          <Link
            to="/eats/orders/me/myOrders"
            className="btn btn-primary my-3"
          >
            Back to My Orders
          </Link>
        </div>
      </div>
    </Fragment>
  );
};

export default OrderDetails;