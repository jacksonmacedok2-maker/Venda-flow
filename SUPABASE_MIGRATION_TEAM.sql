
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

-- 3. Tabela de Convites (Aprimorada)
CREATE TABLE IF NOT EXISTS public.invitations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    invited_name text NOT NULL,
    invited_email text NOT NULL,
    role text NOT NULL CHECK (role IN ('ADMIN', 'SELLER', 'VIEWER')),
    token text DEFAULT encode(gen_random_bytes(32), 'hex') UNIQUE,
    status text DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'EXPIRED')),
    expires_at timestamptz NOT NULL,
    created_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES auth.users(id)
);

-- Garantir coluna de nome caso a tabela já exista
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'invitations' AND COLUMN_NAME = 'invited_name') THEN
        ALTER TABLE public.invitations ADD COLUMN invited_name text NOT NULL DEFAULT 'Convidado';
    END IF;
END $$;

-- 4. Habilitar RLS
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- 5. Políticas de Acesso
DROP POLICY IF EXISTS "companies_owner_access" ON public.companies;
CREATE POLICY "companies_owner_access" ON public.companies FOR ALL TO authenticated 
USING (owner_user_id = auth.uid());

DROP POLICY IF EXISTS "memberships_manage" ON memberships;
CREATE POLICY "memberships_manage" ON memberships FOR ALL TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM memberships m 
        WHERE m.company_id = memberships.company_id 
        AND m.user_id = auth.uid() 
        AND m.role IN ('OWNER', 'ADMIN')
    )
);

DROP POLICY IF EXISTS "invitations_manage" ON invitations;
CREATE POLICY "invitations_manage" ON invitations FOR ALL TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM memberships m 
        WHERE m.company_id = invitations.company_id 
        AND m.user_id = auth.uid() 
        AND m.role IN ('OWNER', 'ADMIN')
    )
);

-- 6. FUNÇÃO RPC PARA ACEITAR CONVITE
CREATE OR REPLACE FUNCTION public.accept_invitation(p_token text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_invite invitations;
    v_user_id uuid;
BEGIN
    v_user_id := auth.uid();
    
    -- Busca convite válido
    SELECT * INTO v_invite FROM invitations 
    WHERE token = p_token AND status = 'PENDING' AND expires_at > now();

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Convite inválido ou expirado';
    END IF;

    -- Cria o membership
    INSERT INTO public.memberships (user_id, company_id, role, status)
    VALUES (v_user_id, v_invite.company_id, v_invite.role, 'ACTIVE')
    ON CONFLICT (user_id, company_id) DO UPDATE 
    SET role = EXCLUDED.role, status = 'ACTIVE';

    -- Marca convite como aceito
    UPDATE invitations SET status = 'ACCEPTED' WHERE id = v_invite.id;

    RETURN true;
END;
$$;
