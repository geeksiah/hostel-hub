import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { FileUploader } from "@/components/shared/FileUploader";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useApp } from "@/contexts/AppContext";
import { adminAccountTypeOptions, hasAdminCapability } from "@/modules/admin/permissions";
import { emailProviderSpecs, paymentProviderSpecs, smsProviderSpecs } from "@/modules/integrations/provider-specs";
import { createDefaultTenantPaymentMethods, mergeTenantPaymentMethods } from "@/modules/payment/config";
import { createDefaultTenantNotificationConfig } from "@/modules/notification/config";
import { canTenantAddHostel, getRemainingHostelSlots, getTenantHostelLimit } from "@/modules/platform/account-types";
import { buildSitePreviewPath } from "@/modules/site/selectors";
import { HostelService, SiteService, TenantService, UserService } from "@/services";
import type { PaymentProvider } from "@/types";

function faqString(items: Array<{ question: string; answer: string }>) {
  return items.map((item) => `${item.question}::${item.answer}`).join("\n");
}

function faqItems(value: string) {
  return value
    .split("\n")
    .map((line) => {
      const [question, ...rest] = line.split("::");
      return { question: question?.trim() ?? "", answer: rest.join("::").trim() };
    })
    .filter((item) => item.question && item.answer);
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default function AdminSettings() {
  const [searchParams] = useSearchParams();
  const { database, currentUser, session, setCurrentHostelId, refreshData, resetDemo } = useApp();

  const tenantId = currentUser?.tenantId ?? "";
  const tenant = useMemo(() => database?.tenants.find((item) => item.id === tenantId), [database, tenantId]);
  const hostels = useMemo(() => database?.hostels.filter((item) => item.tenantId === tenantId) ?? [], [database, tenantId]);
  const currentHostel = useMemo(() => hostels.find((item) => item.id === session.currentHostelId) ?? hostels[0], [hostels, session.currentHostelId]);
  const sites = useMemo(() => database?.sites.filter((item) => item.tenantId === tenantId) ?? [], [database, tenantId]);
  const theme = useMemo(() => database?.brandThemes.find((item) => item.tenantId === tenantId), [database, tenantId]);
  const paymentConfig = useMemo(() => database?.tenantPaymentConfigs.find((item) => item.tenantId === tenantId), [database, tenantId]);
  const emailConfig = useMemo(() => database?.tenantEmailConfigs.find((item) => item.tenantId === tenantId), [database, tenantId]);
  const smsConfig = useMemo(() => database?.tenantSmsConfigs.find((item) => item.tenantId === tenantId), [database, tenantId]);
  const notificationConfig = useMemo(() => database?.tenantNotificationConfigs.find((item) => item.tenantId === tenantId), [database, tenantId]);
  const defaultMethods = useMemo(() => (database ? createDefaultTenantPaymentMethods(database.marketConfig) : []), [database]);

  const [tab, setTab] = useState(searchParams.get("tab") ?? "organization");
  const [selectedSiteId, setSelectedSiteId] = useState("");
  const [selectedHostelId, setSelectedHostelId] = useState("");
  const [newDomain, setNewDomain] = useState("");
  const [profileForm, setProfileForm] = useState({ name: "", currency: "GHS", location: "", email: "", phone: "", description: "" });
  const [myProfileForm, setMyProfileForm] = useState({ name: "", email: "", phone: "" });
  const [brandForm, setBrandForm] = useState({ logoText: "", primaryColor: "#103B31", secondaryColor: "#1F9D6B", accentColor: "#F59E0B", heroFromColor: "#103B31", heroToColor: "#1E5A4B" });
  const [websiteForm, setWebsiteForm] = useState({ name: "", slug: "", renderMode: "template", headline: "", subheadline: "", aboutBody: "", contactBody: "", faq: "", heroMediaUrl: "", customHtml: "", customCss: "", customJs: "", pages: [] as Array<{ id: string; title: string; navLabel: string; visibleInNav: boolean; summary?: string; kind: string }> });
  const [micrositeForm, setMicrositeForm] = useState({ hostelId: "", name: "", slug: "" });
  const [hostelForm, setHostelForm] = useState({ name: "", location: "", university: "", description: "", email: "", phone: "" });
  const [newHostelForm, setNewHostelForm] = useState({ name: "", location: "", university: "", description: "", email: "", phone: "" });
  const [paymentForm, setPaymentForm] = useState({ provider: "", providerDisplayName: "", merchantLabel: "", providerFields: {} as Record<string, string>, methods: defaultMethods });
  const [emailForm, setEmailForm] = useState({ provider: "", providerDisplayName: "", senderName: "", providerFields: {} as Record<string, string> });
  const [smsForm, setSmsForm] = useState({ provider: "", providerDisplayName: "", providerFields: {} as Record<string, string> });
  const [notificationForm, setNotificationForm] = useState(createDefaultTenantNotificationConfig(tenantId || "tenant"));
  const [accountForm, setAccountForm] = useState({ id: "", name: "", email: "", phone: "", hostelId: "", adminAccountType: "manager", accountStatus: "active" });

  const selectedSite = sites.find((item) => item.id === selectedSiteId) ?? sites[0];
  const selectedHostel = hostels.find((item) => item.id === selectedHostelId) ?? currentHostel;
  const siteDraft = database?.siteVersions.find((item) => item.id === selectedSite?.currentDraftVersionId);
  const siteDomains = database?.domains.filter((item) => item.siteId === selectedSite?.id) ?? [];
  const siteVersions = database?.siteVersions.filter((item) => item.siteId === selectedSite?.id && item.status === "published") ?? [];
  const micrositeCandidates = hostels.filter((item) => !item.siteId || !sites.some((site) => site.id === item.siteId));
  const previewUrl = selectedSite ? buildSitePreviewPath(selectedSite, "slug", "/") : "/";
  const primarySite = sites.find((item) => item.id === tenant?.primarySiteId) ?? sites[0];
  const tenantAdmins = useMemo(
    () => database?.users.filter((user) => user.role === "tenant_admin" && user.tenantId === tenantId) ?? [],
    [database, tenantId],
  );
  const hostelSlotsRemaining = getRemainingHostelSlots(tenant);
  const hostelLimit = getTenantHostelLimit(tenant);
  const canManageSettings = hasAdminCapability(currentUser, "settings");
  const canManageOwnAccount = hasAdminCapability(currentUser, "account");
  const supportedCurrencies = database.marketConfig.supportedCurrencies?.length
    ? database.marketConfig.supportedCurrencies
    : [tenant.currency ?? database.marketConfig.currency ?? "GHS"];
  const primaryDomain =
    database?.domains.find((item) => item.siteId === primarySite?.id && item.isPrimary) ??
    database?.domains.find((item) => item.siteId === primarySite?.id && item.isManagedFallback);
  const tenantBaseUrl = primaryDomain ? `https://${primaryDomain.hostname}` : primarySite && database ? `https://${primarySite.slug}.${database.marketConfig.managedDomainSuffix}` : "";

  const requestedTab = useMemo(() => {
    const value = searchParams.get("tab") ?? "organization";
    if (value === "profile") return "organization";
    if (value === "accounts") return "team";
    return value;
  }, [searchParams]);

  const availableTabs = useMemo(() => {
    const items: Array<{ value: string; label: string }> = [];
    if (canManageOwnAccount) items.push({ value: "my-profile", label: "My Profile" });
    if (canManageSettings) {
      items.push(
        { value: "organization", label: "Organization" },
        { value: "branding", label: "Branding" },
        { value: "hostels", label: "Hostels" },
        { value: "website", label: "Website" },
        { value: "domains", label: "Domains" },
        { value: "payment", label: "Payment Setup" },
        { value: "messaging", label: "Messaging" },
        { value: "team", label: "Team" },
        { value: "notifications", label: "Notifications" },
      );
    }
    return items;
  }, [canManageOwnAccount, canManageSettings]);

  useEffect(() => {
    const fallbackTab = availableTabs[0]?.value ?? "my-profile";
    const nextTab = availableTabs.some((item) => item.value === requestedTab) ? requestedTab : fallbackTab;
    setTab(nextTab);
  }, [availableTabs, requestedTab]);

  useEffect(() => {
    if (sites.length && !selectedSiteId) setSelectedSiteId(sites[0].id);
    if (hostels.length && !selectedHostelId) setSelectedHostelId(hostels[0].id);
  }, [hostels, selectedHostelId, selectedSiteId, sites]);

  useEffect(() => {
    setProfileForm({
      name: tenant?.name ?? "",
      currency: tenant?.currency ?? database?.marketConfig.currency ?? "GHS",
      location: currentHostel?.location ?? "",
      email: currentHostel?.contact.email ?? currentUser?.email ?? "",
      phone: currentHostel?.contact.phone ?? currentUser?.phone ?? "",
      description: currentHostel?.description ?? "",
    });
  }, [currentHostel, currentUser?.email, currentUser?.phone, database?.marketConfig.currency, tenant?.currency, tenant?.name]);

  useEffect(() => {
    setMyProfileForm({
      name: currentUser?.name ?? "",
      email: currentUser?.email ?? "",
      phone: currentUser?.phone ?? "",
    });
  }, [currentUser?.email, currentUser?.name, currentUser?.phone]);

  useEffect(() => {
    setBrandForm({
      logoText: theme?.logoText ?? "",
      primaryColor: theme?.primaryColor ?? "#103B31",
      secondaryColor: theme?.secondaryColor ?? "#1F9D6B",
      accentColor: theme?.accentColor ?? "#F59E0B",
      heroFromColor: theme?.heroFromColor ?? "#103B31",
      heroToColor: theme?.heroToColor ?? "#1E5A4B",
    });
  }, [theme]);

  useEffect(() => {
    setWebsiteForm({
      name: selectedSite?.name ?? "",
      slug: selectedSite?.slug ?? "",
      renderMode: selectedSite?.renderMode ?? "template",
      headline: siteDraft?.templateContent.headline ?? "",
      subheadline: siteDraft?.templateContent.subheadline ?? "",
      aboutBody: siteDraft?.templateContent.aboutBody ?? "",
      contactBody: siteDraft?.templateContent.contactBody ?? "",
      faq: faqString(siteDraft?.templateContent.faq ?? []),
      heroMediaUrl: selectedSite?.heroMediaUrl ?? "",
      customHtml: siteDraft?.customCode?.html ?? "",
      customCss: siteDraft?.customCode?.css ?? "",
      customJs: siteDraft?.customCode?.js ?? "",
      pages: (selectedSite?.pageManifest ?? []).map((page) => ({ ...page })),
    });
  }, [selectedSite, siteDraft]);

  useEffect(() => {
    if (!selectedHostel) return;
    setHostelForm({
      name: selectedHostel.name,
      location: selectedHostel.location,
      university: selectedHostel.university,
      description: selectedHostel.description,
      email: selectedHostel.contact.email,
      phone: selectedHostel.contact.phone,
    });
  }, [selectedHostel]);

  useEffect(() => {
    const generatedFields = paymentConfig?.provider === "hubtel" ? { callbackUrl: `${tenantBaseUrl}/api/payments/webhook` } : { webhookUrl: `${tenantBaseUrl}/api/payments/webhook` };
    setPaymentForm({
      provider: paymentConfig?.provider ?? "",
      providerDisplayName: paymentConfig?.providerDisplayName ?? "",
      merchantLabel: paymentConfig?.merchantLabel ?? tenant?.name ?? "",
      providerFields: { ...generatedFields, ...(paymentConfig?.providerFields ?? {}) },
      methods: database ? mergeTenantPaymentMethods(database.marketConfig, paymentConfig?.supportedMethods ?? defaultMethods) : defaultMethods,
    });
  }, [database, defaultMethods, paymentConfig, tenant?.name, tenantBaseUrl]);

  useEffect(() => {
    setEmailForm({
      provider: emailConfig?.provider ?? "",
      providerDisplayName: emailConfig?.providerDisplayName ?? "",
      senderName: emailConfig?.senderName ?? tenant?.name ?? "",
      providerFields: emailConfig?.providerFields ?? {},
    });
    setSmsForm({
      provider: smsConfig?.provider ?? "",
      providerDisplayName: smsConfig?.providerDisplayName ?? "",
      providerFields: smsConfig?.providerFields ?? {},
    });
    setNotificationForm(notificationConfig ?? createDefaultTenantNotificationConfig(tenantId || "tenant"));
  }, [emailConfig, notificationConfig, smsConfig, tenant?.name, tenantId]);

  useEffect(() => {
    if (!micrositeCandidates.length) return;
    const fallback = micrositeCandidates[0];
    setMicrositeForm((current) => ({ hostelId: current.hostelId || fallback.id, name: current.name || `${fallback.name} site`, slug: current.slug || slugify(fallback.name) }));
  }, [micrositeCandidates]);

  if (!database || !tenant) return <div className="py-10">Loading settings...</div>;

  const saveProfile = async () => {
    await TenantService.updateTenant(tenantId, { name: profileForm.name, currency: profileForm.currency });
    if (currentHostel) {
      await HostelService.updateHostelProfile(currentHostel.id, { location: profileForm.location, description: profileForm.description, contact: { email: profileForm.email, phone: profileForm.phone } });
    }
    await refreshData();
    toast.success("Tenant profile updated.");
  };

  const saveHostel = async () => {
    if (!selectedHostel) return;
    await HostelService.updateHostelProfile(selectedHostel.id, { name: hostelForm.name, location: hostelForm.location, university: hostelForm.university, description: hostelForm.description, contact: { email: hostelForm.email, phone: hostelForm.phone } });
    await refreshData();
    toast.success("Hostel saved.");
  };

  const createHostel = async () => {
    if (!newHostelForm.name.trim()) return;
    if (!canTenantAddHostel(tenant)) {
      toast.error("This tenant has reached its hostel limit.");
      return;
    }
    const result = await HostelService.createHostelProfile({ tenantId, name: newHostelForm.name.trim(), location: newHostelForm.location, university: newHostelForm.university, description: newHostelForm.description, contact: { email: newHostelForm.email, phone: newHostelForm.phone } });
    await refreshData();
    setSelectedHostelId(result.data.id);
    setCurrentHostelId(result.data.id);
    setNewHostelForm({ name: "", location: "", university: "", description: "", email: "", phone: "" });
    toast.success("Hostel created.");
  };

  const saveWebsite = async () => {
    if (!selectedSite) return;
    await SiteService.updateSite(selectedSite.id, { name: websiteForm.name, slug: websiteForm.slug, renderMode: websiteForm.renderMode as typeof selectedSite.renderMode, pageManifest: websiteForm.pages, heroMediaUrl: websiteForm.heroMediaUrl });
    await SiteService.saveSiteDraft(selectedSite.id, { templateContent: { ...siteDraft?.templateContent, headline: websiteForm.headline, subheadline: websiteForm.subheadline, aboutBody: websiteForm.aboutBody, contactBody: websiteForm.contactBody, faq: faqItems(websiteForm.faq) }, customCode: { html: websiteForm.customHtml, css: websiteForm.customCss, js: websiteForm.customJs } });
    await refreshData();
    toast.success("Site draft saved.");
  };

  const createMicrosite = async () => {
    if (!micrositeForm.hostelId || !micrositeForm.name.trim() || !micrositeForm.slug.trim()) return;
    const result = await SiteService.createSite({ tenantId, hostelId: micrositeForm.hostelId, name: micrositeForm.name.trim(), slug: micrositeForm.slug.trim(), type: "hostel_microsite" });
    await refreshData();
    setSelectedSiteId(result.data.id);
    toast.success("Microsite created.");
  };

  const saveAdminAccount = async () => {
    if (!accountForm.name.trim() || !accountForm.email.trim()) return;
    if (accountForm.id) {
      await UserService.updateAccount(accountForm.id, {
        name: accountForm.name.trim(),
        email: accountForm.email.trim(),
        phone: accountForm.phone.trim(),
        hostelId: accountForm.hostelId || undefined,
        adminAccountType: accountForm.adminAccountType as typeof tenantAdmins[number]["adminAccountType"],
        accountStatus: accountForm.accountStatus as typeof tenantAdmins[number]["accountStatus"],
      });
      toast.success("Admin account updated.");
    } else {
      await UserService.createTenantAdmin({
        tenantId,
        hostelId: accountForm.hostelId || undefined,
        name: accountForm.name.trim(),
        email: accountForm.email.trim(),
        phone: accountForm.phone.trim(),
        adminAccountType: accountForm.adminAccountType as typeof tenantAdmins[number]["adminAccountType"],
        accountStatus: accountForm.accountStatus as typeof tenantAdmins[number]["accountStatus"],
      });
      toast.success("Admin account created.");
    }
    await refreshData();
    setAccountForm({ id: "", name: "", email: "", phone: "", hostelId: "", adminAccountType: "manager", accountStatus: "active" });
  };

  const saveMyProfile = async () => {
    if (!currentUser) return;
    await UserService.updateAccount(currentUser.id, {
      name: myProfileForm.name.trim(),
      email: myProfileForm.email.trim(),
      phone: myProfileForm.phone.trim(),
    });
    await refreshData();
    toast.success("Profile updated.");
  };

  const assignedHostels = currentUser?.hostelId
    ? hostels.filter((hostel) => hostel.id === currentUser.hostelId)
    : hostels;
  const manualPaymentMethods = paymentForm.methods.filter(
    (method) => method.method === "bank_transfer" || method.method === "cash",
  );
  const updatePaymentMethod = (methodKey: string, updates: Partial<(typeof paymentForm.methods)[number]>) => {
    setPaymentForm((current) => ({
      ...current,
      methods: current.methods.map((item) => (item.method === methodKey ? { ...item, ...updates } : item)),
    }));
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Organization controls, payment setup, and personal profile." />
      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList className="flex h-auto flex-wrap justify-start gap-2 bg-transparent p-0">
          {availableTabs.map((item) => (
            <TabsTrigger key={item.value} value={item.value}>{item.label}</TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="organization">
          <div className="rounded-2xl border bg-card p-5 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Organization name</Label>
                <Input value={profileForm.name} onChange={(event) => setProfileForm({ ...profileForm, name: event.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Currency</Label>
                <select value={profileForm.currency} onChange={(event) => setProfileForm({ ...profileForm, currency: event.target.value })} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                  {supportedCurrencies.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Primary location</Label>
                <Input value={profileForm.location} onChange={(event) => setProfileForm({ ...profileForm, location: event.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Contact email</Label>
                <Input value={profileForm.email} onChange={(event) => setProfileForm({ ...profileForm, email: event.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Contact phone</Label>
                <Input value={profileForm.phone} onChange={(event) => setProfileForm({ ...profileForm, phone: event.target.value })} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Public description</Label>
                <Textarea rows={4} value={profileForm.description} onChange={(event) => setProfileForm({ ...profileForm, description: event.target.value })} />
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="emerald" onClick={() => void saveProfile()}>Save profile</Button>
              <Button variant="outline" onClick={async () => { await resetDemo(); toast.success("Demo reset complete."); }}>Reset demo</Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="my-profile">
          <div className="grid gap-5 xl:grid-cols-[0.92fr_1.08fr]">
            <div className="rounded-2xl border bg-card p-5 space-y-4">
              <div>
                <h2 className="font-display text-lg font-semibold">My profile</h2>
                <p className="text-sm text-muted-foreground">Personal account details and assigned hostel access.</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Full name</Label>
                  <Input value={myProfileForm.name} onChange={(event) => setMyProfileForm({ ...myProfileForm, name: event.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={myProfileForm.email} onChange={(event) => setMyProfileForm({ ...myProfileForm, email: event.target.value })} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Phone</Label>
                  <Input value={myProfileForm.phone} onChange={(event) => setMyProfileForm({ ...myProfileForm, phone: event.target.value })} />
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button variant="emerald" onClick={() => void saveMyProfile()}>Save profile</Button>
              </div>
            </div>

            <div className="rounded-2xl border bg-card p-5 space-y-4">
              <div>
                <h2 className="font-display text-lg font-semibold">Assigned hostels</h2>
                <p className="text-sm text-muted-foreground">Access follows your account type and hostel assignment.</p>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {assignedHostels.map((hostel) => (
                  <div key={hostel.id} className="rounded-2xl border p-4">
                    <p className="font-medium">{hostel.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{hostel.location}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="branding">
          <div className="rounded-2xl border bg-card p-5 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Logo text</Label>
                <Input value={brandForm.logoText} onChange={(event) => setBrandForm({ ...brandForm, logoText: event.target.value })} />
              </div>
              {(["primaryColor", "secondaryColor", "accentColor", "heroFromColor", "heroToColor"] as const).map((field) => (
                <div key={field} className="space-y-2">
                  <Label>{field.replace(/([A-Z])/g, " $1")}</Label>
                  <Input type="color" value={brandForm[field]} onChange={(event) => setBrandForm({ ...brandForm, [field]: event.target.value })} />
                </div>
              ))}
            </div>
            <Button variant="emerald" onClick={async () => { await TenantService.updateBrandTheme(tenantId, brandForm); await refreshData(); toast.success("Brand theme updated."); }}>Save branding</Button>
          </div>
        </TabsContent>

        <TabsContent value="hostels">
          <div className="grid gap-5 xl:grid-cols-2">
            <div className="rounded-2xl border bg-card p-5 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-lg font-semibold">Manage hostels</h2>
                  <p className="text-sm text-muted-foreground">
                    {tenant.accountType === "fleet"
                      ? `Fleet tenant with ${hostelLimit} hostel slots. ${hostelSlotsRemaining} remaining.`
                      : "Single tenant account. Only one hostel can be managed under this account."}
                  </p>
                </div>
                <select value={selectedHostel?.id ?? ""} onChange={(event) => setSelectedHostelId(event.target.value)} className="h-10 rounded-md border bg-background px-3 text-sm">
                  {hostels.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {hostels.map((item) => (
                  <button key={item.id} type="button" onClick={() => { setSelectedHostelId(item.id); setCurrentHostelId(item.id); }} className={`rounded-2xl border p-4 text-left ${selectedHostel?.id === item.id ? "border-emerald/40 bg-emerald-light/30" : ""}`}>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">{item.location}</p>
                  </button>
                ))}
              </div>
              {selectedHostel ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2"><Label>Name</Label><Input value={hostelForm.name} onChange={(event) => setHostelForm({ ...hostelForm, name: event.target.value })} /></div>
                  <div className="space-y-2"><Label>Location</Label><Input value={hostelForm.location} onChange={(event) => setHostelForm({ ...hostelForm, location: event.target.value })} /></div>
                  <div className="space-y-2"><Label>University</Label><Input value={hostelForm.university} onChange={(event) => setHostelForm({ ...hostelForm, university: event.target.value })} /></div>
                  <div className="space-y-2"><Label>Email</Label><Input value={hostelForm.email} onChange={(event) => setHostelForm({ ...hostelForm, email: event.target.value })} /></div>
                  <div className="space-y-2"><Label>Phone</Label><Input value={hostelForm.phone} onChange={(event) => setHostelForm({ ...hostelForm, phone: event.target.value })} /></div>
                  <div className="space-y-2 md:col-span-2"><Label>Description</Label><Textarea rows={4} value={hostelForm.description} onChange={(event) => setHostelForm({ ...hostelForm, description: event.target.value })} /></div>
                </div>
              ) : null}
              <Button variant="emerald" onClick={() => void saveHostel()}>Save hostel</Button>
            </div>

            <div className="rounded-2xl border bg-card p-5 space-y-4">
              <h2 className="font-display text-lg font-semibold">Add hostel</h2>
              <div className="rounded-2xl border bg-muted/40 p-4 text-sm text-muted-foreground">
                {canTenantAddHostel(tenant)
                  ? `You can still add ${hostelSlotsRemaining} ${hostelSlotsRemaining === 1 ? "hostel" : "hostels"} to this tenant.`
                  : "This tenant has reached its allowed hostel limit. Upgrade to a larger fleet account from the platform owner dashboard to add more."}
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2"><Label>Name</Label><Input value={newHostelForm.name} onChange={(event) => setNewHostelForm({ ...newHostelForm, name: event.target.value })} /></div>
                <div className="space-y-2"><Label>Location</Label><Input value={newHostelForm.location} onChange={(event) => setNewHostelForm({ ...newHostelForm, location: event.target.value })} /></div>
                <div className="space-y-2"><Label>University</Label><Input value={newHostelForm.university} onChange={(event) => setNewHostelForm({ ...newHostelForm, university: event.target.value })} /></div>
                <div className="space-y-2"><Label>Email</Label><Input value={newHostelForm.email} onChange={(event) => setNewHostelForm({ ...newHostelForm, email: event.target.value })} /></div>
                <div className="space-y-2"><Label>Phone</Label><Input value={newHostelForm.phone} onChange={(event) => setNewHostelForm({ ...newHostelForm, phone: event.target.value })} /></div>
                <div className="space-y-2 md:col-span-2"><Label>Description</Label><Textarea rows={4} value={newHostelForm.description} onChange={(event) => setNewHostelForm({ ...newHostelForm, description: event.target.value })} /></div>
              </div>
              <Button variant="emerald" className="w-full" disabled={!canTenantAddHostel(tenant)} onClick={() => void createHostel()}>Create hostel</Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="website">
          <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-2xl border bg-card p-5 space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2"><Label>Site</Label><select value={selectedSite?.id ?? ""} onChange={(event) => setSelectedSiteId(event.target.value)} className="h-10 w-full rounded-md border bg-background px-3 text-sm">{sites.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>
                <div className="space-y-2"><Label>Site name</Label><Input value={websiteForm.name} onChange={(event) => setWebsiteForm({ ...websiteForm, name: event.target.value })} /></div>
                <div className="space-y-2"><Label>Slug</Label><Input value={websiteForm.slug} onChange={(event) => setWebsiteForm({ ...websiteForm, slug: slugify(event.target.value) })} /></div>
              </div>
              <FileUploader label="Hero media" description="Upload public hero media." value={websiteForm.heroMediaUrl} onChange={(value) => setWebsiteForm({ ...websiteForm, heroMediaUrl: value })} accept="image/*,video/*" />
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border bg-muted/40 p-4 text-sm text-muted-foreground"><p className="font-medium text-foreground">Preview URL</p><p className="mt-1 font-mono text-xs">{previewUrl}</p></div>
                <div className="rounded-2xl border bg-muted/40 p-4 text-sm text-muted-foreground"><p className="font-medium text-foreground">Live URL</p><p className="mt-1 font-mono text-xs">{siteDomains.find((item) => item.isPrimary)?.hostname ? `https://${siteDomains.find((item) => item.isPrimary)?.hostname}` : "Verify a domain to go live."}</p></div>
              </div>
              <div className="space-y-2"><Label>Page navigation</Label><div className="grid gap-2 md:grid-cols-2">{websiteForm.pages.map((page, index) => (<div key={page.id} className="rounded-xl border p-3"><Input value={page.navLabel} onChange={(event) => setWebsiteForm({ ...websiteForm, pages: websiteForm.pages.map((item, itemIndex) => itemIndex === index ? { ...item, navLabel: event.target.value } : item) })} /><label className="mt-2 inline-flex items-center gap-2 text-xs"><input type="checkbox" checked={page.visibleInNav} onChange={(event) => setWebsiteForm({ ...websiteForm, pages: websiteForm.pages.map((item, itemIndex) => itemIndex === index ? { ...item, visibleInNav: event.target.checked } : item) })} /> Visible</label></div>))}</div></div>
              <div className="space-y-2"><Label>Home headline</Label><Textarea rows={3} value={websiteForm.headline} onChange={(event) => setWebsiteForm({ ...websiteForm, headline: event.target.value })} /></div>
              <div className="space-y-2"><Label>Home subheadline</Label><Textarea rows={4} value={websiteForm.subheadline} onChange={(event) => setWebsiteForm({ ...websiteForm, subheadline: event.target.value })} /></div>
              <div className="space-y-2"><Label>About page copy</Label><Textarea rows={5} value={websiteForm.aboutBody} onChange={(event) => setWebsiteForm({ ...websiteForm, aboutBody: event.target.value })} /></div>
              <div className="space-y-2"><Label>Contact page copy</Label><Textarea rows={4} value={websiteForm.contactBody} onChange={(event) => setWebsiteForm({ ...websiteForm, contactBody: event.target.value })} /></div>
              <div className="space-y-2"><Label>FAQ lines</Label><Textarea rows={5} value={websiteForm.faq} onChange={(event) => setWebsiteForm({ ...websiteForm, faq: event.target.value })} placeholder="Question::Answer" /></div>
              <div className="space-y-2">
                <Label>Render mode</Label>
                <select value={websiteForm.renderMode} onChange={(event) => setWebsiteForm({ ...websiteForm, renderMode: event.target.value })} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                  <option value="template">Template</option>
                  <option value="custom_code">Custom code</option>
                </select>
              </div>
              {websiteForm.renderMode === "custom_code" ? (
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2"><Label>HTML</Label><Textarea rows={8} value={websiteForm.customHtml} onChange={(event) => setWebsiteForm({ ...websiteForm, customHtml: event.target.value })} /></div>
                  <div className="space-y-2"><Label>CSS</Label><Textarea rows={8} value={websiteForm.customCss} onChange={(event) => setWebsiteForm({ ...websiteForm, customCss: event.target.value })} /></div>
                  <div className="space-y-2"><Label>JS</Label><Textarea rows={8} value={websiteForm.customJs} onChange={(event) => setWebsiteForm({ ...websiteForm, customJs: event.target.value })} /></div>
                </div>
              ) : null}
              <div className="flex flex-wrap gap-3">
                <Button variant="emerald" onClick={() => void saveWebsite()}>Save draft</Button>
                <Button variant="outline" onClick={async () => { if (!selectedSite) return; await SiteService.publishSite(selectedSite.id); await refreshData(); toast.success("Site published."); }}>Publish</Button>
              </div>
              {siteVersions.map((version) => (
                <div key={version.id} className="flex items-center justify-between rounded-xl border p-3">
                  <div><p className="font-medium">{version.label}</p><p className="text-xs text-muted-foreground">{version.publishedAt ?? version.createdAt}</p></div>
                  <Button variant="outline" size="sm" onClick={async () => { if (!selectedSite) return; await SiteService.rollbackSite(selectedSite.id, version.id); await refreshData(); toast.success("Rolled back."); }}>Roll back</Button>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border bg-card p-5 space-y-4">
              <h2 className="font-display text-lg font-semibold">Create hostel microsite</h2>
              {micrositeCandidates.length ? (
                <>
                  <div className="space-y-2"><Label>Hostel</Label><select value={micrositeForm.hostelId} onChange={(event) => setMicrositeForm({ ...micrositeForm, hostelId: event.target.value })} className="h-10 w-full rounded-md border bg-background px-3 text-sm">{micrositeCandidates.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>
                  <div className="space-y-2"><Label>Microsite name</Label><Input value={micrositeForm.name} onChange={(event) => setMicrositeForm({ ...micrositeForm, name: event.target.value })} /></div>
                  <div className="space-y-2"><Label>Microsite slug</Label><Input value={micrositeForm.slug} onChange={(event) => setMicrositeForm({ ...micrositeForm, slug: slugify(event.target.value) })} /></div>
                  <Button variant="emerald" className="w-full" onClick={() => void createMicrosite()}>Create microsite</Button>
                </>
              ) : (
                <div className="rounded-2xl border bg-muted/40 p-4 text-sm text-muted-foreground">All current hostels already have linked sites.</div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="domains">
          <div className="rounded-2xl border bg-card p-5 space-y-4">
            <div className="flex flex-wrap gap-3">
              <Input value={newDomain} onChange={(event) => setNewDomain(event.target.value)} placeholder="example.com" className="max-w-sm" />
              <Button variant="emerald" onClick={async () => { if (!selectedSite || !newDomain.trim()) return; await SiteService.addDomain(selectedSite.id, newDomain.trim()); await refreshData(); setNewDomain(""); toast.success("Domain added."); }}>Add domain</Button>
            </div>
            {siteDomains.map((domain) => (
              <div key={domain.id} className="rounded-2xl border p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{domain.hostname}</p>
                    <p className="text-xs text-muted-foreground">{domain.verificationStatus} / SSL {domain.sslStatus}{domain.isPrimary ? " / primary" : ""}</p>
                  </div>
                  <div className="flex gap-2">
                    {domain.verificationStatus !== "verified" ? <Button variant="outline" size="sm" onClick={async () => { await SiteService.verifyDomain(domain.id); await refreshData(); }}>Verify</Button> : null}
                    {!domain.isPrimary && selectedSite ? <Button variant="outline" size="sm" onClick={async () => { await SiteService.setPrimaryDomain(selectedSite.id, domain.id); await refreshData(); }}>Set primary</Button> : null}
                  </div>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">{domain.dnsInstructions.map((item) => <p key={item}>{item}</p>)}</div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="payment">
          <div className="rounded-2xl border bg-card p-5 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2"><Label>Provider</Label><select value={paymentForm.provider} onChange={(event) => { const option = paymentProviderSpecs[event.target.value as keyof typeof paymentProviderSpecs]; setPaymentForm({ ...paymentForm, provider: event.target.value, providerDisplayName: option?.label ?? "" }); }} className="h-10 w-full rounded-md border bg-background px-3 text-sm"><option value="">Select provider</option>{Object.values(paymentProviderSpecs).map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}</select></div>
              <div className="space-y-2"><Label>Merchant label</Label><Input value={paymentForm.merchantLabel} onChange={(event) => setPaymentForm({ ...paymentForm, merchantLabel: event.target.value })} /></div>
            </div>
            {paymentForm.provider ? (
              <div className="grid gap-4 md:grid-cols-2">
                {paymentProviderSpecs[paymentForm.provider as keyof typeof paymentProviderSpecs].fields.map((field) => (
                  <div key={field.key} className="space-y-2">
                    <Label>{field.label}</Label>
                    <Input value={paymentForm.providerFields[field.key] ?? ""} readOnly={field.generated} onChange={(event) => setPaymentForm({ ...paymentForm, providerFields: { ...paymentForm.providerFields, [field.key]: event.target.value } })} />
                    <p className="text-xs text-muted-foreground">{field.help}</p>
                  </div>
                ))}
              </div>
            ) : null}
            <div className="rounded-2xl border bg-muted/35 p-4 text-sm text-muted-foreground">
              Online card and mobile-money methods stay controlled by the connected gateway. Configure only the manual fallback methods here.
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {manualPaymentMethods.map((method) => (
                <div key={method.method} className="rounded-2xl border p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium capitalize">{method.method.replace("_", " ")}</p>
                      <p className="text-xs text-muted-foreground">{method.channel}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">{method.enabled ? "Enabled" : "Disabled"}</span>
                      <Switch
                        checked={method.enabled}
                        onCheckedChange={(checked) => updatePaymentMethod(method.method, { enabled: checked })}
                        aria-label={`Toggle ${method.displayLabel}`}
                      />
                    </div>
                  </div>
                  <div className="mt-3 space-y-2">
                    <Label>Label</Label>
                    <Input value={method.displayLabel} onChange={(event) => updatePaymentMethod(method.method, { displayLabel: event.target.value })} />
                    <Label>Instructions</Label>
                    <Textarea rows={3} value={method.instructions ?? ""} onChange={(event) => updatePaymentMethod(method.method, { instructions: event.target.value })} />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="emerald" onClick={async () => { await TenantService.updatePaymentConfig(tenantId, { provider: paymentForm.provider ? (paymentForm.provider as PaymentProvider) : undefined, providerDisplayName: paymentForm.providerDisplayName || "Select provider", merchantLabel: paymentForm.merchantLabel, providerFields: paymentForm.providerFields, generatedFields: Object.fromEntries(Object.entries(paymentForm.providerFields).filter(([key]) => key === "webhookUrl" || key === "callbackUrl")), supportedMethods: paymentForm.methods }); await refreshData(); toast.success("Payment setup saved."); }}>Save setup</Button>
              <Button variant="outline" onClick={async () => { await TenantService.testPaymentConfig(tenantId); await refreshData(); }}>Test connection</Button>
              <Button variant="outline" onClick={async () => { await TenantService.updatePaymentConfigStatus(tenantId, "live"); await refreshData(); }}>Go live</Button>
            </div>
            {paymentConfig?.testResult ? <p className="text-sm text-muted-foreground">{paymentConfig.testResult}</p> : null}
          </div>
        </TabsContent>

        <TabsContent value="messaging">
          <div className="grid gap-5 xl:grid-cols-2">
            <div className="rounded-2xl border bg-card p-5 space-y-4">
              <h2 className="font-display text-lg font-semibold">Email provider</h2>
              <div className="space-y-2"><Label>Provider</Label><select value={emailForm.provider} onChange={(event) => { const option = emailProviderSpecs[event.target.value as keyof typeof emailProviderSpecs]; setEmailForm({ ...emailForm, provider: event.target.value, providerDisplayName: option?.label ?? "" }); }} className="h-10 w-full rounded-md border bg-background px-3 text-sm"><option value="">Select provider</option>{Object.values(emailProviderSpecs).map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}</select></div>
              <div className="space-y-2"><Label>Sender name</Label><Input value={emailForm.senderName} onChange={(event) => setEmailForm({ ...emailForm, senderName: event.target.value })} /></div>
              {emailForm.provider ? <div className="rounded-2xl border bg-muted/40 p-4 text-sm text-muted-foreground">{emailProviderSpecs[emailForm.provider as keyof typeof emailProviderSpecs].docs.map((url) => <p key={url}>{url}</p>)}</div> : null}
              {emailForm.provider ? emailProviderSpecs[emailForm.provider as keyof typeof emailProviderSpecs].fields.map((field) => (
                <div key={field.key} className="space-y-2">
                  <Label>{field.label}</Label>
                  <Input value={emailForm.providerFields[field.key] ?? ""} onChange={(event) => setEmailForm({ ...emailForm, providerFields: { ...emailForm.providerFields, [field.key]: event.target.value } })} />
                </div>
              )) : null}
              <div className="flex flex-wrap gap-3">
                <Button variant="emerald" onClick={async () => { await TenantService.updateEmailConfig(tenantId, { provider: emailForm.provider ? (emailForm.provider as keyof typeof emailProviderSpecs) : undefined, providerDisplayName: emailForm.providerDisplayName || "Select email provider", senderName: emailForm.senderName, providerFields: emailForm.providerFields }); await refreshData(); toast.success("Email setup saved."); }}>Save email setup</Button>
                <Button variant="outline" onClick={async () => { await TenantService.testEmailConfig(tenantId); await refreshData(); }}>Test connection</Button>
                <Button variant="outline" onClick={async () => { await TenantService.updateEmailConfigStatus(tenantId, "live"); await refreshData(); }}>Go live</Button>
              </div>
              {emailConfig?.testResult ? <p className="text-sm text-muted-foreground">{emailConfig.testResult}</p> : null}
            </div>

            <div className="rounded-2xl border bg-card p-5 space-y-4">
              <h2 className="font-display text-lg font-semibold">SMS provider</h2>
              <div className="space-y-2"><Label>Provider</Label><select value={smsForm.provider} onChange={(event) => { const option = smsProviderSpecs[event.target.value as keyof typeof smsProviderSpecs]; setSmsForm({ ...smsForm, provider: event.target.value, providerDisplayName: option?.label ?? "" }); }} className="h-10 w-full rounded-md border bg-background px-3 text-sm"><option value="">Select provider</option>{Object.values(smsProviderSpecs).map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}</select></div>
              {smsForm.provider ? <div className="rounded-2xl border bg-muted/40 p-4 text-sm text-muted-foreground">{smsProviderSpecs[smsForm.provider as keyof typeof smsProviderSpecs].docs.map((url) => <p key={url}>{url}</p>)}</div> : null}
              {smsForm.provider ? smsProviderSpecs[smsForm.provider as keyof typeof smsProviderSpecs].fields.map((field) => (
                <div key={field.key} className="space-y-2">
                  <Label>{field.label}</Label>
                  <Input value={smsForm.providerFields[field.key] ?? ""} onChange={(event) => setSmsForm({ ...smsForm, providerFields: { ...smsForm.providerFields, [field.key]: event.target.value } })} />
                </div>
              )) : null}
              <div className="flex flex-wrap gap-3">
                <Button variant="emerald" onClick={async () => { await TenantService.updateSmsConfig(tenantId, { provider: smsForm.provider ? (smsForm.provider as keyof typeof smsProviderSpecs) : undefined, providerDisplayName: smsForm.providerDisplayName || "Select SMS provider", providerFields: smsForm.providerFields }); await refreshData(); toast.success("SMS setup saved."); }}>Save SMS setup</Button>
                <Button variant="outline" onClick={async () => { await TenantService.testSmsConfig(tenantId); await refreshData(); }}>Test connection</Button>
                <Button variant="outline" onClick={async () => { await TenantService.updateSmsConfigStatus(tenantId, "live"); await refreshData(); }}>Go live</Button>
              </div>
              {smsConfig?.testResult ? <p className="text-sm text-muted-foreground">{smsConfig.testResult}</p> : null}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="team">
          <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-2xl border bg-card p-5 space-y-4">
              <div>
                <h2 className="font-display text-lg font-semibold">Admin accounts</h2>
                <p className="text-sm text-muted-foreground">Create and manage admin access.</p>
              </div>
              <div className="space-y-3">
                {tenantAdmins.map((admin) => (
                  <div key={admin.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4">
                    <div>
                      <p className="font-medium">{admin.name}</p>
                      <p className="text-sm text-muted-foreground">{admin.email}</p>
                      <p className="text-xs capitalize text-muted-foreground">
                        {admin.adminAccountType} / {admin.accountStatus}
                        {admin.isTenantOwner ? " / owner" : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setAccountForm({
                            id: admin.id,
                            name: admin.name,
                            email: admin.email,
                            phone: admin.phone,
                            hostelId: admin.hostelId ?? "",
                            adminAccountType: admin.adminAccountType ?? "manager",
                            accountStatus: admin.accountStatus ?? "active",
                          })
                        }
                      >
                        Edit
                      </Button>
                      {!admin.isTenantOwner ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            const result = await UserService.deleteTenantAdmin(admin.id);
                            if (!result.data) {
                              toast.error("Tenant owner accounts cannot be deleted here.");
                              return;
                            }
                            await refreshData();
                            toast.success("Admin account deleted.");
                          }}
                        >
                          Delete
                        </Button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border bg-card p-5 space-y-4">
              <div>
                <h2 className="font-display text-lg font-semibold">{accountForm.id ? "Edit admin account" : "Add admin account"}</h2>
                <p className="text-sm text-muted-foreground">Managers have full access. Security stays on scanner duty.</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2"><Label>Full name</Label><Input value={accountForm.name} onChange={(event) => setAccountForm({ ...accountForm, name: event.target.value })} /></div>
                <div className="space-y-2"><Label>Email</Label><Input value={accountForm.email} onChange={(event) => setAccountForm({ ...accountForm, email: event.target.value })} /></div>
                <div className="space-y-2"><Label>Phone</Label><Input value={accountForm.phone} onChange={(event) => setAccountForm({ ...accountForm, phone: event.target.value })} /></div>
                <div className="space-y-2">
                  <Label>Default hostel</Label>
                  <select value={accountForm.hostelId} onChange={(event) => setAccountForm({ ...accountForm, hostelId: event.target.value })} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                    <option value="">All tenant hostels</option>
                    {hostels.map((hostel) => <option key={hostel.id} value={hostel.id}>{hostel.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Account type</Label>
                  <select value={accountForm.adminAccountType} onChange={(event) => setAccountForm({ ...accountForm, adminAccountType: event.target.value })} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                    {adminAccountTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <select value={accountForm.accountStatus} onChange={(event) => setAccountForm({ ...accountForm, accountStatus: event.target.value })} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>
              <div className="rounded-2xl border bg-muted/40 p-4 text-sm text-muted-foreground">
                {(adminAccountTypeOptions.find((option) => option.value === accountForm.adminAccountType)?.description) ?? "Select an account type to review access."}
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                {accountForm.id ? (
                  <Button variant="outline" onClick={() => setAccountForm({ id: "", name: "", email: "", phone: "", hostelId: "", adminAccountType: "manager", accountStatus: "active" })}>
                    Reset
                  </Button>
                ) : null}
                <Button variant="emerald" onClick={() => void saveAdminAccount()}>
                  {accountForm.id ? "Save account" : "Create account"}
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="notifications">
          <div className="rounded-2xl border bg-card p-5 space-y-4">
            <div className="rounded-2xl border bg-muted/40 p-4 text-sm text-muted-foreground">In-app notifications are live. Email and SMS queue when providers are connected.</div>
            <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={notificationForm.internalNotificationsEnabled} onChange={(event) => setNotificationForm({ ...notificationForm, internalNotificationsEnabled: event.target.checked })} /> Enable in-app notifications</label>
            {notificationForm.triggers.map((trigger) => (
              <div key={trigger.eventKey} className="rounded-2xl border p-4">
                <p className="font-medium">{trigger.label}</p>
                <p className="text-xs text-muted-foreground">{trigger.eventKey}</p>
                <div className="mt-3 flex flex-wrap gap-4 text-sm">
                  <label className="inline-flex items-center gap-2"><input type="checkbox" checked={trigger.inAppEnabled} onChange={(event) => setNotificationForm({ ...notificationForm, triggers: notificationForm.triggers.map((item) => item.eventKey === trigger.eventKey ? { ...item, inAppEnabled: event.target.checked } : item) })} /> In-app</label>
                  <label className="inline-flex items-center gap-2"><input type="checkbox" checked={trigger.emailEnabled} onChange={(event) => setNotificationForm({ ...notificationForm, triggers: notificationForm.triggers.map((item) => item.eventKey === trigger.eventKey ? { ...item, emailEnabled: event.target.checked } : item) })} /> Email</label>
                  <label className="inline-flex items-center gap-2"><input type="checkbox" checked={trigger.smsEnabled} onChange={(event) => setNotificationForm({ ...notificationForm, triggers: notificationForm.triggers.map((item) => item.eventKey === trigger.eventKey ? { ...item, smsEnabled: event.target.checked } : item) })} /> SMS</label>
                </div>
              </div>
            ))}
            <Button variant="emerald" onClick={async () => { await TenantService.updateNotificationConfig(tenantId, { internalNotificationsEnabled: notificationForm.internalNotificationsEnabled, triggers: notificationForm.triggers }); await refreshData(); toast.success("Notification settings saved."); }}>Save notification rules</Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
