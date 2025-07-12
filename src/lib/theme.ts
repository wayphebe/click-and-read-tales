// Theme configuration for the children's storybook application
// Balancing professional quality with childlike charm

export const theme = {
  colors: {
    // Primary palette - soft but vibrant
    primary: {
      light: '#FFE5F0',  // Soft pink
      main: '#FF8DC7',   // Cheerful pink
      dark: '#FF5FA9',   // Deep pink
      contrast: '#FFFFFF' // White text
    },
    // Secondary palette - playful accents
    secondary: {
      light: '#E5F6FF',  // Soft blue
      main: '#8DDDFF',   // Sky blue
      dark: '#5FB4FF',   // Deep blue
      contrast: '#FFFFFF' // White text
    },
    // Accent colors for interactive elements
    accent: {
      yellow: '#FFD700',  // Golden star
      purple: '#B19CD9',  // Soft purple
      green: '#98FB98',   // Soft green
      orange: '#FFB347'   // Soft orange
    },
    // Background variations
    background: {
      main: '#FAFAFA',    // Clean white
      paper: '#FFFFFF',   // Pure white
      magical: 'linear-gradient(135deg, #FFE5F0 0%, #E5F6FF 100%)' // Magical gradient
    },
    // Text colors
    text: {
      primary: '#2C3E50',   // Soft black
      secondary: '#7F8C8D', // Medium gray
      disabled: '#BDC3C7'   // Light gray
    }
  },
  // Typography system
  typography: {
    fontFamily: {
      primary: '"Nunito", "PingFang SC", sans-serif',  // Round, friendly font
      decorative: '"Comic Neue", cursive'              // Playful font for accents
    },
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem' // 30px
    }
  },
  // Spacing system
  spacing: {
    xs: '0.25rem',  // 4px
    sm: '0.5rem',   // 8px
    md: '1rem',     // 16px
    lg: '1.5rem',   // 24px
    xl: '2rem',     // 32px
    '2xl': '2.5rem' // 40px
  },
  // Animation timings
  animation: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
    // Easing functions
    easing: {
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      smooth: 'cubic-bezier(0.4, 0, 0.2, 1)'
    }
  },
  // Shadows for depth
  shadows: {
    sm: '0 2px 4px rgba(0,0,0,0.05)',
    md: '0 4px 6px rgba(0,0,0,0.07)',
    lg: '0 10px 15px rgba(0,0,0,0.1)',
    magical: '0 8px 16px rgba(255,141,199,0.15)' // Special shadow for magical elements
  },
  // Border radiuses
  borderRadius: {
    sm: '0.375rem',  // 6px
    md: '0.5rem',    // 8px
    lg: '0.75rem',   // 12px
    xl: '1rem',      // 16px
    full: '9999px'   // Circular
  },
  // Special effects
  effects: {
    // Gradient backgrounds
    gradients: {
      magical: 'linear-gradient(135deg, #FF8DC7 0%, #8DDDFF 100%)',
      warm: 'linear-gradient(135deg, #FFB347 0%, #FF8DC7 100%)',
      cool: 'linear-gradient(135deg, #8DDDFF 0%, #98FB98 100%)'
    },
    // Hover transitions
    hover: {
      scale: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      glow: 'box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      color: 'color 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    }
  }
}; 