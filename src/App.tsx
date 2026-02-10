import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import AppLayout from "./components/layout/AppLayout";

// Public Pages
import Index from "./pages/Index";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

// Unified App Pages
import Dashboard from "./pages/Dashboard";
import Feed from "./pages/pro/Feed";
import ProMessages from "./pages/pro/Messages";
import ProContracts from "./pages/pro/Contracts";
import ProFinance from "./pages/pro/Finance";
import Discovery from "./pages/client/Discovery";
import ClientEvents from "./pages/client/Events";
import Favorites from "./pages/client/Favorites";
import Profile from "./pages/client/Profile";

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
          
          {/* Rota Unificada com Contexto Ativo */}
          <Route path="/app" element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="profile" element={<Profile />} />
            <Route path="feed" element={<Feed />} />
            <Route path="messages" element={<ProMessages />} />
            
            {/* Funcionalidades que aparecem/somem via Sidebar baseada em contexto */}
            <Route path="contracts" element={<ProContracts />} />
            <Route path="finance" element={<ProFinance />} />
            <Route path="discovery" element={<Discovery />} />
            <Route path="events" element={<ClientEvents />} />
            <Route path="favorites" element={<Favorites />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;