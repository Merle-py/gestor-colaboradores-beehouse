/**
 * Utility functions for input masks and validations
 */

// CPF mask: XXX.XXX.XXX-XX
export function maskCPF(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 11)
    return digits
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

// RG mask: XX.XXX.XXX-X (format varies by state, using common format)
export function maskRG(value: string): string {
    const chars = value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 9).toUpperCase()
    return chars
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})([a-zA-Z0-9]{1})$/, '$1-$2')
}

// Phone mask: (XX) XXXXX-XXXX or (XX) XXXX-XXXX
export function maskPhone(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 11)
    if (digits.length <= 10) {
        return digits
            .replace(/(\d{2})(\d)/, '($1) $2')
            .replace(/(\d{4})(\d)/, '$1-$2')
    }
    return digits
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2')
}

// CEP mask: XXXXX-XXX
export function maskCEP(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 8)
    return digits.replace(/(\d{5})(\d)/, '$1-$2')
}

// Bank agency: max 4 digits with optional dash
export function maskBankAgency(value: string): string {
    const chars = value.replace(/[^0-9X]/gi, '').slice(0, 5).toUpperCase()
    if (chars.length > 4) {
        return chars.slice(0, 4) + '-' + chars.slice(4)
    }
    return chars.slice(0, 4)
}

// Bank account: digits with dash before last digit
export function maskBankAccount(value: string): string {
    const chars = value.replace(/[^0-9X]/gi, '').slice(0, 12).toUpperCase()
    if (chars.length > 1) {
        return chars.slice(0, -1) + '-' + chars.slice(-1)
    }
    return chars
}

// Currency mask: R$ X.XXX,XX
export function maskCurrency(value: string): string {
    const digits = value.replace(/\D/g, '')
    const num = parseInt(digits || '0', 10) / 100
    return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// Remove mask, keep only digits
export function unmask(value: string): string {
    return value.replace(/\D/g, '')
}

// Remove mask, keep alphanumeric
export function unmaskAlphanumeric(value: string): string {
    return value.replace(/[^a-zA-Z0-9]/g, '')
}

// Validate date range (end >= start)
export function validateDateRange(startDate: string, endDate: string): boolean {
    if (!startDate || !endDate) return true
    return new Date(endDate) >= new Date(startDate)
}

// Get min date for end date input (should be >= start date)
export function getMinEndDate(startDate: string): string {
    return startDate || ''
}
