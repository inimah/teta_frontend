import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getAuth, isTokenExpired } from "../../lib/auth";

const RequireAdmin: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const location = useLocation();
  const { token, user } = getAuth();

  if (!token || !user || user.role !== "admin" || isTokenExpired(token)) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return children;
};

export default RequireAdmin;
