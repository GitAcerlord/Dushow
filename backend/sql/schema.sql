-- Tabela de Perfis (Extensão do Auth.Users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  role TEXT CHECK (role IN ('PRO', 'CLIENT', 'ADMIN')),
  avatar_url TEXT,
  bio TEXT,
  category TEXT,
  location TEXT,
  price DECIMAL(10,2) DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 5.0,
  reviews_count INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,
  is_superstar BOOLEAN DEFAULT FALSE,
  points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Tabela de Contratos
CREATE TABLE contracts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES profiles(id),
  pro_id UUID REFERENCES profiles(id),
  event_name TEXT,
  event_date TIMESTAMP WITH TIME ZONE,
  event_location TEXT,
  value DECIMAL(10,2),
  status TEXT CHECK (status IN ('PENDING', 'PAID', 'COMPLETED', 'CANCELED')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso (Exemplo: Todos podem ver perfis PRO)
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);