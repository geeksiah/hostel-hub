import { Navigate, useSearchParams } from "react-router-dom";

export default function AdminWaitingList() {
  const [searchParams] = useSearchParams();
  const next = new URLSearchParams(searchParams);
  next.set("tab", "waitlist");
  return <Navigate to={`/admin/bookings?${next.toString()}`} replace />;
}
