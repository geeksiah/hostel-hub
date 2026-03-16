import type {
  AppDatabase,
  ExploreFilters,
  MarketConfig,
  SitePageDefinition,
  SiteTemplateContent,
  SiteVersion,
} from "@/types";
import { createDefaultTenantNotificationConfig } from "@/modules/notification/config";

const tenantBrandPages: SitePageDefinition[] = [
  { id: "page-home", slug: "", title: "Home", navLabel: "Home", kind: "home", visibleInNav: true },
  { id: "page-properties", slug: "properties", title: "Properties", navLabel: "Properties", kind: "properties", visibleInNav: true },
  { id: "page-about", slug: "about", title: "About", navLabel: "About", kind: "about", visibleInNav: true },
  { id: "page-faq", slug: "faq", title: "FAQ", navLabel: "FAQ", kind: "faq", visibleInNav: true },
  { id: "page-contact", slug: "contact", title: "Contact", navLabel: "Contact", kind: "contact", visibleInNav: true },
];

const micrositePages: SitePageDefinition[] = [
  { id: "page-home", slug: "", title: "Home", navLabel: "Overview", kind: "home", visibleInNav: true },
  { id: "page-about", slug: "about", title: "About", navLabel: "About", kind: "about", visibleInNav: true },
  { id: "page-faq", slug: "faq", title: "FAQ", navLabel: "FAQ", kind: "faq", visibleInNav: true },
  { id: "page-contact", slug: "contact", title: "Contact", navLabel: "Contact", kind: "contact", visibleInNav: true },
];

function createTemplateContent(overrides: Partial<SiteTemplateContent>): SiteTemplateContent {
  return {
    eyebrow: "Direct booking, branded for your residents",
    headline: "Launch a booking site that feels like your hostel, not a marketplace listing.",
    subheadline:
      "Publish your own pages, route residents into room selection, and keep operations, payments, and support inside the same tenant workspace.",
    primaryCtaLabel: "Browse properties",
    primaryCtaHref: "/properties",
    secondaryCtaLabel: "Resident login",
    secondaryCtaHref: "/login",
    stats: [
      { label: "Properties", value: "3" },
      { label: "Beds live", value: "470" },
      { label: "Verification", value: "< 1 hr" },
    ],
    featureBullets: [
      "Branded public pages for each tenant or hostel",
      "Direct resident checkout with tenant-owned gateways",
      "Shared admin, resident, ticketing, and reporting flows",
    ],
    trustPoints: [
      "Custom domains with SSL and redirect handling",
      "Template mode or full custom-code takeover on public pages",
      "Dashboards inherit tenant branding automatically",
    ],
    aboutTitle: "Built for tenant-run accommodation operations",
    aboutBody:
      "This setup keeps marketing, booking, resident support, and payments in one tenant-controlled workspace while removing cross-tenant marketplace behavior.",
    faq: [
      {
        question: "Can residents pay online?",
        answer: "Yes. Each tenant configures their own provider stack and enabled methods before going live.",
      },
      {
        question: "Can we use our own domain?",
        answer: "Yes. Every site gets a managed fallback subdomain and can promote one verified primary custom domain in v1.",
      },
      {
        question: "Do admin and resident dashboards match our brand?",
        answer: "Yes. Tenant brand tokens are applied across both dashboards while site pages can add public-only overrides.",
      },
    ],
    contactTitle: "Talk to the operations team",
    contactBody: "Share your preferred room, dates, or payment questions and the team will respond from the tenant dashboard.",
    ...overrides,
  };
}

const dreamlandBrandDraft: SiteVersion = {
  id: "sv-site1-draft",
  siteId: "site1",
  label: "Spring 2026 refresh",
  status: "draft",
  createdAt: "2026-03-10T12:00:00.000Z",
  templateContent: createTemplateContent({
    announcement: "Semester 2 inventory is now live for direct resident booking.",
    eyebrow: "Dreamland Living",
    headline: "One tenant brand, multiple hostels, direct resident booking.",
    subheadline:
      "Publish branded pages for Dreamland Hostel and Dreamland Annex, collect resident payments through your own gateway, and keep support inside one dashboard.",
    stats: [
      { label: "Live hostels", value: "2" },
      { label: "Residents", value: "300+" },
      { label: "Pending verifications", value: "11" },
    ],
  }),
};

const dreamlandBrandPublished: SiteVersion = {
  ...dreamlandBrandDraft,
  id: "sv-site1-published",
  label: "Spring 2026 live",
  status: "published",
  publishedAt: "2026-03-12T08:00:00.000Z",
  templateContent: {
    ...dreamlandBrandDraft.templateContent,
    headline: "Dreamland Living direct booking for residents.",
  },
};

const dreamlandMicrositeDraft: SiteVersion = {
  id: "sv-site2-draft",
  siteId: "site2",
  label: "Dreamland Hostel draft",
  status: "draft",
  createdAt: "2026-03-09T09:00:00.000Z",
  templateContent: createTemplateContent({
    announcement: "Single, double, triple, and quad rooms are open for Semester 2.",
    eyebrow: "Dreamland Hostel",
    headline: "Book a room at Dreamland Hostel from one direct resident portal.",
    subheadline:
      "This microsite focuses on one property while still sending residents into the shared payment, support, and resident dashboard flows.",
    primaryCtaLabel: "View rooms",
    primaryCtaHref: "/properties",
  }),
};

const dreamlandMicrositePublished: SiteVersion = {
  ...dreamlandMicrositeDraft,
  id: "sv-site2-published",
  label: "Dreamland Hostel live",
  status: "published",
  publishedAt: "2026-03-11T15:30:00.000Z",
};

