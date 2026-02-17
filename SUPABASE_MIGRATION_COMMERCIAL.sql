
-- ======================================================
-- CONFIGURAÇÕES COMERCIAIS - NEXERO ENTERPRISE
-- ======================================================

-- 1. CRIAR TABELA
CREATE TABLE IF NOT EXISTS public.commercial_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) UNIQUE,
    
    -- Regras de Venda
    minimum_order_value numeric DEFAULT 0,
    auto_approve_orders boolean DEFAULT false,
    allow_negative_stock boolean DEFAULT false,
    low_stock_threshold int DEFAULT 5,
    
    -- Descontos
    max_discount_percent numeric DEFAULT 10,
    allow_discount_override boolean DEFAULT false,
    
    -- Pagamentos
    default_payment_method text DEFAULT 'PIX',
    allowed_payment_methods text[] DEFAULT '{PIX,CARTAO,BOLETO,DINHEIRO}',
    
    -- Tabela de Preços
    default_price_table text DEFAULT 'PADRAO',
    enable_multiple_price_tables boolean DEFAULT false,
    
    -- Limite de Crédito
    enable_credit_limit boolean DEFAULT false,
    default_credit_limit numeric DEFAULT 0,
    
    -- Numeração de Pedido
    order_code_prefix text DEFAULT 'PED',
    order_code_padding int DEFAULT 6,
    
    -- Frete
    enable_freight boolean DEFAULT true,
    freight_mode text DEFAULT 'EMBUTIDO', -- EMBUTIDO | SEPARADO
    default_freight_value numeric DEFAULT 0,
    
    -- Metas
    enable_sales_goals boolean DEFAULT false,
    monthly_goal numeric DEFAULT 0,
    
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

CREATE TRIGGER update_commercial_settings_updated_at
    BEFORE UPDATE ON commercial_settings
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- 3. SEGURANÇA (RLS)
ALTER TABLE commercial_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "commercial_settings_owner_all" ON commercial_settings
    FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
