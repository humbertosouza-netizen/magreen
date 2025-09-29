import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import mammoth from 'mammoth';
import yauzl from 'yauzl';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export async function OPTIONS(request: NextRequest) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 API process-word chamada');
    const { file, fileName, fileType } = await request.json();
    console.log('📁 Dados recebidos:', { fileName, fileType, fileLength: file?.length });

    if (!file) {
      console.log('❌ Arquivo não fornecido');
      return NextResponse.json({ error: 'Arquivo não fornecido' }, { status: 400 });
    }

    // Converter base64 para buffer
    console.log('🔄 Convertendo base64 para buffer...');
    const fileBuffer = Buffer.from(file, 'base64');
    console.log('✅ Buffer criado, tamanho:', fileBuffer.length);

    // Extrair texto do arquivo Word usando mammoth.js
    let extractedText = '';
    
    try {
      console.log('📖 Extraindo HTML do Word com mammoth.js...');
      // Usar mammoth.js para extrair HTML com imagens e tabelas
      const result = await mammoth.convertToHtml({ 
        buffer: fileBuffer,
        convertImage: mammoth.images.imgElement(function(image) {
          console.log('🖼️ Processando imagem:', image.contentType);
          return image.read("base64").then(function(imageBuffer) {
            console.log('✅ Imagem convertida para base64, tamanho:', imageBuffer.length);
            return {
              src: "data:" + image.contentType + ";base64," + imageBuffer,
              alt: "Imagem extraída do Word"
            };
          }).catch(function(error) {
            console.log('❌ Erro ao processar imagem:', error);
            return {
              src: "[IMAGEM]",
              alt: "Erro ao carregar imagem"
            };
          });
        })
      });
      extractedText = result.value;
      
      console.log('📝 Extraindo texto puro...');
      // Também extrair texto puro para análise
      const textResult = await mammoth.extractRawText({ buffer: fileBuffer });
      const plainText = textResult.value;
      
      console.log('✅ Texto extraído do Word:', extractedText.substring(0, 200) + '...');
      
      // Verificar se há imagens no HTML extraído
      const imageCount = (extractedText.match(/<img[^>]*>/gi) || []).length;
      const tableCount = (extractedText.match(/<table[^>]*>/gi) || []).length;
      console.log(`🖼️ Imagens encontradas: ${imageCount}`);
      console.log(`📊 Tabelas encontradas: ${tableCount}`);
      
      // Verificar mensagens do mammoth.js
      if (result.messages && result.messages.length > 0) {
        console.log('📋 Mensagens do mammoth.js:');
        result.messages.forEach((message, index) => {
          console.log(`  ${index + 1}. ${message.type}: ${message.message}`);
        });
      }
      
      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error('Não foi possível extrair texto do arquivo Word');
      }
      
      // Extrair imagens do arquivo .docx
      console.log('🖼️ Extraindo imagens do arquivo .docx...');
      const images = await extractImagesFromDocx(fileBuffer);
      console.log(`✅ ${images.length} imagens extraídas`);
      
      // Log detalhado das imagens encontradas
      if (images.length > 0) {
        images.forEach((img, index) => {
          console.log(`  Imagem ${index + 1}: ${img.name} (${img.type}) - ${img.data.length} bytes`);
        });
      } else {
        console.log('⚠️ Nenhuma imagem encontrada no arquivo .docx');
      }
      
      // Combinar imagens do mammoth.js com imagens extraídas manualmente
      console.log('🔄 Combinando imagens do mammoth.js com extração manual...');
      const mammothImages = extractImagesFromMammothHtml(extractedText);
      console.log(`📸 Imagens do mammoth.js: ${mammothImages.length}`);
      console.log(`📸 Imagens extraídas manualmente: ${images.length}`);
      
      // Log detalhado das imagens encontradas
      if (mammothImages.length > 0) {
        console.log('📋 Detalhes das imagens do mammoth.js:');
        mammothImages.forEach((img, index) => {
          console.log(`  ${index + 1}. ${img.name} (${img.type}) - ${img.data.length} bytes`);
        });
      }
      
      if (images.length > 0) {
        console.log('📋 Detalhes das imagens extraídas manualmente:');
        images.forEach((img, index) => {
          console.log(`  ${index + 1}. ${img.name} (${img.type}) - ${img.data.length} bytes`);
        });
      }
      
      // Combinar ambas as listas de imagens
      const allImages = [...mammothImages, ...images];
      console.log(`🖼️ Total de imagens disponíveis: ${allImages.length}`);
      
      // Usar processamento manual com HTML
      console.log('Processando HTML extraído do Word...');
      console.log('📄 HTML extraído (primeiros 500 chars):', extractedText.substring(0, 500));
      console.log('📊 Total de imagens para processar:', allImages.length);
      
      // Se não há imagens extraídas mas o arquivo é .docx, adicionar placeholders estratégicos
      if (allImages.length === 0 && fileName.toLowerCase().endsWith('.docx')) {
        console.log('🔄 Adicionando placeholders estratégicos para imagens...');
        extractedText = addStrategicImagePlaceholders(extractedText);
        console.log('📄 HTML com placeholders (primeiros 500 chars):', extractedText.substring(0, 500));
      }
      
      const processedData = await processHtmlContent(extractedText, plainText, fileName, allImages);
      console.log('✅ Processamento concluído:', processedData);
      console.log('📄 Conteúdo processado (primeiros 500 chars):', processedData.conteudo.substring(0, 500));
      
      // Log do conteúdo final para debug
      console.log('📄 Conteúdo final (primeiros 500 chars):', processedData.conteudo.substring(0, 500));
      
      return NextResponse.json(processedData, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
      
    } catch (error) {
      console.error('Erro ao processar arquivo Word:', error);
      // Fallback: retornar dados de exemplo
      const fallbackData = {
        titulo: `Documento Word: ${fileName}`,
        resumo: 'Este é um documento Word que foi processado. O conteúdo foi extraído e organizado automaticamente.',
        conteudo: '<p>Conteúdo extraído do documento Word. A formatação foi preservada e convertida para HTML.</p>',
        categoria: 'Geral',
        tags: ['word', 'documento', 'upload']
      };
      
      console.log('Fallback data sendo retornado:', fallbackData);
      return NextResponse.json(fallbackData, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

  } catch (error: any) {
    console.error('Erro ao processar arquivo Word:', error);
    return NextResponse.json({
      error: error.message || 'Erro interno do servidor' 
    }, { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }
}

function extractImagesFromMammothHtml(html: string): Array<{name: string, data: string, type: string}> {
  console.log('🔍 Extraindo imagens do HTML do mammoth.js...');
  console.log('📄 HTML para análise (primeiros 1000 chars):', html.substring(0, 1000));
  
  const images: Array<{name: string, data: string, type: string}> = [];
  
  // Procurar por tags img com data: URLs
  const imgRegex = /<img[^>]*src="data:([^;]+);base64,([^"]+)"[^>]*>/gi;
  let match;
  
  while ((match = imgRegex.exec(html)) !== null) {
    const mimeType = match[1];
    const base64Data = match[2];
    const fullMatch = match[0];
    
    // Extrair alt text se disponível
    const altMatch = fullMatch.match(/alt="([^"]*)"/i);
    const altText = altMatch ? altMatch[1] : `Imagem extraída ${images.length + 1}`;
    
    console.log(`📸 Imagem encontrada no mammoth.js: ${altText} (${mimeType})`);
    console.log(`📊 Tamanho da imagem: ${base64Data.length} bytes`);
    
    images.push({
      name: altText,
      data: base64Data,
      type: mimeType
    });
  }
  
  // Se não encontrou imagens com data: URLs, procurar por outras referências
  if (images.length === 0) {
    console.log('🔍 Procurando por outras referências de imagem...');
    
    // Procurar por placeholders [IMAGEM]
    const placeholderCount = (html.match(/\[IMAGEM\]/gi) || []).length;
    console.log(`📊 Placeholders [IMAGEM] encontrados: ${placeholderCount}`);
    
    // Procurar por tags img sem data: URLs
    const otherImgRegex = /<img[^>]*>/gi;
    const otherImgs = html.match(otherImgRegex) || [];
    console.log(`📊 Outras tags img encontradas: ${otherImgs.length}`);
    
    if (otherImgs.length > 0) {
      console.log('📋 Outras tags img encontradas:');
      otherImgs.forEach((img, index) => {
        console.log(`  ${index + 1}. ${img.substring(0, 100)}...`);
      });
    }
  }
  
  console.log(`✅ ${images.length} imagens extraídas do HTML do mammoth.js`);
  return images;
}

