import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import AppLayout from "./components/layout/AppLayout";
import AdminLayout from "./pages/admin/AdminLayout";

// Public Pages
import Index from "./pages/Index";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import About from "./pages/About";
import Services from "./pages/Services";
import ArtistProfile from "./pages/client/ArtistProfile"; // Agora público

// Unified App Pages
import Dashboard from "./pages/Dashboard";
import Feed from "./pages/pro/Feed";
import ProContracts from "./pages/pro/Contracts";
import ProFinance from "./pages/pro/Finance";
import ProAgenda from "./pages/pro/Agenda";
import ProProfile from "./pages/pro/Profile";
import Discovery from "./pages/client/Discovery";
import ClientEvents from "./pages/client/Events";
import Favorites from "./pages/client/Favorites";
import Profile from "./pages/client/Profile";
import Checkout from "./pages/client/Checkout";
import ClientPayments from "./pages/client/Payments";
import ContractDetails from "./pages/pro/ContractDetails";
import ClientPlans from "./pages/client/Plans";
import ProducerDashboard from "./pages/producer/ProducerDashboard";
import Messages from "./pages/Messages";

// Admin Pages
import AdminDashboard from "./pages/admin/Dashboard";
import AdminUsers from "./pages/admin/Users";
import AdminContracts from "./pages/admin/Contracts";
import AdminMessages from "./pages/admin/Messages";
import AdminFinance from "./pages/admin/Finance";
import AdminApprovals from "./pages/admin/Approvals";
import AdminSettings from "./pages/admin/Settings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/about" element={<About />} />
          <Route path="/services" element={<Services />} />
          <Route path="/discovery" element={<Discovery />} />
          <Route path="/artist/:id" element={<ArtistProfile />} />
          
          {/* Unified App Route (PRO & CLIENT) */}
          <Route path="/app" element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="profile" element={<Profile />} />
            <Route path="feed" element={<Feed />} />
            <Route path="messages" element={<Messages />} />
            <Route path="contracts" element={<ProContracts />} />
            <Route path="contracts/:id" element={<ContractDetails />} />
            <Route path="finance" element={<ProFinance />} />
            <Route path="agenda" element={<ProAgenda />} />
            <Route path="discovery" element={<Discovery />} />
            <Route path="artist/:id" element={<ArtistProfile />} />
            <Route path="checkout" element={<Checkout />} />
            <Route path="payments" element={<ClientPayments />} />
            <Route path="events" element={<ClientEvents />} />
            <Route path="favorites" element={<Favorites />} />
            <Route path="plans" element={<ClientPlans />} />
            <Route path="producer" element={<ProducerDashboard />} />
          </Route>

          {/* Admin Routes */}
          <Route path="/admin" element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="contracts" element={<AdminContracts />} />
            <Route path="messages" element={<AdminMessages />} />
            <Route path="finance" element={<AdminFinance />} />
            <Route path="approvals" element={<AdminApprovals />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
