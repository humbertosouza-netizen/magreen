# Upload de Imagens no Conteúdo do Blog

## Funcionalidade Implementada

A página de criação de novo post agora inclui uma funcionalidade para inserir imagens diretamente no conteúdo do post.

### Características:

1. **Botão "Inserir Imagem no Conteúdo"** - Localizado acima do campo de conteúdo
2. **Upload automático** - As imagens são enviadas para o bucket `blog-conteudo` no Supabase
3. **Inserção na posição do cursor** - As imagens são inseridas onde o cursor está posicionado no texto
4. **Preview em tempo real** - As imagens aparecem renderizadas no preview do conteúdo
5. **Formato Markdown** - As imagens são inseridas no formato `![alt](url)`

## Configuração Necessária

### 1. Criar o Bucket de Storage

Execute o script de configuração:

```bash
node scripts/setup-blog-content-storage.js
```

### 2. Configurar Políticas de Acesso

Execute o script SQL no Supabase Dashboard:

```sql
-- Execute o arquivo: database/setup_blog_content_storage.sql
```

Ou configure manualmente no Supabase Dashboard:

1. Vá para **Storage** > **Policies**
2. Selecione o bucket `blog-conteudo`
3. Adicione as seguintes políticas:

#### Política para Leitura Pública:
- **Policy name**: "Public read access for blog content images"
- **Operation**: SELECT
- **Target roles**: public
- **Using expression**: `bucket_id = 'blog-conteudo' AND auth.role() = 'anon'`

#### Política para Upload (Usuários Autenticados):
- **Policy name**: "Authenticated users can upload blog content images"
- **Operation**: INSERT
- **Target roles**: authenticated
- **Using expression**: `bucket_id = 'blog-conteudo' AND auth.role() = 'authenticated'`

#### Política para Atualização:
- **Policy name**: "Users can update their own blog content images"
- **Operation**: UPDATE
- **Target roles**: authenticated
- **Using expression**: `bucket_id = 'blog-conteudo' AND auth.uid() = owner`

#### Política para Exclusão:
- **Policy name**: "Users can delete their own blog content images"
- **Operation**: DELETE
- **Target roles**: authenticated
- **Using expression**: `bucket_id = 'blog-conteudo' AND auth.uid() = owner`

## Como Usar

1. Acesse a página de criação de novo post: `/dashboard/blog/novo`
2. Clique no botão **"Inserir Imagem no Conteúdo"**
3. Selecione uma imagem do seu computador
4. A imagem será enviada automaticamente e inserida no conteúdo na posição do cursor
5. No preview, você verá a imagem renderizada
6. Continue escrevendo o conteúdo normalmente

## Limitações

- **Tamanho máximo**: 5MB por imagem
- **Formatos suportados**: JPEG, PNG, GIF, WebP
- **Posicionamento**: As imagens são inseridas na posição atual do cursor no textarea

## Estrutura de Arquivos

```
scripts/
├── setup-blog-content-storage.js    # Script para criar bucket
database/
├── setup_blog_content_storage.sql   # Políticas de acesso
src/app/dashboard/blog/novo/
├── page.tsx                         # Página com funcionalidade implementada
```

## Solução de Problemas

### Erro de Upload
- Verifique se o bucket `blog-conteudo` existe
- Confirme se as políticas de acesso estão configuradas corretamente
- Verifique se o usuário está autenticado

### Imagens não aparecem no Preview
- Verifique se as URLs das imagens estão corretas
- Confirme se as políticas de leitura pública estão ativas
- Verifique se o formato da imagem é suportado

### Imagem não é inserida na posição correta
- Certifique-se de que o textarea está focado antes de fazer o upload
- A funcionalidade funciona melhor quando o cursor está posicionado no texto 