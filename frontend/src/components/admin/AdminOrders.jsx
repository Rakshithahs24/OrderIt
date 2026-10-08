import React, { useEffect, useState } from "react";
import api from "../../utils/api";

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingOrder, setUpdatingOrder] = useState(null);

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
        {
          status,
        }
      );

      // Update the order in the current page
      setOrders((previousOrders) =>
        previousOrders.map((order) =>
          order._id === orderId
            ? {
                ...order,
                orderStatus: data.order.orderStatus,
              }
            : order
        )
      );

      console.log("Order status updated successfully");
    } catch (err) {
      console.error(
        "Failed to update order status:",
        err
      );

      alert(
        err.response?.data?.message ||
          "Failed to update order status."
      );
    } finally {
      setUpdatingOrder(null);
    }
  };

  // Loading
  if (loading) {
    return (
      <div className="container p-4">
        <h1>Orders</h1>
        <p>Loading orders...</p>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="container p-4">
        <h1>Orders</h1>

        <div className="alert alert-danger">
          {error}
        </div>
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
              </tr>
            </thead>

            <tbody>
              {orders.map((order) => (
                <tr key={order._id}>
                  {/* Order ID */}
                  <td>{order._id}</td>

                  {/* Customer */}
                  <td>
                    {order.user?.name || "N/A"}
                  </td>

                  {/* Restaurant */}
                  <td>
                    {order.restaurant?.name || "N/A"}
                  </td>

                  {/* Food */}
                  <td>
                    {order.orderItems?.map((item) => (
                      <div key={item._id}>
                        {item.name} × {item.quantity}
                      </div>
                    ))}
                  </td>

                  {/* Amount */}
                  <td>
                    ₹{order.finalTotal}
                  </td>

                  {/* Payment */}
                  <td>
                    {order.paymentInfo?.status || "N/A"}
                  </td>

                  {/* Order Status */}
                  <td>
                    <select
                      className="form-select"
                      value={
                        order.orderStatus || "Processing"
                      }
                      disabled={
                        updatingOrder === order._id
                      }
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