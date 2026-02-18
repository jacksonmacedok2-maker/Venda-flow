
-- Função para validar token de convite sem estar logado
CREATE OR REPLACE FUNCTION public.get_invitation_by_token(p_token text)
RETURNS TABLE (
    id uuid,
    invited_email text,
    invited_name text,
    role text,
    company_id uuid,
    status text,
    expires_at timestamptz
) 
LANGUAGE plpgsql
SECURITY DEFINER -- Permite que a função ignore RLS para esta consulta específica
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.id, 
        i.invited_email, 
        i.invited_name, 
        i.role, 
        i.company_id, 
        i.status, 
        i.expires_at
    FROM public.invitations i
    WHERE i.token = p_token 
      AND i.status = 'PENDING' 
      AND i.expires_at > now()
    LIMIT 1;
END;
$$;
