import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'sm': '768px',    // Tablet
				'md': '1024px',   // Laptop  
				'lg': '1400px',   // Large Desktop
				'xl': '1920px',   // Full HD (primary target)
				'2xl': '1920px'   // Keep existing 2xl for compatibility
			}
		},
		screens: {
			'mobile': '375px',   // Mobile (375×667) - Condensed experience
			'tablet': '768px',   // Tablet (768×1024) - Touch-optimized layout
			'laptop': '1024px',  // Laptop (1366×768) - Secondary optimization  
			'desktop': '1400px', // Desktop - Large displays
			'fullhd': '1920px',  // Full HD (1920×1080) - Primary target
			// Standard Tailwind breakpoints for compatibility
			'sm': '640px',
			'md': '768px',
			'lg': '1024px',
			'xl': '1280px',
			'2xl': '1536px',
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
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
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
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
			},
			padding: {
				'safe-top': 'env(safe-area-inset-top)',
				'safe-bottom': 'env(safe-area-inset-bottom)',
				'safe-left': 'env(safe-area-inset-left)',
				'safe-right': 'env(safe-area-inset-right)',
			},
			// Responsive spacing system
			spacing: {
				'mobile': '0.75rem',   // 12px for mobile
				'tablet': '1rem',      // 16px for tablet
				'laptop': '1.5rem',    // 24px for laptop
				'desktop': '2rem',     // 32px for desktop
			},
			// Responsive font sizes optimized for each breakpoint
			fontSize: {
				'mobile-xs': ['0.75rem', { lineHeight: '1rem' }],
				'mobile-sm': ['0.875rem', { lineHeight: '1.25rem' }],
				'mobile-base': ['1rem', { lineHeight: '1.5rem' }],
				'laptop-sm': ['0.875rem', { lineHeight: '1.25rem' }],
				'laptop-base': ['1rem', { lineHeight: '1.5rem' }],
				'laptop-lg': ['1.125rem', { lineHeight: '1.75rem' }],
				'desktop-base': ['1.125rem', { lineHeight: '1.75rem' }],
				'desktop-lg': ['1.25rem', { lineHeight: '1.75rem' }],
				'desktop-xl': ['1.5rem', { lineHeight: '2rem' }],
			},
		}
	},
	plugins: [
		require("tailwindcss-animate"),
		function({ addUtilities }) {
			const newUtilities = {
				'.pt-safe': {
					paddingTop: 'env(safe-area-inset-top, 0px)'
				},
				'.pb-safe': {
					paddingBottom: 'env(safe-area-inset-bottom, 0px)'
				},
				'.pl-safe': {
					paddingLeft: 'env(safe-area-inset-left, 0px)'
				},
				'.pr-safe': {
					paddingRight: 'env(safe-area-inset-right, 0px)'
				},
				'.px-safe': {
					paddingLeft: 'env(safe-area-inset-left, 0px)',
					paddingRight: 'env(safe-area-inset-right, 0px)'
				},
				// Responsive layout utilities
				'.layout-mobile': {
					padding: '0.75rem',
					fontSize: '0.875rem',
				},
				'.layout-tablet': {
					padding: '1rem',
					fontSize: '1rem',
				},
				'.layout-laptop': {
					padding: '1.5rem',
					fontSize: '1rem',
				},
				'.layout-desktop': {
					padding: '2rem',
					fontSize: '1.125rem',
					maxWidth: '1920px',
					margin: '0 auto',
				},
				// Overflow prevention utilities
				'.overflow-safe': {
					overflowX: 'hidden',
					overflowY: 'auto',
				},
				'.content-center': {
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					width: '100%',
					maxWidth: '1200px',
					margin: '0 auto',
				},
			};
			addUtilities(newUtilities);
		}
	],
} satisfies Config;

