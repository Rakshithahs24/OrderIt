import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../utils/api";
import { toast } from "react-toastify";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  const submitHandler = async (e) => {
    e.preventDefault();

    try {
      const { data } = await api.post("/v1/users/forgetPassword", {
        email,
      });

      toast.success(data.message || "Password reset link sent to your email");

      setTimeout(() => {
        navigate("/users/login");
      }, 2000);
    } catch (error) {
  console.log(
    "FORGOT PASSWORD ERROR:",
    error.response?.data || error.message
  );

  toast.error(
    error.response?.data?.message || "Something went wrong"
  );
}
  };

  return (
    <div className="row wrapper">
      <div className="col-10 col-lg-5">
        <form className="shadow-lg" onSubmit={submitHandler}>
          <h1 className="mb-3">Forgot Password</h1>

          <div className="form-group">
            <label htmlFor="email_field">Email</label>

            <input
              type="email"
              id="email_field"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-block py-3"
          >
            SEND RESET LINK
          </button>

          <div className="mt-3 text-center">
            <Link to="/users/login">Back to Login</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;