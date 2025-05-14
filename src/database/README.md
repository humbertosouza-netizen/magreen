# MagnifiGreen - Scripts de Banco de Dados

Este diretório contém scripts SQL para configurar e corrigir o banco de dados Supabase utilizado pela aplicação MagnifiGreen.

## Solução de Problemas Comuns

### Erro: "Database error saving new user"

Este erro ocorre ao tentar criar um novo usuário e pode ser causado por:

1. Tabela `profiles` com estrutura incorreta ou inexistente
2. Gatilho (trigger) ausente para criar perfil quando um usuário é criado
3. Políticas de segurança (RLS) mal configuradas

**Solução:**

Execute o script `fix_profiles.sql` no SQL Editor do Supabase:

1. Acesse o dashboard do Supabase
2. Navegue até "SQL Editor"
3. Abra uma nova consulta e cole o conteúdo do arquivo `fix_profiles.sql`
4. Execute o script clicando em "Run"

### Erro: "column blog_posts.visualizacoes does not exist"

Este erro ocorre ao tentar incrementar as visualizações de um post no blog.

**Solução:**

Execute o script `fix_blog_posts.sql` no SQL Editor do Supabase.

### Problemas com comentários no blog

Se os comentários não estão sendo salvos ou exibidos corretamente:

**Solução:**

Execute o script `fix_blog_comments.sql` no SQL Editor do Supabase.

## Ordem de Execução Recomendada

Para configurar um banco de dados do zero ou corrigir problemas existentes, execute os scripts na seguinte ordem:

1. `fix_profiles.sql` - Configura tabela de perfis e gatilhos para criação de usuários
2. `fix_blog_posts.sql` - Configura tabela de posts do blog com campos necessários
3. `fix_blog_comments.sql` - Configura tabela de comentários e funções associadas
4. `diagnostico_admin.sql` - Verifica se há administradores no sistema
5. `create_admin.sql` - Cria um administrador (se necessário)

## Configurações Adicionais

### Promover um usuário a administrador

Se você precisar promover um usuário para administrador:

1. Execute o script `promote_admin.sql` modificando-o para usar o email do usuário desejado

### Verificação de administrador

Para verificar se há administradores no sistema:

1. Execute o script `diagnostico_admin.sql`

## Notas Importantes

- Sempre faça backup do banco de dados antes de executar scripts de modificação.
- Os scripts foram projetados para serem idempotentes - você pode executá-los várias vezes sem efeitos colaterais.
- Certifique-se de que o usuário que está executando os scripts tenha permissões suficientes no Supabase.

## Referência Rápida de Scripts

| Script | Descrição |
|--------|-----------|
| `fix_profiles.sql` | Corrige a tabela de perfis e configura gatilhos para criação automática |
| `fix_blog_posts.sql` | Corrige a tabela de posts do blog adicionando colunas necessárias |
| `fix_blog_comments.sql` | Configura tabela de comentários e funções para contagem |
| `create_admin.sql` | Cria um usuário administrador |
| `promote_admin.sql` | Promove um usuário existente para administrador |
| `diagnostico_admin.sql` | Verifica se existem administradores no sistema |
| `correcao_admin.sql` | Corrige permissões de administrador |
| `user_profiles.sql` | Configura tabela de perfis de usuário (alternativa) |

# Estrutura do Banco de Dados

Este diretório contém os scripts SQL para configurar e manter o banco de dados do sistema.

## Arquivos Principais

### `inicializar_banco.sql`
**[RECOMENDADO]** Script principal para inicializar o banco de dados em um único passo. Este script:
1. Aplica o schema completo do banco de dados
2. Verifica o estado do banco após a instalação
3. Fornece um relatório detalhado do processo

### `schema_principal.sql`
Este é o arquivo que contém toda a estrutura do banco de dados em um único script organizado. Ele é dividido em seções:

1. **Tabelas de Usuários**: Definição das tabelas de perfis de usuários
2. **Tabelas do Blog**: Definição das tabelas para posts e comentários do blog
3. **Tabela de Notificações**: Definição da tabela de notificações para usuários
4. **Triggers e Funções**: Definições de triggers e funções utilitárias
5. **Funções de Administração**: Funções para gerenciar usuários e perfis
6. **Script para Criar Admin Inicial**: Configuração do usuário administrador inicial

