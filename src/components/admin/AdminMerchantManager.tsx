import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuditLog } from '@/hooks/useAuditLog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Pencil, Plus, Globe } from 'lucide-react';

interface Merchant {
  id: string;
  domain: string;
  name: string;
  category_id: string | null;
  verification_status: string;
  is_warehouse: boolean;
  excluded_from_grocery: boolean;
}

interface Category {
  id: string;
  slug: string;
  display_name: string;
}

export function AdminMerchantManager() {
  const { logEvent } = useAuditLog();
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingMerchant, setEditingMerchant] = useState<Merchant | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const [merchantsRes, categoriesRes] = await Promise.all([
      supabase.from('merchants').select('*').order('name'),
      supabase.from('reward_categories').select('*').order('display_name'),
    ]);

    if (merchantsRes.data) setMerchants(merchantsRes.data);
    if (categoriesRes.data) setCategories(categoriesRes.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredMerchants = merchants.filter(m =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.domain.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return 'Uncategorized';
    const cat = categories.find(c => c.id === categoryId);
    return cat?.display_name || 'Unknown';
  };

  const handleSave = async (merchant: Partial<Merchant> & { id?: string }) => {
    if (merchant.id) {
      const { error } = await supabase
        .from('merchants')
        .update({
          name: merchant.name,
          domain: merchant.domain,
          category_id: merchant.category_id,
          is_warehouse: merchant.is_warehouse,
          excluded_from_grocery: merchant.excluded_from_grocery,
          verification_status: merchant.verification_status as any,
        })
        .eq('id', merchant.id);

      if (error) {
        toast.error('Failed to update merchant');
      } else {
        await logEvent('ADMIN_MERCHANT_EDIT', { merchant_id: merchant.id, changes: merchant });
        toast.success('Merchant updated');
        setDialogOpen(false);
        fetchData();
      }
    } else {
      const { error } = await supabase.from('merchants').insert({
        name: merchant.name!,
        domain: merchant.domain!,
        category_id: merchant.category_id,
        is_warehouse: merchant.is_warehouse || false,
        excluded_from_grocery: merchant.excluded_from_grocery || false,
        verification_status: 'verified' as any,
      });

      if (error) {
        toast.error('Failed to create merchant');
      } else {
        await logEvent('ADMIN_MERCHANT_CREATE', { merchant: merchant });
        toast.success('Merchant created');
        setDialogOpen(false);
        fetchData();
      }
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search merchants..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          onClick={() => {
            setEditingMerchant(null);
            setDialogOpen(true);
          }}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Merchant
        </Button>
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Domain</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Flags</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMerchants.slice(0, 50).map(merchant => (
              <TableRow key={merchant.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    <span className="font-mono text-sm">{merchant.domain}</span>
                  </div>
                </TableCell>
                <TableCell className="font-medium">{merchant.name}</TableCell>
                <TableCell>
                  <Badge variant="outline">{getCategoryName(merchant.category_id)}</Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={merchant.verification_status === 'verified' ? 'default' : 'secondary'}
                  >
                    {merchant.verification_status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {merchant.is_warehouse && (
                      <Badge variant="outline" className="text-xs">Warehouse</Badge>
                    )}
                    {merchant.excluded_from_grocery && (
                      <Badge variant="outline" className="text-xs">No Grocery</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditingMerchant(merchant);
                      setDialogOpen(true);
                    }}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filteredMerchants.length > 50 && (
        <p className="text-sm text-muted-foreground text-center">
          Showing 50 of {filteredMerchants.length} merchants. Use search to find specific ones.
        </p>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingMerchant ? 'Edit Merchant' : 'Add Merchant'}</DialogTitle>
          </DialogHeader>
          <MerchantEditForm
            merchant={editingMerchant}
            categories={categories}
            onSave={handleSave}
            onCancel={() => setDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MerchantEditForm({
  merchant,
  categories,
  onSave,
  onCancel,
}: {
  merchant: Merchant | null;
  categories: Category[];
  onSave: (merchant: Partial<Merchant> & { id?: string }) => void;
  onCancel: () => void;
}) {
  const [domain, setDomain] = useState(merchant?.domain || '');
  const [name, setName] = useState(merchant?.name || '');
  const [categoryId, setCategoryId] = useState(merchant?.category_id || '');
  const [isWarehouse, setIsWarehouse] = useState(merchant?.is_warehouse || false);
  const [excludedFromGrocery, setExcludedFromGrocery] = useState(merchant?.excluded_from_grocery || false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: merchant?.id,
      domain,
      name,
      category_id: categoryId || null,
      is_warehouse: isWarehouse,
      excluded_from_grocery: excludedFromGrocery,
      verification_status: 'verified',
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium">Domain</label>
        <Input
          placeholder="example.com"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
        />
      </div>
      <div>
        <label className="text-sm font-medium">Display Name</label>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div>
        <label className="text-sm font-medium">Category</label>
        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map(cat => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.display_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isWarehouse}
            onChange={(e) => setIsWarehouse(e.target.checked)}
            className="rounded"
          />
          Warehouse club
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={excludedFromGrocery}
            onChange={(e) => setExcludedFromGrocery(e.target.checked)}
            className="rounded"
          />
          Excluded from grocery
        </label>
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{merchant ? 'Save Changes' : 'Create Merchant'}</Button>
      </div>
    </form>
  );
}
