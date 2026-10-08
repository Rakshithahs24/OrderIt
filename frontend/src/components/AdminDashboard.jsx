
import React, { useEffect, useState } from "react";
import api from "../utils/api";

const AdminDashboard = () => {
  const [userCount, setUserCount] = useState(0);
  const [restaurantCount, setRestaurantCount] = useState(0);
  const [foodItemCount, setFoodItemCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getDashboardData = async () => {
      try {
        // Get user count
        const userResponse = await api.get(
          "/v1/users/admin/user-count"
        );

        setUserCount(userResponse.data.count ?? 0);

        // Get restaurants
        const restaurantResponse = await api.get(
          "/v1/eats/stores"
        );

        const restaurantList =
          restaurantResponse.data.restaurants || [];

        setRestaurantCount(restaurantList.length);

        // Get food items from all restaurants
        const foodItemResponses = await Promise.all(
          restaurantList.map((restaurant) =>
            api.get(`/v1/eats/items/${restaurant._id}`)
          )
        );

        const allFoodItems = foodItemResponses.flatMap(
          (response) => response.data.data || []
        );

        // Count unique food names
        const uniqueFoodItems = allFoodItems.filter(
          (food, index, items) =>
            items.findIndex(
              (item) =>
                item.name.trim().toLowerCase() ===
                food.name.trim().toLowerCase()
            ) === index
        );

        setFoodItemCount(uniqueFoodItems.length);

        // Get orders
        const orderResponse = await api.get(
          "/v1/eats/orders/admin/orders"
        );

        const orders = orderResponse.data.orders || [];
        setOrderCount(orders.length);
      } catch (error) {
        console.error(
          "Failed to fetch dashboard data:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    getDashboardData();
  }, []);

  const dashboardCards = [
    {
      title: "Users",
      count: userCount,
      description: "Registered users",
    },
    {
      title: "Restaurants",
      count: restaurantCount,
      description: "Restaurants in the system",
    },
    {
      title: "Food Items",
      count: foodItemCount,
      description: "Unique food names",
    },
    {
      title: "Orders",
      count: orderCount,
      description: "Total orders",
    },
  ];

  return (
    <div className="container mt-5 mb-5">
      <h1 className="mb-2">Admin Dashboard</h1>

      <p className="text-muted mb-4">
        Overview of your food delivery platform.
      </p>

      {loading ? (
        <p>Loading dashboard data...</p>
      ) : (
        <div className="row">
          {dashboardCards.map((card) => (
            <div
              className="col-sm-6 col-lg-3 mb-4"
              key={card.title}
            >
              <div className="card p-4 text-center shadow h-100">
                <h4>{card.title}</h4>

                <h2 className="my-3">{card.count}</h2>

                <p className="text-muted mb-0">
                  {card.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="card p-4 mt-3 shadow-sm">
        <h4>Welcome to the Admin Panel</h4>
        <p className="text-muted mb-0">
          Use the Restaurant Management and Food Management
          pages to manage your platform.
        </p>
      </div>
    </div>
  );
};

export default AdminDashboard;