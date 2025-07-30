// Script para diagnosticar problemas de scroll no mobile
// Execute no console do navegador em qualquer página

function testMobileScroll() {
  console.log('📱 Diagnóstico de Scroll Mobile - MagnifiGreen');
  console.log('================================================');
  
  // Informações básicas do viewport
  const viewport = {
    width: window.innerWidth,
    height: window.innerHeight,
    devicePixelRatio: window.devicePixelRatio,
    userAgent: navigator.userAgent,
    isMobile: window.innerWidth <= 768
  };
  
  console.log('\n📊 Informações do Viewport:');
  console.log('Largura:', viewport.width);
  console.log('Altura:', viewport.height);
  console.log('Device Pixel Ratio:', viewport.devicePixelRatio);
  console.log('É Mobile:', viewport.isMobile);
  
  // Verificar elementos body e html
  const body = document.body;
  const html = document.documentElement;
  
  console.log('\n🔍 Estilos de Overflow:');
  
  // Função para obter estilos computados
  function getOverflowStyles(element, name) {
    const computed = window.getComputedStyle(element);
    console.log(`${name}:`);
    console.log('  - overflow:', computed.overflow);
    console.log('  - overflow-x:', computed.overflowX);
    console.log('  - overflow-y:', computed.overflowY);
    console.log('  - height:', computed.height);
    console.log('  - max-height:', computed.maxHeight);
    console.log('  - position:', computed.position);
  }
  
  getOverflowStyles(html, 'HTML');
  getOverflowStyles(body, 'BODY');
  
  // Verificar altura do conteúdo
  console.log('\n📏 Dimensões do Conteúdo:');
  console.log('body.scrollHeight:', body.scrollHeight);
  console.log('body.clientHeight:', body.clientHeight);
  console.log('body.offsetHeight:', body.offsetHeight);
  console.log('html.scrollHeight:', html.scrollHeight);
  console.log('html.clientHeight:', html.clientHeight);
  console.log('document.documentElement.scrollHeight:', document.documentElement.scrollHeight);
  
  // Verificar scroll atual
  console.log('\n📜 Posição de Scroll:');
  console.log('window.scrollY:', window.scrollY);
  console.log('window.pageYOffset:', window.pageYOffset);
  console.log('document.documentElement.scrollTop:', document.documentElement.scrollTop);
  console.log('document.body.scrollTop:', document.body.scrollTop);
  
  // Testar capacidade de scroll
  console.log('\n🧪 Teste de Capacidade de Scroll:');
  const originalScrollY = window.scrollY;
  
  // Tentar scrollar para baixo
  window.scrollTo(0, 100);
  setTimeout(() => {
    const newScrollY = window.scrollY;
    console.log('Scroll original:', originalScrollY);
    console.log('Após scroll(0, 100):', newScrollY);
    console.log('Scroll funcionando:', newScrollY !== originalScrollY);
    
    // Restaurar posição original
    window.scrollTo(0, originalScrollY);
    
    // Verificar elementos com overflow
    console.log('\n🔍 Elementos com Overflow Detectados:');
    
    const elementsWithOverflow = Array.from(document.querySelectorAll('*')).filter(el => {
      const computed = window.getComputedStyle(el);
      return computed.overflow === 'hidden' || 
             computed.overflowY === 'hidden' || 
             computed.overflowX === 'hidden';
    });
    
    if (elementsWithOverflow.length > 0) {
      console.log(`Encontrados ${elementsWithOverflow.length} elementos com overflow hidden:`);
      elementsWithOverflow.slice(0, 10).forEach((el, index) => {
        const computed = window.getComputedStyle(el);
        console.log(`${index + 1}. ${el.tagName}.${el.className}:`, {
          overflow: computed.overflow,
          overflowX: computed.overflowX,
          overflowY: computed.overflowY,
          height: computed.height,
          position: computed.position
        });
      });
      
      if (elementsWithOverflow.length > 10) {
        console.log(`... e mais ${elementsWithOverflow.length - 10} elementos`);
      }
    } else {
      console.log('✅ Nenhum elemento problemático encontrado');
    }
    
    // Verificar elementos fixos que podem cobrir a tela
    console.log('\n📌 Elementos com Position Fixed:');
    
    const fixedElements = Array.from(document.querySelectorAll('*')).filter(el => {
      const computed = window.getComputedStyle(el);
      return computed.position === 'fixed';
    });
    
    if (fixedElements.length > 0) {
      console.log(`Encontrados ${fixedElements.length} elementos fixos:`);
      fixedElements.forEach((el, index) => {
        const computed = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        console.log(`${index + 1}. ${el.tagName}.${el.className}:`, {
          top: computed.top,
          bottom: computed.bottom,
          left: computed.left,
          right: computed.right,
          zIndex: computed.zIndex,
          width: rect.width,
          height: rect.height
        });
      });
    } else {
      console.log('✅ Nenhum elemento fixed encontrado');
    }
    
    // Verificar se há estilos CSS problemáticos
    console.log('\n🎨 Verificação de CSS Problemático:');
    
    // Verificar se há estilos inline problemáticos
    if (body.style.overflow || body.style.overflowY) {
      console.log('⚠️  Body tem estilos inline de overflow:', {
        overflow: body.style.overflow,
        overflowY: body.style.overflowY,
        overflowX: body.style.overflowX
      });
    }
    
    if (html.style.overflow || html.style.overflowY) {
      console.log('⚠️  HTML tem estilos inline de overflow:', {
        overflow: html.style.overflow,
        overflowY: html.style.overflowY,
        overflowX: html.style.overflowX
      });
    }
    
    // Dicas de solução
    console.log('\n💡 Dicas para Solucionar:');
    
    if (body.scrollHeight <= body.clientHeight) {
      console.log('⚠️  O conteúdo pode ser menor que a viewport');
      console.log('   - Adicione mais conteúdo ou aumente min-height');
    }
    
    if (newScrollY === originalScrollY && body.scrollHeight > body.clientHeight) {
      console.log('❌ Scroll não está funcionando apesar de haver conteúdo');
      console.log('   - Verifique overflow: hidden no body/html');
      console.log('   - Verifique elementos fixed cobrindo a tela');
      console.log('   - Verifique height: 100vh sem overflow-y: auto');
    }
    
    if (viewport.isMobile) {
      console.log('📱 Dicas específicas para mobile:');
      console.log('   - Adicione -webkit-overflow-scrolling: touch');
      console.log('   - Evite overflow: hidden no body');
      console.log('   - Use overflow-y: auto explicitamente');
      console.log('   - Verifique se há elementos fixos cobrindo');
    }
    
  }, 100);
}