const greenViewPublished: SiteVersion = {
  id: "sv-site3-published",
  siteId: "site3",
  label: "GreenView live",
  status: "published",
  createdAt: "2026-03-02T10:00:00.000Z",
  publishedAt: "2026-03-04T10:30:00.000Z",
  templateContent: createTemplateContent({
    announcement: "GreenView now accepts direct resident applications for Semester 2.",
    eyebrow: "GreenView Residence",
    headline: "Study-ready rooms, solar-backed utilities, and direct resident booking.",
    subheadline:
      "GreenView's public pages now lead into the live room catalog, resident payment flow, and tenant-managed support inbox without dropping students into a marketplace.",
    primaryCtaLabel: "Browse rooms",
    primaryCtaHref: "/properties/h3",
    secondaryCtaLabel: "Contact GreenView",
    secondaryCtaHref: "/contact",
    stats: [
      { label: "Beds available", value: "42" },
      { label: "Power backup", value: "Solar" },
      { label: "Campus", value: "KNUST" },
    ],
    featureBullets: [
      "One connected tenant site for marketing, booking, payments, and support",
      "Template pages for home, about, FAQ, and contact",
      "Resident dashboard keeps the GreenView brand all the way through booking",
    ],
    trustPoints: [
      "Live room availability from the GreenView inventory",
      "Tenant-owned checkout with offline verification support",
      "Internal notifications ready for email and SMS backend dispatch",
    ],
    aboutTitle: "Built around reliable student living in Kumasi",
    aboutBody:
      "GreenView Residence combines solar-backed utilities, study-friendly shared spaces, and direct resident communication so the same team that markets rooms also manages allocations, payments, and support.",
    faq: [
      {
        question: "Can I book directly from the GreenView site?",
        answer: "Yes. The public site now routes residents directly into GreenView's room selection and checkout flow.",
      },
      {
        question: "What happens after I submit payment?",
        answer: "Online payments can confirm immediately, while bank transfers and cash remain pending until the GreenView team verifies them.",
      },
      {
        question: "How do I contact the hostel team?",
        answer: "Use the contact page details or log in after booking to continue through the resident dashboard and ticketing flow.",
      },
    ],
    contactTitle: "Speak with the GreenView team",
    contactBody: "Questions about room types, payment verification, or move-in dates are handled directly by the GreenView operations team.",
  }),
};

const greenViewDraft: SiteVersion = {
  ...greenViewPublished,
  id: "sv-site3-draft",
  label: "GreenView draft",
  status: "draft",
};

const campusLivingDraft: SiteVersion = {
  id: "sv-site4-draft",
  siteId: "site4",
  label: "Initial draft",
  status: "draft",
  createdAt: "2026-03-13T08:00:00.000Z",
  templateContent: createTemplateContent({
    announcement: "Launch checklist in progress.",
    eyebrow: "Campus Living Ghana",
    headline: "Launch your first whitelabel booking site.",
    subheadline:
      "Draft mode keeps your website private while domains, brand, and payment setup are being completed.",
    primaryCtaLabel: "Coming soon",
  }),
};

export const marketConfig: MarketConfig = {
  currency: "GHS",
  supportedCurrencies: ["GHS", "USD", "NGN", "KES", "ZAR", "GBP"],
  country: "Ghana",
  managedDomainSuffix: "stay.hostelhub.app",
  universities: [
    "All Universities",
    "University of Ghana",
    "KNUST",
    "UCC",
    "Ashesi University",
    "Academic City",
  ],
  locations: ["Accra", "Kumasi", "Cape Coast", "Tema", "Tamale"],
  paymentMethods: [
    { value: "momo", label: "Mobile Money", description: "MTN MoMo, Telecel Cash, AirtelTigo Money" },
    { value: "card", label: "Card", description: "Visa and Mastercard" },
    { value: "bank_transfer", label: "Bank Transfer", description: "Direct bank transfer for verified bookings" },
    { value: "cash", label: "Cash", description: "Pay at the front desk with manual verification" },
  ],
};

export const defaultExploreFilters: ExploreFilters = {
  search: "",
  university: "All Universities",
  roomType: "all",
  genderPolicy: "all",
  availabilityOnly: false,
  duration: "all",
  sort: "recommended",
  priceRange: [0, 8000],
};

const featureFlags = [
  { id: "ff1", key: "waitlist", name: "Waiting List", description: "Allow residents to join waitlists when rooms are full.", enabled: true, tenantId: "t1" },
  { id: "ff2", key: "group_bookings", name: "Group Bookings", description: "Support group booking requests and allocations.", enabled: true, tenantId: "t1" },
  { id: "ff3", key: "offline_payments", name: "Offline Payments", description: "Accept cash and bank transfer receipts.", enabled: true, tenantId: "t1" },
  { id: "ff4", key: "resident_qr", name: "Resident QR", description: "Issue QR resident IDs for security checks.", enabled: true, tenantId: "t1" },
  { id: "ff5", key: "ticketing", name: "Ticketing", description: "Support maintenance and room change tickets.", enabled: true, tenantId: "t1" },
  { id: "ff6", key: "reporting", name: "Reporting", description: "Generate occupancy, resident, and payment reports.", enabled: true, tenantId: "t1" },
  { id: "ff7", key: "offline_payments", name: "Offline Payments", description: "Accept bank transfer proof for GreenView Residence.", enabled: true, tenantId: "t2" },
  { id: "ff8", key: "ticketing", name: "Ticketing", description: "Resident support and maintenance queue.", enabled: true, tenantId: "t2" },
] satisfies AppDatabase["featureFlags"];

const users = [
  { id: "u1", name: "Kwame Asante", email: "owner@hostelhub.app", phone: "+233201234567", role: "platform_owner", accountStatus: "active", createdAt: "2025-01-01T10:00:00.000Z" },
  { id: "u2", name: "Ama Serwaa", email: "ops@dreamlandliving.co", phone: "+233209876543", role: "tenant_admin", tenantId: "t1", hostelId: "h1", adminAccountType: "manager", isTenantOwner: true, accountStatus: "active", createdAt: "2025-01-15T10:00:00.000Z" },
  { id: "u3", name: "Sarah Mensah", email: "sarah@ug.edu.gh", phone: "+233241112233", role: "resident", tenantId: "t1", hostelId: "h1", accountStatus: "active", createdAt: "2025-02-01T10:00:00.000Z" },
  { id: "u4", name: "Kofi Boateng", email: "kofi@ug.edu.gh", phone: "+233244556677", role: "resident", tenantId: "t1", hostelId: "h1", accountStatus: "active", createdAt: "2025-02-03T10:00:00.000Z" },
  { id: "u5", name: "Adaeze Nwosu", email: "adaeze@fieldschool.africa", phone: "+233247778899", role: "group_organizer", accountStatus: "active", createdAt: "2025-02-20T10:00:00.000Z" },
  { id: "u6", name: "Joan Lamptey", email: "joan@ug.edu.gh", phone: "+233240009944", role: "resident", tenantId: "t1", hostelId: "h2", accountStatus: "active", createdAt: "2025-02-24T10:00:00.000Z" },
  { id: "u7", name: "Kwaku Ofori", email: "ops@greenviewhostels.com", phone: "+233205554433", role: "tenant_admin", tenantId: "t2", hostelId: "h3", adminAccountType: "manager", isTenantOwner: true, accountStatus: "active", createdAt: "2025-02-28T09:00:00.000Z" },
  { id: "u8", name: "Esi Addo", email: "hello@campuslivingghana.com", phone: "+233260112244", role: "tenant_admin", tenantId: "t3", adminAccountType: "manager", isTenantOwner: true, accountStatus: "pending", createdAt: "2025-03-01T10:00:00.000Z" },
  { id: "u9", name: "Benjamin Tetteh", email: "frontdesk@dreamlandliving.co", phone: "+233244900100", role: "tenant_admin", tenantId: "t1", hostelId: "h1", adminAccountType: "receptionist", accountStatus: "active", createdAt: "2025-03-03T08:00:00.000Z" },
  { id: "u10", name: "Martha Owusu", email: "finance@dreamlandliving.co", phone: "+233244900101", role: "tenant_admin", tenantId: "t1", adminAccountType: "accountant", accountStatus: "active", createdAt: "2025-03-03T08:15:00.000Z" },
  { id: "u11", name: "Yaw Badu", email: "security@dreamlandliving.co", phone: "+233244900102", role: "tenant_admin", tenantId: "t1", hostelId: "h1", adminAccountType: "security", accountStatus: "active", createdAt: "2025-03-03T08:30:00.000Z" },
] satisfies AppDatabase["users"];

