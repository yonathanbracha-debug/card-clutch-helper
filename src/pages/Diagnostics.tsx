import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Upload, ArrowRight, DollarSign, TrendingDown, RefreshCw } from 'lucide-react';

export default function Diagnostics() {
  const [hasData] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20 pb-12">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Statement Diagnostics</h1>
            <p className="text-muted-foreground">
              Analyze your spending to find missed rewards and subscription waste
            </p>
          </div>

          {!hasData ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Upload className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No transactions yet</h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                  Upload a CSV statement or manually enter transactions to get personalized insights
                </p>
                <Link to="/transactions">
                  <Button className="gap-2">
                    <FileText className="w-4 h-4" />
                    Upload Transactions
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {/* Summary Cards */}
              <div className="grid md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <DollarSign className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">$0</p>
                        <p className="text-xs text-muted-foreground">Total Spend</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                        <TrendingDown className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">$0</p>
                        <p className="text-xs text-muted-foreground">Missed Rewards</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                        <RefreshCw className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">$0/mo</p>
                        <p className="text-xs text-muted-foreground">Subscriptions</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
