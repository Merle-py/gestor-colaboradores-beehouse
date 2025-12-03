export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            collaborators: {
                Row: {
                    id: string
                    created_at: string
                    bitrix_id: number
                    full_name: string
                    department_id: number | null
                    // Add other columns as needed
                }
                Insert: {
                    id?: string
                    created_at?: string
                    bitrix_id: number
                    full_name: string
                    department_id?: number | null
                }
                Update: {
                    id?: string
                    created_at?: string
                    bitrix_id?: number
                    full_name?: string
                    department_id?: number | null
                }
            }
            audit_logs: {
                Row: {
                    id: number
                    created_at: string
                    collaborator_id: string | null
                    bitrix_user_id: number | null
                    action: string
                    entity: string
                    details: Json | null
                }
                Insert: {
                    id?: number
                    created_at?: string
                    collaborator_id?: string | null
                    bitrix_user_id?: number | null
                    action: string
                    entity: string
                    details?: Json | null
                }
                Update: {
                    id?: number
                    created_at?: string
                    collaborator_id?: string | null
                    bitrix_user_id?: number | null
                    action?: string
                    entity?: string
                    details?: Json | null
                }
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
    }
}
