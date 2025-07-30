# Editor Rico - Funcionalidades de Imagens

## 🖼️ Controles de Imagem

O editor rico agora inclui funcionalidades avançadas para trabalhar com imagens no conteúdo dos posts.

### 📋 Funcionalidades Disponíveis

#### 1. **Upload de Imagens no Conteúdo**
- Botão "Inserir Imagem no Conteúdo" acima do editor
- Upload direto para o bucket `blog-conteudo` do Supabase
- Inserção automática no cursor atual

#### 2. **Edição de Imagens**
- **Clique em qualquer imagem** no editor para ativar os controles
- **Redimensionamento**: 4 tamanhos predefinidos (Pequena, Média, Grande, Extra)
- **Alinhamento**: Esquerda, Centro, Direita
- **Remoção**: Botão para deletar a imagem

#### 3. **Processamento de Imagens do Word**
- **Colagem automática**: Cole conteúdo do Word com imagens
- **Upload automático**: Imagens do Word são automaticamente enviadas para o Supabase
- **Indicador visual**: Spinner mostra quando imagens estão sendo processadas
- **Fallback**: Se houver erro, mantém a formatação original

### 🎯 Como Usar

#### **Upload Manual de Imagem**
1. Clique no botão "Inserir Imagem no Conteúdo"
2. Selecione a imagem do seu computador
3. A imagem será inserida no cursor atual
4. Clique na imagem para editar

#### **Editar Imagem Existente**
1. **Clique na imagem** no editor
2. Aparecerá uma barra de controles acima do editor
3. Use os botões para:
   - **Tamanho**: Pequena (200px), Média (400px), Grande (600px), Extra (800px)
   - **Alinhamento**: ← Esquerda, ↔ Centro, → Direita
   - **Remover**: 🗑️ Deletar a imagem

#### **Colar do Word com Imagens**
1. Copie o conteúdo do Word (Ctrl+C)
2. Cole no editor (Ctrl+V)
3. As imagens serão automaticamente:
   - Detectadas
   - Enviadas para o Supabase
   - Substituídas por URLs permanentes
4. Aguarde o indicador "Processando imagens do Word..." desaparecer

### 🔧 Configuração Técnica

#### **Bucket de Storage**
- **Nome**: `blog-conteudo`
- **Políticas**: Acesso público para leitura, upload autenticado
- **Estrutura**: `/blog-conteudo/{timestamp}-{random}.{ext}`

#### **Políticas RLS Necessárias**
```sql
-- Leitura pública
CREATE POLICY "Public read access for blog content images" ON storage.objects
FOR SELECT USING (bucket_id = 'blog-conteudo' AND auth.role() = 'anon');

-- Upload autenticado
CREATE POLICY "Authenticated users can upload blog content images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'blog-conteudo' AND auth.role() = 'authenticated');

-- Atualização pelo proprietário
CREATE POLICY "Users can update their own blog content images" ON storage.objects
FOR UPDATE USING (bucket_id = 'blog-conteudo' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Exclusão pelo proprietário
CREATE POLICY "Users can delete their own blog content images" ON storage.objects
FOR DELETE USING (bucket_id = 'blog-conteudo' AND auth.uid()::text = (storage.foldername(name))[1]);
```

### 🎨 Estilos CSS

#### **Imagens no Editor**
```css
.editor-area img {
  max-width: 100%;
  height: auto;
  border-radius: 0.5rem;
  margin: 1rem 0;
  cursor: pointer;
  transition: all 0.2s ease;
}

.editor-area img:hover {
  box-shadow: 0 0 0 2px #7fdb3f;
}

.editor-area img.selected {
  box-shadow: 0 0 0 3px #7fdb3f;
}
```

#### **Controles de Imagem**
```css
.image-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  padding: 0.75rem;
  background-color: rgba(255, 255, 255, 0.08);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  align-items: center;
}
```

### 🚀 Benefícios

1. **Experiência Completa**: Edição de imagens sem sair do editor
2. **Compatibilidade Word**: Preserva imagens ao colar do Word
3. **Performance**: Upload automático para CDN do Supabase
4. **Responsivo**: Controles adaptam-se a diferentes tamanhos de tela
5. **Intuitivo**: Interface visual clara e fácil de usar

### 🔍 Solução de Problemas

#### **Imagens do Word não aparecem**
- Verifique se o bucket `blog-conteudo` existe
- Confirme se as políticas RLS estão configuradas
- Verifique o console do navegador para erros

#### **Controles de imagem não aparecem**
- Certifique-se de clicar diretamente na imagem
- Verifique se não há conflitos de CSS
- Recarregue a página se necessário

#### **Upload falha**
- Verifique a conexão com a internet
- Confirme se está autenticado
- Verifique as permissões do bucket

### 📝 Notas Importantes

- **Tamanhos**: Os tamanhos são fixos para consistência
- **Alinhamento**: Usa CSS float para posicionamento
- **Performance**: Imagens são otimizadas automaticamente pelo Supabase
- **Compatibilidade**: Funciona em todos os navegadores modernos
- **Mobile**: Interface responsiva para dispositivos móveis 