import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Building2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthService } from "@/services";
import { useApp } from "@/contexts/AppContext";
import { useSiteContext } from "@/contexts/SiteContext";
import type { TenantType, UserRole } from "@/types";

const accountTypes = [
  { value: "resident" as const, label: "Student / Guest", description: "Book a room, pay, get receipts, and raise tickets." },
  { value: "tenant_admin" as const, label: "Hostel operator", description: "Create your hostel profile and manage operations." },
  { value: "group_organizer" as const, label: "Group organizer", description: "Request and pay for multi-bed allocations." },
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useApp();
  const { activeTheme, buildPublicPath } = useSiteContext();
  const [role, setRole] = useState<UserRole>("resident");
  const [residentType, setResidentType] = useState<"student" | "guest">("student");
  const [tenantAccountType, setTenantAccountType] = useState<TenantType>("single");
  const [hostelLimit, setHostelLimit] = useState(3);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const handleRegister = async () => {
    if (!name || !email || !phone) {
      toast.error("Fill in your name, email, and phone number.");
      return;
    }

    await AuthService.register({
      name,
      email,
      phone,
      role,
      residentType,
      tenantAccountType,
      hostelLimit,
    });

    if (role === "tenant_admin") {
      toast.success("Signup received. A platform owner must approve this tenant account before login.");
      navigate("/login");
      return;
    }

    const result = await login(role, email);
    if (!result.user) {
      toast.error(result.error ?? "The demo account could not be created.");
      return;
    }
    toast.success("Account created successfully.");
    navigate(role === "group_organizer" ? "/group-booking" : "/resident");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md space-y-6 lg:max-w-lg">
        <div className="text-center space-y-2">
          <Link to={buildPublicPath("/")} className="inline-flex items-center gap-2 font-display text-xl font-bold">
            <Building2 className="h-6 w-6 text-secondary" />
            {activeTheme?.logoText ?? "HostelHub"}
          </Link>
          <p className="text-sm text-muted-foreground">Create your account.</p>
        </div>

        <div className="rounded-xl border bg-card p-6 space-y-4">
          <div className="space-y-3">
            {accountTypes.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setRole(item.value)}
                className={`w-full rounded-lg border p-3 text-left transition ${role === item.value ? "border-emerald bg-emerald-light" : "hover:bg-muted"}`}
              >
                <p className="font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <Label>Full name</Label>
            <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Kwesi Owusu" />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+233 24 000 0000" />
          </div>
          {role === "resident" ? (
            <div className="space-y-2">
              <Label>Resident type</Label>
              <select
                value={residentType}
                onChange={(event) => setResidentType(event.target.value as typeof residentType)}
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              >
                <option value="student">Student</option>
                <option value="guest">Individual guest</option>
              </select>
            </div>
          ) : role === "tenant_admin" ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Tenant account type</Label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {[
                    { value: "single" as const, label: "Single", description: "One hostel under one tenant account." },
                    { value: "fleet" as const, label: "Fleet", description: "Multiple hostels with a platform-approved cap." },
                  ].map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setTenantAccountType(item.value)}
                      className={`rounded-lg border p-3 text-left transition ${tenantAccountType === item.value ? "border-emerald bg-emerald-light" : "hover:bg-muted"}`}
                    >
                      <p className="font-medium">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </button>
                  ))}
                </div>
              </div>
              {tenantAccountType === "fleet" ? (
                <div className="space-y-2">
                  <Label>Expected hostel capacity</Label>
                  <Input
                    type="number"
                    min={2}
                    value={hostelLimit}
                    onChange={(event) => setHostelLimit(Math.max(2, Number(event.target.value || 2)))}
                    placeholder="3"
                  />
                  <p className="text-xs text-muted-foreground">Platform owner approval will decide the final fleet limit.</p>
                </div>
              ) : null}
              <div className="space-y-2">
                <Label>Password</Label>
                <Input type="password" placeholder="Demo password" />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Password</Label>
              <Input type="password" placeholder="Demo password" />
            </div>
          )}

          <Button variant="emerald" className="w-full" onClick={handleRegister}>
            Create account
          </Button>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-emerald">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
