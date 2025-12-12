import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LoaderOverlay from "./LoaderOverlay";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRoles }) => {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return <LoaderOverlay message="Loading..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRoles && user && !requiredRoles.includes(user.role)) {
    // Redirect to appropriate dashboard based on role
    if (user.role === "ADMIN") {
      return <Navigate to="/admin" replace />;
    } else if (user.role === "MANAGER") {
      return <Navigate to="/manager" replace />;
    } else if (user.role === "EMPLOYEE") {
      return <Navigate to="/employee" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
