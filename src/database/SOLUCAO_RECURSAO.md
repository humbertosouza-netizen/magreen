# Solução para o Erro de Recursão Infinita no Supabase

## Problema
O erro **"infinite recursion detected in policy for relation 'profiles'"** está ocorrendo porque as políticas de segurança (RLS) na tabela `profiles` estão criando um ciclo infinito de verificações.

## Causa
A principal causa é uma política que verifica se o usuário é administrador consultando a própria tabela `profiles`, o que aciona a mesma política novamente, criando um loop infinito.

Por exemplo, na política:
```sql
CREATE POLICY "Admins podem ver todos os perfis" 
  ON profiles FOR SELECT 
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');
```

Quando esta política é executada:
1. O sistema tenta verificar se o usuário atual é admin
2. Para isso, consulta a tabela `profiles`
3. Antes de acessar `profiles`, verifica novamente a política
4. Isso cria um ciclo infinito

## Solução

A solução implementada no arquivo `fix_profiles_rls.sql` utiliza funções com a cláusula `SECURITY DEFINER`, que são executadas com os privilégios do criador da função, ignorando as políticas RLS.

### Como aplicar a solução:

1. **Execute o script de correção**:
   - Acesse o painel do Supabase
   - Navegue até "SQL Editor"
   - Crie uma nova consulta
   - Cole o conteúdo do arquivo `src/database/fix_profiles_rls.sql`
   - Execute o script

2. **Reinicie o aplicativo**:
   - Após aplicar as alterações no banco de dados, reinicie o servidor Next.js
   - Execute: `npm run dev`

3. **Verifique os logs do console**:
   - Monitore o console do navegador para garantir que o erro não ocorra mais

## Explicação técnica da solução

1. **Remoção das políticas problemáticas**:
   - Eliminamos todas as políticas RLS existentes na tabela `profiles` que podem estar causando recursão

2. **Criação de função sem verificação RLS**:
   - Implementamos a função `is_admin_no_rls()` com a flag `SECURITY DEFINER`
   - Esta função verifica se um usuário é administrador sem acionar verificações de políticas

3. **Novas políticas otimizadas**:
   - Criamos políticas que usam a função `is_admin_no_rls()` em vez de consultas diretas
   - Dividimos as políticas por operação (SELECT, UPDATE, INSERT, DELETE)
   - Definimos regras claras: usuários veem/editam apenas seus próprios perfis, admins veem/editam todos

## Prevenção de problemas futuros

Ao criar novas políticas RLS no futuro, sempre:
1. Evite consultas que referenciam a mesma tabela na cláusula `USING`
2. Use funções auxiliares com `SECURITY DEFINER` para verificações de permissões
3. Teste as políticas com diferentes tipos de usuários antes de implementar em produção

Se o problema persistir após aplicar esta solução, verifique se existem outras tabelas com políticas similares que possam estar causando recursão. 