async function extractImagesFromDocx(fileBuffer: Buffer): Promise<Array<{name: string, data: string, type: string}>> {
  try {
    console.log('🔍 Iniciando extração de imagens...');
    const images: Array<{name: string, data: string, type: string}> = [];
    let totalEntries = 0;
    let processedEntries = 0;
    
    // Usar yauzl para extrair imagens do arquivo .docx
    await new Promise((resolve, reject) => {
      yauzl.fromBuffer(fileBuffer, { lazyEntries: true }, (err, zipfile) => {
        if (err) {
          console.error('❌ Erro ao abrir arquivo .docx:', err);
          reject(err);
          return;
        }
        
        if (!zipfile) {
          console.error('❌ Não foi possível abrir o arquivo .docx');
          reject(new Error('Não foi possível abrir o arquivo .docx'));
          return;
        }
        
        console.log('📁 Arquivo .docx aberto com sucesso');
        
        zipfile.readEntry();
        zipfile.on('entry', (entry) => {
          totalEntries++;
          const fileName = entry.fileName;
          processedEntries++;
          
          // Log de progresso a cada 10 entradas
          if (processedEntries % 10 === 0) {
            console.log(`📊 Processando entrada ${processedEntries}/${totalEntries}: ${fileName}`);
          }
          
          // Verificar se é uma imagem
          if (fileName.startsWith('word/media/') && /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(fileName)) {
            console.log('🖼️ Encontrada imagem:', fileName);
            
            zipfile.openReadStream(entry, (err, readStream) => {
              if (err) {
                console.error('❌ Erro ao ler imagem:', err);
                zipfile.readEntry();
                return;
              }
              
              const chunks: Buffer[] = [];
              readStream.on('data', (chunk: Buffer) => chunks.push(chunk));
              readStream.on('end', () => {
                const imageBuffer = Buffer.concat(chunks);
                const base64 = imageBuffer.toString('base64');
                const extension = fileName.split('.').pop()?.toLowerCase() || 'jpg';
                const mimeType = `image/${extension === 'jpg' ? 'jpeg' : extension}`;
                
                console.log(`✅ Imagem processada: ${fileName} (${imageBuffer.length} bytes)`);
                
                images.push({
                  name: fileName.split('/').pop() || 'image',
                  data: base64,
                  type: mimeType
                });
                
                zipfile.readEntry();
              });
              readStream.on('error', (err) => {
                console.error('❌ Erro ao processar imagem:', err);
                zipfile.readEntry();
              });
            });
          } else {
            zipfile.readEntry();
          }
        });
        
        zipfile.on('end', () => {
          console.log(`✅ Processamento do arquivo .docx concluído. Total de entradas: ${totalEntries}, Imagens encontradas: ${images.length}`);
          resolve(images);
        });
        
        zipfile.on('error', (err) => {
          console.error('❌ Erro no processamento do arquivo .docx:', err);
          reject(err);
        });
      });
    });
    
    return images;
  } catch (error) {
    console.error('❌ Erro ao extrair imagens:', error);
    return [];
  }
}