const residentProfiles = [
  { id: "rp1", userId: "u3", residentType: "student", institution: "University of Ghana", course: "Economics", yearOfStudy: "Level 300", emergencyContact: "Mary Mensah (+233245551100)", guardianName: "Mary Mensah", studentId: "UG-2023-0194", admissionLetter: "admission-letter-sarah.pdf", passportPhoto: "sarah-passport.jpg", gender: "female", bio: "Resident rep for Block B." },
  { id: "rp2", userId: "u4", residentType: "student", institution: "University of Ghana", course: "Computer Science", yearOfStudy: "Level 200", emergencyContact: "Yaw Boateng (+233244550010)", guardianName: "Yaw Boateng", studentId: "UG-2024-0408", admissionLetter: "admission-letter-kofi.pdf", passportPhoto: "kofi-passport.jpg", gender: "male" },
  { id: "rp3", userId: "u6", residentType: "guest", institution: "Independent Guest", emergencyContact: "Nana Lamptey (+233208887700)", passportPhoto: "joan-passport.jpg", gender: "female" },
] satisfies AppDatabase["residentProfiles"];

const tenants = [
  {
    id: "t1",
    name: "Dreamland Living",
    ownerId: "u2",
    status: "active",
    accountType: "fleet",
    hostelLimit: 5,
    currency: "GHS",
    hostels: ["h1", "h2"],
    primarySiteId: "site1",
    brandThemeId: "theme1",
    paymentConfigId: "paycfg1",
    emailConfigId: "mailcfg1",
    smsConfigId: "smscfg1",
    notificationConfigId: "notifcfg-t1",
    createdAt: "2025-01-15T10:00:00.000Z",
  },
  {
    id: "t2",
    name: "GreenView Properties",
    ownerId: "u7",
    status: "active",
    accountType: "single",
    hostelLimit: 1,
    currency: "USD",
    hostels: ["h3"],
    primarySiteId: "site3",
    brandThemeId: "theme2",
    paymentConfigId: "paycfg2",
    emailConfigId: "mailcfg2",
    smsConfigId: "smscfg2",
    notificationConfigId: "notifcfg-t2",
    createdAt: "2025-02-01T10:00:00.000Z",
  },
  {
    id: "t3",
    name: "Campus Living Ghana",
    ownerId: "u8",
    status: "pending",
    accountType: "fleet",
    hostelLimit: 3,
    currency: "GHS",
    hostels: [],
    primarySiteId: "site4",
    brandThemeId: "theme3",
    paymentConfigId: "paycfg3",
    emailConfigId: "mailcfg3",
    smsConfigId: "smscfg3",
    notificationConfigId: "notifcfg-t3",
    createdAt: "2025-03-01T10:00:00.000Z",
  },
] satisfies AppDatabase["tenants"];

const brandThemes = [
  { id: "theme1", tenantId: "t1", name: "Dreamland Brand", logoText: "Dreamland Living", fontDisplay: "Plus Jakarta Sans, sans-serif", fontBody: "Inter, sans-serif", backgroundColor: "#F7FAF9", foregroundColor: "#142920", cardColor: "#FFFFFF", cardForegroundColor: "#142920", primaryColor: "#103B31", secondaryColor: "#1F9D6B", accentColor: "#F59E0B", mutedColor: "#E9F1EE", mutedForegroundColor: "#4E665B", borderColor: "#D6E4DE", sidebarBackgroundColor: "#103B31", sidebarForegroundColor: "#F5FBF8", heroFromColor: "#103B31", heroToColor: "#1E5A4B" },
  { id: "theme2", tenantId: "t2", name: "GreenView Brand", logoText: "GreenView Residence", fontDisplay: "Plus Jakarta Sans, sans-serif", fontBody: "Inter, sans-serif", backgroundColor: "#F7F6EE", foregroundColor: "#173122", cardColor: "#FFFAF0", cardForegroundColor: "#173122", primaryColor: "#2D6A4F", secondaryColor: "#40916C", accentColor: "#D68C45", mutedColor: "#EBF0E6", mutedForegroundColor: "#627267", borderColor: "#D6DDCF", sidebarBackgroundColor: "#173122", sidebarForegroundColor: "#F8F7F0", heroFromColor: "#E8E1C8", heroToColor: "#F7F6EE" },
  { id: "theme3", tenantId: "t3", name: "Campus Living Draft", logoText: "Campus Living Ghana", fontDisplay: "Plus Jakarta Sans, sans-serif", fontBody: "Inter, sans-serif", backgroundColor: "#FAFAFC", foregroundColor: "#1F2340", cardColor: "#FFFFFF", cardForegroundColor: "#1F2340", primaryColor: "#1F4E79", secondaryColor: "#3A86B9", accentColor: "#F2994A", mutedColor: "#EEF2F7", mutedForegroundColor: "#5A6480", borderColor: "#DDE5F0", sidebarBackgroundColor: "#1F4E79", sidebarForegroundColor: "#F7FAFC", heroFromColor: "#1F4E79", heroToColor: "#3A86B9" },
] satisfies AppDatabase["brandThemes"];

