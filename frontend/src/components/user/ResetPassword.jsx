import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../utils/api";
import { toast } from "react-toastify";

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  const submitHandler = async (e) => {
    e.preventDefault();

    // Check passwords
    if (password !== passwordConfirm) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      // Send new password to backend
      const { data } = await api.patch(
        `/v1/users/resetPassword/${token}`,
        {
          password,
          passwordConfirm,
        }
      );

      console.log("RESET PASSWORD SUCCESS:", data);

      toast.success(
        data.message || "Password reset successfully"
      );

      // Go to login page
      setTimeout(() => {
        navigate("/users/login");
      }, 1500);

    } catch (error) {
      console.log(
        "RESET PASSWORD ERROR:",
        error.response?.data || error.message
      );

      toast.error(
        error.response?.data?.message ||
          "Password reset failed"
      );
    }
  };

  return (
    <div className="row wrapper">
      <div className="col-10 col-lg-5">
        <form
          className="shadow-lg"
          onSubmit={submitHandler}
        >
          <h1 className="mb-3">Reset Password</h1>

          {/* New Password */}
          <div className="form-group">
            <label htmlFor="password">
              New Password
            </label>

            <input
              type="password"
              id="password"
              className="form-control"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              placeholder="Enter new password"
              minLength={6}
              required
            />
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <label htmlFor="passwordConfirm">
              Confirm Password
            </label>

            <input
              type="password"
              id="passwordConfirm"
              className="form-control"
              value={passwordConfirm}
              onChange={(e) =>
                setPasswordConfirm(e.target.value)
              }
              placeholder="Confirm new password"
              minLength={6}
              required
            />
          </div>

          {/* Reset Button */}
          <button
            type="submit"
            className="btn btn-block py-3"
          >
            RESET PASSWORD
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;