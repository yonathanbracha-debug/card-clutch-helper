-- Create storage bucket for card images
INSERT INTO storage.buckets (id, name, public, allowed_mime_types, file_size_limit)
VALUES (
  'card-images', 
  'card-images', 
  true,
  ARRAY['image/png', 'image/jpeg', 'image/webp'],
  5242880 -- 5MB limit
) ON CONFLICT (id) DO NOTHING;

-- Storage policies for card images
-- Public read access
CREATE POLICY "Card images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'card-images');

-- Only admins can upload/update card images
CREATE POLICY "Admins can upload card images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'card-images' 
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE POLICY "Admins can update card images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'card-images' 
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE POLICY "Admins can delete card images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'card-images' 
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);