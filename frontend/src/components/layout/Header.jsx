import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, Route, Routes } from "react-router-dom";
import { logout } from "../../redux/actions/userActions";

import { toast } from "react-toastify";

import Search from "./Search";
import "../../App.css";

const Header = () => {
  const dispatch = useDispatch();

  const { user, loading } = useSelector((state) => state.user);
  const { cartItems = [] } = useSelector((state) => state.cart);

  const logoutHandler = () => {
    dispatch(logout());
    toast.success("Logged out successfully");
  };

  return (
    <>
      <nav className="navbar row sticky-top">

        {/* LOGO */}
        <div className="col-12 col-md-3">
          <Link to="/">
            <img
              src="/images/logo.webp"
              alt="logo"
              className="logo"
            />
          </Link>
        </div>

        {/* SEARCH */}
        <div className="col-12 col-md-6 mt-2 mt-md-0">
          <Routes>
            <Route path="/" element={<Search />} />

            <Route
              path="/eats/stores/search/:keyword"
              element={<Search />}
            />
          </Routes>
        </div>

        {/* RIGHT SIDE */}
        <div className="col-12 col-md-3 mt-4 mt-md-0 text-center">

          {/* CART */}
          <Link
            to="/cart"
            style={{
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
            }}
          >
            <span id="cart">
              Cart
            </span>

            <span id="cart_count">
              {cartItems.length}
            </span>
          </Link>

          {/* LOGGED-IN USER */}
          {user ? (
            <div className="ml-4 dropdown d-inline">

              <Link
                to="/"
                className="btn dropdown-toggle text-white mr-4"
                id="dropDownMenuButton"
                data-toggle="dropdown"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  whiteSpace: "nowrap",
                }}
              >

                {/* USER AVATAR */}
                {user?.avatar?.url ? (
                  <img
                    src={user.avatar.url}
                    alt={user.name || "User"}
                    className="rounded-circle"
                    style={{
                      width: "35px",
                      height: "35px",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <div
                    className="rounded-circle"
                    style={{
                      width: "35px",
                      height: "35px",
                      backgroundColor: "#ffffff",
                      color: "#087f3e",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "bold",
                    }}
                  >
                    {user?.name
                      ? user.name.charAt(0).toUpperCase()
                      : "U"}
                  </div>
                )}

                {/* USER NAME */}
                <span>
                  {user?.name || "User"}
                </span>
              </Link>

              {/* DROPDOWN */}
              <div className="dropdown-menu">

                <Link
                  className="dropdown-item"
                  to="/eats/orders/me/myOrders"
                >
                  Orders
                </Link>

                <Link
                  className="dropdown-item"
                  to="/users/me"
                >
                  Profile
                </Link>

                <Link
                  className="dropdown-item text-danger"
                  to="/"
                  onClick={logoutHandler}
                >
                  Logout
                </Link>

              </div>
            </div>
          ) : (
            !loading && (
              <Link
                to="/users/login"
                className="btn ml-4"
                id="login_btn"
              >
                Login
              </Link>
            )
          )}
        </div>
      </nav>
    </>
  );
};

export default Header;