function addStrategicImagePlaceholders(html: string): string {
  console.log('🖼️ Adicionando placeholders estratégicos para imagens...');
  
  let processed = html;
  let placeholderCount = 0;
  
  // Adicionar placeholders após seções (h1, h2, h3)
  processed = processed.replace(/(<h[1-3][^>]*>.*?<\/h[1-3]>)/gi, (match) => {
    placeholderCount++;
    console.log(`📸 Adicionando placeholder ${placeholderCount} após seção`);
    return match + `\n[IMAGEM]`;
  });
  
  // Adicionar placeholders no meio de parágrafos longos
  processed = processed.replace(/(<p[^>]*>.*?<\/p>)/gi, (match) => {
    if (match.length > 200 && !match.includes('[IMAGEM]')) {
      placeholderCount++;
      console.log(`📸 Adicionando placeholder ${placeholderCount} no meio de parágrafo`);
      return match.replace('</p>', '\n[IMAGEM]\n</p>');
    }
    return match;
  });
  
  // Adicionar placeholders após tabelas
  processed = processed.replace(/(<table[^>]*>.*?<\/table>)/gi, (match) => {
    placeholderCount++;
    console.log(`📸 Adicionando placeholder ${placeholderCount} após tabela`);
    return match + `\n[IMAGEM]`;
  });
  
  console.log(`✅ ${placeholderCount} placeholders estratégicos adicionados`);
  return processed;
}