const sites = [
  { id: "site1", tenantId: "t1", name: "Dreamland Living", slug: "dreamland-living", type: "tenant_brand", renderMode: "template", status: "published", pageManifest: tenantBrandPages, heroMediaUrl: "dreamland-brand-hero.jpg", publishedVersionId: "sv-site1-published", currentDraftVersionId: "sv-site1-draft", assetIds: ["asset1", "asset2"] },
  { id: "site2", tenantId: "t1", hostelId: "h1", name: "Dreamland Hostel", slug: "dreamland-hostel", type: "hostel_microsite", renderMode: "template", status: "published", pageManifest: micrositePages, heroMediaUrl: "dreamland-hostel-hero.jpg", themeOverride: { primaryColor: "#123E56", heroFromColor: "#123E56", heroToColor: "#1B6A8B" }, publishedVersionId: "sv-site2-published", currentDraftVersionId: "sv-site2-draft", assetIds: ["asset3"] },
  { id: "site3", tenantId: "t2", name: "GreenView Residence", slug: "greenview", type: "tenant_brand", renderMode: "template", status: "published", pageManifest: tenantBrandPages, heroMediaUrl: "greenview-hero.jpg", publishedVersionId: "sv-site3-published", currentDraftVersionId: "sv-site3-draft", assetIds: ["asset4"] },
  { id: "site4", tenantId: "t3", name: "Campus Living Ghana", slug: "campus-living", type: "tenant_brand", renderMode: "template", status: "draft", pageManifest: tenantBrandPages, heroMediaUrl: "campus-living-hero.jpg", currentDraftVersionId: "sv-site4-draft", assetIds: [] },
] satisfies AppDatabase["sites"];

const domains = [
  { id: "domain1", siteId: "site1", hostname: "dreamland-living.stay.hostelhub.app", isPrimary: false, verificationStatus: "verified", sslStatus: "issued", dnsInstructions: ["CNAME @ -> cname.hostelhub.app", "Wait for SSL issuance."], redirectToPrimary: true, isManagedFallback: true },
  { id: "domain2", siteId: "site1", hostname: "dreamlandliving.co", isPrimary: true, verificationStatus: "verified", sslStatus: "issued", dnsInstructions: ["CNAME www -> cname.hostelhub.app", "TXT _verify -> hostelhub-verify-t1"], redirectToPrimary: true, isManagedFallback: false },
  { id: "domain3", siteId: "site2", hostname: "dreamland-hostel.stay.hostelhub.app", isPrimary: true, verificationStatus: "verified", sslStatus: "issued", dnsInstructions: ["Managed subdomain provisioned automatically."], redirectToPrimary: false, isManagedFallback: true },
  { id: "domain4", siteId: "site3", hostname: "greenview.stay.hostelhub.app", isPrimary: true, verificationStatus: "verified", sslStatus: "issued", dnsInstructions: ["Managed subdomain provisioned automatically."], redirectToPrimary: false, isManagedFallback: true },
  { id: "domain5", siteId: "site3", hostname: "greenviewhostels.com", isPrimary: false, verificationStatus: "pending", sslStatus: "pending", dnsInstructions: ["CNAME www -> cname.hostelhub.app", "TXT _verify -> hostelhub-verify-t2"], redirectToPrimary: false, isManagedFallback: false },
  { id: "domain6", siteId: "site4", hostname: "campus-living.stay.hostelhub.app", isPrimary: true, verificationStatus: "pending", sslStatus: "pending", dnsInstructions: ["Managed fallback reserved. Publish after verification."], redirectToPrimary: false, isManagedFallback: true },
] satisfies AppDatabase["domains"];

const siteVersions = [
  dreamlandBrandDraft,
  dreamlandBrandPublished,
  dreamlandMicrositeDraft,
  dreamlandMicrositePublished,
  greenViewPublished,
  greenViewDraft,
  campusLivingDraft,
] satisfies AppDatabase["siteVersions"];

const siteAssets = [
  { id: "asset1", siteId: "site1", name: "Dreamland hero", kind: "image", url: "hostel-hero.jpg" },
  { id: "asset2", siteId: "site1", name: "Brand brochure", kind: "document", url: "dreamland-brand-brochure.pdf" },
  { id: "asset3", siteId: "site2", name: "Dreamland hostel gallery", kind: "image", url: "dreamland-hostel-gallery.jpg" },
  { id: "asset4", siteId: "site3", name: "GreenView hero", kind: "image", url: "greenview-hero.jpg" },
] satisfies AppDatabase["siteAssets"];

const tenantPaymentConfigs = [
  {
    id: "paycfg1",
    tenantId: "t1",
    provider: "paystack",
    providerDisplayName: "Paystack",
    merchantLabel: "Dreamland Living Ltd.",
    providerFields: {
      publicKey: "pk_live_dreamland_xxx",
      secretKey: "sk_live_dreamland_secret",
      webhookUrl: "https://dreamlandliving.co/api/payments/webhook",
    },
    generatedFields: {
      webhookUrl: "https://dreamlandliving.co/api/payments/webhook",
    },
    publicKey: "pk_live_dreamland_xxx",
    secretKey: "sk_live_dreamland_secret",
    secretKeyHint: "sk_live_dreamland_ending_92ab",
    webhookUrl: "https://dreamlandliving.co/api/payments/webhook",
    status: "live",
    lastTestedAt: "2026-03-12T09:00:00.000Z",
    testResult: "Callback signature verified successfully.",
    supportedMethods: [
      { method: "momo", enabled: true, channel: "online", displayLabel: "Paystack Mobile Money", providerMethodKey: "momo" },
      { method: "card", enabled: true, channel: "online", displayLabel: "Card checkout", providerMethodKey: "card" },
      { method: "bank_transfer", enabled: true, channel: "offline", displayLabel: "Bank transfer", instructions: "Transfer to Dreamland Living / GCB Bank / 1234567890 and upload proof.", accountName: "Dreamland Living Ltd.", accountNumber: "1234567890" },
      { method: "cash", enabled: true, channel: "offline", displayLabel: "Pay at reception", instructions: "Cash payments stay pending until a hostel admin verifies the receipt." },
    ],
  },
  {
    id: "paycfg2",
    tenantId: "t2",
    provider: "flutterwave",
    providerDisplayName: "Flutterwave",
    merchantLabel: "GreenView Residence",
    providerFields: {
      publicKey: "FLWPUBK_TEST-greenview",
      secretKey: "FLWSECK_TEST-greenview",
      secretHash: "greenview-secret-hash",
      webhookUrl: "https://greenviewhostels.com/api/payments/webhook",
    },
    generatedFields: {
      webhookUrl: "https://greenviewhostels.com/api/payments/webhook",
    },
    publicKey: "FLWPUBK_TEST-greenview",
    secretKey: "FLWSECK_TEST-greenview",
    secretHash: "greenview-secret-hash",
    secretKeyHint: "FLWSECK_TEST_ending_19cc",
    webhookUrl: "https://greenviewhostels.com/api/payments/webhook",
    status: "test",
    lastTestedAt: "2026-03-08T12:30:00.000Z",
    testResult: "Test mode connection successful. Awaiting live keys.",
    supportedMethods: [
      { method: "momo", enabled: false, channel: "online", displayLabel: "Mobile money", providerMethodKey: "momo" },
      { method: "card", enabled: true, channel: "online", displayLabel: "Card checkout", providerMethodKey: "card" },
      { method: "bank_transfer", enabled: true, channel: "offline", displayLabel: "Bank transfer", instructions: "Transfer to GreenView Residence / Fidelity Bank / 2233445566 and upload proof.", accountName: "GreenView Residence", accountNumber: "2233445566" },
      { method: "cash", enabled: false, channel: "offline", displayLabel: "Cash" },
    ],
  },
  {
    id: "paycfg3",
    tenantId: "t3",
    providerDisplayName: "Select provider",
    merchantLabel: "Campus Living Ghana",
    providerFields: {},
    generatedFields: {
      webhookUrl: "https://campus-living.stay.hostelhub.app/api/payments/webhook",
    },
    status: "draft",
    supportedMethods: [
      { method: "momo", enabled: false, channel: "online", displayLabel: "Mobile money" },
      { method: "card", enabled: false, channel: "online", displayLabel: "Card" },
      { method: "bank_transfer", enabled: true, channel: "offline", displayLabel: "Bank transfer", instructions: "Account details will appear here once the finance team confirms them." },
      { method: "cash", enabled: false, channel: "offline", displayLabel: "Cash" },
    ],
  },
] satisfies AppDatabase["tenantPaymentConfigs"];

