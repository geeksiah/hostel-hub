import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Building2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApp } from "@/contexts/AppContext";
import { useSiteContext } from "@/contexts/SiteContext";
import type { UserRole } from "@/types";

const seededAccounts = [
  { role: "platform_owner" as const, label: "Platform owner", email: "owner@hostelhub.app" },
  { role: "tenant_admin" as const, label: "Manager", email: "ops@dreamlandliving.co" },
  { role: "tenant_admin" as const, label: "Receptionist", email: "frontdesk@dreamlandliving.co" },
  { role: "tenant_admin" as const, label: "Accountant", email: "finance@dreamlandliving.co" },
  { role: "tenant_admin" as const, label: "Security", email: "security@dreamlandliving.co" },
  { role: "resident" as const, label: "Resident", email: "sarah@ug.edu.gh" },
  { role: "group_organizer" as const, label: "Group organizer", email: "adaeze@fieldschool.africa" },
];

function resolveRoute(role: UserRole, hasPendingBooking: boolean) {
  if (hasPendingBooking && role === "resident") return "/payment";
  if (role === "platform_owner") return "/platform";
  if (role === "tenant_admin") return "/admin";
  if (role === "group_organizer") return "/group-booking";
  return "/resident";
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, session } = useApp();
  const { activeTheme, buildPublicPath } = useSiteContext();
  const [email, setEmail] = useState("sarah@ug.edu.gh");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("resident");

  const handleLogin = async (targetRole: UserRole, loginEmail?: string) => {
    const result = await login(targetRole, loginEmail ?? email);
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
          <p className="text-sm text-muted-foreground">Sign in to continue.</p>
        </div>

        <div className="rounded-xl border bg-card p-6 space-y-4">
          <div className="flex flex-wrap gap-2">
            {seededAccounts.map((account) => (
              <Button
                key={`${account.role}-${account.email}`}
                variant={role === account.role ? "emerald" : "outline"}
                size="sm"
                onClick={() => {
                  setRole(account.role);
                  setEmail(account.email);
                }}
              >
                {account.label}
              </Button>
            ))}
          </div>

          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
          </div>
          <div className="space-y-2">
            <Label>Password</Label>
            <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Demo password" />
          </div>

          <Button variant="emerald" className="w-full" onClick={() => handleLogin(role)}>
            Sign in
          </Button>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Need an account?{" "}
          <Link to="/register" className="font-medium text-emerald">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
