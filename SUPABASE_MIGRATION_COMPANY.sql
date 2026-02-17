
-- ======================================================
-- DADOS DA EMPRESA - NEXERO ENTERPRISE
-- ======================================================

-- 1. CRIAR TABELA
CREATE TABLE IF NOT EXISTS public.company_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) UNIQUE,
    
    trade_name text,          -- Nome Fantasia
    legal_name text,          -- Razão Social
    document text,            -- CNPJ/CPF
    state_registration text,  -- Inscrição Estadual
    
    phone text,
    email text,
    whatsapp text,
    
    cep text,
    street text,
    number text,
    district text,
    city text,
    state text,
    country text DEFAULT 'Brasil',
    
    currency text DEFAULT 'BRL',
    timezone text DEFAULT 'America/Sao_Paulo',
    notes text,
    logo_url text,
    
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 2. TRIGGER PARA UPDATED_AT
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_company_settings_updated_at
    BEFORE UPDATE ON company_settings
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- 3. SEGURANÇA (RLS)
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "company_settings_owner_all" ON company_settings
    FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 4. BUCKET DE STORAGE (LOGOS)
-- Nota: A criação de buckets via SQL requer permissões específicas de admin
-- Se falhar, crie manualmente no painel Supabase com o nome 'company-logos'
INSERT INTO storage.buckets (id, name, public) 
VALUES ('company-logos', 'company-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de Storage
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'company-logos');
CREATE POLICY "Authenticated Upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'company-logos');
CREATE POLICY "Authenticated Update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'company-logos');
CREATE POLICY "Authenticated Delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'company-logos');