### `verificar_sistema.sql`
Um script para diagnóstico que verifica o estado do banco de dados e relata problemas comuns. Use este script para identificar e corrigir problemas na estrutura do banco de dados.

### `dados_exemplo.sql`
Script opcional para adicionar dados de exemplo ao banco de dados para fins de desenvolvimento e testes. Inclui:
1. Usuários de exemplo (administrador e usuários comuns)
2. Posts de blog de exemplo (publicados e rascunhos)
3. Comentários de exemplo
4. Notificações de exemplo

> **IMPORTANTE:** Este script é apenas para desenvolvimento e **NÃO** deve ser usado em ambientes de produção.

## Como Usar

1. **Instalação Completa (Recomendado)**: Use o script de inicialização para configurar todo o banco de dados em um único passo:
   ```sql
   psql -U seu_usuario -d seu_banco_de_dados -f inicializar_banco.sql
   ```
   
   Ou no SQL Editor do Supabase, copie e cole o conteúdo do arquivo e execute.

2. **Instalação Manual**: Alternativamente, você pode executar os scripts separadamente:
   ```sql
   psql -U seu_usuario -d seu_banco_de_dados -f schema_principal.sql
   psql -U seu_usuario -d seu_banco_de_dados -f verificar_sistema.sql
   ```

3. **Apenas Verificação**: Se o banco já está configurado e você quer apenas verificar seu estado:
   ```sql
   psql -U seu_usuario -d seu_banco_de_dados -f verificar_sistema.sql
   ```

4. **Adicionar Dados de Exemplo**: Para incluir dados de exemplo para desenvolvimento:
   ```sql
   psql -U seu_usuario -d seu_banco_de_dados -f dados_exemplo.sql
   ```

## Hierarquia de Usuários

O sistema suporta dois níveis de usuários:

1. **Administradores** (`role = 'ADMIN'`):
   - Podem criar, editar e excluir posts do blog
   - Podem gerenciar outros usuários (banir/desbanir)
   - Têm acesso a todas as áreas administrativas
   - Podem moderar comentários

2. **Usuários Comuns** (`role = 'USUARIO'`):
   - Podem visualizar posts publicados
   - Podem comentar em posts (sujeito a aprovação)
   - Podem editar seus próprios perfis
   - Podem dar like em posts

## Arquivos Legados (Não Usar)

Os seguintes arquivos são mantidos apenas para referência e não devem ser usados para configuração:

- `user_profiles.sql` - Substituído pelo `schema_principal.sql`
- `fix_admin.sql` - Substituído pelo `schema_principal.sql`
- `create_admin.sql` - Substituído pelo `schema_principal.sql`
- `promote_admin.sql` - Substituído pelo `schema_principal.sql`
- `correcao_admin.sql` - Substituído pelo `schema_principal.sql`
- `diagnostico_admin.sql` - Substituído pelo `verificar_sistema.sql`
- `blog_tables.sql` - Substituído pelo `schema_principal.sql`

## Tabelas Principais

### Profiles
Armazena informações de perfil dos usuários:
- `id`: Chave primária, referencia `auth.users`
- `nome_completo`: Nome completo do usuário
- `role`: Papel do usuário (`'ADMIN'` ou `'USUARIO'`)
- `banned`: Indica se o usuário está banido

### Blog Posts
Armazena posts do blog:
- `id`: Chave primária
- `titulo`: Título do post
- `resumo`: Resumo curto
- `conteudo`: Conteúdo completo em HTML
- `autor_id`: Referência ao autor (auth.users)
- `publicado`: Indica se está publicado ou é um rascunho

### Blog Comentários
Armazena comentários nos posts:
- `id`: Chave primária
- `post_id`: Referência ao post
- `autor_id`: Referência ao autor do comentário
- `conteudo`: Conteúdo do comentário
- `aprovado`: Indica se foi aprovado por um admin 