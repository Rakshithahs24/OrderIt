
import React, { useEffect, useState } from "react";
import api from "../../utils/api";

const initialRestaurant = () => ({
  name: "",
  address: "",
  isVeg: true,
  ratings: 0,
  location: {
    type: "Point",
    coordinates: [],
  },
});

const RestaurantManagement = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [showAddRestaurant, setShowAddRestaurant] = useState(false);
  const [newRestaurant, setNewRestaurant] = useState(initialRestaurant);
  const [coordsInput, setCoordsInput] = useState("");

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const { data } = await api.get("/v1/eats/stores");
        setRestaurants(data.restaurants || []);
      } catch (error) {
        console.error("Failed to fetch restaurants:", error);
        alert("Unable to load restaurants.");
      }
    };

    fetchRestaurants();
  }, []);

  const handleRestaurantChange = (e) => {
    const { name, value, checked } = e.target;

    if (name === "isVeg") {
      setNewRestaurant((prev) => ({
        ...prev,
        isVeg: checked,
      }));
      return;
    }

    if (name === "coordinates") {
      setCoordsInput(value);

      const coordinates = value
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item !== "")
        .map(Number);

      setNewRestaurant((prev) => ({
        ...prev,
        location: {
          ...prev.location,
          coordinates:
            coordinates.length === 2 &&
            coordinates.every(Number.isFinite)
              ? coordinates
              : [],
        },
      }));
      return;
    }

    if (name === "ratings") {
      setNewRestaurant((prev) => ({
        ...prev,
        ratings: value === "" ? "" : Number(value),
      }));
      return;
    }

    setNewRestaurant((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddRestaurant = async (e) => {
    e.preventDefault();

    if (
      newRestaurant.ratings === "" ||
      !Number.isFinite(newRestaurant.ratings) ||
      newRestaurant.ratings < 0 ||
      newRestaurant.ratings > 5
    ) {
      alert("Please enter a rating between 0 and 5.");
      return;
    }

    if (newRestaurant.location.coordinates.length !== 2) {
      alert("Enter coordinates like: 77.5946,12.9716");
      return;
    }

    try {
      const payload = {
        ...newRestaurant,
        ratings: Number(newRestaurant.ratings),
      };

      const { data } = await api.post(
        "/v1/eats/stores",
        payload
      );

      const createdRestaurant =
        data.data || data.restaurant;

      if (createdRestaurant) {
        setRestaurants((prev) => [
          ...prev,
          createdRestaurant,
        ]);
      } else {
        // Refresh the list if the API response has another format.
        const response = await api.get("/v1/eats/stores");
        setRestaurants(response.data.restaurants || []);
      }

      setNewRestaurant(initialRestaurant());
      setCoordsInput("");
      setShowAddRestaurant(false);

      alert("Restaurant created successfully!");
    } catch (error) {
      console.error("Failed to create restaurant:", error);
      alert(
        error.response?.data?.message ||
          "Unable to create restaurant. Check the backend."
      );
    }
  };

  const deleteRestaurant = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this restaurant?"
      )
    ) {
      return;
    }

    try {
      await api.delete(`/v1/eats/stores/${id}`);

      setRestaurants((prev) =>
        prev.filter((restaurant) => restaurant._id !== id)
      );

      alert("Restaurant deleted successfully!");
    } catch (error) {
      console.error("Failed to delete restaurant:", error);
      alert(
        error.response?.data?.message ||
          "Unable to delete restaurant."
      );
    }
  };

  return (
    <div className="container mt-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Restaurant Management</h1>

        <button
          type="button"
          className="btn btn-primary"
          onClick={() =>
            setShowAddRestaurant((prev) => !prev)
          }
        >
          {showAddRestaurant ? "Close" : "Add Restaurant"}
        </button>
      </div>

      {showAddRestaurant && (
        <div className="card p-4 mb-4 shadow">
          <h3 className="mb-4">Add Restaurant</h3>

          <form onSubmit={handleAddRestaurant}>
            <div className="form-group mb-3">
              <label htmlFor="restaurantName">
                Restaurant Name
              </label>
              <input
                id="restaurantName"
                type="text"
                name="name"
                className="form-control"
                value={newRestaurant.name}
                onChange={handleRestaurantChange}
                placeholder="Enter restaurant name"
                required
              />
            </div>

            <div className="form-group mb-3">
              <label htmlFor="restaurantAddress">
                Address
              </label>
              <input
                id="restaurantAddress"
                type="text"
                name="address"
                className="form-control"
                value={newRestaurant.address}
                onChange={handleRestaurantChange}
                placeholder="Enter restaurant address"
                required
              />
            </div>

            <div className="form-group mb-3">
              <label>
                <input
                  type="checkbox"
                  name="isVeg"
                  checked={newRestaurant.isVeg}
                  onChange={handleRestaurantChange}
                />{" "}
                Pure Veg
              </label>
            </div>

            <div className="form-group mb-3">
              <label htmlFor="restaurantRating">
                Restaurant Rating (0–5)
              </label>
              <input
                id="restaurantRating"
                type="number"
                name="ratings"
                className="form-control"
                min="0"
                max="5"
                step="0.1"
                value={newRestaurant.ratings}
                onChange={handleRestaurantChange}
                required
              />
              <small className="text-muted">
                Enter a rating such as 4.2 or 4.5.
              </small>
            </div>

            <div className="form-group mb-3">
              <label htmlFor="restaurantCoordinates">
                Coordinates
              </label>
              <input
                id="restaurantCoordinates"
                type="text"
                name="coordinates"
                className="form-control"
                value={coordsInput}
                onChange={handleRestaurantChange}
                placeholder="77.5946,12.9716"
                required
              />
              <small className="text-muted">
                Enter longitude,latitude.
              </small>
            </div>

            <button type="submit" className="btn btn-success">
              Add Restaurant
            </button>

            <button
              type="button"
              className="btn btn-secondary ml-2"
              onClick={() => {
                setShowAddRestaurant(false);
                setNewRestaurant(initialRestaurant());
                setCoordsInput("");
              }}
            >
              Cancel
            </button>
          </form>
        </div>
      )}

      <div className="row">
        {restaurants.map((restaurant) => (
          <div
            className="col-md-6 col-lg-4 mb-4"
            key={restaurant._id}
          >
            <div className="card p-3 shadow h-100">
              <h4>{restaurant.name}</h4>

              <p>
                <strong>Address:</strong>{" "}
                {restaurant.address}
              </p>

              <p>
                <strong>Type:</strong>{" "}
                {restaurant.isVeg ? "Veg" : "Non-Veg"}
              </p>

              <p>
                <strong>Rating:</strong>{" "}
                {Number(restaurant.ratings ?? 0).toFixed(1)} / 5
              </p>

              <button
                type="button"
                className="btn btn-danger mt-2"
                onClick={() => deleteRestaurant(restaurant._id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {restaurants.length === 0 && (
        <p>No restaurants found.</p>
      )}
    </div>
  );
};

export default RestaurantManagement;