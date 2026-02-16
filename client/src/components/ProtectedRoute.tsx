import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "@/context/AuthContext";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="container py-10 text-center text-muted-foreground">Yuklanmoqda...</div>;
  }

  if (!user) {
    return <Navigate to="/kirish" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
}
