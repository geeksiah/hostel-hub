export type UserRole = "platform_owner" | "tenant_admin" | "resident" | "group_organizer";
export type TenantStatus = "active" | "suspended" | "pending";
export type TenantType = "single" | "fleet";
export type AdminAccountType = "manager" | "receptionist" | "accountant" | "security";
export type AccountStatus = "active" | "suspended" | "pending";
export type FeatureFlagKey =
  | "waitlist"
  | "group_bookings"
  | "offline_payments"
  | "resident_qr"
  | "ticketing"
  | "reporting";
export type RoomType = "single" | "double" | "triple" | "quad";
export type BedStatus = "available" | "reserved" | "occupied" | "maintenance";
export type AcademicPeriodType = "semester" | "year" | "vacation";
export type SiteType = "tenant_brand" | "hostel_microsite";
export type SiteRenderMode = "template" | "custom_code";
export type SiteStatus = "draft" | "published";
export type SiteVersionStatus = "draft" | "published";
export type SitePageKind = "home" | "properties" | "about" | "faq" | "contact" | "custom";
export type DomainVerificationStatus = "pending" | "verified";
export type DomainSslStatus = "pending" | "issued";
export type BookingStatus =
  | "pending"
  | "reserved"
  | "confirmed"
  | "cancelled"
  | "checked_in"
  | "checked_out";
export type PaymentMethod = "momo" | "card" | "cash" | "bank_transfer";
export type PaymentProvider = "paystack" | "flutterwave" | "hubtel";
export type PaymentProviderStatus = "draft" | "test" | "live";
export type PaymentChannel = "online" | "offline";
export type PaymentStatus = "pending" | "completed" | "failed" | "verified";
export type ExternalPaymentStatus = "not_started" | "initialized" | "captured" | "verification_required" | "failed";
export type TicketCategory = "maintenance" | "room_change" | "general";
export type TicketStatus = "open" | "assigned" | "resolved" | "closed";
export type NotificationChannel = "email" | "sms" | "in_app";
export type NotificationType = "booking" | "payment" | "ticket" | "system" | "waitlist";
export type NotificationAudience = "platform_owner" | "tenant_admin" | "resident" | "group_organizer";
export type NotificationTargetType = "booking" | "payment" | "ticket" | "waitlist" | "group_booking" | "resident" | "site" | "hostel";
export type NotificationEventKey =
  | "booking.created"
  | "booking.cancelled"
  | "booking.status_updated"
  | "group.request_created"
  | "group.allocated"
  | "waitlist.joined"
  | "waitlist.updated"
  | "waitlist.converted"
  | "assignment.updated"
  | "payment.submitted"
  | "payment.verified"
  | "payment.failed"
  | "ticket.created"
  | "ticket.assigned"
  | "ticket.resolved"
  | "ticket.closed"
  | "checkin.completed"
  | "checkout.completed";
export type NotificationDispatchStatus = "queued" | "skipped" | "delivered" | "failed";
export type EmailProvider = "resend";
export type SmsProvider = "hubtel";
export type GroupBookingStatus = "requested" | "reviewing" | "allocated" | "confirmed" | "cancelled";
export type WaitingListStatus = "waiting" | "approved" | "notified" | "rejected" | "expired" | "converted";
export type GenderPolicy = "mixed" | "female_only" | "male_only";
export type ResidentType = "student" | "guest";
export type CheckInStatus = "awaiting_check_in" | "checked_in" | "checked_out";
export type ReportKind = "occupancy" | "revenue" | "payments" | "residents";

export interface ServiceError {
  code: string;
  message: string;
}

export interface Meta {
  total?: number;
  generatedAt?: string;
}

export interface ServiceResult<T> {
  data: T;
  error?: ServiceError;
  meta?: Meta;
}

export interface FeatureFlag {
  id: string;
  key: FeatureFlagKey;
  name: string;
  description: string;
  enabled: boolean;
  tenantId?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  accountStatus?: AccountStatus;
  adminAccountType?: AdminAccountType;
  isTenantOwner?: boolean;
  avatar?: string;
  tenantId?: string;
  hostelId?: string;
  createdAt: string;
}

