// Script para testar a edição de links no editor
// Execute no console do navegador na página do editor

function testLinkEditing() {
  console.log('🔍 Testando edição de links...');
  
  // Encontrar o editor
  const editor = document.querySelector('[contenteditable="true"]');
  if (!editor) {
    console.error('❌ Editor não encontrado');
    return;
  }
  
  console.log('✅ Editor encontrado:', editor);
  
  // Verificar se há imagens
  const images = editor.querySelectorAll('img');
  console.log(`📸 Encontradas ${images.length} imagens`);
  
  if (images.length === 0) {
    console.log('⚠️  Nenhuma imagem encontrada no editor');
    return;
  }
  
  // Analisar cada imagem
  images.forEach((img, index) => {
    const src = img.getAttribute('src');
    const alt = img.getAttribute('alt');
    
    console.log(`\n🖼️  Imagem ${index + 1}:`);
    console.log('   - src:', src);
    console.log('   - alt:', alt);
    console.log('   - width:', img.width);
    console.log('   - height:', img.height);
    
    if (src) {
      const isSupabase = src.includes('supabase.co') || src.includes('blog-conteudo');
      const type = isSupabase ? 'Supabase' : 'Externo';
      console.log('   - tipo:', type);
    }
  });
  
  // Função para simular edição de link
  function simulateLinkEdit(imageIndex, newSrc) {
    console.log(`\n🔧 Simulando edição da imagem ${imageIndex + 1} para: ${newSrc}`);
    
    const images = editor.querySelectorAll('img');
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
      } else {
        console.log('   ❌ Falha na atualização do link');
      }
      
      return newSrcActual === newSrc;
    } else {
      console.log('   ❌ Imagem não encontrada');
      return false;
    }
  }
  
  // Testar edição da primeira imagem
  if (images.length > 0) {
    const testNewSrc = 'https://exemplo.com/teste.jpg';
    const success = simulateLinkEdit(0, testNewSrc);
    
    if (success) {
      console.log('\n🎉 Teste de edição bem-sucedido!');
      console.log('Agora teste a edição na aba Links para ver se funciona.');
    } else {
      console.log('\n❌ Teste de edição falhou!');
    }
  }
  
  // Verificar HTML do editor
  console.log('\n📄 HTML do editor (primeiros 500 chars):');
  console.log(editor.innerHTML.substring(0, 500) + '...');
}

// Executar teste
testLinkEditing(); 