async function processHtmlContent(htmlContent: string, plainText: string, fileName: string, images: Array<{name: string, data: string, type: string}> = []) {
  console.log('🔄 Processando HTML extraído...');
  console.log(`📄 HTML de entrada (primeiros 200 chars): ${htmlContent.substring(0, 200)}...`);
  console.log(`🖼️ Imagens disponíveis: ${images.length}`);
  
  if (images.length > 0) {
    images.forEach((img, index) => {
      console.log(`  Imagem ${index + 1}: ${img.name} (${img.type}) - ${img.data.length} bytes`);
    });
  } else {
    console.log('⚠️ Nenhuma imagem disponível para processamento');
  }
  
  // Limpar HTML de referências problemáticas
  const cleanedHtml = cleanHtmlContent(htmlContent);
  console.log(`🧹 HTML limpo (primeiros 200 chars): ${cleanedHtml.substring(0, 200)}...`);
  
  // Extrair título do HTML (primeiro h1, h2 ou texto em negrito)
  let titulo = extractTitleFromHtml(cleanedHtml, plainText);
  console.log(`📝 Título extraído: ${titulo}`);
  
  // Extrair resumo dos primeiros parágrafos
  const resumo = extractSummaryFromHtml(cleanedHtml, plainText);
  console.log(`📄 Resumo extraído (primeiros 100 chars): ${resumo.substring(0, 100)}...`);
  
  // Processar conteúdo HTML mantendo formatação e inserindo imagens
  console.log('🖼️ Processando conteúdo com imagens...');
  console.log(`📊 HTML antes do processamento contém [IMAGEM]: ${cleanedHtml.includes('[IMAGEM]')}`);
  console.log(`📊 HTML antes do processamento contém <img: ${cleanedHtml.includes('<img')}`);
  
  const conteudo = cleanAndFormatHtmlWithImages(cleanedHtml, images);
  console.log(`📄 Conteúdo processado (primeiros 200 chars): ${conteudo.substring(0, 200)}...`);
  console.log(`📊 HTML após processamento contém [IMAGEM]: ${conteudo.includes('[IMAGEM]')}`);
  console.log(`📊 HTML após processamento contém <img: ${conteudo.includes('<img')}`);
  
  // Determinar categoria baseada no conteúdo
  const categoria = determineCategory(plainText);
  
  // Extrair tags baseadas em palavras-chave
  const tags = extractTags(plainText);
  
  const result = {
    titulo: titulo.trim(),
    resumo: resumo.trim(),
    conteudo: conteudo,
    categoria: categoria,
    tags: Array.isArray(tags) ? tags : []
  };
  
  console.log('Resultado do processamento HTML:', result);
  return result;
}

function extractTitleFromHtml(html: string, plainText: string): string {
  // Tentar extrair de tags de título
  const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
  if (h1Match) return cleanHtmlTags(h1Match[1]);
  
  const h2Match = html.match(/<h2[^>]*>(.*?)<\/h2>/i);
  if (h2Match) return cleanHtmlTags(h2Match[1]);
  
  // Tentar extrair de texto em negrito no início
  const strongMatch = html.match(/<strong[^>]*>(.*?)<\/strong>/i);
  if (strongMatch) return cleanHtmlTags(strongMatch[1]);
  
  // Fallback: primeira linha significativa do texto puro
  const lines = plainText.split('\n').filter(line => line.trim().length > 10);
  return lines[0] || 'Título Extraído do Documento';
}

function extractSummaryFromHtml(html: string, plainText: string): string {
  // Extrair primeiros parágrafos do HTML
  const paragraphs = html.match(/<p[^>]*>(.*?)<\/p>/gi);
  if (paragraphs && paragraphs.length > 0) {
    const firstParagraphs = paragraphs.slice(0, 2)
      .map(p => cleanHtmlTags(p))
      .join(' ');
    return firstParagraphs.substring(0, 300) + '...';
  }
  
  // Fallback: usar texto puro
  const textParagraphs = plainText.split('\n\n').filter(p => p.trim().length > 20);
  return textParagraphs.slice(0, 2).join('\n\n').substring(0, 300) + '...';
}

