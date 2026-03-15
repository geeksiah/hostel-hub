import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Building2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthService } from "@/services";
import { useApp } from "@/contexts/AppContext";
import { useSiteContext } from "@/contexts/SiteContext";
import { getSiteHostels } from "@/modules/site/selectors";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { database, login, session } = useApp();
  const { activeTheme, buildPublicPath, preferredSite } = useSiteContext();
  const [residentType, setResidentType] = useState<"student" | "guest">("student");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const scopedHostel = useMemo(
    () => (database && preferredSite ? getSiteHostels(database, preferredSite)[0] : undefined),
    [database, preferredSite],
  );
  const schoolOptions = scopedHostel?.allowedSchools ?? (scopedHostel?.university ? [scopedHostel.university] : []);
  const [institution, setInstitution] = useState(schoolOptions[0] ?? "");

  const handleRegister = async () => {
    if (!name || !email || !phone) {
      toast.error("Fill in your name, email, and phone number.");
      return;
    }
    if (!scopedHostel) {
      toast.error("This hostel is not ready for resident signup yet.");
      return;
    }
    if (residentType === "student" && !institution) {
      toast.error("Choose your school to continue.");
      return;
    }

    await AuthService.register({
      name,
      email,
      phone,
      role: "resident",
      residentType,
      tenantId: scopedHostel.tenantId,
      hostelId: scopedHostel.id,
      institution: residentType === "student" ? institution : scopedHostel.university,
    });

    const result = await login("resident", email);
    if (!result.user) {
      toast.error(result.error ?? "The demo account could not be created.");
      return;
    }
    toast.success("Account created successfully.");
    navigate(session.pendingBooking ? "/payment" : "/resident");
  };

  if (!database) return <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">Loading signup...</div>;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md space-y-6 lg:max-w-lg">
        <div className="text-center space-y-2">
          <Link to={buildPublicPath("/")} className="inline-flex items-center gap-2 font-display text-xl font-bold">
            <Building2 className="h-6 w-6 text-secondary" />
            {activeTheme?.logoText ?? "HostelHub"}
          </Link>
          <p className="text-sm text-muted-foreground">Create your resident account for {scopedHostel?.name ?? "this hostel"}.</p>
        </div>

        <div className="rounded-xl border bg-card p-6 space-y-4">
          <div className="rounded-lg border bg-muted/40 p-4 text-sm">
            <p className="font-medium">{scopedHostel?.name ?? "Resident signup"}</p>
            <p className="mt-1 text-muted-foreground">Your account will stay inside this hostel portal after signup.</p>
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
          <div className="space-y-2">
            <Label>Account type</Label>
            <select
              value={residentType}
              onChange={(event) => {
                const nextType = event.target.value as typeof residentType;
                setResidentType(nextType);
                if (nextType === "guest") {
                  setInstitution("");
                } else if (!institution) {
                  setInstitution(schoolOptions[0] ?? "");
                }
              }}
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            >
              <option value="student">Student</option>
              <option value="guest">Guest</option>
            </select>
          </div>
          {residentType === "student" ? (
            <div className="space-y-2">
              <Label>School</Label>
              <select
                value={institution}
                onChange={(event) => setInstitution(event.target.value)}
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              >
                <option value="">Select your school</option>
                {schoolOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          <div className="space-y-2">
            <Label>Password</Label>
            <Input type="password" placeholder="Create a password" />
          </div>

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
