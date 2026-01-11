import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Plus, FileText, Loader2, CheckCircle2, ArrowRight, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useWalletCards } from '@/hooks/useWalletCards';
import { useCreditCards } from '@/hooks/useCreditCards';
import type { Transaction, TransactionCategory } from '@/lib/opportunityCostEngine';

const CATEGORIES: { value: TransactionCategory; label: string }[] = [
  { value: 'dining', label: 'Dining' },
  { value: 'travel', label: 'Travel' },
  { value: 'grocery', label: 'Grocery' },
  { value: 'gas', label: 'Gas' },
  { value: 'streaming', label: 'Streaming' },
  { value: 'drugstore', label: 'Drugstore' },
  { value: 'online', label: 'Online Shopping' },
  { value: 'other', label: 'Other' },
];

interface DiagnosticsResult {
  success: boolean;
  data_quality: {
    transaction_count: number;
    is_limited: boolean;
    note: string;
  };
  summary: {
    subscriptions_detected: number;
    subscription_monthly_spend: number;
    missed_benefits_count: number;
    missed_benefits_value: number;
  };
  todos_created: number;
  insights: {
    subscriptions: {
      merchant: string;
      cadence: string;
      avg_amount: number;
      confidence_level: string;
      explanation: string;
    }[];
    missed_benefits: {
      card: string;
      benefit: string;
      value: number;
      confidence_level: string;
      explanation: string;
    }[];
  };
}

