# Implementação da Tabela de Produtos da Loja

Este documento explica como implementar a funcionalidade de persistência dos produtos na página de produtos da loja.

## Problema

Quando os produtos são alterados na página de administração (`/dashboard/produtos`), as alterações são perdidas ao atualizar a página (F5). Isso ocorre porque os dados estavam sendo armazenados apenas na memória, sem persistência no banco de dados Supabase.

## Solução

1. Criar uma nova tabela `cultivo_produtos_loja` no Supabase
2. Configurar as políticas de Row Level Security (RLS) para controle de acesso
3. Atualizar o código da página de produtos para usar a tabela do Supabase

## Passos de Implementação

### 1. Executar o script SQL no Supabase

Acesse o painel de administração do Supabase e vá para o "SQL Editor". Crie uma nova consulta e cole o conteúdo do arquivo `scripts/aplicar_tabela_produtos_loja.sql`. Execute a consulta para criar a tabela e políticas.

**O script fará o seguinte:**
- Criar a função `update_timestamp()` se não existir
- Criar a tabela `cultivo_produtos_loja`
- Configurar políticas RLS:
  - Usuários comuns podem apenas visualizar produtos ativos
  - Administradores podem gerenciar (criar, editar, excluir) todos os produtos
- Adicionar um trigger para atualizar o campo `updated_at` automaticamente
- Inserir dados de exemplo (apenas se a tabela estiver vazia)

### 2. Verificar as Alterações no Código

As seguintes alterações já foram implementadas no código:

1. No arquivo `src/app/dashboard/produtos/page.tsx`:
   - Removidos os dados de exemplo
   - Adicionadas chamadas Supabase para buscar produtos
   - Implementadas operações CRUD reais (Create, Read, Update, Delete)

### 3. Testar a Funcionalidade

1. Inicie o servidor de desenvolvimento com `npm run dev`
2. Acesse `http://localhost:3000/dashboard/produtos` (ou a porta que estiver usando)
3. Faça login como administrador
4. Tente adicionar, editar e excluir produtos
5. Atualize a página (F5) para verificar se as alterações persistem

## Estrutura da Tabela

```sql
CREATE TABLE cultivo_produtos_loja (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    valor DECIMAL(10, 2) NOT NULL,
    imagem_url TEXT,
    link_checkout TEXT,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Solução de Problemas

Se ocorrerem erros durante a execução do script SQL:

1. Verifique se a tabela `profiles` existe e tem o campo `role` para controle de administradores
2. Verifique os logs do console no navegador para identificar erros de consulta
3. Execute partes do script separadamente para identificar qual parte está falhando 