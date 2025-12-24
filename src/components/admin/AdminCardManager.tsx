import { useState } from 'react';
import { useCreditCards, CreditCardDB } from '@/hooks/useCreditCards';
import { useAuditLog } from '@/hooks/useAuditLog';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CardImage } from '@/components/CardImage';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, Plus, Pencil, Trash2, Check, ExternalLink } from 'lucide-react';

export function AdminCardManager() {
  const { cards, loading, refetch } = useCreditCards();
  const { logEvent } = useAuditLog();
  const [searchQuery, setSearchQuery] = useState('');
  const [editingCard, setEditingCard] = useState<CreditCardDB | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const filteredCards = cards.filter(card =>
    card.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    card.issuer_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleMarkVerified = async (cardId: string) => {
    const { error } = await supabase
      .from('credit_cards')
      .update({ last_verified_at: new Date().toISOString() })
      .eq('id', cardId);

    if (error) {
      toast.error('Failed to update verification status');
    } else {
      await logEvent('ADMIN_CARD_EDIT', { card_id: cardId, action: 'mark_verified' });
      toast.success('Card marked as verified');
      refetch();
    }
  };

  const handleSaveCard = async (card: Partial<CreditCardDB> & { id?: string }) => {
    if (card.id) {
      const { error } = await supabase
        .from('credit_cards')
        .update({
          name: card.name,
          annual_fee_cents: card.annual_fee_cents,
          source_url: card.source_url,
          image_url: card.image_url,
        })
        .eq('id', card.id);

      if (error) {
        toast.error('Failed to update card');
      } else {
        await logEvent('ADMIN_CARD_EDIT', { card_id: card.id, changes: card });
        toast.success('Card updated');
        setDialogOpen(false);
        refetch();
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
            placeholder="Search cards..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Badge variant="secondary">{filteredCards.length} cards</Badge>
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>Card Name</TableHead>
              <TableHead>Issuer</TableHead>
              <TableHead>Annual Fee</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Verified</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCards.map(card => {
              const fee = card.annual_fee_cents / 100;
              const verifiedDate = new Date(card.last_verified_at).toLocaleDateString();
              return (
                <TableRow key={card.id}>
                  <TableCell>
                    <CardImage
                      issuer={card.issuer_name}
                      cardName={card.name}
                      network={card.network}
                      size="sm"
                    />
                  </TableCell>
                  <TableCell className="font-medium">{card.name}</TableCell>
                  <TableCell className="text-muted-foreground">{card.issuer_name}</TableCell>
                  <TableCell>
                    {fee === 0 ? (
                      <span className="text-emerald-600 dark:text-emerald-400">Free</span>
                    ) : (
                      `$${fee}/yr`
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={card.is_active ? 'default' : 'secondary'}>
                      {card.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{verifiedDate}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleMarkVerified(card.id)}
                        title="Mark verified"
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingCard(card);
                          setDialogOpen(true);
                        }}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <a
                        href={card.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded hover:bg-muted"
                      >
                        <ExternalLink className="w-4 h-4 text-muted-foreground" />
                      </a>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Card</DialogTitle>
          </DialogHeader>
          {editingCard && (
            <CardEditForm
              card={editingCard}
              onSave={handleSaveCard}
              onCancel={() => setDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CardEditForm({
  card,
  onSave,
  onCancel,
}: {
  card: CreditCardDB;
  onSave: (card: Partial<CreditCardDB> & { id: string }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(card.name);
  const [annualFee, setAnnualFee] = useState((card.annual_fee_cents / 100).toString());
  const [sourceUrl, setSourceUrl] = useState(card.source_url);
  const [imageUrl, setImageUrl] = useState(card.image_url || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: card.id,
      name,
      annual_fee_cents: Math.round(parseFloat(annualFee) * 100),
      source_url: sourceUrl,
      image_url: imageUrl || null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium">Card Name</label>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div>
        <label className="text-sm font-medium">Annual Fee ($)</label>
        <Input
          type="number"
          step="0.01"
          value={annualFee}
          onChange={(e) => setAnnualFee(e.target.value)}
        />
      </div>
      <div>
        <label className="text-sm font-medium">Official URL</label>
        <Input value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} />
      </div>
      <div>
        <label className="text-sm font-medium">Image URL (optional)</label>
        <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Save Changes</Button>
      </div>
    </form>
  );
}