const tenantEmailConfigs = [
  {
    id: "mailcfg1",
    tenantId: "t1",
    provider: "resend",
    providerDisplayName: "Resend",
    senderName: "Dreamland Living",
    fromEmail: "bookings@dreamlandliving.co",
    replyToEmail: "support@dreamlandliving.co",
    sendingDomain: "dreamlandliving.co",
    providerFields: {
      apiKey: "re_dreamland_live_key",
      fromEmail: "bookings@dreamlandliving.co",
      replyToEmail: "support@dreamlandliving.co",
      sendingDomain: "dreamlandliving.co",
    },
    generatedFields: {},
    status: "live",
    lastTestedAt: "2026-03-12T09:10:00.000Z",
    testResult: "Domain verified and sender accepted in mock mode.",
  },
  {
    id: "mailcfg2",
    tenantId: "t2",
    provider: "resend",
    providerDisplayName: "Resend",
    senderName: "GreenView Residence",
    fromEmail: "hello@greenviewhostels.com",
    replyToEmail: "ops@greenviewhostels.com",
    sendingDomain: "greenviewhostels.com",
    providerFields: {
      apiKey: "re_greenview_test_key",
      fromEmail: "hello@greenviewhostels.com",
      replyToEmail: "ops@greenviewhostels.com",
      sendingDomain: "greenviewhostels.com",
    },
    generatedFields: {},
    status: "test",
    lastTestedAt: "2026-03-10T13:00:00.000Z",
    testResult: "API key accepted. Waiting for production domain cutover.",
  },
  {
    id: "mailcfg3",
    tenantId: "t3",
    providerDisplayName: "Select email provider",
    senderName: "Campus Living Ghana",
    providerFields: {},
    generatedFields: {},
    status: "draft",
  },
] satisfies AppDatabase["tenantEmailConfigs"];

const tenantSmsConfigs = [
  {
    id: "smscfg1",
    tenantId: "t1",
    provider: "hubtel",
    providerDisplayName: "Hubtel SMS",
    senderId: "Dreamland",
    providerFields: {
      clientId: "dreamland-sms-client",
      clientSecret: "dreamland-sms-secret",
      senderId: "Dreamland",
    },
    generatedFields: {},
    status: "live",
    lastTestedAt: "2026-03-12T09:15:00.000Z",
    testResult: "Sender ID approved and SMS gateway reachable in mock mode.",
  },
  {
    id: "smscfg2",
    tenantId: "t2",
    provider: "hubtel",
    providerDisplayName: "Hubtel SMS",
    senderId: "GreenView",
    providerFields: {
      clientId: "greenview-sms-client",
      clientSecret: "greenview-sms-secret",
      senderId: "GreenView",
    },
    generatedFields: {},
    status: "test",
    lastTestedAt: "2026-03-10T13:05:00.000Z",
    testResult: "SMS credentials saved. Sender approval still pending.",
  },
  {
    id: "smscfg3",
    tenantId: "t3",
    providerDisplayName: "Select SMS provider",
    providerFields: {},
    generatedFields: {},
    status: "draft",
  },
] satisfies AppDatabase["tenantSmsConfigs"];

const tenantNotificationConfigs = [
  createDefaultTenantNotificationConfig("t1"),
  createDefaultTenantNotificationConfig("t2"),
  createDefaultTenantNotificationConfig("t3"),
].map((config) => {
  if (config.tenantId === "t1") {
    return {
      ...config,
      triggers: config.triggers.map((trigger) => {
        if (trigger.eventKey === "payment.submitted") return { ...trigger, emailEnabled: true };
        if (trigger.eventKey === "ticket.created") return { ...trigger, emailEnabled: true, smsEnabled: true };
        return trigger;
      }),
    };
  }
  if (config.tenantId === "t2") {
    return {
      ...config,
      triggers: config.triggers.map((trigger) => {
        if (trigger.eventKey === "payment.verified") return { ...trigger, emailEnabled: true };
        if (trigger.eventKey === "group.allocated") return { ...trigger, emailEnabled: true, smsEnabled: true };
        return trigger;
      }),
    };
  }
  return config;
}) satisfies AppDatabase["tenantNotificationConfigs"];

const hostels = [
  { id: "h1", tenantId: "t1", siteId: "site2", name: "Dreamland Hostel", location: "East Legon, Accra", university: "University of Ghana", allowedSchools: ["University of Ghana", "Academic City", "Ashesi University"], description: "Premium student accommodation with modern study lounges, secured gates, and easy campus access.", image: "", coverImages: ["dreamland-1", "dreamland-2"], rules: ["No loud music after 10PM", "Visitors must leave by 8PM", "No cooking inside rooms"], amenities: ["WiFi", "Study lounge", "Water backup", "Laundry room"], contact: { phone: "+233201234567", email: "info@dreamlandliving.co" }, rating: 4.7, totalBeds: 200, availableBeds: 36, genderPolicy: "mixed", checkInTime: "09:00", checkOutTime: "12:00" },
  { id: "h2", tenantId: "t1", name: "Dreamland Annex", location: "Madina, Accra", university: "University of Ghana", allowedSchools: ["University of Ghana"], description: "Affordable hostel with direct shuttle access and flexible semester pricing.", image: "", coverImages: ["annex-1", "annex-2"], rules: ["No pets", "Waste sorting required", "Quiet hours start at 9PM"], amenities: ["WiFi", "Shuttle stop", "Kitchenette", "CCTV"], contact: { phone: "+233201234568", email: "annex@dreamlandliving.co" }, rating: 4.2, totalBeds: 120, availableBeds: 18, genderPolicy: "female_only", checkInTime: "10:00", checkOutTime: "11:30" },
  { id: "h3", tenantId: "t2", name: "GreenView Residence", location: "Kumasi", university: "KNUST", allowedSchools: ["KNUST"], description: "Solar-powered student housing with shared workspaces and balanced pricing.", image: "", coverImages: ["greenview-1", "greenview-2"], rules: ["Energy-saving rules apply", "No smoking", "Common areas close at midnight"], amenities: ["Solar", "WiFi", "Gym corner", "Reading room"], contact: { phone: "+233301234567", email: "hello@greenviewhostels.com" }, rating: 4.4, totalBeds: 150, availableBeds: 42, genderPolicy: "mixed", checkInTime: "08:30", checkOutTime: "12:00" },
] satisfies AppDatabase["hostels"];

