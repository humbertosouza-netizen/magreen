const themes = {
  light: {
    colors: {
      primary: '#7FDB3F', // Verde principal MagnifiGreen
      primaryDark: '#6ABF2E', // Verde mais escuro para contrastes
      primaryLight: '#A1E670', // Verde mais claro para fundos e elementos sutis
      accent: '#4DA8DA', // Azul tecnológico para elementos de destaque
      accentDark: '#3589B9', // Azul mais escuro
      accentLight: '#7FC1E6', // Azul mais claro
      success: '#48BB78', // Verde para feedback positivo
      warning: '#F6AD55', // Laranja para alertas
      error: '#F56565', // Vermelho para erros
      info: '#63B3ED', // Azul informativo
      background: '#F7FAFC', // Fundo claro principal
      backgroundLight: '#FFFFFF', // Fundo branco para cards e componentes
      backgroundDark: '#EDF2F7', // Fundo cinza claro para elementos alternados
      surface: '#FFFFFF', // Superfícies de componentes
      surfaceHover: '#F9FAFB', // Estado hover de superfícies
      textPrimary: '#2D3748', // Texto principal
      textSecondary: '#718096', // Texto secundário/subtítulos
      textTertiary: '#A0AEC0', // Texto desabilitado/placeholder
      border: '#E2E8F0', // Bordas padrão
      borderLight: '#EDF2F7', // Bordas sutis
      borderDark: '#CBD5E0', // Bordas com mais contraste
      divider: '#E2E8F0', // Divisor de conteúdo
      focusRing: 'rgba(127, 219, 63, 0.5)', // Anel de foco em elementos interativos
      overlay: 'rgba(45, 55, 72, 0.7)', // Sobreposição para modais
      gradient: {
        primary: 'linear-gradient(135deg, #7FDB3F, #6ABF2E)', // Gradiente primário
        accent: 'linear-gradient(135deg, #4DA8DA, #3589B9)', // Gradiente de destaque
        success: 'linear-gradient(135deg, #68D391, #48BB78)', // Gradiente de sucesso
        warning: 'linear-gradient(135deg, #FBD38D, #F6AD55)', // Gradiente de aviso
        error: 'linear-gradient(135deg, #FC8181, #F56565)', // Gradiente de erro
        primaryToAccent: 'linear-gradient(135deg, #7FDB3F, #4DA8DA)', // Gradiente da marca
        glass: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.7))' // Efeito vidro
      }
    },
    shadows: {
      sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
      outline: '0 0 0 3px rgba(127, 219, 63, 0.5)',
      none: 'none',
      // Sombras orgânicas com toque natural
      leaf: '0 10px 15px -3px rgba(127, 219, 63, 0.15), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      water: '0 10px 15px -3px rgba(77, 168, 218, 0.15), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
    },
    typography: {
      fontFamily: {
        heading: 'Inter, system-ui, sans-serif',
        body: 'Inter, system-ui, sans-serif',
        mono: 'SFMono-Regular, Menlo, monospace'
      },
      fontWeight: {
        regular: 400,
        medium: 500,
        semiBold: 600,
        bold: 700
      },
      fontSize: {
        xs: '0.75rem',
        sm: '0.875rem',
        md: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
        '4xl': '2.25rem',
        '5xl': '3rem',
        '6xl': '4rem'
      },
      lineHeight: {
        none: 1,
        tight: 1.25,
        snug: 1.375,
        normal: 1.5,
        relaxed: 1.625,
        loose: 2
      }
    },
    transitions: {
      fast: 'all 0.2s ease',
      medium: 'all 0.3s ease',
      slow: 'all 0.5s ease'
    },
    borderRadius: {
      none: '0',
      sm: '0.125rem',
      md: '0.375rem',
      lg: '0.5rem',
      xl: '0.75rem',
      '2xl': '1rem',
      '3xl': '1.5rem',
      full: '9999px'
    }
  },
  dark: {
    colors: {
      primary: '#7FDB3F', // Verde principal MagnifiGreen
      primaryDark: '#6ABF2E', // Verde mais escuro
      primaryLight: '#A1E670', // Verde mais claro para destaque
      accent: '#4DA8DA', // Azul tecnológico
      accentDark: '#3589B9', // Azul mais escuro
      accentLight: '#7FC1E6', // Azul mais claro
      success: '#48BB78', // Verde para feedback positivo
      warning: '#F6AD55', // Laranja para alertas
      error: '#F56565', // Vermelho para erros
      info: '#63B3ED', // Azul informativo
      background: '#171923', // Fundo escuro principal
      backgroundLight: '#2D3748', // Fundo escuro secundário para cards
      backgroundDark: '#121212', // Fundo mais escuro para elementos alternados
      surface: '#1A202C', // Superfícies de componentes
      surfaceHover: '#2D3748', // Estado hover de superfícies
      textPrimary: '#F7FAFC', // Texto principal
      textSecondary: '#CBD5E0', // Texto secundário/subtítulos
      textTertiary: '#718096', // Texto desabilitado/placeholder
      border: '#2D3748', // Bordas padrão
      borderLight: '#252D3D', // Bordas sutis
      borderDark: '#4A5568', // Bordas com mais contraste
      divider: '#2D3748', // Divisor de conteúdo
      focusRing: 'rgba(127, 219, 63, 0.5)', // Anel de foco em elementos interativos
      overlay: 'rgba(0, 0, 0, 0.75)', // Sobreposição para modais
      gradient: {
        primary: 'linear-gradient(135deg, #7FDB3F, #6ABF2E)', // Gradiente primário
        accent: 'linear-gradient(135deg, #4DA8DA, #3589B9)', // Gradiente de destaque
        success: 'linear-gradient(135deg, #68D391, #48BB78)', // Gradiente de sucesso
        warning: 'linear-gradient(135deg, #FBD38D, #F6AD55)', // Gradiente de aviso
        error: 'linear-gradient(135deg, #FC8181, #F56565)', // Gradiente de erro
        primaryToAccent: 'linear-gradient(135deg, #7FDB3F, #4DA8DA)', // Gradiente da marca
        glass: 'linear-gradient(135deg, rgba(26, 32, 44, 0.9), rgba(26, 32, 44, 0.7))' // Efeito vidro escuro
      }
    },
    shadows: {
      sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      md: '0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -1px rgba(0, 0, 0, 0.16)',
      lg: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.15)',
      xl: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.14)',
      inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.16)',
      outline: '0 0 0 3px rgba(127, 219, 63, 0.5)',
      none: 'none',
      // Sombras orgânicas com toque natural
      leaf: '0 10px 15px -3px rgba(127, 219, 63, 0.15), 0 4px 6px -2px rgba(0, 0, 0, 0.15)',
      water: '0 10px 15px -3px rgba(77, 168, 218, 0.15), 0 4px 6px -2px rgba(0, 0, 0, 0.15)'
    },
    typography: {
      fontFamily: {
        heading: 'Inter, system-ui, sans-serif',
        body: 'Inter, system-ui, sans-serif',
        mono: 'SFMono-Regular, Menlo, monospace'
      },
      fontWeight: {
        regular: 400,
        medium: 500,
        semiBold: 600,
        bold: 700
      },
      fontSize: {
        xs: '0.75rem',
        sm: '0.875rem',
        md: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
        '4xl': '2.25rem',
        '5xl': '3rem',
        '6xl': '4rem'
      },
      lineHeight: {
        none: 1,
        tight: 1.25,
        snug: 1.375,
        normal: 1.5,
        relaxed: 1.625,
        loose: 2
      }
    },
    transitions: {
      fast: 'all 0.2s ease',
      medium: 'all 0.3s ease',
      slow: 'all 0.5s ease'
    },
    borderRadius: {
      none: '0',
      sm: '0.125rem',
      md: '0.375rem',
      lg: '0.5rem',
      xl: '0.75rem',
      '2xl': '1rem',
      '3xl': '1.5rem',
      full: '9999px'
    }
  }
};

export default themes;

// Constantes de cores para uso individual
export const colors = {
  green: '#7FDB3F',
  darkGreen: '#6ABF2E',
  lightGreen: '#A1E670',
  greenDark: '#6ABF2E',
  greenLight: '#A1E670',
  blue: '#4DA8DA',
  darkBlue: '#3589B9',
  lightBlue: '#7FC1E6',
  purple: '#805AD5',
  darkPurple: '#6B46C1',
  lightPurple: '#D6BCFA',
  yellow: '#F6E05E',
  darkYellow: '#ECC94B',
  lightYellow: '#FAF089',
  orange: '#ED8936',
  darkOrange: '#DD6B20',
  lightOrange: '#FBD38D',
  red: '#F56565',
  darkRed: '#E53E3E',
  lightRed: '#FC8181',
  gray: '#718096',
  darkGray: '#4A5568',
  lightGray: '#CBD5E0',
  black: '#121212',
  white: '#FFFFFF',
  transparentGreen: 'rgba(127, 219, 63, 0.1)',
  transparentBlue: 'rgba(77, 168, 218, 0.1)'
}; 