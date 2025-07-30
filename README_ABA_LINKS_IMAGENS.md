# Aba "Links" no Editor de Conteúdo - Atualizada

## 📋 Descrição

A aba **"Links"** do editor de conteúdo (RichTextEditor) foi atualizada com funcionalidades avançadas para gerenciar links de imagens. Agora permite visualizar, editar e organizar links por tipo (Supabase vs Externos), além de copiar URLs facilmente.

## ✨ Funcionalidades

### 🔗 Visualização e Organização de Links
- **Separação por tipo**: Links organizados em duas seções:
  - **Imagens Hospedadas (Supabase)**: Imagens enviadas via "Inserir Imagem no Conteúdo"
  - **Links Externos**: Imagens de URLs externos (código HTML, Word, etc.)
- **Identificação visual**: Badges coloridos para diferenciar tipos de link
- **Contadores**: Mostra quantas imagens de cada tipo existem
- **Numeração**: Cada imagem é numerada (#1, #2, etc.)
- **Texto alternativo**: Exibe o atributo `alt` de cada imagem

### ✏️ Edição de Links
- **Botão de edição**: Ícone ✏️ para editar qualquer link
- **Campo de edição**: Input com foco automático e validação
- **Ações de confirmação**: Botões "Salvar" e "Cancelar"
- **Atualização em tempo real**: Mudanças refletem imediatamente no editor

### 📋 Interface Intuitiva
- **Aba "Links"** localizada ao lado das abas "Visual" e "HTML"
- **Ícones diferenciados**: Supabase (azul) e Externos (laranja)
- **Design responsivo**: Funciona perfeitamente em mobile
- **Tema consistente**: Usa as cores do tema da aplicação

### 🎯 Funcionalidades de Usabilidade
- **Campo de texto somente leitura** com o URL da imagem
- **Clique para selecionar** todo o conteúdo do campo
- **Botão "Copiar"** para copiar o URL para a área de transferência
- **Feedback visual** quando o link é copiado (botão fica verde por 1 segundo)
- **Edição inline**: Modificar links sem sair da aba

### 📱 Estados da Interface
- **Com imagens**: Seções organizadas por tipo de link
- **Sem imagens**: Mensagem informativa com ícone e instruções
- **Modo de edição**: Interface especial para modificar links

## 🛠️ Implementação Técnica

### Estrutura do Componente
```typescript
// Estados para gerenciar edição
const [editingLinkIndex, setEditingLinkIndex] = useState<number | null>(null);
const [editingLinkValue, setEditingLinkValue] = useState('');

// Função para extrair e classificar links das imagens
const extractImageLinks = () => {
  if (!editorRef.current) return [];
  
  const images = editorRef.current.querySelectorAll('img');
  const links: Array<{ 
    src: string; 
    alt: string; 
    index: number; 
    type: 'supabase' | 'external';
    originalSrc: string;
  }> = [];
  
  images.forEach((img, index) => {
    const src = img.getAttribute('src');
    const alt = img.getAttribute('alt') || `Imagem ${index + 1}`;
    
    if (src) {
      // Determinar se é link do Supabase ou externo
      const isSupabase = src.includes('supabase.co') || src.includes('blog-conteudo');
      const type = isSupabase ? 'supabase' : 'external';
      
      links.push({
        src,
        alt,
        index: index + 1,
        type,
        originalSrc: src
      });
    }
  });
  
  return links;
};

// Funções para edição de links
const startEditingLink = (index: number, currentSrc: string) => {
  setEditingLinkIndex(index);
  setEditingLinkValue(currentSrc);
};

const saveEditingLink = () => {
  if (editingLinkIndex && editingLinkValue.trim()) {
    updateImageLink(editingLinkIndex, editingLinkValue.trim());
    setEditingLinkIndex(null);
    setEditingLinkValue('');
  }
};

const cancelEditingLink = () => {
  setEditingLinkIndex(null);
  setEditingLinkValue('');
};
```

### Nova Aba na Interface
```jsx
<button
  type="button"
  onClick={switchToLinks}
  className={`tab-btn ${activeTab === 'links' ? 'active' : ''}`}
>
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
  </svg>
  Links
</button>
```

### Conteúdo da Aba Links (Atualizado)
```jsx
<div className="links-panel">
  <div className="links-header">
    <h3 className="links-title">Links das Imagens</h3>
    <p className="links-description">
      Gerencie os links das imagens do seu conteúdo
    </p>
  </div>
  
  <div className="links-content">
    <div className="links-sections">
      {/* Seção de Links do Supabase */}
      {supabaseLinks.length > 0 && (
        <div className="links-section">
          <div className="section-header">
            <div className="section-icon supabase-icon">
              {/* Ícone Supabase */}
            </div>
            <div className="section-info">
              <h4 className="section-title">Imagens Hospedadas (Supabase)</h4>
              <p className="section-count">{supabaseLinks.length} imagem(s)</p>
            </div>
          </div>
          {/* Lista de links do Supabase */}
        </div>
      )}

      {/* Seção de Links Externos */}
      {externalLinks.length > 0 && (
        <div className="links-section">
          <div className="section-header">
            <div className="section-icon external-icon">
              {/* Ícone Externo */}
            </div>
            <div className="section-info">
              <h4 className="section-title">Links Externos</h4>
              <p className="section-count">{externalLinks.length} imagem(s)</p>
            </div>
          </div>
          {/* Lista de links externos */}
        </div>
      )}
    </div>
  </div>
</div>
```

## 🎨 Estilos CSS

### Classes Principais
- `.links-panel`: Container principal da aba
- `.links-header`: Cabeçalho com título e descrição
- `.links-sections`: Container das seções organizadas
- `.links-section`: Seção individual (Supabase ou Externos)
- `.section-header`: Cabeçalho da seção com ícone e contador
- `.links-list`: Lista de links das imagens
- `.link-item`: Item individual de cada imagem
- `.link-header`: Cabeçalho do item (número + alt + badge)
- `.link-url`: Container do URL e ações
- `.link-actions`: Container dos botões de ação
- `.edit-link-container`: Container do modo de edição

### Estados Visuais
- **Hover**: Efeitos de transparência e bordas
- **Foco**: Destaque na cor primária
- **Ativo**: Feedback visual para ações
- **Edição**: Interface especial com campos de input
- **Badges**: Identificação visual por tipo de link

## 📍 Localização

### Arquivos Modificados
- `src/components/ui/RichTextEditor.tsx`

### Páginas que Utilizam
- `src/app/dashboard/blog/novo/page.tsx` (Criar Post)
- `src/app/dashboard/blog/editar/[id]/page.tsx` (Editar Post)

## 🚀 Como Usar

1. **Acesse** a página de criar ou editar post
2. **Adicione imagens** usando o botão "Inserir Imagem no Conteúdo"
3. **Clique na aba "Links"** ao lado das abas "Visual" e "HTML"
4. **Visualize** os links organizados por tipo:
   - **Azul**: Imagens hospedadas no Supabase
   - **Laranja**: Links externos (código, Word, etc.)
5. **Copie** os links clicando no botão "Copiar"
6. **Edite** os links clicando no ícone ✏️
7. **Salve** ou **cancele** as edições conforme necessário

## 💡 Benefícios

- **Organização**: Visualização clara e separada por tipo de link
- **Identificação**: Distinção visual entre imagens hospedadas e externas
- **Edição**: Modificação de links diretamente na interface
- **Acessibilidade**: Fácil acesso aos URLs das imagens
- **Produtividade**: Copia rápida e edição inline de links
- **Controle**: Verificação e gerenciamento completo de imagens
- **Debugging**: Identificação de imagens quebradas ou URLs incorretos
- **Flexibilidade**: Suporte para diferentes fontes de imagens

## 🔄 Atualizações Futuras

Possíveis melhorias para versões futuras:
- **Filtros avançados**: Por tipo de imagem, tamanho ou data
- **Busca**: Pesquisar por texto alternativo ou URL
- **Preview**: Miniaturas das imagens
- **Estatísticas**: Contagem de imagens, tamanhos e uso
- **Validação**: Verificação automática de links quebrados
- **Bulk actions**: Edição em lote de múltiplos links
- **Histórico**: Log de alterações nos links
- **Backup**: Restauração de links anteriores 