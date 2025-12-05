-- =====================================================
-- MIGRATION 003: BILLS (Contas a Pagar/Receber)
-- Execute no SQL Editor do Supabase
-- =====================================================

-- Tabela principal de contas
CREATE TABLE IF NOT EXISTS bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Informações básicas
    description TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN (
        'energia', 'agua', 'internet', 'telefone', 
        'aluguel', 'condominio', 'iptu', 'seguro',
        'fornecedor', 'colaborador', 'marketing', 
        'manutencao', 'equipamentos', 'software', 'outros'
    )),
    type TEXT NOT NULL CHECK (type IN ('pagar', 'receber')),
    
    -- Valores
    amount DECIMAL(12,2) NOT NULL,
    paid_amount DECIMAL(12,2) DEFAULT 0,
    
    -- Datas
    due_date DATE NOT NULL,
    payment_date DATE,
    competence_month DATE, -- Mês de competência
    
    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN (
        'pending',   -- Pendente
        'paid',      -- Pago
        'overdue',   -- Vencido
        'cancelled', -- Cancelado
        'partial'    -- Pago parcialmente
    )),
    
    -- Recorrência
    is_recurring BOOLEAN DEFAULT false,
    recurrence_type TEXT CHECK (recurrence_type IN ('monthly', 'yearly', 'weekly')),
    recurrence_end_date DATE,
    parent_bill_id UUID REFERENCES bills(id) ON DELETE SET NULL,
    
    -- Relacionamentos
    collaborator_id UUID REFERENCES collaborators(id) ON DELETE SET NULL,
    contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
    
    -- Informações adicionais
    supplier_name TEXT,
    document_number TEXT, -- Número da nota/boleto
    barcode TEXT,
    notes TEXT,
    file_url TEXT,
    
    -- Metadados
    created_by UUID REFERENCES collaborators(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_bills_status ON bills(status);
CREATE INDEX IF NOT EXISTS idx_bills_due_date ON bills(due_date);
CREATE INDEX IF NOT EXISTS idx_bills_category ON bills(category);
CREATE INDEX IF NOT EXISTS idx_bills_type ON bills(type);
CREATE INDEX IF NOT EXISTS idx_bills_competence ON bills(competence_month);

-- Desabilitar RLS (conforme padrão atual)
ALTER TABLE bills DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- Campos adicionais para imobiliária em collaborators
-- =====================================================

-- Adicionar campo CRECI para corretores
ALTER TABLE collaborators ADD COLUMN IF NOT EXISTS creci TEXT;

-- Adicionar campo de comissão padrão
ALTER TABLE collaborators ADD COLUMN IF NOT EXISTS default_commission DECIMAL(5,2);

-- Adicionar tipo de vínculo específico
ALTER TABLE collaborators ADD COLUMN IF NOT EXISTS partner_type TEXT 
    CHECK (partner_type IN ('funcionario', 'corretor_associado', 'parceiro', 'estagiario'));

-- Adicionar tipo de conta bancária
ALTER TABLE collaborators ADD COLUMN IF NOT EXISTS bank_account_type TEXT
    CHECK (bank_account_type IN ('corrente', 'poupanca', 'salario'));

-- =====================================================
-- View para dashboard financeiro
-- =====================================================

CREATE OR REPLACE VIEW v_financial_summary AS
SELECT 
    COALESCE(SUM(CASE WHEN type = 'pagar' AND status = 'pending' THEN amount ELSE 0 END), 0) as total_a_pagar,
    COALESCE(SUM(CASE WHEN type = 'receber' AND status = 'pending' THEN amount ELSE 0 END), 0) as total_a_receber,
    COALESCE(SUM(CASE WHEN status = 'overdue' THEN amount ELSE 0 END), 0) as total_vencido,
    COALESCE(SUM(CASE WHEN status = 'paid' AND payment_date >= date_trunc('month', CURRENT_DATE) THEN paid_amount ELSE 0 END), 0) as pago_este_mes,
    COUNT(CASE WHEN status = 'pending' AND due_date <= CURRENT_DATE + 7 THEN 1 END) as vencendo_proximos_7_dias,
    COUNT(CASE WHEN status = 'overdue' THEN 1 END) as qtd_vencidas
FROM bills;

-- =====================================================
-- Função para atualizar status de contas vencidas
-- =====================================================

CREATE OR REPLACE FUNCTION update_overdue_bills()
RETURNS void AS $$
BEGIN
    UPDATE bills 
    SET status = 'overdue', updated_at = now()
    WHERE status = 'pending' 
    AND due_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;
