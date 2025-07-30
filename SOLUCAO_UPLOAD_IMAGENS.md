# Solução para Erro de Upload de Imagens do Conteúdo

## Problema Identificado
O erro "Erro ao fazer upload da imagem do conteúdo" está acontecendo porque o bucket `blog-conteudo` não foi criado ou as políticas de acesso não estão configuradas corretamente.

## Solução Passo a Passo

### Passo 1: Criar o Bucket via Dashboard (Método Mais Simples)

1. **Acesse o Supabase Dashboard**
   - Vá para https://supabase.com/dashboard
   - Selecione seu projeto

2. **Criar o Bucket**
   - Vá para **Storage** no menu lateral
   - Clique em **"New Bucket"**
   - Configure:
     - **Name**: `blog-conteudo`
     - **Public bucket**: ✅ Marque esta opção
     - **File size limit**: `5MB`
     - **Allowed MIME types**: `image/jpeg, image/png, image/gif, image/webp`

3. **Clique em "Create bucket"**

### Passo 2: Configurar Políticas de Acesso

1. **No Supabase Dashboard**
   - Vá para **Storage** > **Policies**
   - Selecione o bucket `blog-conteudo`

2. **Adicionar Políticas**

#### Política 1: Leitura Pública
- **Policy name**: `Public read access for blog content images`
- **Operation**: `SELECT`
- **Target roles**: `public`
- **Using expression**: `bucket_id = 'blog-conteudo' AND auth.role() = 'anon'`

#### Política 2: Upload para Usuários Autenticados
- **Policy name**: `Authenticated users can upload blog content images`
- **Operation**: `INSERT`
- **Target roles**: `authenticated`
- **Using expression**: `bucket_id = 'blog-conteudo' AND auth.role() = 'authenticated'`

#### Política 3: Atualização para Proprietário
- **Policy name**: `Users can update their own blog content images`
- **Operation**: `UPDATE`
- **Target roles**: `authenticated`
- **Using expression**: `bucket_id = 'blog-conteudo' AND auth.uid() = owner`

#### Política 4: Exclusão para Proprietário
- **Policy name**: `Users can delete their own blog content images`
- **Operation**: `DELETE`
- **Target roles**: `authenticated`
- **Using expression**: `bucket_id = 'blog-conteudo' AND auth.uid() = owner`

### Passo 3: Testar a Funcionalidade

1. **Acesse a aplicação**
   - Vá para `http://localhost:3000/dashboard/blog/novo`

2. **Teste o upload**
   - Clique em "Inserir Imagem no Conteúdo"
   - Selecione uma imagem
   - Verifique se o upload funciona

## Método Alternativo: Scripts Automatizados

### Opção A: Script JavaScript (se tiver service_role key)

1. **Configure a variável de ambiente**
   ```bash
   export SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui
   ```

2. **Execute o script**
   ```bash
   node scripts/create-blog-content-bucket.js
   ```

### Opção B: Script SQL

1. **Execute no SQL Editor do Supabase**
   - Vá para **SQL Editor** no Dashboard
   - Cole o conteúdo do arquivo `database/create_blog_content_bucket.sql`
   - Execute o script

## Verificação

Para verificar se tudo está funcionando:

1. **Verificar bucket**
   ```sql
   SELECT name, public FROM storage.buckets WHERE name = 'blog-conteudo';
   ```

2. **Verificar políticas**
   ```sql
   SELECT policyname, cmd, roles FROM pg_policies 
   WHERE tablename = 'objects' AND policyname LIKE '%blog content%';
   ```

## Solução de Problemas Comuns

### Erro: "Bucket não encontrado"
- Verifique se o bucket `blog-conteudo` foi criado
- Confirme se o nome está exatamente igual

### Erro: "Acesso negado"
- Verifique se as políticas de acesso estão configuradas
- Confirme se o usuário está autenticado

### Erro: "Tipo de arquivo não permitido"
- Verifique se o arquivo é uma imagem (JPEG, PNG, GIF, WebP)
- Confirme se o tamanho é menor que 5MB

### Erro: "Service role key não encontrada"
- Use o método manual via Dashboard
- Ou configure a variável de ambiente corretamente

## Próximos Passos

Após configurar o bucket e as políticas:

1. Teste o upload de imagem na página de criação de post
2. Verifique se as imagens aparecem no preview
3. Teste a criação de um post completo com imagens
4. Verifique se as imagens são exibidas corretamente no post publicado 