import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Placeholder para as áreas que criaremos a seguir
const AdminDashboard = () => <div className="p-8"><h1>Painel Super Admin</h1></div>;
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
          
          {/* Áreas Protegidas (Simuladas) */}
          <Route path="/admin/*" element={<AdminDashboard />} />
          <Route path="/pro/*" element={<ProDashboard />} />
          <Route path="/client/*" element={<ClientDashboard />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;