// Script para testar a detecção de links no editor
// Execute no console do navegador na página do editor

function testLinksDetection() {
  console.log('🔍 Testando detecção de links...');
  
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
  
  // Verificar HTML do editor
  console.log('\n📄 HTML do editor:');
  console.log(editor.innerHTML.substring(0, 500) + '...');
}

// Executar teste
testLinksDetection(); 