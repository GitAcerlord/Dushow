-- Criar buckets de armazenamento (se não existirem)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('posts', 'posts', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas para o bucket 'avatars'
CREATE POLICY "Acesso público para avatares" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Usuários autenticados sobem avatares" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars');
CREATE POLICY "Usuários atualizam seus avatares" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars');

-- Políticas para o bucket 'posts'
CREATE POLICY "Acesso público para posts" ON storage.objects FOR SELECT USING (bucket_id = 'posts');
CREATE POLICY "Usuários autenticados sobem fotos de posts" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'posts');