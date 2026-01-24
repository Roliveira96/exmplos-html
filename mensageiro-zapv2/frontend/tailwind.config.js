/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#f0f7ff',
                    100: '#e0effe',
                    200: '#bae0fd',
                    300: '#7cc8fb',
                    400: '#36abf7',
                    500: '#0c8fcf', // Deep Blue
                    600: '#006aff', // Vibrant Blue
                    700: '#005edb',
                    800: '#004eb3',
                    900: '#004192',
                },
                chat: {
                    bg: '#F8FAFC',
                    bubble: '#FFFFFF',
                    out: '#006AFF',
                    sidebar: '#FFFFFF',
                }
            },
            backgroundImage: {
                'wave-pattern': "url('https://www.transparenttextures.com/patterns/cubes.png')",
            }
        },
    },
    plugins: [],
}
