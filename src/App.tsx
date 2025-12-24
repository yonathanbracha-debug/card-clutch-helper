import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Mission from "./pages/Mission";
import Product from "./pages/Product";
import Founders from "./pages/Founders";
import RoadmapPage from "./pages/RoadmapPage";
import Trust from "./pages/Trust";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/mission" element={<Mission />} />
          <Route path="/product" element={<Product />} />
          <Route path="/founders" element={<Founders />} />
          <Route path="/roadmap" element={<RoadmapPage />} />
          <Route path="/trust" element={<Trust />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
