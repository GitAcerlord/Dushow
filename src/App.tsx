import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/auth/ProtectedRoute";

// Pages
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import About from "./pages/About";
import Services from "./pages/Services";

// Admin
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminUsers from "./pages/admin/Users";
import AdminContracts from "./pages/admin/Contracts";
import AdminApprovals from "./pages/admin/Approvals";
import AdminSettings from "./pages/admin/Settings";
import AdminFinance from "./pages/admin/Finance";
import AdminMessages from "./pages/admin/Messages";
import AdminDisputes from "./pages/admin/Disputes";

// Pro
import ProLayout from "./pages/pro/ProLayout";
import ProDashboard from "./pages/pro/Dashboard";
import ProFinance from "./pages/pro/Finance";
import ProPlans from "./pages/pro/Plans";
import PlanCheckout from "./pages/pro/PlanCheckout";
import Feed from "./pages/pro/Feed";
import ProAgenda from "./pages/pro/Agenda";
import ProProfile from "./pages/pro/Profile";
import ProMessages from "./pages/pro/Messages";
import ProAchievements from "./pages/pro/Achievements";
import ProReviews from "./pages/pro/Reviews";
import ProContracts from "./pages/pro/Contracts";
import ContractDetails from "./pages/pro/ContractDetails";
import Badges from "./pages/pro/Badges";
import ProSettings from "./pages/pro/Settings";

// Client
import ClientLayout from "./pages/client/ClientLayout";
import ClientDashboard from "./pages/client/Dashboard";
import Discovery from "./pages/client/Discovery";
import Checkout from "./pages/client/Checkout";
import ClientEvents from "./pages/client/Events";
import ClientMessages from "./pages/client/Messages";
import Favorites from "./pages/client/Favorites";
import ClientPayments from "./pages/client/Payments";
import ClientProfile from "./pages/client/Profile";
import ClientFeed from "./pages/client/Feed";
import ArtistProfile from "./pages/client/ArtistProfile";
import PaymentMethods from "./pages/client/PaymentMethods";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/about" element={<About />} />
          <Route path="/services" element={<Services />} />
          
          {/* Painel Administrativo */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="contracts" element={<AdminContracts />} />
            <Route path="disputes" element={<AdminDisputes />} />
            <Route path="messages" element={<AdminMessages />} />
            <Route path="finance" element={<AdminFinance />} />
            <Route path="approvals" element={<AdminApprovals />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          {/* Painel do Profissional */}
          <Route path="/pro" element={
            <ProtectedRoute allowedRoles={['PRO', 'ADMIN']}>
              <ProLayout />
            </ProtectedRoute>
          }>
            <Route index element={<ProDashboard />} />
            <Route path="profile" element={<ProProfile />} />
            <Route path="feed" element={<Feed />} />
            <Route path="reviews" element={<ProReviews />} />
            <Route path="messages" element={<ProMessages />} />
            <Route path="contracts" element={<ProContracts />} />
            <Route path="contracts/:id" element={<ContractDetails />} />
            <Route path="agenda" element={<ProAgenda />} />
            <Route path="badges" element={<Badges />} />
            <Route path="achievements" element={<ProAchievements />} />
            <Route path="settings" element={<ProSettings />} />
            <Route path="plans" element={<ProPlans />} />
            <Route path="plans/checkout" element={<PlanCheckout />} />
            <Route path="finance" element={<ProFinance />} />
          </Route>

          {/* Painel do Contratante */}
          <Route path="/client" element={
            <ProtectedRoute allowedRoles={['CLIENT', 'ADMIN']}>
              <ClientLayout />
            </ProtectedRoute>
          }>
            <Route index element={<ClientDashboard />} />
            <Route path="profile" element={<ClientProfile />} />
            <Route path="feed" element={<ClientFeed />} />
            <Route path="discovery" element={<Discovery />} />
            <Route path="checkout" element={<Checkout />} />
            <Route path="events" element={<ClientEvents />} />
            <Route path="contracts/:id" element={<ContractDetails />} />
            <Route path="messages" element={<ClientMessages />} />
            <Route path="favorites" element={<Favorites />} />
            <Route path="payments" element={<ClientPayments />} />
            <Route path="payment-methods" element={<PaymentMethods />} />
            <Route path="artist/:id" element={<ArtistProfile />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;