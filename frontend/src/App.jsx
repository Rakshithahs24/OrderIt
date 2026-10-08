import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";

import "./App.css";

// Admin components
import AdminLayout from "./components/AdminLayout";
import AdminDashboard from "./components/AdminDashboard";
import RestaurantManagement from "./components/admin/RestaurantManagement";
import FoodManagement from "./components/admin/FoodManagement";
import AdminOrders from "./components/admin/AdminOrders";

// General components
import Home from "./components/Home";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import Menu from "./components/Menu";

// Redux
import { loadUser } from "./redux/actions/userActions";
import store from "./redux/store";

// User components
import Login from "./components/user/Login";
import Register from "./components/user/Register";
import Profile from "./components/user/Profile";
import UpdateProfile from "./components/user/UpdateProfile";
import ForgotPassword from "./components/user/ForgotPassword";
import ResetPassword from "./components/user/ResetPassword";

// Cart components
import Cart from "./components/cart/Cart";
import OrderSuccess from "./components/cart/OrderSuccess";

// Order components
import ListOrders from "./components/order/ListOrders";
import OrderDetails from "./components/order/OrderDetails";

// Notifications
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  useEffect(() => {
    store.dispatch(loadUser());
  }, []);

  return (
    <>
      <ToastContainer />

      <Router>
        <div className="App">
          <Header />

          <div className="container container-fluids">
            <Routes>

              {/* HOME */}
              <Route
                path="/"
                element={<Home />}
              />

              {/* SEARCH */}
              <Route
                path="/eats/stores/search/:keyword"
                element={<Home />}
              />

              {/* RESTAURANT MENU */}
              <Route
                path="/eats/stores/:id/menus"
                element={<Menu />}
              />

              {/* ADMIN PAGES WITH SIDEBAR */}
              <Route
                path="/admin"
                element={<AdminLayout />}
              >
                <Route
                  path="dashboard"
                  element={<AdminDashboard />}
                />

                <Route
                  path="restaurants"
                  element={<RestaurantManagement />}
                />

                <Route
                  path="food"
                  element={<FoodManagement />}
                />

                {/* ADMIN ORDERS */}
                <Route
                  path="orders"
                  element={<AdminOrders />}
                />
              </Route>

              {/* USER ROUTES */}
              <Route
                path="/users/login"
                element={<Login />}
              />

              <Route
                path="/users/signup"
                element={<Register />}
              />

              <Route
                path="/users/me"
                element={<Profile />}
              />

              <Route
                path="/users/me/update"
                element={<UpdateProfile />}
              />

              <Route
                path="/users/forgetPassword"
                element={<ForgotPassword />}
              />

              <Route
                path="/password/reset/:token"
                element={<ResetPassword />}
              />

              {/* CART */}
              <Route
                path="/cart"
                element={<Cart />}
              />

              {/* ORDER SUCCESS */}
              <Route
                path="/success"
                element={<OrderSuccess />}
              />

              {/* CUSTOMER MY ORDERS */}
              <Route
                path="/eats/orders/me/myOrders"
                element={<ListOrders />}
              />

              {/* ORDER DETAILS */}
              <Route
                path="/eats/orders/:id"
                element={<OrderDetails />}
              />

            </Routes>
          </div>

          <Footer />
        </div>
      </Router>
    </>
  );
}

export default App;