-- Adicionando campos de auditoria para validade jurídica das assinaturas
ALTER TABLE public.contracts 
ADD COLUMN IF NOT EXISTS client_signature_metadata JSONB,
ADD COLUMN IF NOT EXISTS pro_signature_metadata JSONB,
ADD COLUMN IF NOT EXISTS document_hash TEXT,
ADD COLUMN IF NOT EXISTS external_signature_id TEXT; -- ID da Assinafy/Outros

-- Comentários para documentação de auditoria
COMMENT ON COLUMN public.contracts.client_signature_metadata IS 'Armazena IP, UserAgent e Timestamp da assinatura do cliente';
COMMENT ON COLUMN public.contracts.pro_signature_metadata IS 'Armazena IP, UserAgent e Timestamp da assinatura do profissional';