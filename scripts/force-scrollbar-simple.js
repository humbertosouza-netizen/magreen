// Script SIMPLES para forçar scrollbar no mobile
// Cole este código no console do navegador (F12 → Console)

console.log('🔧 FORÇANDO SCROLLBAR MÓVEL - VERSÃO SIMPLES');

// Aplicar CSS diretamente
const style = document.createElement('style');
style.id = 'force-mobile-scrollbar-NOW';
style.innerHTML = `
/* FORÇAR SCROLLBAR IMEDIATAMENTE */
html, body {
  overflow: auto !important;
  scrollbar-width: thin !important;
  scrollbar-color: rgba(127, 219, 63, 0.9) rgba(0, 0, 0, 0.5) !important;
  -webkit-overflow-scrolling: touch !important;
}

/* Scrollbar SUPER visível */
*::-webkit-scrollbar {
  width: 20px !important;
  height: 20px !important;
  -webkit-appearance: none !important;
  display: block !important;
  background: rgba(0, 0, 0, 0.4) !important;
}

*::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.6) !important;
  border-radius: 10px !important;
  border: 3px solid rgba(127, 219, 63, 0.4) !important;
  box-shadow: inset 0 0 15px rgba(0, 0, 0, 0.5) !important;
}

*::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, 
    #7FDB3F 0%, 
    #4DA8DA 50%,
    #7FDB3F 100%) !important;
  border-radius: 10px !important;
  border: 3px solid rgba(255, 255, 255, 0.3) !important;
  box-shadow: 
    0 0 20px rgba(127, 219, 63, 0.8),
    inset 0 0 10px rgba(255, 255, 255, 0.4) !important;
  min-height: 40px !important;
  min-width: 40px !important;
}

*::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, 
    #7FDB3F 0%, 
    #4DA8DA 50%,
    #7FDB3F 100%) !important;
  box-shadow: 
    0 0 25px rgba(127, 219, 63, 1),
    inset 0 0 15px rgba(255, 255, 255, 0.5) !important;
  transform: scale(1.1) !important;
}

/* Forçar overflow em TODOS os elementos importantes */
html, body, main, div, section, article {
  overflow-y: auto !important;
}

/* Casos específicos do dashboard */
.main-container, .mobile-scroll-visible,
[class*="dashboard"], [class*="estudos"], [class*="cultivo"] {
  overflow-y: auto !important;
  scrollbar-width: thin !important;
}
`;

// Remover estilo anterior se existir
const existing = document.getElementById('force-mobile-scrollbar-NOW');
if (existing) existing.remove();

// Adicionar novo estilo
document.head.appendChild(style);

// Forçar overflow nos elementos principais
const elements = [
  document.documentElement,
  document.body,
  ...document.querySelectorAll('main'),
  ...document.querySelectorAll('div'),
  ...document.querySelectorAll('.main-container'),
  ...document.querySelectorAll('[class*="dashboard"]'),
  ...document.querySelectorAll('[class*="estudos"]')
];

elements.forEach((el, i) => {
  if (el) {
    el.style.overflowY = 'auto';
    el.style.webkitOverflowScrolling = 'touch';
    el.style.scrollbarWidth = 'thin';
    if (i < 10) console.log(`✅ Elemento ${i + 1} configurado:`, el.tagName, el.className);
  }
});

// Adicionar indicador visual temporário
const indicator = document.createElement('div');
indicator.style.cssText = `
  position: fixed;
  top: 50%;
  right: 10px;
  width: 25px;
  height: 100px;
  background: linear-gradient(180deg, #7FDB3F, #4DA8DA);
  border-radius: 12px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 0 20px rgba(127, 219, 63, 0.8);
  z-index: 999999;
  animation: scrollbarPulse 2s infinite;
`;

const animation = document.createElement('style');
animation.innerHTML = `
@keyframes scrollbarPulse {
  0%, 100% { opacity: 0.7; transform: translateY(-50%) scale(1); }
  50% { opacity: 1; transform: translateY(-50%) scale(1.1); }
}
`;

document.head.appendChild(animation);
document.body.appendChild(indicator);

// Remover indicador após 5 segundos
setTimeout(() => {
  if (indicator.parentNode) indicator.remove();
  if (animation.parentNode) animation.remove();
}, 5000);

console.log('🎉 SCROLLBAR FORÇADA APLICADA!');
console.log('📱 Procure por uma barra verde/azul na lateral direita');
console.log('🔍 Verifique se consegue fazer scroll agora');

// Teste de scroll
const originalScrollY = window.scrollY;
window.scrollTo(0, 50);
setTimeout(() => {
  const scrollWorking = window.scrollY !== originalScrollY;
  console.log('🧪 Teste de scroll:', scrollWorking ? '✅ FUNCIONANDO' : '❌ NÃO FUNCIONOU');
  window.scrollTo(0, originalScrollY);
}, 500);

// Informações de debug
console.log('📊 INFO:');
console.log('- Viewport:', window.innerWidth + 'x' + window.innerHeight);
console.log('- Scroll height:', document.body.scrollHeight);
console.log('- Overflow Y (body):', getComputedStyle(document.body).overflowY);
console.log('- Scrollbar width:', getComputedStyle(document.body).scrollbarWidth); 