# Editor Rico - Abas de Edição

## 🎯 Nova Funcionalidade: Abas Visual e HTML

O editor rico agora possui duas abas de edição que permitem alternar entre a edição visual e a edição direta do código HTML.

### 📋 Funcionalidades das Abas

#### 1. **Aba Visual** 👁️
- **Editor WYSIWYG** (What You See Is What You Get)
- **Barra de ferramentas** completa com formatação
- **Controles de imagem** (redimensionar, alinhar, remover)
- **Processamento automático** de imagens do Word
- **Interface intuitiva** para usuários não técnicos

#### 2. **Aba HTML** 🔧
- **Editor de código** com syntax highlighting
- **Fonte monospace** para melhor legibilidade
- **Edição direta** do código HTML
- **Sincronização automática** com a aba visual
- **Controle total** sobre a estrutura HTML

### 🎯 Como Usar

#### **Alternando entre Abas**
1. **Aba Visual**: Clique no botão "Visual" (ícone de olho)
2. **Aba HTML**: Clique no botão "HTML" (ícone de código)

#### **Sincronização Automática**
- **Visual → HTML**: O código HTML é atualizado automaticamente
- **HTML → Visual**: O conteúdo visual é atualizado ao trocar de aba
- **Tempo real**: Mudanças são refletidas instantaneamente

#### **Casos de Uso**

##### **Aba Visual - Para:**
- ✅ Usuários iniciantes
- ✅ Formatação rápida
- ✅ Inserção de imagens
- ✅ Colagem do Word
- ✅ Edição visual de conteúdo

##### **Aba HTML - Para:**
- ✅ Desenvolvedores
- ✅ Ajustes finos de CSS
- ✅ Estrutura HTML personalizada
- ✅ Inserção de código customizado
- ✅ Debugging de formatação

### 🔧 Funcionalidades Técnicas

#### **Editor HTML**
```css
.html-editor {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  background-color: rgba(0, 0, 0, 0.3);
  color: #ffffff;
  resize: vertical;
}
```

#### **Sincronização de Estado**
```typescript
// Visual → HTML
const handleInput = () => {
  if (editorRef.current) {
    const newValue = editorRef.current.innerHTML;
    onChange(newValue);
    setHtmlValue(newValue);
  }
};

// HTML → Visual
const handleHtmlChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
  const newHtmlValue = e.target.value;
  setHtmlValue(newHtmlValue);
  onChange(newHtmlValue);
};
```

### 🎨 Interface Visual

#### **Abas**
- **Design moderno** com ícones SVG
- **Indicador ativo** com cor primária
- **Hover effects** suaves
- **Responsivo** para mobile

#### **Estados das Abas**
```css
.tab-btn {
  /* Estado normal */
  color: #cccccc;
  border-bottom: 2px solid transparent;
}

.tab-btn.active {
  /* Estado ativo */
  color: #7fdb3f;
  border-bottom-color: #7fdb3f;
  background-color: rgba(127, 219, 63, 0.1);
}
```

### 🚀 Benefícios

1. **Flexibilidade**: Escolha o modo que preferir
2. **Acessibilidade**: Suporte a diferentes níveis de usuário
3. **Precisão**: Controle total sobre o HTML
4. **Produtividade**: Alternância rápida entre modos
5. **Debugging**: Fácil identificação de problemas de formatação

### 🔍 Casos de Uso Práticos

#### **Exemplo 1: Formatação Complexa**
1. Use a aba **Visual** para estrutura básica
2. Mude para a aba **HTML** para ajustes finos
3. Adicione classes CSS personalizadas
4. Volte para **Visual** para ver o resultado

#### **Exemplo 2: Inserção de Código**
1. Vá para a aba **HTML**
2. Insira `<pre><code>seu código aqui</code></pre>`
3. Mude para **Visual** para ver a formatação
4. Ajuste conforme necessário

#### **Exemplo 3: Debugging**
1. Conteúdo não aparece como esperado na **Visual**
2. Mude para **HTML** para ver o código
3. Identifique tags malformadas
4. Corrija e volte para **Visual**

### 📱 Responsividade

#### **Desktop**
- Abas lado a lado
- Barra de ferramentas completa
- Editor com altura adequada

#### **Mobile**
- Abas empilhadas verticalmente
- Barra de ferramentas compacta
- Interface otimizada para touch

### 🔧 Configuração

#### **Estados Iniciais**
```typescript
const [activeTab, setActiveTab] = useState<'visual' | 'html'>('visual');
const [htmlValue, setHtmlValue] = useState(value);
```

#### **Sincronização**
- **Automática**: Sempre que o conteúdo muda
- **Bidirecional**: Visual ↔ HTML
- **Tempo real**: Sem necessidade de salvar

### 🎯 Dicas de Uso

1. **Comece pela Visual**: Para estrutura básica
2. **Use HTML para detalhes**: Ajustes finos e personalizações
3. **Teste sempre**: Volte para Visual para verificar
4. **Mantenha backup**: Copie o HTML antes de grandes mudanças
5. **Use preview**: Verifique como ficará no post final

### 🔍 Solução de Problemas

#### **HTML não sincroniza**
- Verifique se não há erros de sintaxe
- Recarregue a página se necessário
- Confirme se o HTML é válido

#### **Formatação perdida**
- Use a aba HTML para verificar o código
- Identifique tags quebradas
- Corrija manualmente se necessário

#### **Performance lenta**
- Evite HTML muito complexo
- Use a aba Visual para edições simples
- Limpe código desnecessário

### 📝 Notas Importantes

- **HTML válido**: Sempre use HTML bem formado
- **Segurança**: O HTML é sanitizado automaticamente
- **Compatibilidade**: Funciona em todos os navegadores modernos
- **Performance**: Sincronização otimizada para grandes conteúdos
- **Acessibilidade**: Suporte completo a leitores de tela 