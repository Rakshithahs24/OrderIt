
import React from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import Loader from "../layout/Loader";

const Profile = () => {
  const { user, loading } = useSelector((state) => state.user);

  if (loading) {
    return <Loader />;
  }

  if (!user) {
    return (
      <div className="container mt-5">
        <h3>Unable to load profile.</h3>
        <p>Please log in again.</p>
        <Link to="/login" className="btn btn-primary">
          Go to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="row justify-content-around mt-5 user-info">
      <div className="col-12 col-md-5 profile">
        <div className="d-flex align-items-center mb-4">
          <figure className="avatar avatar-profile text-center mr-3">
            
{user?.avatar?.url ? (
  <img
    className="rounded-circle figure-img img-fluid"
    src={user.avatar.url}
    alt="User Avatar"
    onError={(event) => {
      console.error("Avatar failed to load:", event.currentTarget.src);
    }}
  />
) : (
  <div className="rounded-circle d-flex align-items-center justify-content-center">
    {user?.name?.charAt(0)?.toUpperCase() || "U"}
  </div>
)}

              
          </figure>

          <span>Welcome {user.name || "User"}!</span>
        </div>

        <Link
          to="/users/me/update"
          id="edit_profile"
          className="btn btn-primary btn-block my-5"
        >
          Edit Profile
        </Link>

        <h4>Full Name:</h4>
        <p>{user.name || "Not available"}</p>

        <h4>Email Address:</h4>
        <p>{user.email || "Not available"}</p>
        <h4>Phone Number:</h4>
<p>{user.phoneNumber || "Not available"}</p>

        <h4>Joined On:</h4>
        <p>
          {user.createdAt
            ? String(user.createdAt).substring(0, 10)
            : "Not available"}
        </p>
      </div>
    </div>
  );
};

export default Profile;
