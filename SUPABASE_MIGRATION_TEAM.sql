
-- ======================================================
-- GESTÃO DE EQUIPE E MULTI-TENANCY - NEXERO
-- ======================================================

-- 1. Tabela de Membros (Multi-Tenancy)
CREATE TABLE IF NOT EXISTS public.memberships (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) NOT NULL,
    company_id uuid NOT NULL, -- Pode ser o user_id do Owner original
    role text NOT NULL CHECK (role IN ('OWNER', 'ADMIN', 'SELLER', 'VIEWER')),
    status text DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id, company_id)
);

-- 2. Tabela de Convites
CREATE TABLE IF NOT EXISTS public.invitations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid NOT NULL,
    invited_email text NOT NULL,
    role text NOT NULL CHECK (role IN ('ADMIN', 'SELLER', 'VIEWER')),
    status text DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'EXPIRED')),
    token text NOT NULL UNIQUE,
    expires_at timestamptz NOT NULL,
    created_by uuid REFERENCES auth.users(id) NOT NULL,
    accepted_at timestamptz,
    created_at timestamptz DEFAULT now()
);

-- 3. Habilitar RLS
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- 4. Políticas para Memberships
-- Usuário pode ver suas próprias participações
CREATE POLICY "memberships_view_self" ON memberships FOR SELECT TO authenticated 
USING (auth.uid() = user_id);

-- Admins podem ver todos os membros da mesma empresa
CREATE POLICY "memberships_view_company" ON memberships FOR SELECT TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM memberships m 
        WHERE m.company_id = memberships.company_id 
        AND m.user_id = auth.uid() 
        AND m.role IN ('OWNER', 'ADMIN')
    )
);

-- 5. Políticas para Invitations
-- Só Admins/Owners podem criar/ver convites da empresa
CREATE POLICY "invitations_manage_company" ON invitations FOR ALL TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM memberships 
        WHERE memberships.company_id = invitations.company_id 
        AND memberships.user_id = auth.uid() 
        AND memberships.role IN ('OWNER', 'ADMIN')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM memberships 
        WHERE memberships.company_id = invitations.company_id 
        AND memberships.user_id = auth.uid() 
        AND memberships.role IN ('OWNER', 'ADMIN')
    )
);

-- Permitir leitura pública do convite via Token (para a tela de aceite)
CREATE POLICY "invitations_read_token" ON invitations FOR SELECT TO anon, authenticated
USING (status = 'PENDING');
