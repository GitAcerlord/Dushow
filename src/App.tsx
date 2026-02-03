import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard";

// Placeholders para as outras áreas
const ProDashboard = () => <div className="p-8"><h1>Painel Profissional</h1></div>;
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
            <Route path="users" element={<div className="p-8"><h1>Gestão de Usuários</h1></div>} />
            <Route path="contracts" element={<div className="p-8"><h1>Monitoramento de Contratos</h1></div>} />
            <Route path="finance" element={<div className="p-8"><h1>Financeiro & ASAAS</h1></div>} />
            <Route path="approvals" element={<div className="p-8"><h1>Aprovação de Selos</h1></div>} />
            <Route path="settings" element={<div className="p-8"><h1>Configurações do Sistema</h1></div>} />
          </Route>

          {/* Outras Áreas */}
          <Route path="/pro/*" element={<ProDashboard />} />
          <Route path="/client/*" element={<ClientDashboard />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;