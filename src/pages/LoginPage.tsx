import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Building2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApp } from "@/contexts/AppContext";
import { useSiteContext } from "@/contexts/SiteContext";
import type { UserRole } from "@/types";
import { getSiteHostels } from "@/modules/site/selectors";

function resolveRoute(role: UserRole, hasPendingBooking: boolean) {
  if (hasPendingBooking && role === "resident") return "/payment";
  if (role === "platform_owner") return "/platform";
  if (role === "tenant_admin") return "/admin";
  if (role === "group_organizer") return "/group-booking";
  return "/resident";
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { database, login, session } = useApp();
  const { activeTheme, buildPublicPath, preferredSite } = useSiteContext();
  const [email, setEmail] = useState("sarah@ug.edu.gh");
  const [password, setPassword] = useState("");
  const scopedHostel = useMemo(
    () => (database && preferredSite ? getSiteHostels(database, preferredSite)[0] : undefined),
    [database, preferredSite],
  );

  const handleLogin = async () => {
    const result = await login("resident", email);
    if (!result.user) {
      toast.error(result.error ?? "No matching demo account found.");
      return;
    }
    toast.success(`Signed in as ${result.user.name}.`);
    navigate(resolveRoute(result.user.role, Boolean(session.pendingBooking)));
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md space-y-6 lg:max-w-lg">
        <div className="text-center space-y-2">
          <Link to={buildPublicPath("/")} className="inline-flex items-center gap-2 font-display text-xl font-bold">
            <Building2 className="h-6 w-6 text-secondary" />
            {activeTheme?.logoText ?? "HostelHub"}
          </Link>
          <p className="text-sm text-muted-foreground">
            Sign in to continue to {scopedHostel?.name ?? activeTheme?.logoText ?? "your hostel portal"}.
          </p>
        </div>

        <div className="rounded-xl border bg-card p-6 space-y-4">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
          </div>
          <div className="space-y-2">
            <Label>Password</Label>
            <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Demo password" />
          </div>

          <Button variant="emerald" className="w-full" onClick={() => void handleLogin()}>
            Resident login
          </Button>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          New to {scopedHostel?.name ?? "this hostel"}?{" "}
          <Link to="/register" className="font-medium text-emerald">
            Create your account
          </Link>
        </p>
      </div>
    </div>
  );
}
