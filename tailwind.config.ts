import type { Config } from 'tailwindcss'

export default <Config>{
    content: [],
    theme: {
        extend: {
            colors: {
                // Aqui definimos que a cor 'primary' do sistema É o amarelo da Beehouse
                primary: {
                    50: '#fffbef',
                    100: '#fff0c8',
                    200: '#ffe086',
                    300: '#ffcf47',
                    400: '#ffc01c',
                    500: '#f9b410', // <--- Sua cor principal (#f9b410)
                    600: '#db8e00',
                    700: '#ae6200',
                    800: '#8d4c08',
                    900: '#753e0e',
                    950: '#432002',
                    DEFAULT: '#f9b410' // Garante que bg-primary funcione sem número
                },
                // Definimos o cinza padrão como Zinc (mais frio/moderno para dark mode)
                gray: {
                    50: '#fafafa',
                    100: '#f4f4f5',
                    200: '#e4e4e7',
                    300: '#d4d4d8',
                    400: '#a1a1aa',
                    500: '#71717a',
                    600: '#52525b',
                    700: '#3f3f46',
                    800: '#27272a',
                    900: '#18181b',
                    950: '#09090b',
                    DEFAULT: '#71717a'
                }
            }
        }
    }
}