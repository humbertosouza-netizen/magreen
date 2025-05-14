/**
 * Tema Magnificência Green
 * Baseado na estética de floresta mística + estrutura maia digital
 */

const theme = {
  colors: {
    // Cores principais
    background: '#332131',      // Roxo escuro (fundo principal)
    surface: '#1C3C25',         // Verde floresta (blocos internos)
    primary: '#7FDB3F',         // Verde limão (ações e botões)
    textPrimary: '#F2F2F2',     // Branco gelo (texto principal)
    textSecondary: '#B4D7A7',   // Verde opaco (texto secundário)
    accent: '#F8CC3C',          // Amarelo ouro (destaques/hover)
    
    // Cores auxiliares
    success: '#3AD16B',         // Verde sucesso
    warning: '#F8CC3C',         // Amarelo alerta 
    error: '#E63946',           // Vermelho erro
    info: '#90E0EF',            // Azul informação
    
    // Variações
    backgroundLight: '#4A3147',  // Versão mais clara do background
    backgroundDark: '#251724',   // Versão mais escura do background
    primaryLight: '#A1E969',     // Verde limão mais claro
    primaryDark: '#5CA626',      // Verde limão mais escuro
    accentLight: '#FFE17D',      // Amarelo ouro mais claro
    accentDark: '#D9A322',       // Amarelo ouro mais escuro
  },
  
  // Bordas e espaçamentos
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px',
  },
  
  // Bordas
  border: {
    radius: {
      sm: '4px',
      md: '8px',
      lg: '12px',
      xl: '16px',
      card: '12px',
      button: '8px',
      circle: '50%',
    },
    width: {
      thin: '1px',
      regular: '2px',
      thick: '3px',
      highlight: '4px',
    }
  },
  
  // Sombras
  shadows: {
    sm: '0 2px 4px rgba(0, 0, 0, 0.1)',
    md: '0 4px 8px rgba(0, 0, 0, 0.12)',
    lg: '0 8px 16px rgba(0, 0, 0, 0.14)',
    xl: '0 12px 24px rgba(0, 0, 0, 0.16)',
    inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)',
    glow: '0 0 8px rgba(127, 219, 63, 0.6)',
    accentGlow: '0 0 8px rgba(248, 204, 60, 0.6)',
  },
  
  // Tipografia
  typography: {
    fontFamily: {
      heading: '"Poppins", sans-serif',
      body: '"Inter", "Roboto", sans-serif',
    },
    fontWeight: {
      regular: 400,
      medium: 500,
      semiBold: 600,
      bold: 700,
    },
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      md: '1rem',       // 16px
      lg: '1.25rem',    // 20px
      xl: '1.5rem',     // 24px
      xxl: '2rem',      // 32px
      xxxl: '2.5rem',   // 40px
    },
  },
  
  // Transições
  transitions: {
    fast: '0.15s ease',
    medium: '0.3s ease',
    slow: '0.5s ease',
    bounce: '0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  },
  
  // Z-index
  zIndex: {
    base: 1,
    dropdown: 10,
    sticky: 100,
    fixed: 200,
    modal: 300,
    popover: 400,
    tooltip: 500,
  },
};

// Exportar classes de utilidade
export const greenVariant = {
  regular: {
    color: theme.colors.primary,
    letterSpacing: '0.1em',
    fontWeight: theme.typography.fontWeight.bold,
  },
  large: {
    color: theme.colors.primary,
    letterSpacing: '0.15em',
    fontWeight: theme.typography.fontWeight.bold,
    fontSize: theme.typography.fontSize.xl,
  }
};

export default theme; 