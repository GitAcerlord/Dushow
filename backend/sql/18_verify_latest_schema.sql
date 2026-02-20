-- ============================================================================
-- DUSHOW - Verificacao de schema (versao mais nova)
-- ============================================================================
-- Retorna colunas obrigatorias ausentes por tabela.
-- Se qualquer SELECT abaixo retornar linhas, ainda ha pendencia de upgrade.

WITH required(table_name, column_name) AS (
  VALUES
  -- profiles
  ('profiles','id'),
  ('profiles','user_id'),
  ('profiles','role'),
  ('profiles','active_context'),
  ('profiles','enabled_contexts'),
  ('profiles','pref_dark_mode'),
  ('profiles','pref_email_notifications'),
  ('profiles','pref_public_profile'),

  -- contracts
  ('contracts','id'),
  ('contracts','contratante_profile_id'),
  ('contracts','profissional_profile_id'),
  ('contracts','created_by_profile_id'),
  ('contracts','event_name'),
  ('contracts','data_evento'),
  ('contracts','valor_atual'),
  ('contracts','status'),
  ('contracts','status_master'),
  ('contracts','local'),
  ('contracts','descricao'),

  -- notifications
  ('notifications','id'),
  ('notifications','user_id'),
  ('notifications','title'),
  ('notifications','content'),
  ('notifications','type'),
  ('notifications','is_read'),
  ('notifications','created_at'),
  ('notifications','updated_at'),

  -- support
  ('support_tickets','id'),
  ('support_tickets','requester_id'),
  ('support_tickets','subject'),
  ('support_tickets','category'),
  ('support_tickets','priority'),
  ('support_tickets','status'),
  ('support_tickets','created_at'),
  ('support_tickets','updated_at'),

  ('support_ticket_messages','id'),
  ('support_ticket_messages','ticket_id'),
  ('support_ticket_messages','author_id'),
  ('support_ticket_messages','is_admin_reply'),
  ('support_ticket_messages','body'),
  ('support_ticket_messages','created_at'),

  -- settings
  ('admin_platform_settings','setting_key'),
  ('admin_platform_settings','setting_value'),
  ('admin_platform_settings','updated_by'),
  ('admin_platform_settings','created_at'),
  ('admin_platform_settings','updated_at')
)
SELECT r.table_name, r.column_name AS missing_column
FROM required r
LEFT JOIN information_schema.columns c
  ON c.table_schema = 'public'
 AND c.table_name = r.table_name
 AND c.column_name = r.column_name
WHERE c.column_name IS NULL
ORDER BY r.table_name, r.column_name;

-- Verifica objetos-chave
SELECT
  'missing_function_is_admin' AS check_name
WHERE NOT EXISTS (
  SELECT 1
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname = 'is_admin'
);

SELECT
  'missing_type_contract_status_master' AS check_name
WHERE NOT EXISTS (
  SELECT 1
  FROM pg_type t
  JOIN pg_namespace n ON n.oid = t.typnamespace
  WHERE n.nspname = 'public'
    AND t.typname = 'contract_status_master'
);

-- Snapshot resumido de quantidades para sanidade
SELECT 'profiles' AS table_name, COUNT(*)::BIGINT AS total FROM public.profiles
UNION ALL
SELECT 'contracts' AS table_name, COUNT(*)::BIGINT AS total FROM public.contracts
UNION ALL
SELECT 'notifications' AS table_name, COUNT(*)::BIGINT AS total FROM public.notifications
UNION ALL
SELECT 'support_tickets' AS table_name, COUNT(*)::BIGINT AS total FROM public.support_tickets
UNION ALL
SELECT 'support_ticket_messages' AS table_name, COUNT(*)::BIGINT AS total FROM public.support_ticket_messages;
