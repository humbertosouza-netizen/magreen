'use client';

import { useState, useEffect } from 'react';

interface ImageGroup {
  id: string;
  images: string[];
  startIndex: number;
  endIndex: number;
}

export const useImageExtractor = (content: string) => {
  const [imageGroups, setImageGroups] = useState<ImageGroup[]>([]);
  const [processedContent, setProcessedContent] = useState(content);

  useEffect(() => {
    if (!content) {
      setImageGroups([]);
      setProcessedContent('');
      return;
    }

    // Criar um elemento temporário para processar o HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;

    // 1) Tratamento prioritário: tabelas com múltiplas imagens (molde do botão Carrossel)
    const tableGroups: ImageGroup[] = [];
    const tables = Array.from(tempDiv.querySelectorAll('table'));
    tables.forEach((table, index) => {
      const imgs = table.querySelectorAll('img');
      if (imgs.length > 1) {
        const imgsSrc = Array.from(imgs)
          .map(img => img.getAttribute('src'))
          .filter((src): src is string => Boolean(src));
        if (imgsSrc.length > 1) {
          const id = `table-group-${index}`;
          tableGroups.push({
            id,
            images: imgsSrc,
            startIndex: 0,
            endIndex: imgsSrc.length - 1,
          });
          // Substituir a tabela diretamente no DOM por um placeholder
          const placeholder = document.createElement('div');
          placeholder.className = 'image-carousel-placeholder';
          placeholder.setAttribute('data-group-id', id);
          placeholder.setAttribute('data-images', JSON.stringify(imgsSrc));
          table.parentNode?.replaceChild(placeholder, table);
        }
      }
    });

    if (tableGroups.length > 0) {
      setImageGroups(tableGroups);
      setProcessedContent(tempDiv.innerHTML);
      return; // já processado via tabelas
    }

    // 2) Fallback: Encontrar todas as imagens (não-tabela) e agrupar quando próximas
    const images = tempDiv.querySelectorAll('img');
    const imageUrls: string[] = [];
    const imageElements: Element[] = [];

    images.forEach((img) => {
      const src = img.getAttribute('src');
      if (src) {
        // Verificar se é uma imagem válida (não data:image vazia)
        if (src.startsWith('data:image') || src.startsWith('http') || src.startsWith('/') || src.startsWith('./')) {
          imageUrls.push(src);
          imageElements.push(img);
        }
      }
    });

    console.log('Imagens encontradas:', imageUrls.length, imageUrls);

    // Agrupar imagens que estão próximas (dentro de 5 elementos para ser mais flexível)
    const groups: ImageGroup[] = [];
    let currentGroup: ImageGroup | null = null;

    imageElements.forEach((img, index) => {
      // Calcular posição sequencial percorrendo toda a árvore
      // Usamos a ordem do NodeList (document order) como índice relativo estável
      const imgIndex = index;
      
      if (!currentGroup) {
        currentGroup = {
          id: `group-${index}`,
          images: [imageUrls[index]],
          startIndex: imgIndex,
          endIndex: imgIndex
        };
      } else {
        const distance = imgIndex - currentGroup.endIndex;
        
        // Se a imagem está próxima (dentro de 5 elementos), adiciona ao grupo atual
        // Isso é mais flexível para capturar imagens que podem estar separadas por texto
        if (distance <= 5) {
          currentGroup.images.push(imageUrls[index]);
          currentGroup.endIndex = imgIndex;
        } else {
          // Finaliza o grupo atual e inicia um novo
          groups.push(currentGroup);
          currentGroup = {
            id: `group-${index}`,
            images: [imageUrls[index]],
            startIndex: imgIndex,
            endIndex: imgIndex
          };
        }
      }
    });

    // Adicionar o último grupo
    if (currentGroup) {
      groups.push(currentGroup);
    }

    console.log('Grupos de imagens criados:', groups);

    setImageGroups(groups);

    // Processar o conteúdo para substituir grupos de imagens por placeholders
    let newContent = content;
    groups.forEach((group, groupIndex) => {
      if (group.images.length > 1) {
        // Substituir o primeiro img do grupo por um placeholder
        const firstImg = imageElements[group.startIndex];
        if (firstImg) {
          const placeholder = `<div class="image-carousel-placeholder" data-group-id="${group.id}" data-images='${JSON.stringify(group.images)}'></div>`;
          newContent = newContent.replace(firstImg.outerHTML, placeholder);
        }
        
        // Remover as outras imagens do grupo
        for (let i = group.startIndex + 1; i <= group.endIndex; i++) {
          const img = imageElements[i];
          if (img) {
            newContent = newContent.replace(img.outerHTML, '');
          }
        }
      }
    });

    setProcessedContent(newContent);
  }, [content]);

  return {
    imageGroups,
    processedContent,
    hasMultipleImages: imageGroups.some(group => group.images.length > 1)
  };
}; 