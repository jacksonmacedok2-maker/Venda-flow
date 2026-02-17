
-- ======================================================
-- GESTÃO DE EQUIPE E MULTI-TENANCY - NEXERO (POLICIES FIXED)
-- ======================================================

-- 1. Tabela de Empresas
CREATE TABLE IF NOT EXISTS public.companies (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    owner_user_id uuid REFERENCES auth.users(id) NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 2. Tabela de Membros
CREATE TABLE IF NOT EXISTS public.memberships (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) NOT NULL,
    company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    role text NOT NULL CHECK (role IN ('OWNER', 'ADMIN', 'SELLER', 'VIEWER')),
    status text DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id, company_id)
);

-- 3. Habilitar RLS
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de Acesso (Empresas)
DROP POLICY IF EXISTS "companies_owner_access" ON public.companies;
CREATE POLICY "companies_owner_access" ON public.companies FOR ALL TO authenticated 
USING (owner_user_id = auth.uid());

DROP POLICY IF EXISTS "companies_member_view" ON public.companies;
CREATE POLICY "companies_member_view" ON public.companies FOR SELECT TO authenticated 
USING (
    EXISTS (SELECT 1 FROM memberships WHERE company_id = companies.id AND user_id = auth.uid())
);

-- 5. Políticas de Acesso (Membros)
DROP POLICY IF EXISTS "memberships_view_self" ON memberships;
CREATE POLICY "memberships_view_self" ON memberships FOR SELECT TO authenticated 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "memberships_owner_manage" ON memberships;
CREATE POLICY "memberships_owner_manage" ON memberships FOR ALL TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM companies c 
        WHERE c.id = memberships.company_id AND c.owner_user_id = auth.uid()
    )
);

-- 6. FUNÇÃO RPC
CREATE OR REPLACE FUNCTION public.create_company_for_owner(p_company_name text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_company_id uuid;
    v_user_id uuid;
BEGIN
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado';
    END IF;

    -- 1. Cria a empresa
    INSERT INTO public.companies (name, owner_user_id)
    VALUES (p_company_name, v_user_id)
    RETURNING id INTO new_company_id;

    -- 2. Cria o membership
    INSERT INTO public.memberships (user_id, company_id, role, status)
    VALUES (v_user_id, new_company_id, 'OWNER', 'ACTIVE')
    ON CONFLICT (user_id, company_id) DO NOTHING;

    RETURN new_company_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_company_for_owner(text) TO authenticated;
