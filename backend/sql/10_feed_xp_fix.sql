-- ============================================================================
-- DUSHOW - Correção de XP do Feed (idempotente)
-- ============================================================================

ALTER TABLE public.xp_transactions
  ADD COLUMN IF NOT EXISTS post_id UUID;

CREATE INDEX IF NOT EXISTS idx_xp_transactions_post_id ON public.xp_transactions(post_id);

-- Evita dupla pontuacao de criacao do mesmo post.
CREATE UNIQUE INDEX IF NOT EXISTS idx_xp_post_created_unique
  ON public.xp_transactions(profile_id, post_id)
  WHERE action = 'POST_CREATED' AND post_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.feed_post_xp()
RETURNS TRIGGER AS $$
DECLARE
  v_points INTEGER := CASE WHEN NEW.image_url IS NULL OR NEW.image_url = '' THEN 2 ELSE 7 END;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.xp_transactions x
    WHERE x.profile_id = NEW.author_id
      AND x.post_id = NEW.id
      AND x.action = 'POST_CREATED'
  ) THEN
    INSERT INTO public.xp_transactions(profile_id, action, points, post_id)
    VALUES (NEW.author_id, 'POST_CREATED', v_points, NEW.id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_feed_post_xp ON public.posts;
CREATE TRIGGER tr_feed_post_xp
AFTER INSERT ON public.posts
FOR EACH ROW EXECUTE FUNCTION public.feed_post_xp();

-- Remove trigger legado paralelo para evitar comportamentos divergentes.
DROP TRIGGER IF EXISTS tr_post_xp ON public.posts;