export interface ResidentProfile {
  id: string;
  userId: string;
  residentType: ResidentType;
  institution: string;
  course?: string;
  yearOfStudy?: string;
  emergencyContact: string;
  guardianName?: string;
  studentId?: string;
  admissionLetter?: string;
  passportPhoto?: string;
  nationalId?: string;
  gender: "male" | "female" | "other";
  bio?: string;
}

export interface Tenant {
  id: string;
  name: string;
  ownerId: string;
  status: TenantStatus;
  accountType: TenantType;
  hostelLimit: number;
  currency: string;
  hostels: string[];
  primarySiteId?: string;
  brandThemeId?: string;
  paymentConfigId?: string;
  emailConfigId?: string;
  smsConfigId?: string;
  notificationConfigId?: string;
  createdAt: string;
}

export interface Hostel {
  id: string;
  tenantId: string;
  siteId?: string;
  name: string;
  location: string;
  university: string;
  description: string;
  image: string;
  coverImages: string[];
  rules: string[];
  amenities: string[];
  contact: { phone: string; email: string };
  rating: number;
  totalBeds: number;
  availableBeds: number;
  genderPolicy: GenderPolicy;
  checkInTime: string;
  checkOutTime: string;
}

export interface Block {
  id: string;
  hostelId: string;
  name: string;
  floors: number;
}

export interface Room {
  id: string;
  hostelId: string;
  blockId: string;
  name: string;
  type: RoomType;
  capacity: number;
  occupancy: number;
  floor: number;
  amenities: string[];
  images: string[];
  pricePerSemester: number;
  pricePerYear: number;
  pricePerNight: number;
  status: "available" | "full" | "maintenance";
  genderPolicy: GenderPolicy;
}

export interface Bed {
  id: string;
  roomId: string;
  label: string;
  status: BedStatus;
  residentId?: string;
  bookingId?: string;
}

