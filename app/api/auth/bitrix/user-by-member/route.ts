import { NextRequest, NextResponse } from 'next/server'

// This route gets the current user ID from Bitrix using the member_id
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { member_id, domain } = body

        if (!member_id) {
            return NextResponse.json(
                { error: 'member_id é obrigatório' },
                { status: 400 }
            )
        }

        // Get environment variables
        const webhookDomain = process.env.BITRIX_DOMAIN
        const webhookToken = process.env.BITRIX_WEBHOOK_TOKEN
        const webhookUserId = process.env.BITRIX_WEBHOOK_USER_ID

        if (!webhookDomain || !webhookToken || !webhookUserId) {
            return NextResponse.json(
                { error: 'Bitrix webhook not configured' },
                { status: 500 }
            )
        }

        // The member_id from Bitrix is actually the portal/account ID, not the user ID
        // We need to get the current user from the portal
        // For local apps, the MEMBER_ID might be the user ID

        // Try to get user info - member_id might actually be user ID
        const bitrixUrl = `https://${webhookDomain}/rest/${webhookUserId}/${webhookToken}/user.get.json?ID=${member_id}`

        console.log('Getting user by member_id:', bitrixUrl)

        const bitrixResponse = await fetch(bitrixUrl)
        const bitrixData = await bitrixResponse.json()

        if (bitrixData.result && bitrixData.result.length > 0) {
            const user = bitrixData.result[0]
            return NextResponse.json({
                success: true,
                user_id: user.ID,
                name: `${user.NAME} ${user.LAST_NAME}`,
                email: user.EMAIL,
            })
        }

        // If not found by ID, return the member_id as user_id
        // (in some cases member_id IS the user_id)
        return NextResponse.json({
            success: true,
            user_id: member_id,
        })

    } catch (error: any) {
        console.error('Error getting user by member:', error)
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        )
    }
}
