
import React from "react";
import { useNavigate } from "react-router-dom";

const BackButton = ({
  label = "Back",
  to = "/",
}) => {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      className="btn btn-outline-secondary mb-3"
      onClick={() => navigate(to)}
    >
      ← {label}
    </button>
  );
};

export default BackButton;
