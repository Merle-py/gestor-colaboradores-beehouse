import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { createServiceClient } from '@/lib/supabase/server'

interface BitrixUser {
    ID: string
    NAME: string
    LAST_NAME: string
    EMAIL: string
    PERSONAL_PHOTO: string
    WORK_POSITION: string
    UF_DEPARTMENT: number[]
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { bitrix_id } = body

        if (!bitrix_id) {
            return NextResponse.json(
                { error: 'ID do Bitrix é obrigatório' },
                { status: 400 }
            )
        }

        // Get environment variables
        const domain = process.env.BITRIX_DOMAIN
        const webhookToken = process.env.BITRIX_WEBHOOK_TOKEN
        const webhookUserId = process.env.BITRIX_WEBHOOK_USER_ID
        const jwtSecret = process.env.JWT_SECRET

        if (!domain || !webhookToken || !webhookUserId || !jwtSecret) {
            console.error('Missing Bitrix environment variables')
            return NextResponse.json(
                { error: 'Configuração do Bitrix incompleta' },
                { status: 500 }
            )
        }

        // 1. Validate user against Bitrix24 API
        const bitrixUrl = `https://${domain}/rest/${webhookUserId}/${webhookToken}/user.get.json?ID=${bitrix_id}`

        console.log('Calling Bitrix API:', bitrixUrl)

        const bitrixResponse = await fetch(bitrixUrl)
        const bitrixData = await bitrixResponse.json()

        if (bitrixData.error || !bitrixData.result || bitrixData.result.length === 0) {
            console.error('Bitrix API error:', bitrixData.error_description || 'User not found')
            return NextResponse.json(
                { error: 'Usuário não encontrado no Bitrix24' },
                { status: 404 }
            )
        }

        const bitrixUser: BitrixUser = bitrixData.result[0]
        const fullName = `${bitrixUser.NAME} ${bitrixUser.LAST_NAME}`.trim()
        const email = bitrixUser.EMAIL || `bitrix_${bitrix_id}@local`

        console.log('Bitrix user found:', fullName, email)

        // 2. Get Supabase client
        const supabase = await createServiceClient() as any

        // 3. Check if user exists in Supabase Auth
        let authUserId: string
        const { data: usersList } = await supabase.auth.admin.listUsers()
        const existingAuth = usersList?.users?.find((u: any) =>
            u.user_metadata?.bitrix_id === parseInt(bitrix_id) || u.email === email
        )

        if (existingAuth) {
            authUserId = existingAuth.id
            console.log('Existing auth user found:', authUserId)
        } else {
            // Create new auth user
            const { data: newAuth, error: createError } = await supabase.auth.admin.createUser({
                email: email,
                email_confirm: true,
                password: `bitrix_${bitrix_id}_${Date.now()}`,
                user_metadata: {
                    bitrix_id: parseInt(bitrix_id),
                    full_name: fullName,
                },
            })

            if (createError) {
                console.error('Error creating auth user:', createError)
                return NextResponse.json(
                    { error: 'Erro ao criar usuário: ' + createError.message },
                    { status: 500 }
                )
            }

            authUserId = newAuth.user.id
            console.log('New auth user created:', authUserId)
        }

        // 4. Upsert collaborator in public table
        const { error: upsertError } = await supabase.from('collaborators').upsert(
            {
                id: authUserId,
                bitrix_id: parseInt(bitrix_id),
                full_name: fullName,
                email: email,
                position: bitrixUser.WORK_POSITION || null,
                status: 'ativo',
            },
            { onConflict: 'id' }
        )

        if (upsertError) {
            console.error('Error upserting collaborator:', upsertError)
            return NextResponse.json(
                { error: 'Erro ao sincronizar usuário: ' + upsertError.message },
                { status: 500 }
            )
        }

        // 5. Generate JWT token
        const token = jwt.sign(
            {
                aud: 'authenticated',
                role: 'authenticated',
                sub: authUserId,
                email: email,
                user_metadata: {
                    bitrix_id: parseInt(bitrix_id),
                    full_name: fullName,
                },
                exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24 hours
            },
            jwtSecret
        )

        return NextResponse.json({
            success: true,
            token,
            user: {
                id: authUserId,
                name: fullName,
                email: email,
                bitrix_id: parseInt(bitrix_id),
            }
        })

    } catch (error: any) {
        console.error('Bitrix auth error:', error)
        return NextResponse.json(
            { error: 'Erro na autenticação: ' + error.message },
            { status: 500 }
        )
    }
}
