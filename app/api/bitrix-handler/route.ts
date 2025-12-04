import { NextRequest, NextResponse } from 'next/server'

// Bitrix24 sends a POST request when loading the app in iframe
// This route handles that and redirects to the login page with params
export async function POST(request: NextRequest) {
    try {
        // Get form data from Bitrix
        const formData = await request.formData()

        // Extract Bitrix parameters
        const params = new URLSearchParams()
        formData.forEach((value, key) => {
            params.append(key, value.toString())
        })

        // Redirect to login page with Bitrix parameters
        const loginUrl = new URL('/login', request.url)
        loginUrl.search = params.toString()

        return NextResponse.redirect(loginUrl, { status: 303 })
    } catch (error) {
        // If form data parsing fails, try JSON
        try {
            const body = await request.json()
            const params = new URLSearchParams(body)
            const loginUrl = new URL('/login', request.url)
            loginUrl.search = params.toString()
            return NextResponse.redirect(loginUrl, { status: 303 })
        } catch {
            // Fallback: just redirect to login
            return NextResponse.redirect(new URL('/login', request.url), { status: 303 })
        }
    }
}

export async function GET(request: NextRequest) {
    // For GET requests, just redirect to login with any query params
    const loginUrl = new URL('/login', request.url)
    loginUrl.search = request.nextUrl.search
    return NextResponse.redirect(loginUrl, { status: 303 })
}
