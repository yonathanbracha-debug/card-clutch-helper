import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { PageViewTracker } from "@/hooks/usePageView";
import { Suspense, lazy } from "react";
import Index from "./pages/Index";
import Vault from "./pages/Vault";
import WalletGated from "./pages/WalletGated";
import Analyze from "./pages/Analyze";
import Cards from "./pages/Cards";
import CardDetail from "./pages/CardDetail";
import About from "./pages/About";
import Product from "./pages/Product";
import Mission from "./pages/Mission";
import Founders from "./pages/Founders";
import RoadmapPage from "./pages/RoadmapPage";
import Privacy from "./pages/Privacy";
import Security from "./pages/Security";
import Trust from "./pages/Trust";
import Features from "./pages/Features";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import Dashboard from "./pages/Dashboard";
import Ask from "./pages/Ask";
import { ProtectedCreditRoute } from "@/components/ProtectedCreditRoute";
import NotFound from "./pages/NotFound";
import { useAuth } from "@/contexts/AuthContext";

// Lazy load the heavy Lab page (3D)
const Lab = lazy(() => import("./pages/Lab"));

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
            <PageViewTracker>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Index />} />
              <Route path="/analyze" element={<Analyze />} />
              <Route path="/cards" element={<Cards />} />
              <Route path="/cards/:id" element={<CardDetail />} />
              <Route path="/about" element={<About />} />
              <Route path="/product" element={<Product />} />
              <Route path="/mission" element={<Mission />} />
              <Route path="/founders" element={<Founders />} />
              <Route path="/roadmap" element={<RoadmapPage />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/security" element={<Security />} />
              <Route path="/trust" element={<Trust />} />
              <Route path="/features" element={<Features />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/ask" element={<ProtectedCreditRoute allowDemo={true}><Ask /></ProtectedCreditRoute>} />
              
              {/* Lab route (lazy loaded for 3D experiments) */}
              <Route 
                path="/lab/hero" 
                element={
                  <Suspense fallback={
                    <div className="min-h-screen flex items-center justify-center bg-background">
                      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                  }>
                    <Lab />
                  </Suspense>
                } 
              />
              {/* Admin route (protected by component) */}
              <Route path="/admin" element={<Admin />} />
              
              {/* User Dashboard (protected) */}
              <Route path="/dashboard" element={<Dashboard />} />
              
              {/* Wallet with friendly gating */}
              <Route path="/wallet" element={<WalletWrapper />} />
              
              {/* Legacy route redirect */}
              <Route path="/recommend" element={<Analyze />} />
              <Route path="/vault" element={<WalletWrapper />} />
              <Route path="/app" element={<WalletWrapper />} />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
            </PageViewTracker>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