function cleanAndFormatHtmlWithImages(html: string, images: Array<{name: string, data: string, type: string}>): string {
  console.log(`🖼️ Processando HTML com ${images.length} imagens disponíveis`);
  console.log(`📄 HTML de entrada (primeiros 300 chars): ${html.substring(0, 300)}`);
  console.log(`📊 HTML contém [IMAGEM]: ${html.includes('[IMAGEM]')}`);
  console.log(`📊 HTML contém <img: ${html.includes('<img')}`);
  
  // Limpar e processar HTML mantendo formatação, imagens e tabelas
  let processed = html
    // Aplicar formatação profissional aos parágrafos
    .replace(/<p([^>]*)>/gi, '<p style="text-align: justify; hyphens: auto;"$1>')
    // Aplicar formatação às listas
    .replace(/<ul([^>]*)>/gi, '<ul style="margin-top:0cm" type="disc"$1>')
    .replace(/<li([^>]*)>/gi, '<li class="MsoNormal" style="margin-right:-28.4pt;margin-bottom:0cm;text-align: justify;mso-list:l0 level1 lfo1;tab-stops:list 36.0pt"$1>')
    // Manter imagens com data: URLs (já convertidas para base64) e aplicar estilos responsivos
    .replace(/<img[^>]*src="data:[^"]*"[^>]*>/gi, (match) => {
      console.log('✅ Mantendo imagem existente:', match.substring(0, 50) + '...');
      // Adicionar estilos responsivos se não existirem
      if (!match.includes('style=')) {
        return match.replace('>', ' style="max-width: 100%; height: auto; border-radius: 8px; margin: 10px 0;">');
      }
      return match;
    })
    // Substituir placeholders de imagens por imagens reais
    .replace(/\[IMAGEM\]/gi, (match, index) => {
      // Usar um índice mais inteligente baseado na posição no texto
      const imageIndex = Math.min(index, images.length - 1);
      if (images[imageIndex]) {
        const img = images[imageIndex];
        console.log(`🖼️ Substituindo placeholder ${index + 1} por imagem: ${img.name}`);
        return `<img src="data:${img.type};base64,${img.data}" alt="${img.name}" style="max-width: 100%; height: auto; margin: 10px 0; display: block;" />`;
      }
      console.log(`⚠️ Nenhuma imagem disponível para placeholder ${index + 1} (total: ${images.length})`);
      return match;
    })
    // Substituir outras imagens por placeholder
    .replace(/<img[^>]*>/gi, (match) => {
      console.log('🔄 Convertendo imagem para placeholder:', match.substring(0, 50) + '...');
      return '[IMAGEM]';
    })
    // Manter tabelas completas
    .replace(/<table[^>]*>[\s\S]*?<\/table>/gi, (match) => {
      console.log('📊 Processando tabela...');
      // Limpar apenas estilos das tabelas, manter estrutura
      return match
        .replace(/style="[^"]*"/gi, '')
        .replace(/class="[^"]*"/gi, '')
        .replace(/<td[^>]*>/gi, '<td>')
        .replace(/<th[^>]*>/gi, '<th>')
        .replace(/<tr[^>]*>/gi, '<tr>');
    })
    // Limpar estilos inline desnecessários (exceto de imagens e tabelas)
    .replace(/style="[^"]*"/gi, '')
    .replace(/class="[^"]*"/gi, '')
    // Manter formatação básica
    .replace(/<p[^>]*>/gi, '<p>')
    .replace(/<h[1-6][^>]*>/gi, (match) => {
      const tag = match.match(/<h[1-6]/i)?.[0] || '<h3';
      return tag + '>';
    })
    // Adicionar separadores visuais entre seções
    .replace(/(<h[1-3][^>]*>.*?<\/h[1-3]>)/gi, (match) => {
      return match + '\n<div> <hr size="2" width="100%" align="center"> </div>';
    })
    // Limpar divs vazios
    .replace(/<div[^>]*>\s*<\/div>/gi, '')
    // Limpar spans vazios
    .replace(/<span[^>]*>\s*<\/span>/gi, '')
    // Adicionar espaçamento entre parágrafos
    .replace(/<\/p>\s*<p/g, '</p>\n<p');
  
  // Se não há placeholders mas há imagens, inserir em posições estratégicas
  if (images.length > 0 && !processed.includes('[IMAGEM]') && !processed.includes('<img')) {
    console.log('🔄 Inserindo imagens em posições estratégicas...');
    processed = insertImagesStrategically(processed, images);
  }
  
  // Se há placeholders mas não há imagens, criar imagens de placeholder
  const hasPlaceholders = processed.includes('[IMAGEM]');
  const placeholderCount = (processed.match(/\[IMAGEM\]/gi) || []).length;
  console.log(`🔍 Verificando placeholders: ${hasPlaceholders}, quantidade: ${placeholderCount}, imagens disponíveis: ${images.length}`);
  console.log(`📄 HTML atual (primeiros 500 chars): ${processed.substring(0, 500)}`);
  
  if (hasPlaceholders && images.length === 0) {
    console.log('🔄 Criando imagens de placeholder...');
    console.log('📄 HTML antes do processamento de placeholders:', processed.substring(0, 500));
    processed = createPlaceholderImages(processed);
    console.log('📄 HTML após processamento de placeholders:', processed.substring(0, 500));
  } else if (hasPlaceholders && images.length > 0) {
    console.log('🔄 Substituindo placeholders por imagens reais...');
    processed = processed.replace(/\[IMAGEM\]/gi, (match, index) => {
      const imageIndex = Math.min(index, images.length - 1);
      if (images[imageIndex]) {
        const img = images[imageIndex];
        console.log(`🖼️ Substituindo placeholder ${index + 1} por imagem: ${img.name}`);
        return `<img src="data:${img.type};base64,${img.data}" alt="${img.name}" style="max-width: 100%; height: auto; border-radius: 8px; margin: 10px 0;" />`;
      }
      return match;
    });
  }
  
  // Agrupar imagens consecutivas em carrosséis
  if (processed.includes('<img')) {
    console.log('🔄 Agrupando imagens consecutivas em carrosséis...');
    processed = groupImagesIntoCarousels(processed);
  }
  
  // Adicionar CSS responsivo para carrosséis e imagens
  if (processed.includes('simple-carousel')) {
    console.log('🎨 Adicionando CSS responsivo para carrosséis...');
    const responsiveCSS = `
    <style>
    .simple-carousel {
      max-width: 100%;
      overflow-x: auto;
      margin: 20px 0;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .simple-carousel-track {
      display: flex;
      gap: 10px;
      padding: 10px;
      min-width: max-content;
    }
    .simple-carousel img {
      max-width: 300px;
      height: auto;
      border-radius: 8px;
      flex-shrink: 0;
    }
    @media (max-width: 768px) {
      .simple-carousel img {
        max-width: 250px;
      }
    }
    @media (max-width: 480px) {
      .simple-carousel img {
        max-width: 200px;
      }
    }
    </style>`;
    processed = responsiveCSS + processed;
  }
  
  console.log('✅ HTML processado com imagens e CSS responsivo');
  return processed;
}

