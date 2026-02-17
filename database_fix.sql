
-- 1. ADICIONAR COLUNAS FALTANTES NAS TABELAS DE CONFIGURAÇÃO
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_settings' AND column_name = 'company_id') THEN
        ALTER TABLE public.company_settings ADD COLUMN company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;
        ALTER TABLE public.company_settings ADD CONSTRAINT company_settings_company_id_key UNIQUE (company_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'commercial_settings' AND COLUMN_NAME = 'company_id') THEN
        ALTER TABLE public.commercial_settings ADD COLUMN company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;
        ALTER TABLE public.commercial_settings ADD CONSTRAINT commercial_settings_company_id_key UNIQUE (company_id);
    END IF;
END $$;

-- 2. RESET DE POLÍTICAS DE SEGURANÇA (RLS) PARA CONFIGURAÇÕES
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acesso por membros da empresa" ON public.company_settings;
CREATE POLICY "Acesso por membros da empresa" ON public.company_settings
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM memberships WHERE memberships.company_id = company_settings.company_id AND memberships.user_id = auth.uid()));

ALTER TABLE public.commercial_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acesso comercial por membros da empresa" ON public.commercial_settings;
CREATE POLICY "Acesso comercial por membros da empresa" ON public.commercial_settings
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM memberships WHERE memberships.company_id = commercial_settings.company_id AND memberships.user_id = auth.uid()));
