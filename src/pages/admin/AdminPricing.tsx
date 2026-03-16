import { Navigate } from "react-router-dom";

export default function AdminPricing() {
  return <Navigate to="/admin/payments?tab=discounts" replace />;
}
