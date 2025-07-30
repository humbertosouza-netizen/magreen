// Script para forçar a scrollbar a aparecer no mobile
// Execute no console ou adicione no HTML

function forceMobileScrollbar() {
  console.log('🔧 Forçando scrollbar visível no mobile...');
  
  // Detectar se é mobile
  const isMobile = window.innerWidth <= 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  if (!isMobile) {
    console.log('📱 Não é mobile, scrollbar padrão aplicada');
    return;
  }
  
  console.log('📱 Mobile detectado, aplicando scrollbar forçada...');
  
  // Função para aplicar estilos de scrollbar
  function applyScrollbarStyles() {
    const style = document.createElement('style');
    style.id = 'mobile-scrollbar-force';
    
    // Remover estilo anterior se existir
    const existingStyle = document.getElementById('mobile-scrollbar-force');
    if (existingStyle) {
      existingStyle.remove();
    }
    
    style.textContent = `
      /* Forçar scrollbar no mobile */
      html, body {
        overflow: auto !important;
        scrollbar-width: thin !important;
        scrollbar-color: rgba(127, 219, 63, 0.8) rgba(0, 0, 0, 0.3) !important;
      }
      
      /* Webkit scrollbar customizada e forçada */
      *::-webkit-scrollbar {
        width: 16px !important;
        height: 16px !important;
        -webkit-appearance: none !important;
        display: block !important;
        background: rgba(0, 0, 0, 0.1) !important;
      }

      *::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.4) !important;
        border-radius: 8px !important;
        box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.3) !important;
        border: 2px solid rgba(127, 219, 63, 0.2) !important;
      }

      *::-webkit-scrollbar-thumb {
        background: linear-gradient(180deg, 
          rgba(127, 219, 63, 0.95) 0%, 
          rgba(77, 168, 218, 0.95) 100%) !important;
        border-radius: 8px !important;
        border: 2px solid rgba(0, 0, 0, 0.2) !important;
        box-shadow: 
          0 0 8px rgba(127, 219, 63, 0.5),
          inset 0 0 4px rgba(255, 255, 255, 0.2) !important;
        min-height: 30px !important;
        min-width: 30px !important;
      }
      
      *::-webkit-scrollbar-thumb:hover {
        background: linear-gradient(180deg, 
          rgba(127, 219, 63, 1) 0%, 
          rgba(77, 168, 218, 1) 100%) !important;
        box-shadow: 
          0 0 12px rgba(127, 219, 63, 0.7),
          inset 0 0 6px rgba(255, 255, 255, 0.3) !important;
      }
      
      *::-webkit-scrollbar-thumb:active {
        background: linear-gradient(180deg, 
          rgba(127, 219, 63, 1) 0%, 
          rgba(77, 168, 218, 1) 100%) !important;
        box-shadow: 
          0 0 16px rgba(127, 219, 63, 0.9),
          inset 0 0 8px rgba(255, 255, 255, 0.4) !important;
        transform: scale(1.1) !important;
      }
      
      /* Forçar elementos específicos */
      main, .main-container, .mobile-scroll-visible {
        overflow-y: scroll !important;
        -webkit-overflow-scrolling: touch !important;
        scrollbar-width: thin !important;
      }
      
      /* Garantir que containers do dashboard tenham scrollbar */
      .dashboard-container, [class*="dashboard"], [class*="cultivo"] {
        overflow-y: scroll !important;
        scrollbar-width: thin !important;
      }
      
      /* Estilo especial para touch devices */
      @media (pointer: coarse) {
        *::-webkit-scrollbar {
          width: 18px !important;
          height: 18px !important;
        }
        
        *::-webkit-scrollbar-thumb {
          min-height: 40px !important;
          min-width: 40px !important;
        }
      }
    `;
    
    document.head.appendChild(style);
    console.log('✅ Estilos de scrollbar móvel aplicados');
  }
  
  // Função para forçar overflow nos elementos
  function forceElementsOverflow() {
    const elements = [
      document.body,
      document.documentElement,
      ...document.querySelectorAll('main'),
      ...document.querySelectorAll('.main-container'),
      ...document.querySelectorAll('.mobile-scroll-visible'),
      ...document.querySelectorAll('[class*="dashboard"]'),
      ...document.querySelectorAll('[class*="cultivo"]')
    ];
    
    elements.forEach((el, index) => {
      if (el) {
        el.style.overflowY = 'scroll';
        el.style.webkitOverflowScrolling = 'touch';
        el.style.scrollbarWidth = 'thin';
        console.log(`📜 Elemento ${index + 1} configurado para scroll forçado`);
      }
    });
  }
  
  // Função para adicionar conteúdo de teste se necessário
  function addTestContentIfNeeded() {
    const bodyHeight = document.body.scrollHeight;
    const windowHeight = window.innerHeight;
    
    if (bodyHeight <= windowHeight + 100) {
      console.log('⚠️  Conteúdo pode ser insuficiente para scroll, adicionando indicador...');
      
      // Adicionar indicador de scroll no final da página
      const scrollIndicator = document.createElement('div');
      scrollIndicator.id = 'mobile-scroll-indicator';
      scrollIndicator.style.cssText = `
        position: fixed;
        bottom: 10px;
        right: 10px;
        width: 20px;
        height: 60px;
        background: linear-gradient(180deg, 
          rgba(127, 219, 63, 0.8) 0%, 
          rgba(77, 168, 218, 0.8) 100%);
        border-radius: 10px;
        border: 2px solid rgba(0, 0, 0, 0.3);
        box-shadow: 0 0 10px rgba(127, 219, 63, 0.5);
        z-index: 10000;
        animation: scrollPulse 2s infinite;
      `;
      
      // Adicionar animação CSS
      const animationStyle = document.createElement('style');
      animationStyle.textContent = `
        @keyframes scrollPulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.1); }
        }
      `;
      document.head.appendChild(animationStyle);
      
      document.body.appendChild(scrollIndicator);
      
      // Remover indicador após 10 segundos
      setTimeout(() => {
        if (scrollIndicator.parentNode) {
          scrollIndicator.remove();
          animationStyle.remove();
        }
      }, 10000);
      
      console.log('📍 Indicador de scrollbar adicionado');
    }
  }
  
  // Aplicar todas as correções
  applyScrollbarStyles();
  forceElementsOverflow();
  addTestContentIfNeeded();
  
  // Verificar resultado após um tempo
  setTimeout(() => {
    const hasScrollbar = document.body.scrollHeight > window.innerHeight;
    const scrollbarVisible = getComputedStyle(document.documentElement).scrollbarWidth !== 'none';
    
    console.log('📊 Resultado da aplicação:');
    console.log('- Conteúdo maior que viewport:', hasScrollbar);
    console.log('- Scrollbar width configurada:', getComputedStyle(document.documentElement).scrollbarWidth);
    console.log('- Overflow Y do body:', getComputedStyle(document.body).overflowY);
    
    if (hasScrollbar) {
      console.log('✅ Scrollbar deve estar visível agora!');
      console.log('💡 Tente fazer scroll para confirmar');
    } else {
      console.log('⚠️  Pode ser necessário mais conteúdo para ativar scroll');
    }
  }, 1000);
}

// Executar automaticamente quando o DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', forceMobileScrollbar);
} else {
  forceMobileScrollbar();
}

// Executar novamente quando a página for redimensionada
window.addEventListener('resize', () => {
  setTimeout(forceMobileScrollbar, 100);
});

// Disponibilizar função globalmente
window.forceMobileScrollbar = forceMobileScrollbar;

console.log('📱 Script de scrollbar mobile carregado. Use forceMobileScrollbar() para executar manualmente.'); 