const blocks = [
  { id: "b1", hostelId: "h1", name: "Block A", floors: 3 },
  { id: "b2", hostelId: "h1", name: "Block B", floors: 4 },
  { id: "b3", hostelId: "h2", name: "Annex Main", floors: 2 },
  { id: "b4", hostelId: "h3", name: "Green Block", floors: 4 },
] satisfies AppDatabase["blocks"];

const rooms = [
  { id: "r1", hostelId: "h1", blockId: "b1", name: "A302", type: "single", capacity: 1, occupancy: 0, floor: 3, amenities: ["WiFi", "AC", "Desk"], images: ["room-single"], pricePerSemester: 3500, pricePerYear: 6200, pricePerNight: 120, status: "available", genderPolicy: "mixed" },
  { id: "r2", hostelId: "h1", blockId: "b1", name: "A201", type: "double", capacity: 2, occupancy: 1, floor: 2, amenities: ["WiFi", "Fan", "Desk"], images: ["room-double"], pricePerSemester: 2800, pricePerYear: 5000, pricePerNight: 90, status: "available", genderPolicy: "mixed" },
  { id: "r3", hostelId: "h1", blockId: "b2", name: "B101", type: "quad", capacity: 4, occupancy: 4, floor: 1, amenities: ["WiFi", "Fan"], images: ["room-double"], pricePerSemester: 1420, pricePerYear: 2600, pricePerNight: 55, status: "full", genderPolicy: "mixed" },
  { id: "r4", hostelId: "h1", blockId: "b2", name: "B203", type: "triple", capacity: 3, occupancy: 1, floor: 2, amenities: ["WiFi", "Wardrobe", "Fan"], images: ["room-double"], pricePerSemester: 2100, pricePerYear: 3750, pricePerNight: 70, status: "available", genderPolicy: "mixed" },
  { id: "r8", hostelId: "h1", blockId: "b1", name: "A103", type: "single", capacity: 1, occupancy: 0, floor: 1, amenities: ["WiFi", "Desk", "Wardrobe"], images: ["room-single"], pricePerSemester: 3300, pricePerYear: 5900, pricePerNight: 118, status: "available", genderPolicy: "mixed" },
  { id: "r9", hostelId: "h1", blockId: "b1", name: "A104", type: "double", capacity: 2, occupancy: 0, floor: 1, amenities: ["WiFi", "Desk", "Balcony"], images: ["room-double"], pricePerSemester: 2650, pricePerYear: 4800, pricePerNight: 88, status: "available", genderPolicy: "mixed" },
  { id: "r10", hostelId: "h1", blockId: "b1", name: "A305", type: "double", capacity: 2, occupancy: 0, floor: 3, amenities: ["WiFi", "AC", "Desk"], images: ["room-double"], pricePerSemester: 3100, pricePerYear: 5600, pricePerNight: 98, status: "available", genderPolicy: "mixed" },
  { id: "r11", hostelId: "h1", blockId: "b2", name: "B204", type: "triple", capacity: 3, occupancy: 0, floor: 2, amenities: ["WiFi", "Wardrobe", "Study nook"], images: ["room-double"], pricePerSemester: 2250, pricePerYear: 3950, pricePerNight: 74, status: "available", genderPolicy: "mixed" },
  { id: "r12", hostelId: "h1", blockId: "b2", name: "B307", type: "quad", capacity: 4, occupancy: 0, floor: 3, amenities: ["WiFi", "Locker", "Fan"], images: ["room-double"], pricePerSemester: 1680, pricePerYear: 3000, pricePerNight: 60, status: "available", genderPolicy: "mixed" },
  { id: "r13", hostelId: "h1", blockId: "b2", name: "B401", type: "single", capacity: 1, occupancy: 0, floor: 4, amenities: ["WiFi", "AC", "Private bath"], images: ["room-single"], pricePerSemester: 3750, pricePerYear: 6600, pricePerNight: 125, status: "available", genderPolicy: "mixed" },
  { id: "r5", hostelId: "h2", blockId: "b3", name: "M105", type: "double", capacity: 2, occupancy: 0, floor: 1, amenities: ["WiFi", "Desk"], images: ["room-double"], pricePerSemester: 2200, pricePerYear: 4100, pricePerNight: 88, status: "available", genderPolicy: "female_only" },
  { id: "r6", hostelId: "h3", blockId: "b4", name: "G301", type: "single", capacity: 1, occupancy: 1, floor: 3, amenities: ["WiFi", "AC", "Solar"], images: ["room-single"], pricePerSemester: 4000, pricePerYear: 7200, pricePerNight: 130, status: "full", genderPolicy: "mixed" },
  { id: "r7", hostelId: "h3", blockId: "b4", name: "G104", type: "double", capacity: 2, occupancy: 1, floor: 1, amenities: ["WiFi", "Solar", "Desk"], images: ["room-double"], pricePerSemester: 3000, pricePerYear: 5500, pricePerNight: 99, status: "available", genderPolicy: "mixed" },
] satisfies AppDatabase["rooms"];

