import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminUsers from "./pages/admin/Users";
import AdminContracts from "./pages/admin/Contracts";
import AdminApprovals from "./pages/admin/Approvals";
import AdminSettings from "./pages/admin/Settings";
import ProLayout from "./pages/pro/ProLayout";
import ProDashboard from "./pages/pro/Dashboard";
import ProFinance from "./pages/pro/Finance";
import ProPlans from "./pages/pro/Plans";
import Feed from "./pages/pro/Feed";
import ProAgenda from "./pages/pro/Agenda";
import ProProfile from "./pages/pro/Profile";
import ClientLayout from "./pages/client/ClientLayout";
import Discovery from "./pages/client/Discovery";

// Placeholders para as outras áreas
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
          
          {/* Painel Administrativo */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="contracts" element={<AdminContracts />} />
            <Route path="finance" element={<div className="p-8"><h1>Financeiro & ASAAS</h1></div>} />
            <Route path="approvals" element={<AdminApprovals />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          {/* Painel do Profissional */}
          <Route path="/pro" element={<ProLayout />}>
            <Route index element={<ProDashboard />} />
            <Route path="profile" element={<ProProfile />} />
            <Route path="feed" element={<Feed />} />
            <Route path="agenda" element={<ProAgenda />} />
            <Route path="achievements" element={<ProPlans />} />
            <Route path="finance" element={<ProFinance />} />
          </Route>

          {/* Painel do Contratante */}
          <Route path="/client" element={<ClientLayout />}>
            <Route index element={<ClientDashboard />} />
            <Route path="discovery" element={<Discovery />} />
            <Route path="events" element={<div className="p-8"><h1>Meus Eventos</h1></div>} />
            <Route path="messages" element={<div className="p-8"><h1>Mensagens</h1></div>} />
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