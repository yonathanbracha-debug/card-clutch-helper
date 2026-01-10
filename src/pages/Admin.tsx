import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminCardManager } from '@/components/admin/AdminCardManager';
import { AdminMerchantManager } from '@/components/admin/AdminMerchantManager';
import { AdminAuditLogs } from '@/components/admin/AdminAuditLogs';
import { AdminUrlHealthChecker } from '@/components/admin/AdminUrlHealthChecker';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { AdminReportsManager } from '@/components/admin/AdminReportsManager';
import { AdminDataHealth } from '@/components/admin/AdminDataHealth';
import { AdminCatalogQA } from '@/components/admin/AdminCatalogQA';
import { AdminMerchantReview } from '@/components/admin/AdminMerchantReview';
import { AdminUsersManager } from '@/components/admin/AdminUsersManager';
import { AdminWaitlistManager } from '@/components/admin/AdminWaitlistManager';
import { AdminKnowledgeManager } from '@/components/admin/AdminKnowledgeManager';
import { useAnalytics } from '@/hooks/useAnalytics';
import { Shield, CreditCard, Store, ClipboardList, Loader2, LinkIcon, LayoutDashboard, AlertCircle, HeartPulse, FileCheck, Brain, Users, Mail, BookOpen } from 'lucide-react';

export default function Admin() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const { trackEvent } = useAnalytics();
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    if (isAdmin) {
      trackEvent('admin_viewed_dashboard');
    }
  }, [isAdmin]);

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20 pb-12">
          <div className="container max-w-4xl mx-auto px-4">
            <div className="text-center py-20">
              <Shield className="w-16 h-16 text-destructive mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
              <p className="text-muted-foreground">
                You don't have permission to access the admin console.
              </p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20 pb-12">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-6 h-6 text-primary" />
              <h1 className="text-3xl font-bold">Admin Console</h1>
            </div>
            <p className="text-muted-foreground">
              Monitor metrics, manage data, and review reports.
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6 flex-wrap h-auto gap-1">
              <TabsTrigger value="dashboard" className="gap-2">
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="reports" className="gap-2">
                <AlertCircle className="w-4 h-4" />
                Reports
              </TabsTrigger>
              <TabsTrigger value="data-health" className="gap-2">
                <HeartPulse className="w-4 h-4" />
                Data Health
              </TabsTrigger>
              <TabsTrigger value="catalog-qa" className="gap-2">
                <FileCheck className="w-4 h-4" />
                Catalog QA
              </TabsTrigger>
              <TabsTrigger value="merchant-review" className="gap-2">
                <Brain className="w-4 h-4" />
                AI Review
              </TabsTrigger>
              <TabsTrigger value="cards" className="gap-2">
                <CreditCard className="w-4 h-4" />
                Cards
              </TabsTrigger>
              <TabsTrigger value="url-health" className="gap-2">
                <LinkIcon className="w-4 h-4" />
                URL Health
              </TabsTrigger>
              <TabsTrigger value="merchants" className="gap-2">
                <Store className="w-4 h-4" />
                Merchants
              </TabsTrigger>
              <TabsTrigger value="users" className="gap-2">
                <Users className="w-4 h-4" />
                Users
              </TabsTrigger>
              <TabsTrigger value="waitlist" className="gap-2">
                <Mail className="w-4 h-4" />
                Waitlist
              </TabsTrigger>
              <TabsTrigger value="knowledge" className="gap-2">
                <BookOpen className="w-4 h-4" />
                Knowledge
              </TabsTrigger>
              <TabsTrigger value="logs" className="gap-2">
                <ClipboardList className="w-4 h-4" />
                Audit Logs
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard">
              <AdminDashboard />
            </TabsContent>

            <TabsContent value="reports">
              <AdminReportsManager />
            </TabsContent>

            <TabsContent value="data-health">
              <AdminDataHealth />
            </TabsContent>

            <TabsContent value="catalog-qa">
              <AdminCatalogQA />
            </TabsContent>

            <TabsContent value="merchant-review">
              <AdminMerchantReview />
            </TabsContent>

            <TabsContent value="cards">
              <AdminCardManager />
            </TabsContent>

            <TabsContent value="url-health">
              <AdminUrlHealthChecker />
            </TabsContent>

            <TabsContent value="merchants">
              <AdminMerchantManager />
            </TabsContent>

            <TabsContent value="users">
              <AdminUsersManager />
            </TabsContent>

            <TabsContent value="waitlist">
              <AdminWaitlistManager />
            </TabsContent>

            <TabsContent value="knowledge">
              <AdminKnowledgeManager />
            </TabsContent>

            <TabsContent value="logs">
              <AdminAuditLogs />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
}
