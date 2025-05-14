# Solução para Problemas do Banco de Dados no MagnifiGreen

## Erro: "Database error saving new user"

Este erro ocorre ao tentar cadastrar novos usuários no sistema. A causa está relacionada a problemas na estrutura do banco de dados Supabase.

### Causas possíveis:
1. Tabela `profiles` não existe ou tem estrutura incorreta
2. Trigger para criar o perfil automaticamente após o registro do usuário não está funcionando
3. Políticas RLS (Row Level Security) mal configuradas causando recursão infinita

### Como resolver:

1. **Execute o script de correção da tabela profiles**:
   ```bash
   # Acesse o painel do Supabase
   # Navegue até "SQL Editor"
   # Cole e execute o conteúdo do arquivo: src/database/fix_profiles.sql
   ```

2. **Corrija as políticas RLS que causam recursão infinita**:
   ```bash
   # No SQL Editor do Supabase
   # Cole e execute o conteúdo do arquivo: src/database/fix_profiles_rls.sql
   ```

3. **Reinicie o servidor da aplicação**:
   ```bash
   # Encerre qualquer instância em execução com Ctrl+C
   # Reinicie o servidor
   npm run dev
   ```

## Erro: "infinite recursion detected in policy for relation 'profiles'"

Este erro ocorre devido a políticas de segurança (RLS) que criam um ciclo infinito de verificações.

### Explicação detalhada:
O problema acontece quando uma política RLS tenta verificar se o usuário atual é administrador consultando a tabela `profiles`, o que por sua vez aciona a mesma política novamente, criando um loop infinito.

### Como identificar o problema:
Se você encontrar este erro nos logs do console, significa que as políticas RLS da tabela `profiles` estão causando recursão.

### Solução implementada:
1. Criamos uma função `is_admin_no_rls()` com a flag `SECURITY DEFINER`, que é executada com os privilégios do criador da função, ignorando as políticas RLS
2. Substituímos as políticas problemáticas por novas políticas otimizadas que utilizam esta função

## Instruções para o Administrador do Sistema

1. **Verificar logs do banco de dados**:
   ```sql
   -- No SQL Editor do Supabase
   SELECT * FROM pg_stat_activity WHERE state = 'active';
   ```

2. **Verificar estrutura atual da tabela profiles**:
   ```sql
   -- No SQL Editor do Supabase
   SELECT column_name, data_type FROM information_schema.columns 
   WHERE table_schema = 'public' AND table_name = 'profiles';
   ```

3. **Verificar políticas RLS atuais**:
   ```sql
   -- No SQL Editor do Supabase
   SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'profiles';
   ```

4. **Verificar triggers existentes**:
   ```sql
   -- No SQL Editor do Supabase
   SELECT * FROM pg_trigger WHERE tgrelid = 'profiles'::regclass;
   ```

## Prevenção de problemas futuros

1. **Evite políticas RLS auto-referentes**:
   - Nunca crie políticas que verificam a mesma tabela na cláusula `USING`
   - Use funções com `SECURITY DEFINER` para verificações de permissões

2. **Teste as alterações do banco de dados**:
   - Antes de implantar em produção, teste todas as alterações em um ambiente de desenvolvimento
   - Verifique se o cadastro de usuários funciona corretamente após cada alteração

3. **Mantenha backups regulares**:
   - Faça backups periódicos do banco de dados
   - Documente todas as alterações estruturais

## Em caso de problemas persistentes

Se os problemas persistirem após aplicar estas soluções:

1. Verifique se há outros erros no console do navegador
2. Examine os logs do servidor Next.js
3. Considere a possibilidade de outros problemas na estrutura do banco de dados
4. Entre em contato com o suporte do Supabase para assistência adicional 