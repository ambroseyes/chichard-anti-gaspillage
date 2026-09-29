/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
  	extend: {
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		colors: {
  			/*
  			 * Charte Chichard : violet + jaune (voir la charte graphique).
  			 * Le violet est décliné sur les échelles `emerald` et `teal` — les
  			 * deux couleurs de marque utilisées dans tout le code — pour que
  			 * l'ensemble de l'interface passe au violet sans toucher à la
  			 * structure des écrans. `gold` (jaune) et `grape` (violet profond)
  			 * sont les accents de la marque.
  			 */
  			emerald: {
  				50: '#F4F0FC', 100: '#E9E1F9', 200: '#D5C6F2', 300: '#B9A1E8',
  				400: '#9C7BDE', 500: '#835FD6', 600: '#7048C9', 700: '#5D39A8',
  				800: '#4C2E88', 900: '#3F276E', 950: '#2A1A4D',
  			},
  			teal: {
  				50: '#F3F0FD', 100: '#E7E0FB', 200: '#CEC0F5', 300: '#AE9BEC',
  				400: '#8E6BE3', 500: '#7C56DB', 600: '#6C44CC', 700: '#5836AA',
  				800: '#472C88', 900: '#3A256D', 950: '#26184A',
  			},
  			gold: {
  				50: '#FFFDE6', 100: '#FFFAB8', 200: '#FFF680', 300: '#FFF24D',
  				400: '#FFED00', 500: '#EAD400', 600: '#C7B200', 700: '#9E8C00',
  				800: '#7A6C00', 900: '#5C5100',
  			},
  			grape: {
  				DEFAULT: '#440E6E', 600: '#652B93', 700: '#551F7F',
  				800: '#481672', 900: '#440E6E',
  			},
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}