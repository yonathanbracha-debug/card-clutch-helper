import { useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Plus, FileText } from 'lucide-react';
import { toast } from 'sonner';
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

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [merchant, setMerchant] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<TransactionCategory>('other');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

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
    toast.success('Transaction added');
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').slice(1); // Skip header
      
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
        toast.success(`Imported ${parsed.length} transactions`);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20 pb-12">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Transaction Upload</h1>
            <p className="text-muted-foreground">
              Add transactions manually or upload a CSV statement
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
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
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
              <CardHeader>
                <CardTitle className="text-lg">{transactions.length} Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-auto">
                  {transactions.map(tx => (
                    <div key={tx.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{tx.merchant}</p>
                        <p className="text-xs text-muted-foreground">{tx.date} • {tx.category}</p>
                      </div>
                      <span className="font-mono text-sm">${(tx.amount / 100).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