export default function Transactions() {
  const navigate = useNavigate();
  const { user, session } = useAuth();
  const { selectedCardIds } = useWalletCards();
  const { cards } = useCreditCards();
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [merchant, setMerchant] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<TransactionCategory>('other');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<DiagnosticsResult | null>(null);

  const handleAddTransaction = () => {
    if (!merchant.trim() || !amount) {
      toast.error('Please fill in merchant and amount');
      return;
    }

    const newTransaction: Transaction = {
      id: crypto.randomUUID(),
      date,
      merchant: merchant.trim(),
      category,
      amount: Math.round(parseFloat(amount) * 100),
      card_used: {
        card_id: 'manual-entry',
        issuer: 'Unknown',
        card_name: 'Manual Entry',
      },
    };

    setTransactions(prev => [newTransaction, ...prev]);
    setMerchant('');
    setAmount('');
    setResult(null);
    toast.success('Transaction added');
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').slice(1);
      
      const parsed: Transaction[] = [];
      for (const line of lines) {
        const [dateStr, merchantStr, amountStr, categoryStr] = line.split(',');
        if (!dateStr || !merchantStr || !amountStr) continue;
        
        parsed.push({
          id: crypto.randomUUID(),
          date: dateStr.trim(),
          merchant: merchantStr.trim(),
          category: (categoryStr?.trim() as TransactionCategory) || 'other',
          amount: Math.round(parseFloat(amountStr.replace(/[^0-9.-]/g, '')) * 100),
          card_used: {
            card_id: 'csv-import',
            issuer: 'Unknown',
            card_name: 'CSV Import',
          },
        });
      }

      if (parsed.length > 0) {
        setTransactions(prev => [...parsed, ...prev]);
        setResult(null);
        toast.success(`Imported ${parsed.length} transactions`);
      }
    };
    reader.readAsText(file);
  };

  const runDiagnostics = async () => {
    if (!user || !session) {
      toast.error('Please sign in to run diagnostics');
      return;
    }

    if (transactions.length === 0) {
      toast.error('Add transactions first');
      return;
    }

    setAnalyzing(true);
    try {
      // Get user's wallet cards
      const userCards = selectedCardIds
        .map(id => cards.find(c => c.id === id))
        .filter(Boolean)
        .map(c => ({
          issuer: c!.issuer_name || '',
          card_name: c!.name,
        }));

      const { data, error } = await supabase.functions.invoke('finance-diagnostics', {
        body: {
          transactions,
          user_cards: userCards,
        },
      });

      if (error) throw error;

      setResult(data as DiagnosticsResult);
      
      if (data.todos_created > 0) {
        toast.success(`Analysis complete. ${data.todos_created} action items created.`);
      } else {
        toast.success('Analysis complete.');
      }
    } catch (err) {
      console.error('Diagnostics error:', err);
      toast.error('Analysis failed. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const getConfidenceBadge = (level: string) => {
    const config = {
      high: { variant: 'default' as const, label: 'High confidence' },
      medium: { variant: 'secondary' as const, label: 'Medium confidence' },
      low: { variant: 'outline' as const, label: 'Low confidence' },
    };
    const c = config[level as keyof typeof config] || config.medium;
    return <Badge variant={c.variant} className="text-xs">{c.label}</Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20 pb-12">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Transaction Upload</h1>
            <p className="text-muted-foreground">
              Add transactions manually or upload a CSV statement for analysis
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Manual Entry */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Manual Entry
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="merchant">Merchant</Label>
                  <Input
                    id="merchant"
                    value={merchant}
                    onChange={(e) => setMerchant(e.target.value)}
                    placeholder="e.g., Chipotle"
                  />
                </div>
                <div>
                  <Label htmlFor="amount">Amount ($)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={category} onValueChange={(v) => setCategory(v as TransactionCategory)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
                <Button onClick={handleAddTransaction} className="w-full">
                  Add Transaction
                </Button>
              </CardContent>
            </Card>

            {/* CSV Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  CSV Upload
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                  <FileText className="w-10 h-10 text-muted-foreground/50 mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Upload a CSV with columns: date, merchant, amount, category
                  </p>
                  <label>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleCSVUpload}
                      className="hidden"
                    />
                    <Button variant="outline" asChild>
                      <span>Select CSV File</span>
                    </Button>
                  </label>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Transaction List */}
          {transactions.length > 0 && (
            <Card className="mt-6">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">{transactions.length} Transactions</CardTitle>
                <Button 
                  onClick={runDiagnostics} 
                  disabled={analyzing || !user}
                  className="gap-2"
                >
                  {analyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      Run Analysis
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-auto">
                  {transactions.slice(0, 20).map(tx => (
                    <div key={tx.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{tx.merchant}</p>
                        <p className="text-xs text-muted-foreground">{tx.date} • {tx.category}</p>
                      </div>
                      <span className="font-mono text-sm">${(tx.amount / 100).toFixed(2)}</span>
                    </div>
                  ))}
                  {transactions.length > 20 && (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      +{transactions.length - 20} more transactions
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Analysis Results */}
          {result && (
            <div className="mt-6 space-y-4">
              {/* Data Quality Banner */}
              {result.data_quality.is_limited && (
                <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Limited data</p>
                    <p className="text-sm text-muted-foreground">{result.data_quality.note}</p>
                  </div>
                </div>
              )}

              {/* Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                    Analysis Complete
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 gap-4 mb-4">
                    <div className="p-4 rounded-lg bg-muted/50">
                      <p className="text-2xl font-bold">${result.summary.subscription_monthly_spend.toFixed(2)}/mo</p>
                      <p className="text-sm text-muted-foreground">
                        {result.summary.subscriptions_detected} recurring charges detected
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50">
                      <p className="text-2xl font-bold">${result.summary.missed_benefits_value}</p>
                      <p className="text-sm text-muted-foreground">
                        {result.summary.missed_benefits_count} card benefits to review
                      </p>
                    </div>
                  </div>
                  
                  {result.todos_created > 0 && (
                    <Button 
                      variant="outline" 
                      onClick={() => navigate('/diagnostics')}
                      className="w-full gap-2"
                    >
                      View {result.todos_created} action items
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Subscription Insights */}
              {result.insights.subscriptions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Recurring Charges</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {result.insights.subscriptions.map((sub, i) => (
                      <div key={i} className="p-4 rounded-lg border border-border">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <p className="font-medium">{sub.merchant}</p>
                            <p className="text-sm text-muted-foreground">
                              ~${sub.avg_amount.toFixed(2)}/{sub.cadence}
                            </p>
                          </div>
                          {getConfidenceBadge(sub.confidence_level)}
                        </div>
                        <p className="text-sm text-muted-foreground">{sub.explanation}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Missed Benefits */}
              {result.insights.missed_benefits.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Card Benefits to Review</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {result.insights.missed_benefits.map((mb, i) => (
                      <div key={i} className="p-4 rounded-lg border border-border">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <p className="font-medium">{mb.benefit}</p>
                            <p className="text-sm text-muted-foreground">{mb.card}</p>
                          </div>
                          <Badge variant="secondary">${mb.value}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{mb.explanation}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Privacy note */}
              <p className="text-xs text-muted-foreground text-center">
                All insights are based solely on your data. We do not share or infer beyond what you provide.
              </p>
            </div>
          )}

          {!user && transactions.length > 0 && (
            <div className="mt-6 p-4 rounded-lg bg-muted/50 text-center">
              <p className="text-sm text-muted-foreground mb-2">
                Sign in to run analysis and save your action items
              </p>
              <Button variant="outline" onClick={() => navigate('/auth')}>
                Sign In
              </Button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