const beds = [
  { id: "bed1", roomId: "r1", label: "Bed A", status: "available" },
  { id: "bed2", roomId: "r2", label: "Bed A", status: "occupied", residentId: "u4", bookingId: "bk2" },
  { id: "bed3", roomId: "r2", label: "Bed B", status: "available" },
  { id: "bed4", roomId: "r3", label: "Bed A", status: "occupied", residentId: "u3", bookingId: "bk1" },
  { id: "bed5", roomId: "r3", label: "Bed B", status: "occupied" },
  { id: "bed6", roomId: "r3", label: "Bed C", status: "occupied" },
  { id: "bed7", roomId: "r3", label: "Bed D", status: "occupied" },
  { id: "bed8", roomId: "r4", label: "Bed A", status: "occupied", residentId: "u6", bookingId: "bk4" },
  { id: "bed9", roomId: "r4", label: "Bed B", status: "available" },
  { id: "bed10", roomId: "r4", label: "Bed C", status: "available" },
  { id: "bed16", roomId: "r8", label: "Bed A", status: "available" },
  { id: "bed17", roomId: "r9", label: "Bed A", status: "available" },
  { id: "bed18", roomId: "r9", label: "Bed B", status: "available" },
  { id: "bed19", roomId: "r10", label: "Bed A", status: "available" },
  { id: "bed20", roomId: "r10", label: "Bed B", status: "available" },
  { id: "bed21", roomId: "r11", label: "Bed A", status: "available" },
  { id: "bed22", roomId: "r11", label: "Bed B", status: "available" },
  { id: "bed23", roomId: "r11", label: "Bed C", status: "available" },
  { id: "bed24", roomId: "r12", label: "Bed A", status: "available" },
  { id: "bed25", roomId: "r12", label: "Bed B", status: "available" },
  { id: "bed26", roomId: "r12", label: "Bed C", status: "available" },
  { id: "bed27", roomId: "r12", label: "Bed D", status: "available" },
  { id: "bed28", roomId: "r13", label: "Bed A", status: "available" },
  { id: "bed11", roomId: "r5", label: "Bed A", status: "available" },
  { id: "bed12", roomId: "r5", label: "Bed B", status: "available" },
  { id: "bed13", roomId: "r6", label: "Bed A", status: "occupied" },
  { id: "bed14", roomId: "r7", label: "Bed A", status: "occupied" },
  { id: "bed15", roomId: "r7", label: "Bed B", status: "available" },
] satisfies AppDatabase["beds"];

const periods = [
  { id: "p1", hostelId: "h1", name: "Semester 1 2025/2026", type: "semester", startDate: "2025-08-18", endDate: "2025-12-18", isActive: true },
  { id: "p2", hostelId: "h1", name: "Semester 2 2025/2026", type: "semester", startDate: "2026-01-15", endDate: "2026-06-03", isActive: false },
  { id: "p3", hostelId: "h1", name: "Vacation Stay 2026", type: "vacation", startDate: "2026-06-10", endDate: "2026-08-12", isActive: false },
  { id: "p4", hostelId: "h3", name: "Semester 1 2025/2026", type: "semester", startDate: "2025-08-18", endDate: "2025-12-18", isActive: true },
] satisfies AppDatabase["periods"];

const roomPeriodRates = rooms.flatMap((room) =>
  periods
    .filter((period) => period.hostelId === room.hostelId)
    .map((period) => {
      const hostel = hostels.find((item) => item.id === room.hostelId);
      const tenant = hostel ? tenants.find((item) => item.id === hostel.tenantId) : undefined;
      const price =
        period.type === "year"
          ? room.pricePerYear
          : period.type === "vacation"
            ? room.pricePerNight * 45
            : room.pricePerSemester;

      return {
        id: `rate-${room.id}-${period.id}`,
        roomId: room.id,
        periodId: period.id,
        price,
        currency: tenant?.currency ?? marketConfig.currency,
        active: true,
      };
    }),
) satisfies AppDatabase["roomPeriodRates"];

const bookings = [
  { id: "bk1", residentId: "u3", roomId: "r3", bedId: "bed4", hostelId: "h1", periodId: "p1", status: "confirmed", amount: 1420, durationLabel: "Semester 1", createdAt: "2025-08-15T10:00:00.000Z", updatedAt: "2025-08-16T10:00:00.000Z", checkInDate: "2025-08-18T10:00:00.000Z" },
  { id: "bk2", residentId: "u4", roomId: "r2", bedId: "bed2", hostelId: "h1", periodId: "p1", status: "checked_in", amount: 2800, durationLabel: "Semester 1", createdAt: "2025-08-12T10:00:00.000Z", updatedAt: "2025-08-18T10:00:00.000Z", checkInDate: "2025-08-18T10:00:00.000Z" },
  { id: "bk3", residentId: "u3", roomId: "r1", bedId: "bed1", hostelId: "h1", periodId: "p2", status: "pending", amount: 3500, durationLabel: "Semester 2", createdAt: "2025-11-01T10:00:00.000Z", updatedAt: "2025-11-01T10:00:00.000Z" },
  { id: "bk4", residentId: "u6", roomId: "r4", bedId: "bed8", hostelId: "h1", periodId: "p1", status: "reserved", amount: 2100, durationLabel: "Semester 1", createdAt: "2025-08-20T10:00:00.000Z", updatedAt: "2025-08-20T10:00:00.000Z" },
] satisfies AppDatabase["bookings"];

const groupBookings = [
  { id: "gb1", organizerId: "u5", hostelId: "h1", groupName: "Field School Africa", bedsRequired: 12, bedsAllocated: 0, allocatedBedIds: [], periodId: "p3", status: "requested", amount: 0, contactPhone: "+233247778899", notes: "Need rooms close together and early arrival support.", createdAt: "2025-10-15T10:00:00.000Z" },
] satisfies AppDatabase["groupBookings"];

const payments = [
  { id: "pay1", bookingId: "bk1", residentId: "u3", tenantId: "t1", amount: 1420, method: "momo", provider: "paystack", providerReference: "psk_112233", channel: "online", status: "completed", externalStatus: "captured", reference: "MOMO-2025-001", receiptName: "receipt-bk1.pdf", createdAt: "2025-08-15T10:00:00.000Z" },
  { id: "pay2", bookingId: "bk2", residentId: "u4", tenantId: "t1", amount: 2800, method: "card", provider: "paystack", providerReference: "psk_445566", channel: "online", status: "verified", externalStatus: "captured", reference: "CARD-2025-002", receiptName: "receipt-bk2.pdf", verifiedBy: "u2", createdAt: "2025-08-12T10:00:00.000Z" },
  { id: "pay3", bookingId: "bk3", residentId: "u3", tenantId: "t1", amount: 3500, method: "bank_transfer", channel: "offline", status: "pending", externalStatus: "verification_required", reference: "BANK-2025-003", receiptName: "transfer-proof-bk3.pdf", createdAt: "2025-11-01T10:00:00.000Z" },
] satisfies AppDatabase["payments"];