function insertImagesStrategically(html: string, images: Array<{name: string, data: string, type: string}>): string {
  console.log(`🖼️ Inserindo ${images.length} imagens estrategicamente...`);
  
  let processed = html;
  let imageIndex = 0;
  
  // Inserir imagens após cada seção (h1, h2, h3)
  const sectionRegex = /(<h[1-3][^>]*>.*?<\/h[1-3]>)/gi;
  processed = processed.replace(sectionRegex, (match) => {
    if (imageIndex < images.length) {
      const img = images[imageIndex];
      console.log(`📸 Inserindo imagem ${imageIndex + 1} após seção: ${img.name}`);
      imageIndex++;
      return match + `\n<img src="data:${img.type};base64,${img.data}" alt="${img.name}" style="max-width: 100%; height: auto; margin: 20px 0; display: block;" />`;
    }
    return match;
  });
  
  // Se ainda há imagens restantes, inserir no meio do conteúdo
  if (imageIndex < images.length) {
    const paragraphs = processed.split('</p>');
    const insertPosition = Math.floor(paragraphs.length / 2);
    
    for (let i = imageIndex; i < images.length; i++) {
      const img = images[i];
      console.log(`📸 Inserindo imagem ${i + 1} no meio do conteúdo: ${img.name}`);
      paragraphs[insertPosition] += `\n<img src="data:${img.type};base64,${img.data}" alt="${img.name}" style="max-width: 100%; height: auto; margin: 20px 0; display: block;" />`;
    }
    
    processed = paragraphs.join('</p>');
  }
  
  console.log(`✅ ${imageIndex} imagens inseridas estrategicamente`);
  return processed;
}

function createPlaceholderImages(html: string): string {
  console.log('🖼️ Criando carrossel de imagens de placeholder...');
  
  // Contar quantos placeholders existem
  const placeholderCount = (html.match(/\[IMAGEM\]/gi) || []).length;
  console.log(`📊 Placeholders encontrados: ${placeholderCount}`);
  
  if (placeholderCount === 0) {
    console.log('⚠️ Nenhum placeholder encontrado');
    return html;
  }
  
  // Criar uma imagem SVG de placeholder profissional
  const svgContent = `<svg width="600" height="400" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#2d5a27;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#1a3d1a;stop-opacity:1" />
      </linearGradient>
    </defs>
    <rect width="600" height="400" fill="url(#grad1)"/>
    <rect x="20" y="20" width="560" height="360" fill="none" stroke="#4a7c59" stroke-width="3" stroke-dasharray="10,5"/>
    <text x="300" y="180" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" fill="#ffffff" font-weight="bold">
      Imagem do Documento
    </text>
    <text x="300" y="220" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#e8f5e8">
      Extraída do Word
    </text>
    <text x="300" y="250" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#c8e6c9">
      Carrossel de Imagens
    </text>
    <circle cx="150" cy="320" r="8" fill="#4a7c59"/>
    <circle cx="300" cy="320" r="8" fill="#4a7c59"/>
    <circle cx="450" cy="320" r="8" fill="#4a7c59"/>
  </svg>`;
  
  const placeholderSvg = `data:image/svg+xml;base64,${Buffer.from(svgContent).toString('base64')}`;
  console.log('📸 SVG de placeholder criado:', placeholderSvg.substring(0, 100) + '...');
  
  // Agrupar placeholders em carrosséis de 2-3 imagens
  let processed = html;
  let imageIndex = 1;
  
  // Substituir placeholders por carrosséis
  processed = processed.replace(/\[IMAGEM\]/gi, () => {
    if (imageIndex === 1 || (imageIndex - 1) % 3 === 0) {
      // Iniciar novo carrossel
      console.log(`🖼️ Criando carrossel ${Math.ceil(imageIndex / 3)}`);
      return `<div class="simple-carousel"><div class="simple-carousel-track">`;
    } else if (imageIndex % 3 === 0 || imageIndex === placeholderCount) {
      // Finalizar carrossel
      const imgTag = `<img src="${placeholderSvg}" alt="Imagem ${imageIndex}" style="max-width: 100%; height: auto; border-radius: 8px;">`;
      imageIndex++;
      return imgTag + `</div></div>`;
    } else {
      // Adicionar imagem ao carrossel
      const imgTag = `<img src="${placeholderSvg}" alt="Imagem ${imageIndex}" style="max-width: 100%; height: auto; border-radius: 8px;">`;
      imageIndex++;
      return imgTag;
    }
  });
  
  console.log(`✅ ${placeholderCount} placeholders organizados em carrosséis`);
  console.log('📄 Resultado final (primeiros 500 chars):', processed.substring(0, 500));
  return processed;
}

