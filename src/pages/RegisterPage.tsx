import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Building2 } from "lucide-react";
import { toast } from "sonner";
import { Container } from "@/components/shared/Container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
    <div className="min-h-screen bg-background">
      <Container className="flex min-h-screen items-center justify-center py-10">
        <div className="w-full max-w-[520px] space-y-6">
          <Link to={buildPublicPath("/")} className="inline-flex items-center gap-2 font-display text-lg font-semibold tracking-tight text-foreground">
            <Building2 className="h-5 w-5 text-secondary" />
            {activeTheme?.logoText ?? "HostelHub"}
          </Link>

          <div className="surface-card p-6 sm:p-8">
            <div className="space-y-3">
              <p className="text-[12px] font-medium uppercase tracking-[0.22em] text-muted-foreground">Create account</p>
              <h1 className="font-display text-[2rem] font-semibold tracking-tight text-foreground">Join the hostel portal</h1>
              <p className="text-sm leading-6 text-muted-foreground">
                Create your resident profile for {scopedHostel?.name ?? "this hostel"}.
              </p>
            </div>

            <div className="mt-8 grid gap-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2.5">
                  <Label htmlFor="full-name">Full name</Label>
                  <Input id="full-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Kwesi Owusu" />
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+233 24 000 0000" />
                </div>
              </div>

              <div className="space-y-2.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2.5">
                  <Label>Account type</Label>
                  <Select
                    value={residentType}
                    onValueChange={(value: "student" | "guest") => {
                      setResidentType(value);
                      if (value === "guest") {
                        setInstitution("");
                      } else if (!institution) {
                        setInstitution(schoolOptions[0] ?? "");
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select account type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="guest">Guest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {residentType === "student" ? (
                  <div className="space-y-2.5">
                    <Label>School</Label>
                    <Select value={institution} onValueChange={setInstitution}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your school" />
                      </SelectTrigger>
                      <SelectContent>
                        {schoolOptions.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : null}
              </div>

              <div className="space-y-2.5">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="Create a password" />
              </div>

              <Button variant="emerald" size="lg" className="w-full" onClick={() => void handleRegister()}>
                Create account
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Already registered?{" "}
            <Link to={buildPublicPath("/login")} className="font-medium text-secondary transition-colors hover:text-secondary/80">
              Sign in
            </Link>
          </p>
        </div>
      </Container>
    </div>
  );
}
