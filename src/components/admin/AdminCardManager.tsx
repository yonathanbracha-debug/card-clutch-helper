import { useState, useRef } from 'react';
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
import { Search, Pencil, Check, ExternalLink, Upload, Loader2, ImageIcon } from 'lucide-react';

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
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload PNG, JPG, or WebP.');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large. Maximum size is 5MB.');
      return;
    }

    setUploading(true);
    try {
      // Generate a unique filename
      const ext = file.name.split('.').pop();
      const filename = `${card.id}-${Date.now()}.${ext}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('card-images')
        .upload(filename, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('card-images')
        .getPublicUrl(filename);

      setImageUrl(urlData.publicUrl);
      toast.success('Image uploaded successfully');
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

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
      <div className="flex items-center gap-4 mb-4">
        <div className="w-24 h-16 rounded-lg bg-muted flex items-center justify-center overflow-hidden border border-border">
          {imageUrl ? (
            <img src={imageUrl} alt={card.name} className="w-full h-full object-cover" />
          ) : (
            <ImageIcon className="w-8 h-8 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload Image
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground mt-1">PNG, JPG, or WebP. Max 5MB.</p>
        </div>
      </div>
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
        <label className="text-sm font-medium">Image URL</label>
        <Input 
          value={imageUrl} 
          onChange={(e) => setImageUrl(e.target.value)} 
          placeholder="Auto-filled when you upload, or paste URL"
        />
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
