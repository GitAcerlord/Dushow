import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import About from "./pages/About";
import Marketplace from "./pages/Marketplace";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminUsers from "./pages/admin/Users";
import AdminContracts from "./pages/admin/Contracts";
import AdminApprovals from "./pages/admin/Approvals";
import AdminSettings from "./pages/admin/Settings";
import AdminFinance from "./pages/admin/Finance";
import ProLayout from "./pages/pro/ProLayout";
import ProDashboard from "./pages/pro/Dashboard";
import ProFinance from "./pages/pro/Finance";
import ProPlans from "./pages/pro/Plans";
import Feed from "./pages/pro/Feed";
import ProAgenda from "./pages/pro/Agenda";
import ProProfile from "./pages/pro/Profile";
import ProMessages from "./pages/pro/Messages";
import ProAchievements from "./pages/pro/Achievements";
import ProReviews from "./pages/pro/Reviews";
import ProContracts from "./pages/pro/Contracts";
import ContractDetails from "./pages/pro/ContractDetails";
import ClientLayout from "./pages/client/ClientLayout";
import Discovery from "./pages/client/Discovery";
import ClientMessages from "./pages/client/Messages";
import Checkout from "./pages/client/Checkout";

const Academy = () => <div className="p-20 text-center"><h1>DUSHOW Academy - Em Breve para membros Pro e Elite</h1></div>;
const ClientDashboard = () => <div className="p-8"><h1>Painel Contratante</h1></div>;

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
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/academy" element={<Academy />} />
          
          {/* Painel Administrativo */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="contracts" element={<AdminContracts />} />
            <Route path="finance" element={<AdminFinance />} />
            <Route path="approvals" element={<AdminApprovals />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          {/* Painel do Profissional */}
          <Route path="/pro" element={<ProLayout />}>
            <Route index element={<ProDashboard />} />
            <Route path="profile" element={<ProProfile />} />
            <Route path="feed" element={<Feed />} />
            <Route path="reviews" element={<ProReviews />} />
            <Route path="messages" element={<ProMessages />} />
            <Route path="contracts" element={<ProContracts />} />
            <Route path="contracts/:id" element={<ContractDetails />} />
            <Route path="agenda" element={<ProAgenda />} />
            <Route path="achievements" element={<ProAchievements />} />
            <Route path="plans" element={<ProPlans />} />
            <Route path="finance" element={<ProFinance />} />
          </Route>

          {/* Painel do Contratante */}
          <Route path="/client" element={<ClientLayout />}>
            <Route index element={<ClientDashboard />} />
            <Route path="discovery" element={<Discovery />} />
            <Route path="checkout" element={<Checkout />} />
            <Route path="events" element={<div className="p-8"><h1>Meus Eventos</h1></div>} />
            <Route path="messages" element={<ClientMessages />} />
            <Route path="favorites" element={<div className="p-8"><h1>Favoritos</h1></div>} />
            <Route path="payments" element={<div className="p-8"><h1>Histórico de Pagamentos</h1></div>} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;