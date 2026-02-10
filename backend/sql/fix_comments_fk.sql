-- Garante que a tabela post_comments tenha uma relação formal com a tabela profiles
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'post_comments_user_id_fkey') THEN
    ALTER TABLE public.post_comments 
    ADD CONSTRAINT post_comments_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;