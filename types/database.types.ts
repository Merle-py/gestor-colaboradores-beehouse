// =====================================================
// HR MODULES - TypeScript Types
// =====================================================

export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

// =====================================================
// ENUMS
// =====================================================

export type ContractType = 'CLT' | 'PJ' | 'Estagiário' | 'Temporário'
export type DocumentStatus = 'pending' | 'uploaded' | 'approved' | 'rejected' | 'expired'
export type CloudProvider = 'google_drive' | 's3' | 'azure' | 'other'
export type TermType = 'confidentiality' | 'responsibility' | 'image_usage' | 'data_consent' | 'equipment'
export type ContractStatus = 'active' | 'expired' | 'renewed' | 'cancelled' | 'pending'
export type RecessType = 'individual' | 'collective'
export type RecessCategory = 'vacation' | 'recess' | 'leave' | 'medical' | 'maternity' | 'paternity'
export type RecessStatus = 'requested' | 'approved' | 'in_progress' | 'completed' | 'rejected' | 'cancelled'
export type ItemCategory = 'EPI' | 'Uniforme' | 'Ferramenta' | 'TI' | 'Escritório' | 'Outro'
export type ItemUnit = 'un' | 'par' | 'cx' | 'kg' | 'mt'
export type MovementType = 'entry' | 'exit' | 'adjustment' | 'return' | 'loss'
export type ItemCondition = 'new' | 'used' | 'refurbished'
export type ActionStatus = 'pending' | 'in_review' | 'urgent' | 'completed'
export type ModuleType = 'Documentos' | 'Contratos' | 'Recessos' | 'Materiais' | 'Financeiro'
export type AlertSeverity = 'info' | 'warning' | 'critical'

// =====================================================
// BASE TYPES
// =====================================================

export interface Collaborator {
    id: string
    created_at: string
    bitrix_id: number | null
    full_name: string
    email: string | null
    department: string | null
    department_id: number | null
    status: string | null
}

// =====================================================
// MODULE II: ADMISSÃO E DOCUMENTAÇÃO
// =====================================================

export interface DocumentChecklist {
    id: string
    contract_type: ContractType
    document_name: string
    description: string | null
    required: boolean
    order_index: number
    created_at: string
    updated_at: string
}

export interface CollaboratorDocument {
    id: string
    collaborator_id: string
    checklist_item_id: string | null
    document_name: string
    cloud_url: string | null
    cloud_provider: CloudProvider | null
    file_type: string | null
    status: DocumentStatus
    rejection_reason: string | null
    uploaded_at: string | null
    approved_by: string | null
    approved_at: string | null
    expiration_date: string | null
    created_at: string
    updated_at: string
    // Relations
    collaborator?: Collaborator
    checklist_item?: DocumentChecklist
}

export interface SignatureTerm {
    id: string
    collaborator_id: string
    term_type: TermType
    term_version: string
    signed: boolean
    signed_at: string | null
    ip_address: string | null
    user_agent: string | null
    created_at: string
    // Relations
    collaborator?: Collaborator
}

// =====================================================
// MODULE III: CONTRATOS E JORNADA
// =====================================================

export interface Contract {
    id: string
    collaborator_id: string
    contract_type: ContractType
    contract_number: string | null
    start_date: string
    end_date: string | null
    renewal_date: string | null
    monthly_value: number | null
    payment_day: number | null
    work_hours_per_week: number
    status: ContractStatus
    termination_reason: string | null
    notes: string | null
    created_at: string
    updated_at: string
    // Relations
    collaborator?: Collaborator
    // Computed
    days_until_expiration?: number
}

export interface RecessRequest {
    id: string
    collaborator_id: string
    request_type: RecessType
    category: RecessCategory | null
    start_date: string
    end_date: string
    total_days: number
    status: RecessStatus
    approved_by: string | null
    approved_at: string | null
    rejection_reason: string | null
    reason: string | null
    notes: string | null
    created_at: string
    updated_at: string
    // Relations
    collaborator?: Collaborator
    approver?: Collaborator
}

