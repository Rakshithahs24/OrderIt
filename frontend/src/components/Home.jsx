import React, { useEffect, useState } from "react";

import {
  sortByRatings,
  sortByReviews,
  toggleVegOnly,
} from "../redux/slices/restaurantSlice";

import {
  createRestaurant,
  getRestaurants,
} from "../redux/actions/restaurantAction";

import Restaurant from "./Restaurant";
import Loader from "./layout/Loader";
import Message from "./Message";
import CountRestaurant from "./CountRestaurant";

import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";

const Home = () => {
  const dispatch = useDispatch();
  const { keyword } = useParams();

  const {
    loading: restaurantsLoading,
    error: restaurantsError,
    restaurants,
    showVegOnly,
    creating,
    createError,
  } = useSelector((state) => state.restaurants);

  const {
    isAuthenticated,
    user,
  } = useSelector((state) => state.user);

  // Fetch restaurants
  useEffect(() => {
    dispatch(getRestaurants(keyword));
  }, [dispatch, keyword]);

  // Sort by ratings
  const handleSortByRatings = () => {
    dispatch(sortByRatings());
  };

  // Sort by reviews
  const handleSortByReviews = () => {
    dispatch(sortByReviews());
  };

  // Toggle veg only
  const handleToggleVegOnly = () => {
    dispatch(toggleVegOnly());
  };

  // -------------------------------
  // ADMIN CREATE RESTAURANT
  // -------------------------------

  const [showCreate, setShowCreate] = useState(false);

  const [newRestaurant, setNewRestaurant] = useState({
    name: "",
    address: "",
    isVeg: false,
    location: {
      type: "Point",
      coordinates: [],
    },
    imageUrl: "",
  });

  const [coordsInput, setCoordsInput] = useState("");

  // Open create form
  const handleOpenCreate = () => {
    setCoordsInput(
      newRestaurant.location.coordinates.join(",")
    );

    setShowCreate(true);
  };

  // Close create form
  const handleCloseCreate = () => {
    setShowCreate(false);
    setCoordsInput("");
  };

  // Handle form input
  const handleChange = (e) => {
    const { name, value, checked } = e.target;

    // Pure veg checkbox
    if (name === "isVeg") {
      setNewRestaurant({
        ...newRestaurant,
        isVeg: checked,
      });
    }

    // Coordinates
    else if (name === "coordinates") {
      setCoordsInput(value);

      const parts = value
        .split(",")
        .map((v) => v.trim())
        .filter((v) => v !== "");

      const coords = parts
        .map((v) => parseFloat(v))
        .filter((n) => !isNaN(n));

      setNewRestaurant({
        ...newRestaurant,
        location: {
          ...newRestaurant.location,
          coordinates: coords,
        },
      });
    }

    // Image URL
    else if (name === "imageUrl") {
      setNewRestaurant({
        ...newRestaurant,
        imageUrl: value,
      });
    }

    // Name / Address
    else {
      setNewRestaurant({
        ...newRestaurant,
        [name]: value,
      });
    }
  };

  // Submit create restaurant
  const submitCreate = async (e) => {
    e.preventDefault();

    const payload = {
      name: newRestaurant.name,
      address: newRestaurant.address,
      isVeg: newRestaurant.isVeg,

      location: newRestaurant.location,

      images: [
        {
          public_id: "default",
          url: newRestaurant.imageUrl,
        },
      ],
    };

    const result = await dispatch(
      createRestaurant(payload)
    );

    // Close only when creation succeeds
    if (createRestaurant.fulfilled.match(result)) {
      handleCloseCreate();

      setNewRestaurant({
        name: "",
        address: "",
        isVeg: false,
        location: {
          type: "Point",
          coordinates: [],
        },
        imageUrl: "",
      });

      setCoordsInput("");
    }
  };

  return (
    <>
      <CountRestaurant />

      {/* Loading */}
      {restaurantsLoading ? (
        <Loader />
      ) : restaurantsError ? (
        /* Error */
        <Message variant="danger">
          {restaurantsError}
        </Message>
      ) : (
        <>
          <section>

            {/* SORT BUTTONS */}
            <div className="sort">

              <button
                className="sort_veg p-3"
                onClick={handleToggleVegOnly}
              >
                {showVegOnly ? "Show All" : "Pure Veg"}
              </button>

              <button
                className="sort_rev p-3"
                onClick={handleSortByReviews}
              >
                Sort By Reviews
              </button>

              <button
                className="sort_rate p-3"
                onClick={handleSortByRatings}
              >
                Sort By Ratings
              </button>

            </div>

            {/* RESTAURANTS */}
            <div className="row mt-4">

              {restaurants && restaurants.length > 0 ? (

                restaurants.map((restaurant) =>
                  !showVegOnly || restaurant.isVeg ? (
                    <Restaurant
                      key={restaurant._id}
                      restaurant={restaurant}
                    />
                  ) : null
                )

              ) : (

                <Message variant="info">
                  No restaurants Found.
                </Message>

              )}

              {/* ADMIN ADD RESTAURANT */}
              {isAuthenticated &&
                user &&
                user.role === "admin" && (

                  <div className="col-sm-12 col-md-6 col-lg-3 my-3">

                    <div
                      className="card p-3 rounded text-center d-flex align-items-center justify-content-center"
                      style={{ cursor: "pointer" }}
                      onClick={handleOpenCreate}
                    >

                      <h1 className="m-0">+</h1>

                      <p className="mb-0">
                        Add Restaurant
                      </p>

                    </div>

                  </div>
                )}

            </div>

            {/* CREATE RESTAURANT MODAL */}
            {showCreate && (

              <div className="create-modal">

                <div className="create-content">

                  <h3>Create Restaurant</h3>

                  <form onSubmit={submitCreate}>

                    {/* Create Error */}
                    {createError && (
                      <Message variant="danger">
                        {createError}
                      </Message>
                    )}

                    {/* NAME */}
                    <div className="form-group">

                      <label>Name</label>

                      <input
                        type="text"
                        name="name"
                        value={newRestaurant.name}
                        onChange={handleChange}
                        required
                      />

                    </div>

                    {/* ADDRESS */}
                    <div className="form-group">

                      <label>Address</label>

                      <input
                        type="text"
                        name="address"
                        value={newRestaurant.address}
                        onChange={handleChange}
                        required
                      />

                    </div>

                    {/* VEG */}
                    <div className="form-group">

                      <label>Pure Veg</label>

                      <input
                        type="checkbox"
                        name="isVeg"
                        checked={newRestaurant.isVeg}
                        onChange={handleChange}
                      />

                    </div>

                    {/* COORDINATES */}
                    <div className="form-group">

                      <label>
                        Coordinates (longitude,latitude)
                      </label>

                      <input
                        type="text"
                        name="coordinates"
                        value={coordsInput}
                        onChange={handleChange}
                        placeholder="e.g. -73.97,40.77"
                        required
                      />

                    </div>

                    {/* IMAGE URL */}
                    <div className="form-group">

                      <label>Image URL</label>

                      <input
                        type="text"
                        name="imageUrl"
                        value={newRestaurant.imageUrl}
                        onChange={handleChange}
                        placeholder="https://..."
                        required
                      />

                    </div>

                    {/* CREATE */}
                    <button
                      className="btn btn-primary"
                      type="submit"
                      disabled={creating}
                    >
                      {creating
                        ? "Creating..."
                        : "Create"}
                    </button>

                    {/* CANCEL */}
                    <button
                      className="btn btn-secondary ml-2"
                      type="button"
                      onClick={handleCloseCreate}
                    >
                      Cancel
                    </button>

                  </form>

                </div>

              </div>
            )}

          </section>
        </>
      )}
    </>
  );
};

export default Home;