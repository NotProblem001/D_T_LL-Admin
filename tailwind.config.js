/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dtll: {
          // Paleta de marca DTLL (espejo de D_T_LL-Landing-Page/tailwind.config.js)
          blue: '#31547f',          // Azul Profundo - color estructural / primario
          blueDark: '#274465',      // Variante oscura para hover/active
          blueLight: '#e8eef5',     // Fondo suave para estados seleccionados
          turquoise: '#68dfd5',     // Turquesa
          orange: '#ed6f32',        // Naranjo - acento
          gold: '#ffc914',          // Oro Real
          lilac: '#ada8be',         // Lila Ceniza
          warmWhite: '#fafaf7',     // Blanco Cálido
          gray: '#6e6e6b',          // Gris Medio
          warmTurquoise: '#465b86', // Turquesa Cálido
        },
      },
      fontFamily: {
        sans: ['Questrial', 'system-ui', 'sans-serif'],
        display: ['Questrial', 'system-ui', 'sans-serif'],
        body: ['Questrial', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
