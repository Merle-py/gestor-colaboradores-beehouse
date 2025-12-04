import type { Config } from 'tailwindcss'

const config: Config = {
    darkMode: 'class',
    content: [
        './app/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
        './lib/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#fffbef',
                    100: '#fff0c8',
                    200: '#ffe086',
                    300: '#ffcf47',
                    400: '#ffc01c',
                    500: '#f9b410', // Amarelo Beehouse Principal
                    600: '#db8e00',
                    700: '#ae6200',
                    800: '#8d4c08',
                    900: '#753e0e',
                    950: '#432002',
                    DEFAULT: '#f9b410',
                },
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
        },
    },
    plugins: [],
}

export default config