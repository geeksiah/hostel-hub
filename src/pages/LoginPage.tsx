import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Building2 } from "lucide-react";
import { toast } from "sonner";
import { Container } from "@/components/shared/Container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApp } from "@/contexts/AppContext";
import { useSiteContext } from "@/contexts/SiteContext";
import { getSiteHostels } from "@/modules/site/selectors";
import type { UserRole } from "@/types";

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
    <div className="min-h-screen bg-background">
      <Container className="flex min-h-screen items-center justify-center py-10">
        <div className="w-full max-w-[440px] space-y-6">
          <Link to={buildPublicPath("/")} className="inline-flex items-center gap-2 font-display text-lg font-semibold tracking-tight text-foreground">
            <Building2 className="h-5 w-5 text-secondary" />
            {activeTheme?.logoText ?? "HostelHub"}
          </Link>

          <div className="surface-card p-6 sm:p-8">
            <div className="space-y-3">
              <p className="text-[12px] font-medium uppercase tracking-[0.22em] text-muted-foreground">Sign in</p>
              <h1 className="font-display text-[2rem] font-semibold tracking-tight text-foreground">Welcome back</h1>
              <p className="text-sm leading-6 text-muted-foreground">
                Sign in to continue to {scopedHostel?.name ?? activeTheme?.logoText ?? "your hostel portal"}.
              </p>
            </div>

            <div className="mt-8 space-y-5">
              <div className="space-y-2.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                />
              </div>

              <div className="space-y-2.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                />
              </div>

              <Button variant="emerald" size="lg" className="w-full" onClick={() => void handleLogin()}>
                Sign in
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            New resident?{" "}
            <Link to={buildPublicPath("/register")} className="font-medium text-secondary transition-colors hover:text-secondary/80">
              Create account
            </Link>
          </p>
        </div>
      </Container>
    </div>
  );
}
