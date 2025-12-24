import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Vault from "./pages/Vault";
import WalletGated from "./pages/WalletGated";
import Analyze from "./pages/Analyze";
import Cards from "./pages/Cards";
import CardDetail from "./pages/CardDetail";
import About from "./pages/About";
import RoadmapPage from "./pages/RoadmapPage";
import Privacy from "./pages/Privacy";
import Security from "./pages/Security";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import { useAuth } from "@/contexts/AuthContext";

const queryClient = new QueryClient();

// Wrapper component for wallet that shows gated page for guests
function WalletWrapper() {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  
  if (!user) {
    return <WalletGated />;
  }
  
  return <Vault />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Index />} />
              <Route path="/analyze" element={<Analyze />} />
              <Route path="/cards" element={<Cards />} />
              <Route path="/cards/:id" element={<CardDetail />} />
              <Route path="/about" element={<About />} />
              <Route path="/roadmap" element={<RoadmapPage />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/security" element={<Security />} />
              <Route path="/auth" element={<Auth />} />
              
              {/* Wallet with friendly gating */}
              <Route path="/wallet" element={<WalletWrapper />} />
              
              {/* Legacy route redirect */}
              <Route path="/recommend" element={<Analyze />} />
              <Route path="/vault" element={<WalletWrapper />} />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
