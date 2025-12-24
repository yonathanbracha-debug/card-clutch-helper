import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminCardManager } from '@/components/admin/AdminCardManager';
import { AdminMerchantManager } from '@/components/admin/AdminMerchantManager';
import { AdminAuditLogs } from '@/components/admin/AdminAuditLogs';
import { Shield, CreditCard, Store, ClipboardList, Loader2 } from 'lucide-react';

export default function Admin() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const [activeTab, setActiveTab] = useState('cards');

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
              Manage card library, merchants, and view audit logs.
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="cards" className="gap-2">
                <CreditCard className="w-4 h-4" />
                Cards
              </TabsTrigger>
              <TabsTrigger value="merchants" className="gap-2">
                <Store className="w-4 h-4" />
                Merchants
              </TabsTrigger>
              <TabsTrigger value="logs" className="gap-2">
                <ClipboardList className="w-4 h-4" />
                Audit Logs
              </TabsTrigger>
            </TabsList>

            <TabsContent value="cards">
              <AdminCardManager />
            </TabsContent>

            <TabsContent value="merchants">
              <AdminMerchantManager />
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
