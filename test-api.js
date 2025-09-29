const fs = require('fs');

// Simular dados de teste com placeholders
const testData = {
  file: 'dGVzdA==', // base64 de "test"
  fileName: 'teste.docx'
};

// Fazer requisição para a API
fetch('http://localhost:3001/api/process-word', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(testData)
})
.then(response => response.json())
.then(data => {
  console.log('Resposta da API:', data);
  console.log('Conteúdo contém [IMAGEM]:', data.conteudo?.includes('[IMAGEM]'));
  console.log('Conteúdo contém <img:', data.conteudo?.includes('<img'));
  
  // Testar com HTML que contém placeholders
  const htmlWithPlaceholders = '<p>Teste com [IMAGEM] e [IMAGEM] placeholders</p>';
  console.log('\nTestando com placeholders:');
  console.log('HTML contém [IMAGEM]:', htmlWithPlaceholders.includes('[IMAGEM]'));
  
  // Simular a função createPlaceholderImages
  const svgContent = `<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
    <rect width="400" height="300" fill="#f0f0f0" stroke="#ccc" stroke-width="2"/>
    <text x="200" y="150" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#666">
      Imagem do Documento
    </text>
    <text x="200" y="180" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#999">
      Extraída do Word
    </text>
  </svg>`;
  
  const placeholderSvg = `data:image/svg+xml;base64,${Buffer.from(svgContent).toString('base64')}`;
  
  let processed = htmlWithPlaceholders;
  let imageIndex = 1;
  
  processed = processed.replace(/\[IMAGEM\]/gi, () => {
    console.log(`Criando placeholder ${imageIndex}`);
    const imgTag = `<img src="${placeholderSvg}" alt="Imagem do documento ${imageIndex}" style="max-width: 100%; height: auto; margin: 20px 0; display: block; border: 1px solid #ddd; border-radius: 8px;" />`;
    imageIndex++;
    return imgTag;
  });
  
  console.log('HTML processado:', processed);
})
.catch(error => {
  console.error('Erro:', error);
});
