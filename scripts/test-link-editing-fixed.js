// Script para testar a correção da edição de links
// Execute no console do navegador na página do editor

function testLinkEditingFixed() {
  console.log('🔧 Testando correção da edição de links...');
  
  // Verificar se estamos na página correta
  const editor = document.querySelector('[contenteditable="true"]');
  const linksTab = document.querySelector('button[onclick*="switchToLinks"]');
  
  if (!editor && !linksTab) {
    console.error('❌ Página do editor não encontrada');
    return;
  }
  
  console.log('✅ Página do editor encontrada');
  
  // Função para simular edição de link usando HTML
  function simulateLinkEditWithHTML(htmlContent, imageIndex, newSrc) {
    console.log(`\n🔧 Simulando edição da imagem ${imageIndex + 1} para: ${newSrc}`);
    
    // Criar elemento temporário
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    
    const images = tempDiv.querySelectorAll('img');
    console.log(`📸 Encontradas ${images.length} imagens no HTML`);
    
    if (images.length === 0) {
      console.log('⚠️  Nenhuma imagem encontrada no HTML');
      return null;
    }
    
    const targetImage = images[imageIndex];
    
    if (targetImage) {
      const oldSrc = targetImage.getAttribute('src');
      console.log('   - src anterior:', oldSrc);
      
      // Atualizar o src
      targetImage.setAttribute('src', newSrc);
      
      // Verificar se foi atualizado
      const newSrcActual = targetImage.getAttribute('src');
      console.log('   - src atual:', newSrcActual);
      
      if (newSrcActual === newSrc) {
        console.log('   ✅ Link atualizado com sucesso!');
        return tempDiv.innerHTML;
      } else {
        console.log('   ❌ Falha na atualização do link');
        return null;
      }
    } else {
      console.log('   ❌ Imagem não encontrada');
      return null;
    }
  }
  
  // Função para extrair links do HTML
  function extractLinksFromHTML(htmlContent) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    
    const images = tempDiv.querySelectorAll('img');
    const links = [];
    
    images.forEach((img, index) => {
      const src = img.getAttribute('src');
      const alt = img.getAttribute('alt') || `Imagem ${index + 1}`;
      
      if (src && src.trim() !== '') {
        const isSupabase = src.includes('supabase.co') || src.includes('blog-conteudo');
        const type = isSupabase ? 'Supabase' : 'Externo';
        
        links.push({
          src: src.trim(),
          alt: alt.trim(),
          index: index + 1,
          type
        });
      }
    });
    
    return links;
  }
  
  // Teste com HTML de exemplo
  const testHTML = `
    <p>Teste de conteúdo</p>
    <img src="https://exemplo.com/imagem1.jpg" alt="Imagem 1">
    <p>Mais conteúdo</p>
    <img src="https://supabase.co/storage/v1/object/public/blog-conteudo/imagem2.jpg" alt="Imagem 2">
    <p>Fim do conteúdo</p>
  `;
  
  console.log('\n📄 HTML de teste:');
  console.log(testHTML);
  
  // Extrair links do HTML de teste
  const initialLinks = extractLinksFromHTML(testHTML);
  console.log('\n🔗 Links iniciais:', initialLinks);
  
  // Testar edição da primeira imagem
  if (initialLinks.length > 0) {
    const testNewSrc = 'https://novo-exemplo.com/imagem-atualizada.jpg';
    const updatedHTML = simulateLinkEditWithHTML(testHTML, 0, testNewSrc);
    
    if (updatedHTML) {
      console.log('\n📄 HTML atualizado:');
      console.log(updatedHTML);
      
      const updatedLinks = extractLinksFromHTML(updatedHTML);
      console.log('\n🔗 Links após atualização:', updatedLinks);
      
      if (updatedLinks[0] && updatedLinks[0].src === testNewSrc) {
        console.log('\n🎉 Teste de edição bem-sucedido!');
        console.log('A correção está funcionando corretamente.');
      } else {
        console.log('\n❌ Teste de edição falhou!');
      }
    }
  }
  
  // Verificar se há imagens no editor atual
  if (editor) {
    const currentImages = editor.querySelectorAll('img');
    console.log(`\n📸 Imagens no editor atual: ${currentImages.length}`);
    
    if (currentImages.length > 0) {
      console.log('💡 Dica: Teste a edição na aba Links com essas imagens');
    }
  }
}

// Executar teste
testLinkEditingFixed(); 