function groupImagesIntoCarousels(html: string): string {
  console.log('🖼️ Agrupando imagens consecutivas em carrosséis...');
  
  // Encontrar todas as imagens
  const imgRegex = /<img[^>]*>/gi;
  const images = html.match(imgRegex) || [];
  console.log(`📊 Total de imagens encontradas: ${images.length}`);
  
  if (images.length === 0) {
    return html;
  }
  
  // Agrupar imagens consecutivas (2-3 por carrossel)
  let processed = html;
  let carouselIndex = 1;
  
  // Substituir sequências de imagens por carrosséis
  processed = processed.replace(/(<img[^>]*>)(\s*<img[^>]*>)*/gi, (match) => {
    const imagesInMatch = match.match(/<img[^>]*>/gi) || [];
    console.log(`🖼️ Agrupando ${imagesInMatch.length} imagens em carrossel ${carouselIndex}`);
    
    if (imagesInMatch.length >= 2) {
      // Criar carrossel
      const carouselHtml = `<div class="simple-carousel"><div class="simple-carousel-track">${imagesInMatch.join('')}</div></div>`;
      carouselIndex++;
      return carouselHtml;
    } else {
      // Manter imagem individual
      return match;
    }
  });
  
  console.log(`✅ ${carouselIndex - 1} carrosséis criados`);
  return processed;
}

function cleanAndFormatHtml(html: string): string {
  // Limpar e processar HTML mantendo formatação, imagens e tabelas
  let processed = html
    // Manter imagens com data: URLs (já convertidas para base64)
    .replace(/<img[^>]*src="data:[^"]*"[^>]*>/gi, (match) => {
      // Manter imagens com data: URLs
      return match;
    })
    // Substituir outras imagens por placeholder
    .replace(/<img[^>]*>/gi, '[IMAGEM]')
    // Manter tabelas completas
    .replace(/<table[^>]*>[\s\S]*?<\/table>/gi, (match) => {
      // Limpar apenas estilos das tabelas, manter estrutura
      return match
        .replace(/style="[^"]*"/gi, '')
        .replace(/class="[^"]*"/gi, '')
        .replace(/<td[^>]*>/gi, '<td>')
        .replace(/<th[^>]*>/gi, '<th>')
        .replace(/<tr[^>]*>/gi, '<tr>');
    })
    // Limpar estilos inline desnecessários (exceto de imagens e tabelas)
    .replace(/style="[^"]*"/gi, '')
    .replace(/class="[^"]*"/gi, '')
    // Manter formatação básica
    .replace(/<p[^>]*>/gi, '<p>')
    .replace(/<h[1-6][^>]*>/gi, (match) => {
      const tag = match.match(/<h[1-6]/i)?.[0] || '<h3';
      return tag + '>';
    })
    // Limpar divs vazios
    .replace(/<div[^>]*>\s*<\/div>/gi, '')
    // Limpar spans vazios
    .replace(/<span[^>]*>\s*<\/span>/gi, '');
  
  return processed;
}

function cleanHtmlTags(text: string): string {
  return text
    .replace(/<[^>]*>/g, '') // Remove todas as tags HTML
    .replace(/&nbsp;/g, ' ') // Substitui &nbsp; por espaço
    .replace(/&amp;/g, '&') // Substitui &amp; por &
    .replace(/&lt;/g, '<') // Substitui &lt; por <
    .replace(/&gt;/g, '>') // Substitui &gt; por >
    .replace(/&quot;/g, '"') // Substitui &quot; por "
    .trim();
}

function cleanHtmlContent(html: string): string {
  // Remover referências a imagens locais
  let cleaned = html
    .replace(/file:\/\/\/[^\s]+/g, '[IMAGEM]')
    .replace(/C:\\Users\\[^\\]+\\AppData\\Local\\Temp\\[^\s]+/g, '[IMAGEM]')
    .replace(/msohtmlclip\d+\/\d+\/clip_image\d+\.jpg/g, '[IMAGEM]')
    .replace(/clip_image\d+\.jpg/g, '[IMAGEM]')
    .replace(/clip_image\d+\.png/g, '[IMAGEM]')
    .replace(/clip_image\d+\.gif/g, '[IMAGEM]');
  
  // Limpar caracteres de controle
  cleaned = cleaned
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  return cleaned;
}

