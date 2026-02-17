
-- ======================================================
-- DADOS DA EMPRESA - NEXERO ENTERPRISE (FIXED SCHEMA)
-- ======================================================

-- 1. CRIAR TABELA SE NÃO EXISTIR
CREATE TABLE IF NOT EXISTS public.company_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE UNIQUE,
    user_id uuid NOT NULL REFERENCES auth.users(id),
    
    trade_name text,          
    legal_name text,          
    document text,            
    state_registration text,  
    
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

-- ADICIONAR COLUNA CASO JÁ EXISTA A TABELA SEM ELA
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'company_settings' AND COLUMN_NAME = 'company_id') THEN
        ALTER TABLE public.company_settings ADD COLUMN company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE UNIQUE;
    END IF;
END $$;
