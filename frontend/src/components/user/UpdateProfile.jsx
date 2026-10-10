
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  updateProfile,
  loadUser,
} from "../../redux/actions/userActions";
import {
  clearErrors,
  updateReset,
} from "../../redux/slices/userSlice";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const UpdateProfile = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { user, error, isUpdated, loading } = useSelector(
    (state) => state.user
  );

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
      setPhoneNumber(user.phoneNumber || "");
      setAvatarPreview(user.avatar?.url || "");
    }
  }, [user]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearErrors());
    }
  }, [error, dispatch]);

  useEffect(() => {
    if (isUpdated) {
      toast.success("Profile updated successfully");
      dispatch(updateReset());
      dispatch(loadUser());
      navigate("/users/me");
    }
  }, [isUpdated, dispatch, navigate]);

  const submitHandler = (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("name", name.trim());
    formData.append("email", email.trim());
    formData.append("phoneNumber", phoneNumber.trim());

    if (avatar) {
      formData.append("avatar", avatar);
    }

    dispatch(updateProfile(formData));
  };

  const onChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image.");
      e.target.value = "";
      return;
    }

    setAvatar(file);

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        setAvatarPreview(reader.result);
      }
    };

    reader.onerror = () => {
      toast.error("Unable to preview this image.");
    };

    reader.readAsDataURL(file);
  };

  return (
    <div className="row wrapper">
      <div className="col-10 col-lg-5 updateprofile">
        <form
          className="shadow-lg"
          onSubmit={submitHandler}
          encType="multipart/form-data"
        >
          <h1 className="mt-2 mb-5">Update Profile</h1>

          <div className="form-group">
            <label htmlFor="name_field">Name</label>
            <input
              type="text"
              id="name_field"
              className="form-control"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email_field">Email</label>
            <input
              type="email"
              id="email_field"
              className="form-control"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="phoneNumber_field">
              Phone Number
            </label>
            <input
              type="tel"
              id="phoneNumber_field"
              className="form-control"
              name="phoneNumber"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="avatar_upload">Avatar</label>

            <div className="d-flex align-items-center">
              <figure className="avatar mr-3 item-rtl">
                {avatarPreview && (
                  <img
                    src={avatarPreview}
                    className="rounded-circle"
                    alt="Avatar preview"
                  />
                )}
              </figure>

              <div className="custom-file">
                <input
                  type="file"
                  name="avatar"
                  className="custom-file-input"
                  id="avatar_upload"
                  accept="image/*"
                  onChange={onChange}
                />

                <label
                  className="custom-file-label"
                  htmlFor="avatar_upload"
                >
                  Choose Avatar
                </label>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-block py-3"
            disabled={loading}
          >
            {loading ? "UPDATING..." : "UPDATE"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UpdateProfile;