// =====================================================
// MODULE IV: MATERIAIS E EPIs
// =====================================================

export interface InventoryItem {
    id: string
    name: string
    description: string | null
    category: ItemCategory
    sku: string | null
    unit: ItemUnit
    quantity_available: number
    min_stock: number
    max_stock: number | null
    unit_cost: number | null
    supplier: string | null
    ca_number: string | null
    ca_expiration: string | null
    replacement_cycle_days: number | null
    is_active: boolean
    created_at: string
    updated_at: string
}

export interface InventoryMovement {
    id: string
    item_id: string
    movement_type: MovementType
    quantity: number
    previous_quantity: number
    new_quantity: number
    collaborator_id: string | null
    reason: string | null
    document_number: string | null
    unit_cost: number | null
    performed_by: string | null
    created_at: string
    // Relations
    item?: InventoryItem
    collaborator?: Collaborator
    performer?: Collaborator
}

export interface EPIDelivery {
    id: string
    collaborator_id: string
    item_id: string
    quantity: number
    size: string | null
    delivery_date: string
    next_replacement_date: string | null
    ca_at_delivery: string | null
    condition_at_delivery: ItemCondition
    digital_signature: boolean
    signature_ip: string | null
    signed_at: string | null
    returned: boolean
    returned_at: string | null
    return_condition: string | null
    notes: string | null
    delivered_by: string | null
    created_at: string
    // Relations
    collaborator?: Collaborator
    item?: InventoryItem
    deliverer?: Collaborator
}

// =====================================================
// PENDING ACTIONS
// =====================================================

export interface PendingAction {
    id: string
    action_type: string
    title: string
    description: string | null
    status: ActionStatus
    priority: number
    module: ModuleType
    related_entity_type: string | null
    related_entity_id: string | null
    collaborator_id: string | null
    assigned_to: string | null
    due_date: string | null
    completed_at: string | null
    completed_by: string | null
    created_at: string
    updated_at: string
    // Relations
    collaborator?: Collaborator
    assignee?: Collaborator
}

// =====================================================
// DASHBOARD VIEWS (Agregados)
// =====================================================

export interface ContractExpiringSoon {
    id: string
    collaborator_id: string
    full_name: string
    email: string | null
    contract_type: ContractType
    start_date: string
    end_date: string
    monthly_value: number | null
    status: ContractStatus
    days_until_expiration: number
    severity: AlertSeverity
}

export interface RecessExpiringSoon {
    id: string
    collaborator_id: string
    full_name: string
    request_type: RecessType
    category: RecessCategory | null
    start_date: string
    end_date: string
    total_days: number
    status: RecessStatus
    days_remaining: number
    severity: AlertSeverity
}

export interface EPICAExpiring {
    id: string
    name: string
    category: ItemCategory
    ca_number: string
    ca_expiration: string
    quantity_available: number
    days_until_expiration: number
    severity: AlertSeverity
}

export interface ItemLowStock {
    id: string
    name: string
    category: ItemCategory
    sku: string | null
    quantity_available: number
    min_stock: number
    stock_difference: number
    severity: AlertSeverity
}

export interface EPIReplacementDue {
    id: string
    collaborator_id: string
    full_name: string
    item_name: string
    category: ItemCategory
    delivery_date: string
    next_replacement_date: string
    days_until_replacement: number
    severity: AlertSeverity
}

// =====================================================
// DASHBOARD ALERT (Unified)
// =====================================================

export interface CriticalAlert {
    id: string
    type: 'contract_expiring' | 'recess_expiring' | 'epi_ca_expiring' | 'low_stock' | 'epi_replacement'
    title: string
    description: string
    severity: AlertSeverity
    related_id: string
    days_remaining: number
    module: ModuleType
}

// =====================================================
// FORM TYPES (Para criação/edição)
// =====================================================

