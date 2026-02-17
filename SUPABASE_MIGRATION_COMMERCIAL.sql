
-- ======================================================
-- CONFIGURAÇÕES COMERCIAIS - NEXERO (FIXED SCHEMA)
-- ======================================================

-- 1. CRIAR TABELA SE NÃO EXISTIR
CREATE TABLE IF NOT EXISTS public.commercial_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE UNIQUE,
    user_id uuid NOT NULL REFERENCES auth.users(id),
    
    minimum_order_value numeric DEFAULT 0,
    auto_approve_orders boolean DEFAULT false,
    allow_negative_stock boolean DEFAULT false,
    low_stock_threshold int DEFAULT 5,
    max_discount_percent numeric DEFAULT 10,
    allow_discount_override boolean DEFAULT false,
    default_payment_method text DEFAULT 'PIX',
    allowed_payment_methods text[] DEFAULT '{PIX,CARTAO,BOLETO,DINHEIRO}',
    default_price_table text DEFAULT 'PADRAO',
    enable_multiple_price_tables boolean DEFAULT false,
    enable_credit_limit boolean DEFAULT false,
    default_credit_limit numeric DEFAULT 0,
    order_code_prefix text DEFAULT 'PED',
    order_code_padding int DEFAULT 6,
    enable_freight boolean DEFAULT true,
    freight_mode text DEFAULT 'EMBUTIDO',
    default_freight_value numeric DEFAULT 0,
    enable_sales_goals boolean DEFAULT false,
    monthly_goal numeric DEFAULT 0,
    
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- ADICIONAR COLUNA CASO JÁ EXISTA A TABELA SEM ELA
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'commercial_settings' AND COLUMN_NAME = 'company_id') THEN
        ALTER TABLE public.commercial_settings ADD COLUMN company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE UNIQUE;
    END IF;
END $$;
