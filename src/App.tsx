import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "@/contexts/AppContext";
import { SiteProvider } from "@/contexts/SiteContext";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { ResidentLayout } from "@/components/layout/ResidentLayout";
import ExplorePage from "@/pages/ExplorePage";
import HostelDetailPage from "@/pages/HostelDetailPage";
import RoomDetailPage from "@/pages/RoomDetailPage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import OnboardingPage from "@/pages/OnboardingPage";
import PaymentPage from "@/pages/PaymentPage";
import GroupBookingPage from "@/pages/GroupBookingPage";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminRooms from "@/pages/admin/AdminRooms";
import AdminBookings from "@/pages/admin/AdminBookings";
import AdminPayments from "@/pages/admin/AdminPayments";
import AdminTickets from "@/pages/admin/AdminTickets";
import AdminResidents from "@/pages/admin/AdminResidents";
import AdminCheckIn from "@/pages/admin/AdminCheckIn";
import AdminWaitingList from "@/pages/admin/AdminWaitingList";
import AdminPeriods from "@/pages/admin/AdminPeriods";
import AdminPricing from "@/pages/admin/AdminPricing";
import AdminReports from "@/pages/admin/AdminReports";
import AdminSettings from "@/pages/admin/AdminSettings";
import AdminAccount from "@/pages/admin/AdminAccount";
import ResidentDashboard from "@/pages/resident/ResidentDashboard";
import ResidentBookings from "@/pages/resident/ResidentBookings";
import ResidentPayments from "@/pages/resident/ResidentPayments";
import ResidentTickets from "@/pages/resident/ResidentTickets";
import ResidentQR from "@/pages/resident/ResidentQR";
import ResidentNotifications from "@/pages/resident/ResidentNotifications";
import ResidentProfile from "@/pages/resident/ResidentProfile";
import PlatformDashboard from "@/pages/platform/PlatformDashboard";
import PlatformAnalytics from "@/pages/platform/PlatformAnalytics";
import PlatformTenants from "@/pages/platform/PlatformTenants";
import PlatformFeatures from "@/pages/platform/PlatformFeatures";
import PlatformAccount from "@/pages/platform/PlatformAccount";
import GroupProfilePage from "@/pages/GroupProfilePage";
import ResolvedPublicSitePage from "@/pages/ResolvedPublicSitePage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AppProvider>
        <BrowserRouter>
          <SiteProvider>
            <Routes>
              {/* Auth */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/:siteSlug/login" element={<LoginPage />} />
              <Route path="/:siteSlug/register" element={<RegisterPage />} />
              <Route path="/onboarding" element={<OnboardingPage />} />

              {/* Admin */}
              <Route element={<AdminLayout />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/rooms" element={<AdminRooms />} />
                <Route path="/admin/bookings" element={<AdminBookings />} />
                <Route path="/admin/payments" element={<AdminPayments />} />
                <Route path="/admin/tickets" element={<AdminTickets />} />
                <Route path="/admin/residents" element={<AdminResidents />} />
                <Route path="/admin/checkin" element={<AdminCheckIn />} />
                <Route path="/admin/waiting-list" element={<AdminWaitingList />} />
                <Route path="/admin/periods" element={<AdminPeriods />} />
                <Route path="/admin/pricing" element={<AdminPricing />} />
                <Route path="/admin/reports" element={<AdminReports />} />
                <Route path="/admin/notifications" element={<ResidentNotifications />} />
                <Route path="/admin/notifications/:notificationId" element={<ResidentNotifications />} />
                <Route path="/admin/settings" element={<AdminSettings />} />
                <Route path="/admin/account" element={<AdminAccount />} />
                <Route path="/platform" element={<PlatformDashboard />} />
                <Route path="/platform/tenants" element={<PlatformTenants />} />
                <Route path="/platform/analytics" element={<PlatformAnalytics />} />
                <Route path="/platform/features" element={<PlatformFeatures />} />
                <Route path="/platform/account" element={<PlatformAccount />} />
              </Route>

              {/* Resident */}
              <Route element={<ResidentLayout />}>
                <Route path="/payment" element={<PaymentPage />} />
                <Route path="/group-booking" element={<GroupBookingPage />} />
                <Route path="/group/profile" element={<GroupProfilePage />} />
                <Route path="/group/notifications" element={<ResidentNotifications />} />
                <Route path="/group/notifications/:notificationId" element={<ResidentNotifications />} />
                <Route path="/group/properties" element={<ExplorePage />} />
                <Route path="/group/properties/:hostelId" element={<HostelDetailPage />} />
                <Route path="/group/rooms/:roomId" element={<RoomDetailPage />} />
                <Route path="/resident" element={<ResidentDashboard />} />
                <Route path="/resident/bookings" element={<ResidentBookings />} />
                <Route path="/resident/payments" element={<ResidentPayments />} />
                <Route path="/resident/tickets" element={<ResidentTickets />} />
                <Route path="/resident/qr" element={<ResidentQR />} />
                <Route path="/resident/notifications" element={<ResidentNotifications />} />
                <Route path="/resident/notifications/:notificationId" element={<ResidentNotifications />} />
                <Route path="/resident/properties" element={<ExplorePage />} />
                <Route path="/resident/properties/:hostelId" element={<HostelDetailPage />} />
                <Route path="/resident/rooms/:roomId" element={<RoomDetailPage />} />
                <Route path="/resident/profile" element={<ResidentProfile />} />
              </Route>

              {/* Public */}
              <Route element={<PublicLayout />}>
                <Route path="/properties" element={<ExplorePage />} />
                <Route path="/properties/:hostelId" element={<HostelDetailPage />} />
                <Route path="/rooms/:roomId" element={<RoomDetailPage />} />
                <Route path="/:siteSlug/properties" element={<ExplorePage />} />
                <Route path="/:siteSlug/properties/:hostelId" element={<HostelDetailPage />} />
                <Route path="/:siteSlug/rooms/:roomId" element={<RoomDetailPage />} />
                <Route path="*" element={<ResolvedPublicSitePage />} />
              </Route>
            </Routes>
          </SiteProvider>
        </BrowserRouter>
      </AppProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
