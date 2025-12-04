-- =====================================================
-- HR MODULES DATABASE MIGRATION - COMPLETE
-- Gestor Colaboradores Beehouse
-- Execute this in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- BASE TABLE: COLLABORATORS (Cadastro Mestre)
-- =====================================================

CREATE TABLE IF NOT EXISTS collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bitrix_id INTEGER UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  cpf TEXT UNIQUE,
  rg TEXT,
  birth_date DATE,
  gender TEXT CHECK (gender IN ('M', 'F', 'O')),
  marital_status TEXT CHECK (marital_status IN ('solteiro', 'casado', 'divorciado', 'viuvo', 'uniao_estavel')),
  nationality TEXT DEFAULT 'Brasileiro',
  
  -- Address
  address_street TEXT,
  address_number TEXT,
  address_complement TEXT,
  address_neighborhood TEXT,
  address_city TEXT,
  address_state TEXT,
  address_zip TEXT,
  
  -- Work Info
  department TEXT,
  department_id INTEGER,
  position TEXT,
  hire_date DATE,
  termination_date DATE,
  contract_type TEXT CHECK (contract_type IN ('CLT', 'PJ', 'Estagiário', 'Temporário')),
  work_shift TEXT,
  
  -- Bank Info
  bank_name TEXT,
  bank_agency TEXT,
  bank_account TEXT,
  pix_key TEXT,
  
  -- Status
  status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'ferias', 'afastado', 'desligado')),
  avatar_url TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for collaborators
ALTER TABLE collaborators ENABLE ROW LEVEL SECURITY;

-- Policies for collaborators
CREATE POLICY "Authenticated can read collaborators" ON collaborators FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert collaborators" ON collaborators FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update collaborators" ON collaborators FOR UPDATE TO authenticated USING (true);

-- Index for collaborators
CREATE INDEX IF NOT EXISTS idx_collaborators_status ON collaborators(status);
CREATE INDEX IF NOT EXISTS idx_collaborators_department ON collaborators(department);
CREATE INDEX IF NOT EXISTS idx_collaborators_email ON collaborators(email);

-- =====================================================
-- AUDIT LOGS
-- =====================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  collaborator_id UUID REFERENCES collaborators(id) ON DELETE SET NULL,
  bitrix_user_id INTEGER,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read audit_logs" ON audit_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert audit_logs" ON audit_logs FOR INSERT TO authenticated WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_audit_logs_collaborator ON audit_logs(collaborator_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- =====================================================
-- MODULE II: ADMISSÃO E DOCUMENTAÇÃO
-- =====================================================

-- Document checklists per contract type
CREATE TABLE IF NOT EXISTS document_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_type TEXT NOT NULL CHECK (contract_type IN ('CLT', 'PJ', 'Estagiário', 'Temporário')),
  document_name TEXT NOT NULL,
  description TEXT,
  required BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Documents uploaded/linked per collaborator
CREATE TABLE IF NOT EXISTS collaborator_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collaborator_id UUID NOT NULL REFERENCES collaborators(id) ON DELETE CASCADE,
  checklist_item_id UUID REFERENCES document_checklists(id) ON DELETE SET NULL,
  document_name TEXT NOT NULL,
  cloud_url TEXT,
  cloud_provider TEXT CHECK (cloud_provider IN ('google_drive', 's3', 'azure', 'other')),
  file_type TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'uploaded', 'approved', 'rejected', 'expired')),
  rejection_reason TEXT,
  uploaded_at TIMESTAMPTZ,
  approved_by UUID REFERENCES collaborators(id),
  approved_at TIMESTAMPTZ,
  expiration_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Digital signatures for terms
CREATE TABLE IF NOT EXISTS signature_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collaborator_id UUID NOT NULL REFERENCES collaborators(id) ON DELETE CASCADE,
  term_type TEXT NOT NULL CHECK (term_type IN ('confidentiality', 'responsibility', 'image_usage', 'data_consent', 'equipment')),
  term_version TEXT DEFAULT '1.0',
  signed BOOLEAN DEFAULT false,
  signed_at TIMESTAMPTZ,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- MODULE III: CONTRATOS E JORNADA
-- =====================================================

-- Contracts for collaborators (focus on PJ)
CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collaborator_id UUID NOT NULL REFERENCES collaborators(id) ON DELETE CASCADE,
  contract_type TEXT NOT NULL CHECK (contract_type IN ('CLT', 'PJ', 'Estagiário', 'Temporário')),
  contract_number TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  renewal_date DATE,
  monthly_value DECIMAL(12,2),
  payment_day INTEGER CHECK (payment_day BETWEEN 1 AND 31),
  work_hours_per_week INTEGER DEFAULT 40,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'renewed', 'cancelled', 'pending')),
  termination_reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Recess/Pause requests
