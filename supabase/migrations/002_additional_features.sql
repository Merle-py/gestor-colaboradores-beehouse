-- =====================================================
-- HR MODULES DATABASE MIGRATION V2 - NEW TABLES
-- Execute this AFTER the initial 001_hr_modules.sql
-- =====================================================

-- =====================================================
-- FIX: Update document_checklists to support categories
-- =====================================================

ALTER TABLE document_checklists ADD COLUMN IF NOT EXISTS is_required BOOLEAN DEFAULT true;
ALTER TABLE document_checklists ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Identificação';
ALTER TABLE document_checklists ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Update existing required column
UPDATE document_checklists SET is_required = required WHERE is_required IS NULL;

-- =====================================================
-- FIX: Update collaborator_documents for upload flow
-- =====================================================

ALTER TABLE collaborator_documents ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE collaborator_documents ADD COLUMN IF NOT EXISTS uploaded_at TIMESTAMPTZ;
ALTER TABLE collaborator_documents ADD COLUMN IF NOT EXISTS notes TEXT;

-- =====================================================
-- NEW TABLE: Signature Terms (Templates)
-- =====================================================

CREATE TABLE IF NOT EXISTS signature_terms_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  term_type TEXT NOT NULL,
  term_title TEXT NOT NULL,
  term_content TEXT,
  is_required BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Drop and recreate signature_terms for better structure
DROP TABLE IF EXISTS collaborator_terms CASCADE;

CREATE TABLE IF NOT EXISTS collaborator_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collaborator_id UUID NOT NULL REFERENCES collaborators(id) ON DELETE CASCADE,
  term_id UUID NOT NULL REFERENCES signature_terms_templates(id) ON DELETE CASCADE,
  sent_at TIMESTAMPTZ DEFAULT now(),
  signed_at TIMESTAMPTZ,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE collaborator_terms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can all collaborator_terms" ON collaborator_terms FOR ALL TO authenticated USING (true);

ALTER TABLE signature_terms_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can all signature_terms_templates" ON signature_terms_templates FOR ALL TO authenticated USING (true);

-- Seed terms templates
INSERT INTO signature_terms_templates (term_type, term_title, term_content, is_required) VALUES
('contract', 'Contrato de Prestação de Serviços', 'Modelo de contrato PJ...', true),
('confidentiality', 'Termo de Confidencialidade', 'Comprometo-me a manter sigilo sobre...', true),
('responsibility', 'Termo de Responsabilidade', 'Declaro estar ciente das responsabilidades...', true),
('equipment', 'Termo de Guarda de Equipamentos', 'Comprometo-me a zelar pelos equipamentos...', false),
('image', 'Termo de Uso de Imagem', 'Autorizo o uso de minha imagem...', false),
('lgpd', 'Termo LGPD - Proteção de Dados', 'Estou ciente quanto ao tratamento de dados...', true)
ON CONFLICT DO NOTHING;

-- =====================================================
-- NEW TABLE: Notas Fiscais PJ
-- =====================================================

CREATE TABLE IF NOT EXISTS notas_fiscais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collaborator_id UUID NOT NULL REFERENCES collaborators(id) ON DELETE CASCADE,
  nf_number TEXT NOT NULL,
  nf_date DATE NOT NULL,
  nf_value DECIMAL(12,2) NOT NULL,
  competence_month TEXT NOT NULL, -- YYYY-MM format
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'received', 'approved', 'paid')),
  file_url TEXT,
  notes TEXT,
  approved_by UUID REFERENCES collaborators(id),
  approved_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE notas_fiscais ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can all notas_fiscais" ON notas_fiscais FOR ALL TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_notas_fiscais_collaborator ON notas_fiscais(collaborator_id);
CREATE INDEX IF NOT EXISTS idx_notas_fiscais_status ON notas_fiscais(status);
CREATE INDEX IF NOT EXISTS idx_notas_fiscais_competence ON notas_fiscais(competence_month);

-- =====================================================
-- NEW TABLE: Alert Configurations
-- =====================================================

CREATE TABLE IF NOT EXISTS alert_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  enabled BOOLEAN DEFAULT true,
  days_before INTEGER DEFAULT 30,
  channels TEXT[] DEFAULT ARRAY['email'],
  recipients TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE alert_configurations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can all alert_configurations" ON alert_configurations FOR ALL TO authenticated USING (true);

-- Seed alert configurations
INSERT INTO alert_configurations (alert_type, name, description, enabled, days_before, channels) VALUES
('contract_expiration', 'Vencimento de Contrato PJ', 'Alerta quando contratos PJ estão próximos do vencimento', true, 30, ARRAY['email']),
('ca_expiration', 'Vencimento de CA de EPI', 'Alerta quando o Certificado de Aprovação do EPI está vencendo', true, 60, ARRAY['email']),
('recess_reminder', 'Lembrete de Recesso', 'Notifica sobre recessos programados', true, 7, ARRAY['email']),
('document_pending', 'Documentos Pendentes', 'Alerta sobre documentos não enviados após admissão', true, 5, ARRAY['email']),
('nf_pending', 'Nota Fiscal Pendente', 'Alerta sobre NFs não recebidas de prestadores PJ', true, 5, ARRAY['email'])
ON CONFLICT DO NOTHING;

-- =====================================================
-- UPDATE: Collaborators table for gestor_id
-- =====================================================

ALTER TABLE collaborators ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES collaborators(id);
ALTER TABLE collaborators ADD COLUMN IF NOT EXISTS commission_rules JSONB;
ALTER TABLE collaborators ADD COLUMN IF NOT EXISTS cost_center TEXT;
ALTER TABLE collaborators ADD COLUMN IF NOT EXISTS business_unit TEXT DEFAULT 'Beehouse';
ALTER TABLE collaborators ADD COLUMN IF NOT EXISTS cloud_folder_url TEXT;

-- =====================================================
-- UPDATE: Inventory items for current_stock and minimum_stock
-- =====================================================

ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS current_stock INTEGER DEFAULT 0;
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS minimum_stock INTEGER DEFAULT 0;

-- Sync current_stock with quantity_available
UPDATE inventory_items SET current_stock = quantity_available WHERE current_stock = 0;
UPDATE inventory_items SET minimum_stock = min_stock WHERE minimum_stock = 0;

-- =====================================================
-- VIEW: Notas Fiscais Pendentes
-- =====================================================

CREATE OR REPLACE VIEW nfs_pending AS
SELECT 
  nf.id,
  nf.collaborator_id,
  co.full_name,
  co.email,
  nf.competence_month,
  nf.status,
  CASE 
    WHEN nf.status = 'pending' THEN 'critical'
    WHEN nf.status = 'received' THEN 'warning'
    ELSE 'info'
  END as severity
FROM notas_fiscais nf
JOIN collaborators co ON nf.collaborator_id = co.id
WHERE nf.status IN ('pending', 'received')
ORDER BY nf.competence_month DESC;

-- =====================================================
-- STORAGE BUCKET FOR DOCUMENTS
-- =====================================================

-- Note: Run this in Supabase Dashboard > Storage > Create Bucket
-- Bucket name: documents
-- Public: false

-- =====================================================
-- DONE!
-- =====================================================