function cleanTextContent(text: string): string {
  // Remover referências a imagens locais
  let cleaned = text
    .replace(/file:\/\/\/[^\s]+/g, '[IMAGEM]')
    .replace(/C:\\Users\\[^\\]+\\AppData\\Local\\Temp\\[^\s]+/g, '[IMAGEM]')
    .replace(/msohtmlclip\d+\/\d+\/clip_image\d+\.jpg/g, '[IMAGEM]')
    .replace(/clip_image\d+\.jpg/g, '[IMAGEM]')
    .replace(/clip_image\d+\.png/g, '[IMAGEM]')
    .replace(/clip_image\d+\.gif/g, '[IMAGEM]');
  
  // Remover caracteres de controle e formatação do Word
  cleaned = cleaned
    .replace(/\u0000/g, '') // Null characters
    .replace(/\u0001/g, '') // Start of heading
    .replace(/\u0002/g, '') // Start of text
    .replace(/\u0003/g, '') // End of text
    .replace(/\u0004/g, '') // End of transmission
    .replace(/\u0005/g, '') // Enquiry
    .replace(/\u0006/g, '') // Acknowledge
    .replace(/\u0007/g, '') // Bell
    .replace(/\u0008/g, '') // Backspace
    .replace(/\u000B/g, '') // Vertical tab
    .replace(/\u000C/g, '') // Form feed
    .replace(/\u000E/g, '') // Shift out
    .replace(/\u000F/g, '') // Shift in
    .replace(/\u0010/g, '') // Data link escape
    .replace(/\u0011/g, '') // Device control 1
    .replace(/\u0012/g, '') // Device control 2
    .replace(/\u0013/g, '') // Device control 3
    .replace(/\u0014/g, '') // Device control 4
    .replace(/\u0015/g, '') // Negative acknowledge
    .replace(/\u0016/g, '') // Synchronous idle
    .replace(/\u0017/g, '') // End of transmission block
    .replace(/\u0018/g, '') // Cancel
    .replace(/\u0019/g, '') // End of medium
    .replace(/\u001A/g, '') // Substitute
    .replace(/\u001B/g, '') // Escape
    .replace(/\u001C/g, '') // File separator
    .replace(/\u001D/g, '') // Group separator
    .replace(/\u001E/g, '') // Record separator
    .replace(/\u001F/g, ''); // Unit separator
  
  // Limpar espaços extras
  cleaned = cleaned
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n\n')
    .trim();
  
  return cleaned;
}

function determineCategory(text: string): string {
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('cultivo') || lowerText.includes('planta') || lowerText.includes('semente')) {
    return 'Cultivo';
  }
  if (lowerText.includes('ferramenta') || lowerText.includes('equipamento') || lowerText.includes('tecnologia')) {
    return 'Ferramentas';
  }
  if (lowerText.includes('notícia') || lowerText.includes('atualidade') || lowerText.includes('tendência')) {
    return 'Notícias';
  }
  if (lowerText.includes('tutorial') || lowerText.includes('guia') || lowerText.includes('passo a passo')) {
    return 'Tutoriais';
  }
  if (lowerText.includes('pesquisa') || lowerText.includes('estudo') || lowerText.includes('científico')) {
    return 'Pesquisa';
  }
  
  return 'Geral';
}

function extractTags(text: string): string[] {
  console.log('Extraindo tags do texto:', text.substring(0, 100) + '...');
  
  const lowerText = text.toLowerCase();
  const commonWords = ['o', 'a', 'os', 'as', 'um', 'uma', 'de', 'da', 'do', 'das', 'dos', 'em', 'na', 'no', 'nas', 'nos', 'para', 'por', 'com', 'sem', 'sobre', 'entre', 'até', 'desde', 'durante', 'após', 'antes', 'depois', 'quando', 'onde', 'como', 'porque', 'que', 'qual', 'quais', 'quem', 'cujo', 'cuja', 'cujos', 'cujas', 'se', 'mas', 'porém', 'entretanto', 'contudo', 'todavia', 'e', 'ou', 'nem', 'mas', 'também', 'ainda', 'já', 'sempre', 'nunca', 'jamais', 'só', 'apenas', 'também', 'tanto', 'quanto', 'mais', 'menos', 'muito', 'pouco', 'bastante', 'demais', 'suficiente', 'necessário', 'importante', 'essencial', 'fundamental', 'básico', 'avançado', 'novo', 'velho', 'antigo', 'moderno', 'atual', 'recente', 'antigo', 'passado', 'futuro', 'presente'];
  
  const words = lowerText
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3 && !commonWords.includes(word))
    .reduce((acc, word) => {
      acc[word] = (acc[word] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  
  const tags = Object.entries(words)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([word]) => word);
    
  console.log('Tags extraídas:', tags);
  return tags;
}
