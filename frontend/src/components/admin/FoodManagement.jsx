
import React, { useEffect, useState } from "react";
import api from "../../utils/api";

const createEmptyForm = () => ({
  name: "",
  price: "",
  description: "",
  isVeg: true,
  stock: "",
  restaurant: "",
  imageUrl: "",
});

const FoodManagement = () => {
  const [foodItems, setFoodItems] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingFoodId, setEditingFoodId] = useState(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState(createEmptyForm);

  const fetchFoodItems = async () => {
    setLoading(true);
    setError("");

    try {
      const restaurantResponse = await api.get("/v1/eats/stores");
      const restaurantList =
        restaurantResponse.data.restaurants || [];

      setRestaurants(restaurantList);

      const responses = await Promise.all(
        restaurantList.map((restaurant) =>
          api.get(`/v1/eats/items/${restaurant._id}`)
        )
      );

      const items = responses.flatMap((response, index) =>
        (response.data.data || []).map((food) => ({
          ...food,
          restaurantName:
            restaurantList[index]?.name || "Unknown restaurant",
        }))
      );

      // Keep the existing display behavior: show one card per food name.
      

      setFoodItems(items);
    } catch (err) {
      console.error("Failed to fetch food items:", err);
      setError(
        err.response?.data?.message ||
          "Unable to load food items. Check that the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFoodItems();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const openAddForm = () => {
    setEditingFoodId(null);
    setForm({
      ...createEmptyForm(),
      restaurant: restaurants[0]?._id || "",
    });
    setShowForm(true);
    setError("");
  };

  const handleEdit = (food) => {
      console.log("EDIT CLICKED:", food);

    setEditingFoodId(food._id);

    setForm({
      name: food.name || "",
      price: food.price ?? "",
      description: food.description || "",
      isVeg: Boolean(food.isVeg),
      stock: food.stock ?? "",
      restaurant: food.restaurant?._id || food.restaurant || "",
      imageUrl: food.images?.[0]?.url || "",
    });

    setShowForm(true);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.restaurant) {
      setError("Please select a restaurant.");
      return;
    }

    const trimmedImageUrl = form.imageUrl.trim();

    if (trimmedImageUrl) {
      try {
        const parsedUrl = new URL(trimmedImageUrl);

        if (
          parsedUrl.protocol !== "http:" &&
          parsedUrl.protocol !== "https:"
        ) {
          setError("Please enter a valid HTTP or HTTPS image URL.");
          return;
        }
      } catch {
        setError("Please enter a valid image URL.");
        return;
      }
    }

    const payload = {
      name: form.name.trim(),
      price: Number(form.price),
      description: form.description.trim(),
      isVeg: form.isVeg,
      stock: Number(form.stock),
      restaurant: form.restaurant,
      imageUrl: trimmedImageUrl,
    };

    try {
      if (editingFoodId) {
        // The current backend update handler expects an images array,
        // so convert the URL into the model's image structure.
        const updatePayload = { ...payload };
        delete updatePayload.imageUrl;

        updatePayload.images = trimmedImageUrl
          ? [
              {
                public_id: "default",
                url: trimmedImageUrl,
              },
            ]
          : [];

        await api.patch(
          `/v1/eats/item/${editingFoodId}`,
          updatePayload
        );
      } else {
        // The create controller already converts imageUrl to images.
        await api.post("/v1/eats/item", payload);
      }

      setShowForm(false);
      setEditingFoodId(null);
      setForm(createEmptyForm());

      await fetchFoodItems();
    } catch (err) {
      console.error("Failed to save food item:", err);
      setError(
        err.response?.data?.message ||
          "Unable to save food item. Check your admin login and required fields."
      );
    }
  };

  const handleDelete = async (foodId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this food item?"
    );

    if (!confirmed) return;

    setError("");

    try {
      await api.delete(`/v1/eats/item/${foodId}`);

      setFoodItems((previous) =>
        previous.filter((food) => food._id !== foodId)
      );
    } catch (err) {
      console.error("Failed to delete food item:", err);
      setError(
        err.response?.data?.message ||
          "Unable to delete food item. Check your admin login."
      );
    }
  };

  return (
    <div className="container-fluid p-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4">
        <div>
          <h1>Food Management</h1>
          <p className="text-muted">
            Add, view, update, and delete food items.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={openAddForm}
          disabled={restaurants.length === 0}
        >
          Add Food Item
        </button>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {showForm && (
        <div className="card shadow-sm p-4 mb-4">
          <h3 className="mb-3">
            {editingFoodId ? "Edit Food Item" : "Add Food Item"}
          </h3>

          <form onSubmit={handleSubmit}>
            <div className="form-group mb-3">
              <label htmlFor="foodName">Food Name</label>
              <input
                id="foodName"
                type="text"
                className="form-control"
                name="name"
                value={form.name}
                onChange={handleChange}
                maxLength={100}
                required
              />
            </div>

            <div className="form-group mb-3">
              <label htmlFor="foodRestaurant">Restaurant</label>
              <select
                id="foodRestaurant"
                className="form-control"
                name="restaurant"
                value={form.restaurant}
                onChange={handleChange}
                required
              >
                <option value="">Select restaurant</option>
                {restaurants.map((restaurant) => (
                  <option
                    key={restaurant._id}
                    value={restaurant._id}
                  >
                    {restaurant.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group mb-3">
              <label htmlFor="foodPrice">Price (₹)</label>
              <input
                id="foodPrice"
                type="number"
                min="0"
                step="0.01"
                className="form-control"
                name="price"
                value={form.price}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group mb-3">
              <label htmlFor="foodStock">
                Stock / Quantity Available
              </label>
              <input
                id="foodStock"
                type="number"
                min="0"
                className="form-control"
                name="stock"
                value={form.stock}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group mb-3">
              <label htmlFor="foodDescription">Description</label>
              <textarea
                id="foodDescription"
                className="form-control"
                name="description"
                value={form.description}
                onChange={handleChange}
                rows="3"
                required
              />
            </div>

            <div className="form-group mb-3">
              <label htmlFor="foodImageUrl">Food Image URL</label>
              <input
                id="foodImageUrl"
                type="url"
                className="form-control"
                name="imageUrl"
                value={form.imageUrl}
                onChange={handleChange}
                placeholder="Paste a direct image URL"
              />
              <small className="text-muted">
                Use a publicly accessible image URL beginning with
                http:// or https://.
              </small>
            </div>

            {form.imageUrl.trim() && (
              <div className="mb-3">
                <p className="mb-2">Image Preview</p>
                <img
                  src={form.imageUrl.trim()}
                  alt="Food preview"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                  onLoad={(e) => {
                    e.currentTarget.style.display = "block";
                  }}
                  style={{
                    width: "200px",
                    height: "140px",
                    objectFit: "cover",
                    borderRadius: "8px",
                  }}
                />
              </div>
            )}

            <div className="form-check mb-3">
              <input
                type="checkbox"
                className="form-check-input"
                id="foodIsVeg"
                name="isVeg"
                checked={form.isVeg}
                onChange={handleChange}
              />
              <label
                className="form-check-label"
                htmlFor="foodIsVeg"
              >
                Vegetarian
              </label>
            </div>

            <button
              type="submit"
              className="btn btn-success mr-2"
            >
              {editingFoodId ? "Save Changes" : "Add Food Item"}
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setShowForm(false);
                setEditingFoodId(null);
                setForm(createEmptyForm());
                setError("");
              }}
            >
              Cancel
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <p>Loading food items...</p>
      ) : foodItems.length === 0 ? (
        <div className="alert alert-info">
          No food items found. You can add a food item using the
          button above.
        </div>
      ) : (
        <div className="row">
          {foodItems.map((food) => (
            <div
              className="col-sm-6 col-xl-4 mb-4"
              key={food._id}
            >
              <div className="card shadow-sm h-100">
                {food.images?.[0]?.url ? (
                  <img
                    src={food.images[0].url}
                    className="card-img-top"
                    alt={food.name}
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                    style={{
                      height: "190px",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <div
                    className="d-flex align-items-center justify-content-center bg-light text-muted"
                    style={{ height: "190px" }}
                  >
                    No image available
                  </div>
                )}

                <div className="card-body">
                  <h4>{food.name}</h4>

                  <p className="text-muted mb-2">
                    {food.restaurantName}
                  </p>

                  <p>
                    <strong>Price:</strong> ₹{food.price}
                  </p>

                  <p>
                    <strong>Type:</strong>{" "}
                    {food.isVeg ? "Veg" : "Non-Veg"}
                  </p>

                  <p>
                    <strong>Stock:</strong> {food.stock ?? 0}
                  </p>

                  <p>{food.description}</p>

                  <div className="d-flex flex-wrap">
                    <button
                      type="button"
                      className="btn btn-warning mr-2 mb-2"
                      onClick={() => handleEdit(food)}
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      className="btn btn-danger mb-2"
                      onClick={() => handleDelete(food._id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FoodManagement;