const tickets = [
  { id: "tk1", residentId: "u3", hostelId: "h1", category: "maintenance", subject: "Broken shower head", description: "The shower head in Room B101 is leaking constantly.", status: "open", priority: "high", createdAt: "2025-09-15T10:00:00.000Z", updatedAt: "2025-09-15T10:00:00.000Z" },
  { id: "tk2", residentId: "u4", hostelId: "h1", category: "room_change", subject: "Room change request", description: "I would like to move to a single room for next semester.", status: "assigned", priority: "medium", createdAt: "2025-10-01T10:00:00.000Z", updatedAt: "2025-10-02T10:00:00.000Z", assignedTo: "u2" },
  { id: "tk3", residentId: "u3", hostelId: "h1", category: "general", subject: "WiFi connectivity", description: "WiFi has been very slow on the third floor for the past week.", status: "resolved", priority: "medium", createdAt: "2025-09-20T10:00:00.000Z", updatedAt: "2025-09-22T10:00:00.000Z", assignedTo: "u2", resolutionNote: "ISP router was reset and signal extenders replaced." },
] satisfies AppDatabase["tickets"];

const notifications = [
  { id: "n1", userId: "u3", tenantId: "t1", audience: "resident", eventKey: "booking.status_updated", title: "Booking confirmed", message: "Your booking for Room B101 has been confirmed.", type: "booking", channel: "in_app", read: false, createdAt: "2025-08-16T10:00:00.000Z", link: "/resident/bookings" },
  { id: "n2", userId: "u3", tenantId: "t1", audience: "resident", eventKey: "payment.verified", title: "Payment received", message: "Payment of GHS 1,420 received successfully.", type: "payment", channel: "in_app", read: true, createdAt: "2025-08-15T10:00:00.000Z", link: "/resident/payments" },
  { id: "n3", userId: "u2", tenantId: "t1", audience: "tenant_admin", eventKey: "payment.submitted", title: "Bank transfer proof uploaded", message: "Sarah Mensah submitted transfer proof for review.", type: "payment", channel: "in_app", read: false, createdAt: "2025-11-01T10:05:00.000Z", link: "/admin/payments" },
  { id: "n4", userId: "u5", tenantId: "t1", audience: "group_organizer", eventKey: "group.request_created", title: "Group request received", message: "Your field school request is under review.", type: "booking", channel: "in_app", read: false, createdAt: "2025-10-15T10:00:00.000Z", link: "/group-booking" },
  { id: "n5", userId: "u7", tenantId: "t2", audience: "tenant_admin", eventKey: "ticket.created", title: "New resident issue logged", message: "A GreenView resident submitted a support request from the resident dashboard.", type: "ticket", channel: "in_app", read: false, createdAt: "2025-10-18T10:00:00.000Z", link: "/admin/tickets" },
] satisfies AppDatabase["notifications"];

const notificationDispatches = [
  {
    id: "dispatch1",
    tenantId: "t1",
    userId: "u2",
    notificationId: "n3",
    eventKey: "payment.submitted",
    channel: "email",
    status: "queued",
    provider: "resend",
    target: "ops@dreamlandliving.co",
    createdAt: "2025-11-01T10:05:00.000Z",
  },
  {
    id: "dispatch2",
    tenantId: "t2",
    userId: "u7",
    notificationId: "n5",
    eventKey: "ticket.created",
    channel: "sms",
    status: "queued",
    provider: "hubtel",
    target: "+233205554433",
    createdAt: "2025-10-18T10:00:05.000Z",
  },
] satisfies AppDatabase["notificationDispatches"];

const waitingList = [
  { id: "w1", residentId: "u3", hostelId: "h1", roomType: "single", periodId: "p2", position: 1, status: "waiting", createdAt: "2025-10-10T10:00:00.000Z" },
] satisfies AppDatabase["waitingList"];

const pricingRules = [
  { id: "pr1", hostelId: "h1", roomType: "single", periodType: "semester", durationLabel: "Semester", price: 3500, currency: "GHS", active: true },
  { id: "pr2", hostelId: "h1", roomType: "double", periodType: "semester", durationLabel: "Semester", price: 2800, currency: "GHS", active: true },
  { id: "pr3", hostelId: "h1", roomType: "triple", periodType: "semester", durationLabel: "Semester", price: 2100, currency: "GHS", active: true },
  { id: "pr4", hostelId: "h1", roomType: "quad", periodType: "semester", durationLabel: "Semester", price: 1420, currency: "GHS", active: true },
  { id: "pr5", hostelId: "h3", roomType: "single", periodType: "semester", durationLabel: "Semester", price: 4000, currency: "USD", active: true },
] satisfies AppDatabase["pricingRules"];

const discountCodes = [
  { id: "dc1", hostelId: "h1", code: "EARLY2026", percentage: 10, validUntil: "2026-01-10", usageLimit: 50, usedCount: 12, active: true },
  { id: "dc2", hostelId: "h1", code: "GROUP15", percentage: 15, validUntil: "2026-06-30", usageLimit: 20, usedCount: 3, active: true },
] satisfies AppDatabase["discountCodes"];

export function createSeedDatabase(): AppDatabase {
  return {
    marketConfig,
    featureFlags,
    users,
    residentProfiles,
    tenants,
    brandThemes,
    sites,
    domains,
    siteVersions,
    siteAssets,
    tenantPaymentConfigs,
    tenantEmailConfigs,
    tenantSmsConfigs,
    tenantNotificationConfigs,
    notificationDispatches,
    hostels,
    blocks,
    rooms,
    roomPeriodRates,
    beds,
    periods,
    bookings,
    groupBookings,
    payments,
    tickets,
    notifications,
    waitingList,
    pricingRules,
    discountCodes,
  };
}

const seed = createSeedDatabase();

export const mockUsers = seed.users;
export const mockTenants = seed.tenants;
export const mockBrandThemes = seed.brandThemes;
export const mockSites = seed.sites;
export const mockDomains = seed.domains;
export const mockSiteVersions = seed.siteVersions;
export const mockSiteAssets = seed.siteAssets;
export const mockTenantPaymentConfigs = seed.tenantPaymentConfigs;
export const mockTenantEmailConfigs = seed.tenantEmailConfigs;
export const mockTenantSmsConfigs = seed.tenantSmsConfigs;
export const mockTenantNotificationConfigs = seed.tenantNotificationConfigs;
export const mockNotificationDispatches = seed.notificationDispatches;
export const mockHostels = seed.hostels;
export const mockBlocks = seed.blocks;
export const mockRooms = seed.rooms;
export const mockRoomPeriodRates = seed.roomPeriodRates;
export const mockBeds = seed.beds;
export const mockPeriods = seed.periods;
export const mockBookings = seed.bookings;
export const mockGroupBookings = seed.groupBookings;
export const mockPayments = seed.payments;
export const mockTickets = seed.tickets;
export const mockNotifications = seed.notifications;
export const mockWaitingList = seed.waitingList;
export const mockPricingRules = seed.pricingRules;
export const mockDiscountCodes = seed.discountCodes;