// Função adicional para forçar scroll de teste
function forceTestScroll() {
  console.log('\n🚀 Teste Forçado de Scroll:');
  
  // Criar elemento temporário grande para forçar scroll
  const testDiv = document.createElement('div');
  testDiv.id = 'scroll-test-element';
  testDiv.style.cssText = `
    height: 200vh;
    width: 100%;
    background: linear-gradient(to bottom, 
      rgba(127, 219, 63, 0.1) 0%, 
      rgba(127, 219, 63, 0.05) 50%, 
      rgba(127, 219, 63, 0.1) 100%);
    position: relative;
    z-index: 1;
    pointer-events: none;
  `;
  testDiv.innerHTML = `
    <div style="
      position: absolute; 
      top: 50%; 
      left: 50%; 
      transform: translate(-50%, -50%);
      color: rgba(127, 219, 63, 0.7);
      font-size: 24px;
      text-align: center;
      font-weight: bold;
    ">
      TESTE DE SCROLL<br>
      <small style="font-size: 16px;">Se você consegue ver isto no meio da tela, o scroll está funcionando</small><br>
      <button onclick="removeScrollTest()" style="
        margin-top: 20px;
        padding: 10px 20px;
        background: rgba(127, 219, 63, 0.8);
        color: #121212;
        border: none;
        border-radius: 5px;
        font-weight: bold;
        pointer-events: auto;
        cursor: pointer;
      ">Remover Teste</button>
    </div>
  `;
  
  document.body.appendChild(testDiv);
  
  // Função global para remover o teste
  window.removeScrollTest = function() {
    const testElement = document.getElementById('scroll-test-element');
    if (testElement) {
      testElement.remove();
      delete window.removeScrollTest;
      console.log('✅ Elemento de teste removido');
    }
  };
  
  console.log('✅ Elemento de teste adicionado');
  console.log('   - Tente scrollar para ver o elemento no meio da tela');
  console.log('   - Clique no botão "Remover Teste" para limpar');
}

// Executar diagnóstico
testMobileScroll();

// Disponibilizar função de teste forçado
console.log('\n🔧 Funções Disponíveis:');
console.log('- testMobileScroll() - Executar diagnóstico completo');
console.log('- forceTestScroll() - Adicionar elemento de teste grande');

// Auto-executar teste forçado se não conseguir scrollar
setTimeout(() => {
  if (document.body.scrollHeight <= window.innerHeight + 50) {
    console.log('\n⚠️  Conteúdo parece pequeno, executando teste forçado...');
    forceTestScroll();
  }
}, 1000); 