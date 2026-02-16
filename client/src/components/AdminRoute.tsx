import { ReactNode } from "react";
import { Navigate } from "react-router-dom";

import { useAuth } from "@/context/AuthContext";

export default function AdminRoute({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="container py-10 text-center text-muted-foreground">Yuklanmoqda...</div>;
  }

  if (!user) return <Navigate to="/kirish" replace />;
  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") return <Navigate to="/" replace />;

  return <>{children}</>;
}
