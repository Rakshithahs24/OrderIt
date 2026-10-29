
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingOrder, setUpdatingOrder] = useState(null);

  const navigate = useNavigate();

  // Fetch all orders
  const fetchOrders = async () => {
    try {
      setLoading(true);

      const { data } = await api.get(
        "/v1/eats/orders/admin/orders"
      );

      setOrders(data.orders || []);
      setError("");
    } catch (err) {
      console.error("Failed to fetch admin orders:", err);

      setError(
        err.response?.data?.message ||
          "Unable to load orders."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Update order status
  const updateStatus = async (orderId, status) => {
    try {
      setUpdatingOrder(orderId);

      const { data } = await api.put(
        `/v1/eats/orders/admin/orders/${orderId}`,
        { status }
      );

      setOrders((previousOrders) =>
        previousOrders.map((order) =>
          order._id === orderId
            ? {
                ...order,
                orderStatus:
                  data.order?.orderStatus || status,
              }
            : order
        )
      );
    } catch (err) {
      console.error("Failed to update order status:", err);

      alert(
        err.response?.data?.message ||
          "Failed to update order status."
      );

      // Reload the server's current order data
      await fetchOrders();
    } finally {
      setUpdatingOrder(null);
    }
  };

  if (loading) {
    return (
      <div className="container p-4">
        <h1>Orders</h1>
        <p>Loading orders...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container p-4">
        <h1>Orders</h1>
        <div className="alert alert-danger">{error}</div>

        <button
          className="btn btn-primary"
          onClick={fetchOrders}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="container-fluid p-4">
      <h1 className="mb-4">All Orders</h1>

      {orders.length === 0 ? (
        <div className="alert alert-info">
          There are no orders to display.
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-bordered table-striped">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Restaurant</th>
                <th>Food</th>
                <th>Amount</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Details</th>
              </tr>
            </thead>

            <tbody>
              {orders.map((order) => (
                <tr key={order._id}>
                  <td>{order._id}</td>

                  <td>
                    {order.user?.name || "N/A"}
                  </td>

                  <td>
                    {order.restaurant?.name || "N/A"}
                  </td>

                  <td>
                    {order.orderItems?.length ? (
                      order.orderItems.map((item, index) => (
                        <div key={item._id || index}>
                          {item.name || "Food item"} ×{" "}
                          {item.quantity}
                        </div>
                      ))
                    ) : (
                      "No items"
                    )}
                  </td>

                  <td>₹{order.finalTotal ?? 0}</td>

                  <td>
                    {order.paymentInfo?.status || "N/A"}
                  </td>

                  <td>
                    <select
                      className="form-select"
                      value={order.orderStatus || "Processing"}
                      disabled={updatingOrder === order._id}
                      onChange={(e) =>
                        updateStatus(
                          order._id,
                          e.target.value
                        )
                      }
                    >
                      <option value="Processing">
                        Processing
                      </option>
                      <option value="Shipped">
                        Shipped
                      </option>
                      <option value="Delivered">
                        Delivered
                      </option>
                      <option value="Cancelled">
                        Cancelled
                      </option>
                    </select>

                    {updatingOrder === order._id && (
                      <small className="text-muted">
                        Updating...
                      </small>
                    )}
                  </td>

                  <td>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() =>
                        navigate(`/eats/orders/${order._id}`)
                      }
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