export interface AcademicPeriod {
  id: string;
  hostelId: string;
  name: string;
  type: AcademicPeriodType;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface Booking {
  id: string;
  residentId: string;
  roomId: string;
  bedId: string;
  hostelId: string;
  periodId: string;
  status: BookingStatus;
  amount: number;
  durationLabel: string;
  discountCode?: string;
  createdAt: string;
  updatedAt: string;
  checkInDate?: string;
  checkOutDate?: string;
  inspectionNotes?: string;
}

export interface GroupBooking {
  id: string;
  organizerId: string;
  hostelId: string;
  groupName: string;
  bedsRequired: number;
  bedsAllocated: number;
  allocatedBedIds: string[];
  periodId: string;
  status: GroupBookingStatus;
  amount: number;
  contactPhone: string;
  notes?: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  bookingId?: string;
  groupBookingId?: string;
  residentId?: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  reference: string;
  tenantId?: string;
  provider?: PaymentProvider;
  providerReference?: string;
  channel?: PaymentChannel;
  failureReason?: string;
  externalStatus?: ExternalPaymentStatus;
  externalMetadata?: Record<string, string>;
  receiptUrl?: string;
  receiptName?: string;
  verifiedBy?: string;
  createdAt: string;
}

export interface Ticket {
  id: string;
  residentId: string;
  hostelId: string;
  category: TicketCategory;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: "low" | "medium" | "high";
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
  resolutionNote?: string;
  images?: string[];
}

export interface WaitingListEntry {
  id: string;
  residentId: string;
  hostelId: string;
  roomType: RoomType;
  periodId: string;
  position: number;
  status: WaitingListStatus;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  tenantId?: string;
  audience?: NotificationAudience;
  eventKey?: NotificationEventKey;
  title: string;
  message: string;
  type: NotificationType;
  channel: NotificationChannel;
  read: boolean;
  createdAt: string;
  link?: string;
  actionLabel?: string;
  targetType?: NotificationTargetType;
  targetId?: string;
}

export interface PricingRule {
  id: string;
  hostelId: string;
  roomType: RoomType;
  periodType: AcademicPeriodType;
  durationLabel: string;
  price: number;
  currency: string;
  active: boolean;
}

export interface DiscountCode {
  id: string;
  hostelId: string;
  code: string;
  percentage: number;
  validUntil: string;
  usageLimit: number;
  usedCount: number;
  active: boolean;
}

export interface ReportDataset {
  id: string;
  kind: ReportKind;
  title: string;
  columns: string[];
  rows: Array<Record<string, string | number>>;
  generatedAt: string;
}

export interface BrandTheme {
  id: string;
  tenantId: string;
  name: string;
  logoText: string;
  logoUrl?: string;
  fontDisplay: string;
  fontBody: string;
  backgroundColor: string;
  foregroundColor: string;
  cardColor: string;
  cardForegroundColor: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  mutedColor: string;
  mutedForegroundColor: string;
  borderColor: string;
  sidebarBackgroundColor: string;
  sidebarForegroundColor: string;
  heroFromColor: string;
  heroToColor: string;
}

export interface BrandThemeOverride extends Partial<Omit<BrandTheme, "id" | "tenantId" | "name">> {}

export interface SitePageDefinition {
  id: string;
  slug: string;
  title: string;
  navLabel: string;
  kind: SitePageKind;
  visibleInNav: boolean;
  summary?: string;
}

export interface SiteStat {
  label: string;
  value: string;
}

export interface SiteFaqItem {
  question: string;
  answer: string;
}

export interface SiteTemplateContent {
  announcement?: string;
  eyebrow: string;
  headline: string;
  subheadline: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
  stats: SiteStat[];
  featureBullets: string[];
  trustPoints: string[];
  aboutTitle?: string;
  aboutBody?: string;
  faq: SiteFaqItem[];
  contactTitle?: string;
  contactBody?: string;
}

export interface SiteVersion {
  id: string;
  siteId: string;
  label: string;
  status: SiteVersionStatus;
  createdAt: string;
  publishedAt?: string;
  templateContent: SiteTemplateContent;
  customCode?: {
    html: string;
    css: string;
    js: string;
  };
}

export interface SiteAsset {
  id: string;
  siteId: string;
  name: string;
  kind: "image" | "video" | "document";
  url: string;
}

export interface Site {
  id: string;
  tenantId: string;
  hostelId?: string;
  name: string;
  slug: string;
  type: SiteType;
  renderMode: SiteRenderMode;
  status: SiteStatus;
  pageManifest: SitePageDefinition[];
  themeOverride?: BrandThemeOverride;
  heroMediaUrl?: string;
  publishedVersionId?: string;
  currentDraftVersionId?: string;
  assetIds: string[];
}

export interface DomainMapping {
  id: string;
  siteId: string;
  hostname: string;
  isPrimary: boolean;
  verificationStatus: DomainVerificationStatus;
  sslStatus: DomainSslStatus;
  dnsInstructions: string[];
  redirectToPrimary: boolean;
  isManagedFallback: boolean;
}

export interface TenantPaymentMethodConfig {
  method: PaymentMethod;
  enabled: boolean;
  channel: PaymentChannel;
  displayLabel: string;
  instructions?: string;
  accountName?: string;
  accountNumber?: string;
  providerMethodKey?: string;
}

export interface TenantPaymentConfig {
  id: string;
  tenantId: string;
  provider?: PaymentProvider;
  providerDisplayName: string;
  merchantLabel: string;
  providerFields?: Record<string, string>;
  generatedFields?: Record<string, string>;
  publicKey?: string;
  secretKey?: string;
  secretHash?: string;
  secretKeyHint?: string;
  webhookUrl?: string;
  supportedMethods: TenantPaymentMethodConfig[];
  status: PaymentProviderStatus;
  lastTestedAt?: string;
  testResult?: string;
}

export interface TenantEmailConfig {
  id: string;
  tenantId: string;
  provider?: EmailProvider;
  providerDisplayName: string;
  senderName: string;
  fromEmail?: string;
  replyToEmail?: string;
  sendingDomain?: string;
  providerFields?: Record<string, string>;
  generatedFields?: Record<string, string>;
  status: PaymentProviderStatus;
  lastTestedAt?: string;
  testResult?: string;
}

export interface TenantSmsConfig {
  id: string;
  tenantId: string;
  provider?: SmsProvider;
  providerDisplayName: string;
  senderId?: string;
  providerFields?: Record<string, string>;
  generatedFields?: Record<string, string>;
  status: PaymentProviderStatus;
  lastTestedAt?: string;
  testResult?: string;
}

export interface NotificationTriggerConfig {
  eventKey: NotificationEventKey;
  label: string;
  audience: NotificationAudience;
  inAppEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
}

export interface TenantNotificationConfig {
  id: string;
  tenantId: string;
  internalNotificationsEnabled: boolean;
  triggers: NotificationTriggerConfig[];
}

export interface NotificationDispatch {
  id: string;
  tenantId: string;
  userId: string;
  notificationId?: string;
  eventKey: NotificationEventKey;
  channel: Exclude<NotificationChannel, "in_app">;
  status: NotificationDispatchStatus;
  provider?: PaymentProvider | EmailProvider | SmsProvider;
  providerReference?: string;
  target: string;
  reason?: string;
  createdAt: string;
}

export interface MarketConfig {
  currency: string;
  supportedCurrencies: string[];
  country: string;
  managedDomainSuffix: string;
  universities: string[];
  locations: string[];
  paymentMethods: Array<{ value: PaymentMethod; label: string; description: string }>;
}

export interface ExploreFilters {
  search: string;
  university: string;
  roomType: RoomType | "all";
  genderPolicy: GenderPolicy | "all";
  availabilityOnly: boolean;
  duration: AcademicPeriodType | "all";
  sort: "recommended" | "price_asc" | "price_desc" | "beds_desc";
  priceRange: [number, number];
}

export interface PendingBookingDraft {
  hostelId: string;
  roomId: string;
  bedId: string;
  periodId: string;
  residentId?: string;
  amount: number;
  durationLabel: string;
  discountCode?: string;
}

export interface DashboardMetrics {
  totalBeds: number;
  occupiedBeds: number;
  availableBeds: number;
  pendingBookings: number;
  pendingPayments: number;
  openTickets: number;
  revenue: number;
}

export interface TenantDetailView {
  tenant: Tenant;
  hostels: Hostel[];
  flags: FeatureFlag[];
  sites: Site[];
  domains: DomainMapping[];
  residents: number;
  revenue: number;
  brandTheme?: BrandTheme;
  paymentConfig?: TenantPaymentConfig;
  readiness: {
    website: boolean;
    domain: boolean;
    brand: boolean;
    payments: boolean;
  };
}

export interface AccountProfileView {
  user: User;
  residentProfile?: ResidentProfile;
  tenant?: Tenant;
  hostels: Hostel[];
}

export interface BookingDraft extends PendingBookingDraft {
  discountCode?: string;
}

export interface GroupAllocationDraft {
  groupBookingId: string;
  selectedBedIds: string[];
}

export interface NotificationEvent {
  title: string;
  message: string;
  channel: NotificationChannel;
  type: NotificationType;
  link?: string;
}

export interface AppDatabase {
  marketConfig: MarketConfig;
  featureFlags: FeatureFlag[];
  users: User[];
  residentProfiles: ResidentProfile[];
  tenants: Tenant[];
  brandThemes: BrandTheme[];
  sites: Site[];
  domains: DomainMapping[];
  siteVersions: SiteVersion[];
  siteAssets: SiteAsset[];
  tenantPaymentConfigs: TenantPaymentConfig[];
  tenantEmailConfigs: TenantEmailConfig[];
  tenantSmsConfigs: TenantSmsConfig[];
  tenantNotificationConfigs: TenantNotificationConfig[];
  notificationDispatches: NotificationDispatch[];
  hostels: Hostel[];
  blocks: Block[];
  rooms: Room[];
  beds: Bed[];
  periods: AcademicPeriod[];
  bookings: Booking[];
  groupBookings: GroupBooking[];
  payments: Payment[];
  tickets: Ticket[];
  notifications: Notification[];
  waitingList: WaitingListEntry[];
  pricingRules: PricingRule[];
  discountCodes: DiscountCode[];
}
