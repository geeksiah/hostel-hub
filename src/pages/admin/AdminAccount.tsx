import { Navigate } from "react-router-dom";

export default function AdminAccount() {
  return <Navigate to="/admin/settings?tab=my-profile" replace />;
}
