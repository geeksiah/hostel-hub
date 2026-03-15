import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { BackBreadcrumbHeader } from "@/components/shared/BackBreadcrumbHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { HostelService } from "@/services";
import { useApp } from "@/contexts/AppContext";

const steps = ["Hostel details", "Location and contact", "Rules", "Complete"] as const;

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { currentUser, database, setCurrentHostelId, refreshData } = useApp();
  const existingTenantHostel = useMemo(
    () => database?.hostels.find((hostel) => hostel.tenantId === currentUser?.tenantId),
    [currentUser?.tenantId, database],
  );

  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: existingTenantHostel?.name ?? "",
    description: existingTenantHostel?.description ?? "",
    university: existingTenantHostel?.university ?? "",
    location: existingTenantHostel?.location ?? "",
    phone: existingTenantHostel?.contact.phone ?? currentUser?.phone ?? "",
    email: existingTenantHostel?.contact.email ?? currentUser?.email ?? "",
    rules: existingTenantHostel?.rules.join("\n") ?? "No loud music after 10PM\nVisitors must leave by 8PM",
    amenities: existingTenantHostel?.amenities.join(", ") ?? "WiFi, Security, Laundry",
  });

  const next = async () => {
    if (step < steps.length - 1) {
      setStep((value) => value + 1);
      return;
    }

    if (!currentUser?.tenantId) {
      toast.error("Only tenant admins can complete onboarding.");
      return;
    }

    const result = existingTenantHostel
      ? await HostelService.updateHostelProfile(existingTenantHostel.id, {
          name: form.name,
          description: form.description,
          university: form.university,
          location: form.location,
          contact: { phone: form.phone, email: form.email },
          rules: form.rules.split("\n").map((rule) => rule.trim()).filter(Boolean),
          amenities: form.amenities.split(",").map((item) => item.trim()).filter(Boolean),
        })
      : await HostelService.createHostelProfile({
          tenantId: currentUser.tenantId,
          name: form.name,
          description: form.description,
          university: form.university,
          location: form.location,
          contact: { phone: form.phone, email: form.email },
          rules: form.rules.split("\n").map((rule) => rule.trim()).filter(Boolean),
          amenities: form.amenities.split(",").map((item) => item.trim()).filter(Boolean),
        });

    if (result.data) {
      setCurrentHostelId(result.data.id);
      await refreshData();
    }

    toast.success("Hostel profile saved.");
    navigate("/admin");
  };

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto w-full max-w-lg space-y-6">
        <BackBreadcrumbHeader
          title="Set up your hostel"
          backHref="/login"
          backLabel="Back"
          breadcrumbs={[
            { label: "Account", href: "/login" },
            { label: "Onboarding" },
          ]}
        />

        <div className="flex items-center justify-center gap-2">
          {steps.map((item, index) => (
            <div key={item} className="flex items-center gap-2">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${index <= step ? "bg-emerald text-white" : "bg-muted text-muted-foreground"}`}>
                {index < step ? <Check className="h-4 w-4" /> : index + 1}
              </div>
              {index < steps.length - 1 && <div className={`h-0.5 w-8 ${index < step ? "bg-emerald" : "bg-border"}`} />}
            </div>
          ))}
        </div>

        <div className="rounded-xl border bg-card p-6">
          <h2 className="font-display text-lg font-semibold">{steps[step]}</h2>

          {step === 0 && (
            <div className="mt-4 grid gap-4">
              <div className="space-y-2">
                <Label>Hostel name</Label>
                <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Dreamland Hostel" />
              </div>
              <div className="space-y-2">
                <Label>University</Label>
                <Input value={form.university} onChange={(event) => setForm({ ...form, university: event.target.value })} placeholder="University of Ghana" />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows={4} />
              </div>
              <div className="space-y-2">
                <Label>Amenities</Label>
                <Input value={form.amenities} onChange={(event) => setForm({ ...form, amenities: event.target.value })} placeholder="WiFi, Security, Laundry" />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="mt-4 grid gap-4">
              <div className="space-y-2">
                <Label>Location</Label>
                <Input value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} placeholder="East Legon, Accra" />
              </div>
              <div className="space-y-2">
                <Label>Contact phone</Label>
                <Input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="+233 20 000 0000" />
              </div>
              <div className="space-y-2">
                <Label>Contact email</Label>
                <Input value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="ops@hostel.com" />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="mt-4 space-y-2">
              <Label>Rules and policies</Label>
              <Textarea value={form.rules} onChange={(event) => setForm({ ...form, rules: event.target.value })} rows={6} />
              <p className="text-xs text-muted-foreground">Use one rule per line.</p>
            </div>
          )}

          {step === 3 && (
            <div className="mt-4 rounded-lg bg-muted/60 p-4 text-center">
              <h3 className="font-display text-lg font-semibold">Ready to launch</h3>
              <p className="mt-1 text-sm text-muted-foreground">Your hostel profile will be saved and the admin dashboard will open.</p>
            </div>
          )}

          <div className="mt-6 flex gap-2">
            {step > 0 && (
              <Button variant="outline" onClick={() => setStep((value) => value - 1)}>
                Back
              </Button>
            )}
            <Button variant="emerald" className="flex-1" onClick={() => void next()}>
              {step === steps.length - 1 ? "Finish setup" : "Continue"}
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