export interface CreateContractInput {
    collaborator_id: string
    contract_type: ContractType
    contract_number?: string
    start_date: string
    end_date?: string
    renewal_date?: string
    monthly_value?: number
    payment_day?: number
    work_hours_per_week?: number
    notes?: string
}

export interface CreateRecessRequestInput {
    collaborator_id: string
    request_type: RecessType
    category?: RecessCategory
    start_date: string
    end_date: string
    reason?: string
    notes?: string
}

export interface CreateInventoryItemInput {
    name: string
    description?: string
    category: ItemCategory
    sku?: string
    unit?: ItemUnit
    quantity_available?: number
    min_stock?: number
    max_stock?: number
    unit_cost?: number
    supplier?: string
    ca_number?: string
    ca_expiration?: string
    replacement_cycle_days?: number
}

export interface CreateInventoryMovementInput {
    item_id: string
    movement_type: MovementType
    quantity: number
    collaborator_id?: string
    reason?: string
    document_number?: string
    unit_cost?: number
}

export interface CreateEPIDeliveryInput {
    collaborator_id: string
    item_id: string
    quantity?: number
    size?: string
    delivery_date?: string
    ca_at_delivery?: string
    condition_at_delivery?: ItemCondition
    notes?: string
}

// =====================================================
// SUPABASE DATABASE INTERFACE
// =====================================================

export interface Database {
    public: {
        Tables: {
            collaborators: {
                Row: Collaborator
                Insert: Omit<Collaborator, 'id' | 'created_at'> & { id?: string; created_at?: string }
                Update: Partial<Collaborator>
            }
            document_checklists: {
                Row: DocumentChecklist
                Insert: Omit<DocumentChecklist, 'id' | 'created_at' | 'updated_at'> & { id?: string }
                Update: Partial<DocumentChecklist>
            }
            collaborator_documents: {
                Row: CollaboratorDocument
                Insert: Omit<CollaboratorDocument, 'id' | 'created_at' | 'updated_at'> & { id?: string }
                Update: Partial<CollaboratorDocument>
            }
            signature_terms: {
                Row: SignatureTerm
                Insert: Omit<SignatureTerm, 'id' | 'created_at'> & { id?: string }
                Update: Partial<SignatureTerm>
            }
            contracts: {
                Row: Contract
                Insert: Omit<Contract, 'id' | 'created_at' | 'updated_at'> & { id?: string }
                Update: Partial<Contract>
            }
            recess_requests: {
                Row: RecessRequest
                Insert: Omit<RecessRequest, 'id' | 'created_at' | 'updated_at' | 'total_days'> & { id?: string }
                Update: Partial<RecessRequest>
            }
            inventory_items: {
                Row: InventoryItem
                Insert: Omit<InventoryItem, 'id' | 'created_at' | 'updated_at'> & { id?: string }
                Update: Partial<InventoryItem>
            }
            inventory_movements: {
                Row: InventoryMovement
                Insert: Omit<InventoryMovement, 'id' | 'created_at'> & { id?: string }
                Update: Partial<InventoryMovement>
            }
            epi_deliveries: {
                Row: EPIDelivery
                Insert: Omit<EPIDelivery, 'id' | 'created_at'> & { id?: string }
                Update: Partial<EPIDelivery>
            }
            pending_actions: {
                Row: PendingAction
                Insert: Omit<PendingAction, 'id' | 'created_at' | 'updated_at'> & { id?: string }
                Update: Partial<PendingAction>
            }
        }
        Views: {
            contracts_expiring_soon: {
                Row: ContractExpiringSoon
            }
            recesses_expiring_soon: {
                Row: RecessExpiringSoon
            }
            epis_ca_expiring: {
                Row: EPICAExpiring
            }
            items_low_stock: {
                Row: ItemLowStock
            }
            epis_replacement_due: {
                Row: EPIReplacementDue
            }
        }
        Functions: Record<string, never>
        Enums: Record<string, never>
    }
}