CREATE TABLE IF NOT EXISTS recess_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collaborator_id UUID NOT NULL REFERENCES collaborators(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL CHECK (request_type IN ('individual', 'collective')),
  category TEXT CHECK (category IN ('vacation', 'recess', 'leave', 'medical', 'maternity', 'paternity')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_days INTEGER GENERATED ALWAYS AS (end_date - start_date + 1) STORED,
  status TEXT DEFAULT 'requested' CHECK (status IN ('requested', 'approved', 'in_progress', 'completed', 'rejected', 'cancelled')),
  approved_by UUID REFERENCES collaborators(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- MODULE IV: MATERIAIS E EPIs
-- =====================================================

-- Inventory items (stock)
CREATE TABLE IF NOT EXISTS inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('EPI', 'Uniforme', 'Ferramenta', 'TI', 'Escritório', 'Outro')),
  sku TEXT UNIQUE,
  unit TEXT DEFAULT 'un' CHECK (unit IN ('un', 'par', 'cx', 'kg', 'mt')),
  quantity_available INTEGER DEFAULT 0 CHECK (quantity_available >= 0),
  min_stock INTEGER DEFAULT 0,
  max_stock INTEGER,
  unit_cost DECIMAL(10,2),
  supplier TEXT,
  ca_number TEXT,
  ca_expiration DATE,
  replacement_cycle_days INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Stock movements (in/out)
CREATE TABLE IF NOT EXISTS inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('entry', 'exit', 'adjustment', 'return', 'loss')),
  quantity INTEGER NOT NULL,
  previous_quantity INTEGER NOT NULL,
  new_quantity INTEGER NOT NULL,
  collaborator_id UUID REFERENCES collaborators(id),
  reason TEXT,
  document_number TEXT,
  unit_cost DECIMAL(10,2),
  performed_by UUID REFERENCES collaborators(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- EPI delivery records (ficha de EPI)
CREATE TABLE IF NOT EXISTS epi_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collaborator_id UUID NOT NULL REFERENCES collaborators(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
  size TEXT,
  delivery_date DATE DEFAULT CURRENT_DATE,
  next_replacement_date DATE,
  ca_at_delivery TEXT,
  condition_at_delivery TEXT DEFAULT 'new' CHECK (condition_at_delivery IN ('new', 'used', 'refurbished')),
  digital_signature BOOLEAN DEFAULT false,
  signature_ip INET,
  signed_at TIMESTAMPTZ,
  returned BOOLEAN DEFAULT false,
  returned_at DATE,
  return_condition TEXT,
  notes TEXT,
  delivered_by UUID REFERENCES collaborators(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- PENDING ACTIONS (Para Dashboard)
-- =====================================================

CREATE TABLE IF NOT EXISTS pending_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'urgent', 'completed')),
  priority INTEGER DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
  module TEXT NOT NULL CHECK (module IN ('Documentos', 'Contratos', 'Recessos', 'Materiais', 'Financeiro')),
  related_entity_type TEXT,
  related_entity_id UUID,
  collaborator_id UUID REFERENCES collaborators(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES collaborators(id),
  due_date DATE,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES collaborators(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- DATABASE VIEWS (Para Alertas do Dashboard)
-- =====================================================

-- View: Contratos expirando nos próximos 30 dias
CREATE OR REPLACE VIEW contracts_expiring_soon AS
SELECT 
  c.id,
  c.collaborator_id,
  co.full_name,
  co.email,
  c.contract_type,
  c.start_date,
  c.end_date,
  c.monthly_value,
  c.status,
  (c.end_date - CURRENT_DATE) as days_until_expiration,
  CASE 
    WHEN (c.end_date - CURRENT_DATE) <= 7 THEN 'critical'
    WHEN (c.end_date - CURRENT_DATE) <= 15 THEN 'warning'
    ELSE 'info'
  END as severity
FROM contracts c
JOIN collaborators co ON c.collaborator_id = co.id
WHERE c.status = 'active'
  AND c.end_date IS NOT NULL
  AND c.end_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '30 days')
ORDER BY c.end_date ASC;

-- View: Recessos em andamento ou próximos
CREATE OR REPLACE VIEW recesses_expiring_soon AS
SELECT 
  r.id,
  r.collaborator_id,
  co.full_name,
  r.request_type,
  r.category,
  r.start_date,
  r.end_date,
  r.total_days,
  r.status,
  (r.end_date - CURRENT_DATE) as days_remaining,
  CASE 
    WHEN r.status = 'in_progress' AND (r.end_date - CURRENT_DATE) <= 3 THEN 'critical'
    WHEN r.status = 'in_progress' AND (r.end_date - CURRENT_DATE) <= 7 THEN 'warning'
    ELSE 'info'
  END as severity
FROM recess_requests r
JOIN collaborators co ON r.collaborator_id = co.id
WHERE r.status IN ('approved', 'in_progress')
  AND r.end_date >= CURRENT_DATE
ORDER BY r.end_date ASC;

-- View: EPIs com CA vencendo
CREATE OR REPLACE VIEW epis_ca_expiring AS
SELECT 
  i.id,
  i.name,
  i.category,
  i.ca_number,
  i.ca_expiration,
  i.quantity_available,
  (i.ca_expiration - CURRENT_DATE) as days_until_expiration,
  CASE 
    WHEN (i.ca_expiration - CURRENT_DATE) <= 15 THEN 'critical'
    WHEN (i.ca_expiration - CURRENT_DATE) <= 30 THEN 'warning'
    ELSE 'info'
  END as severity
FROM inventory_items i
WHERE i.ca_expiration IS NOT NULL
  AND i.is_active = true
  AND i.ca_expiration BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '60 days')
ORDER BY i.ca_expiration ASC;

-- View: Itens com estoque baixo
CREATE OR REPLACE VIEW items_low_stock AS
SELECT 
  i.id,
  i.name,
  i.category,
  i.sku,
  i.quantity_available,
  i.min_stock,
  (i.quantity_available - i.min_stock) as stock_difference,
  CASE 
    WHEN i.quantity_available = 0 THEN 'critical'
    WHEN i.quantity_available <= i.min_stock THEN 'warning'
    ELSE 'info'
  END as severity
FROM inventory_items i
WHERE i.is_active = true
  AND i.quantity_available <= i.min_stock
ORDER BY i.quantity_available ASC;

-- View: EPIs próximos de troca
CREATE OR REPLACE VIEW epis_replacement_due AS
SELECT 
  e.id,
  e.collaborator_id,
  co.full_name,
  i.name as item_name,
  i.category,
  e.delivery_date,
  e.next_replacement_date,
  (e.next_replacement_date - CURRENT_DATE) as days_until_replacement,
  CASE 
    WHEN (e.next_replacement_date - CURRENT_DATE) <= 7 THEN 'critical'
    WHEN (e.next_replacement_date - CURRENT_DATE) <= 15 THEN 'warning'
    ELSE 'info'
  END as severity
FROM epi_deliveries e
JOIN collaborators co ON e.collaborator_id = co.id
JOIN inventory_items i ON e.item_id = i.id
WHERE e.returned = false
  AND e.next_replacement_date IS NOT NULL
  AND e.next_replacement_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '30 days')
ORDER BY e.next_replacement_date ASC;

-- =====================================================
-- INDEXES (Performance)
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_collaborator_documents_collaborator ON collaborator_documents(collaborator_id);
CREATE INDEX IF NOT EXISTS idx_collaborator_documents_status ON collaborator_documents(status);
CREATE INDEX IF NOT EXISTS idx_contracts_collaborator ON contracts(collaborator_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_end_date ON contracts(end_date);
CREATE INDEX IF NOT EXISTS idx_recess_requests_collaborator ON recess_requests(collaborator_id);
CREATE INDEX IF NOT EXISTS idx_recess_requests_status ON recess_requests(status);
CREATE INDEX IF NOT EXISTS idx_inventory_items_category ON inventory_items(category);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_item ON inventory_movements(item_id);
CREATE INDEX IF NOT EXISTS idx_epi_deliveries_collaborator ON epi_deliveries(collaborator_id);
CREATE INDEX IF NOT EXISTS idx_pending_actions_status ON pending_actions(status);
CREATE INDEX IF NOT EXISTS idx_pending_actions_module ON pending_actions(module);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE document_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaborator_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE signature_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE recess_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE epi_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_actions ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can read all
CREATE POLICY "Authenticated can read document_checklists" ON document_checklists FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can read collaborator_documents" ON collaborator_documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can read signature_terms" ON signature_terms FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can read contracts" ON contracts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can read recess_requests" ON recess_requests FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can read inventory_items" ON inventory_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can read inventory_movements" ON inventory_movements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can read epi_deliveries" ON epi_deliveries FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can read pending_actions" ON pending_actions FOR SELECT TO authenticated USING (true);

-- Policy: Authenticated users can insert/update
CREATE POLICY "Authenticated can insert document_checklists" ON document_checklists FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update document_checklists" ON document_checklists FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can insert collaborator_documents" ON collaborator_documents FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update collaborator_documents" ON collaborator_documents FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can insert signature_terms" ON signature_terms FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update signature_terms" ON signature_terms FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can insert contracts" ON contracts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update contracts" ON contracts FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can insert recess_requests" ON recess_requests FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update recess_requests" ON recess_requests FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can insert inventory_items" ON inventory_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update inventory_items" ON inventory_items FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can insert inventory_movements" ON inventory_movements FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can insert epi_deliveries" ON epi_deliveries FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update epi_deliveries" ON epi_deliveries FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can insert pending_actions" ON pending_actions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update pending_actions" ON pending_actions FOR UPDATE TO authenticated USING (true);

-- =====================================================
-- SEED DATA: Document Checklists
-- =====================================================

INSERT INTO document_checklists (contract_type, document_name, description, required, order_index) VALUES
-- CLT Documents
('CLT', 'RG', 'Documento de Identidade', true, 1),
('CLT', 'CPF', 'Cadastro de Pessoa Física', true, 2),
('CLT', 'CTPS', 'Carteira de Trabalho (digital ou física)', true, 3),
('CLT', 'Comprovante de Residência', 'Conta de luz, água ou telefone', true, 4),
('CLT', 'Certidão de Nascimento/Casamento', 'Estado civil', true, 5),
('CLT', 'Título de Eleitor', 'Documento eleitoral', true, 6),
('CLT', 'Certificado de Reservista', 'Para homens maiores de 18 anos', false, 7),
('CLT', 'PIS/PASEP', 'Número do PIS', true, 8),
('CLT', 'Foto 3x4', 'Foto recente para crachá', true, 9),
('CLT', 'ASO Admissional', 'Atestado de Saúde Ocupacional', true, 10),
-- PJ Documents
('PJ', 'CNPJ', 'Cartão CNPJ da empresa', true, 1),
('PJ', 'Contrato Social', 'Contrato social ou MEI', true, 2),
('PJ', 'RG do Sócio', 'Documento do responsável', true, 3),
('PJ', 'CPF do Sócio', 'CPF do responsável', true, 4),
('PJ', 'Comprovante de Endereço PJ', 'Endereço da empresa', true, 5),
('PJ', 'Certidão Negativa Federal', 'Regularidade fiscal', false, 6),
-- Estagiário Documents
('Estagiário', 'RG', 'Documento de Identidade', true, 1),
('Estagiário', 'CPF', 'Cadastro de Pessoa Física', true, 2),
('Estagiário', 'Comprovante de Matrícula', 'Instituição de ensino', true, 3),
('Estagiário', 'Histórico Escolar', 'Histórico atualizado', true, 4),
('Estagiário', 'Termo de Compromisso', 'Assinado pela instituição', true, 5)
ON CONFLICT DO NOTHING;

-- =====================================================
-- SEED DATA: Sample Inventory Items
-- =====================================================

INSERT INTO inventory_items (name, description, category, sku, unit, quantity_available, min_stock, ca_number, ca_expiration, replacement_cycle_days) VALUES
('Capacete de Segurança', 'Capacete branco classe A/B', 'EPI', 'EPI-CAP-001', 'un', 25, 10, 'CA-12345', CURRENT_DATE + INTERVAL '1 year', 365),
('Luvas de Proteção', 'Luvas de látex tamanho M', 'EPI', 'EPI-LUV-001', 'par', 100, 30, 'CA-12346', CURRENT_DATE + INTERVAL '6 months', 90),
('Óculos de Proteção', 'Óculos incolor anti-risco', 'EPI', 'EPI-OCU-001', 'un', 50, 15, 'CA-12347', CURRENT_DATE + INTERVAL '2 years', 180),
('Uniforme Camisa', 'Camisa polo azul marinho', 'Uniforme', 'UNI-CAM-001', 'un', 40, 10, NULL, NULL, 180),
('Uniforme Calça', 'Calça jeans azul escuro', 'Uniforme', 'UNI-CAL-001', 'un', 35, 10, NULL, NULL, 180),
('Notebook Dell', 'Notebook Dell Latitude 5520', 'TI', 'TI-NOTE-001', 'un', 5, 2, NULL, NULL, NULL),
('Mouse USB', 'Mouse óptico USB', 'TI', 'TI-MOU-001', 'un', 20, 5, NULL, NULL, NULL)
ON CONFLICT DO NOTHING;

-- =====================================================
-- DONE!
-- =====================================================
