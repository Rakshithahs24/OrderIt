
import React from "react";
import { NavLink, Outlet } from "react-router-dom";

const AdminLayout = () => {
  return (
    <div className="container-fluid">
      <div className="row">
        {/* Sidebar */}
        <aside className="col-md-3 col-lg-2 bg-dark text-white min-vh-100 p-3">
          <h4 className="mb-4">Admin Panel</h4>

          <nav className="nav flex-column">
            <NavLink
              to="/admin/dashboard"
              end
              className={({ isActive }) =>
                `nav-link mb-2 ${
                  isActive ? "bg-primary text-white" : "text-white"
                }`
              }
            >
              Dashboard
            </NavLink>

            <NavLink
              to="/admin/restaurants"
              className={({ isActive }) =>
                `nav-link mb-2 ${
                  isActive ? "bg-primary text-white" : "text-white"
                }`
              }
            >
              Restaurant Management
            </NavLink>

            <NavLink
              to="/admin/food"
              className={({ isActive }) =>
                `nav-link mb-2 ${
                  isActive ? "bg-primary text-white" : "text-white"
                }`
              }
            >
              Food Management
            </NavLink>
            <NavLink
  to="/admin/orders"
  className={({ isActive }) =>
    `nav-link mb-2 ${
      isActive ? "bg-primary text-white" : "text-white"
    }`
  }
>
  Orders
</NavLink>
          </nav>
        </aside>

        {/* Current admin page */}
        <main className="col-md-9 col-lg-10 p-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;