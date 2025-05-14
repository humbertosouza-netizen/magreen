-- Função para verificar o estado atual das tabelas e gatilhos relacionados a usuários
-- Esta função irá ajudar a diagnosticar problemas de criação de usuários

-- Verificar se já existe
DROP FUNCTION IF EXISTS check_user_system();

-- Criar função diagnóstica
CREATE OR REPLACE FUNCTION check_user_system()
RETURNS TEXT AS $$
DECLARE
    v_result TEXT := '';
    v_auth_count INTEGER;
    v_profiles_count INTEGER;
    v_trigger_exists BOOLEAN;
    v_role_constraint TEXT;
    v_columns TEXT;
    v_user_id UUID;
    v_error TEXT;
BEGIN
    -- Verificar contagens
    SELECT COUNT(*) INTO v_auth_count FROM auth.users WHERE deleted_at IS NULL;
    SELECT COUNT(*) INTO v_profiles_count FROM profiles;
    
    v_result := v_result || 'Total de usuários em auth: ' || v_auth_count || E'\n';
    v_result := v_result || 'Total de perfis em profiles: ' || v_profiles_count || E'\n';
    
    IF v_auth_count <> v_profiles_count THEN
        v_result := v_result || 'ALERTA: Diferença entre usuários auth e perfis: ' || (v_auth_count - v_profiles_count) || E'\n';
    ELSE
        v_result := v_result || 'OK: Contagens de usuários auth e perfis estão iguais!' || E'\n';
    END IF;
    
    -- Verificar gatilho
    SELECT EXISTS (
        SELECT FROM pg_trigger
        WHERE tgname = 'on_auth_user_created'
        AND tgrelid = 'auth.users'::regclass
    ) INTO v_trigger_exists;
    
    IF v_trigger_exists THEN
        v_result := v_result || 'OK: Gatilho on_auth_user_created existe!' || E'\n';
    ELSE
        v_result := v_result || 'ERRO: Gatilho on_auth_user_created não existe!' || E'\n';
    END IF;
    
    -- Verificar restrição da coluna role
    BEGIN
        SELECT pg_get_constraintdef(oid)
        INTO v_role_constraint
        FROM pg_constraint
        WHERE conname = 'profiles_role_check'
        AND conrelid = 'profiles'::regclass;
        
        v_result := v_result || 'Restrição da coluna role: ' || COALESCE(v_role_constraint, 'Nenhuma') || E'\n';
        
        IF v_role_constraint !~ 'USUARIO' THEN
            v_result := v_result || 'ALERTA: A restrição não inclui o valor USUARIO!' || E'\n';
        END IF;
    EXCEPTION WHEN OTHERS THEN
        v_result := v_result || 'ERRO ao verificar restrição: ' || SQLERRM || E'\n';
    END;
    
    -- Verificar colunas na tabela profiles
    SELECT string_agg(column_name, ', ')
    INTO v_columns
    FROM information_schema.columns
    WHERE table_name = 'profiles'
    AND table_schema = 'public';
    
    v_result := v_result || 'Colunas na tabela profiles: ' || v_columns || E'\n';
    
    -- Verificar usuários sem perfil
    v_result := v_result || 'Usuários sem perfil:' || E'\n';
    FOR v_user_id IN 
        SELECT au.id
        FROM auth.users au
        LEFT JOIN profiles p ON au.id = p.id
        WHERE p.id IS NULL
        AND au.deleted_at IS NULL
    LOOP
        v_result := v_result || 'ID: ' || v_user_id || E'\n';
    END LOOP;
    
    -- Testar a função handle_new_user com um ID fictício para ver se há erros
    BEGIN
        PERFORM handle_new_user();
        v_result := v_result || 'ERRO: Foi possível executar handle_new_user sem parâmetros!' || E'\n';
    EXCEPTION WHEN OTHERS THEN
        v_error := SQLERRM;
        IF v_error ~* 'wrong number of arguments' THEN
            v_result := v_result || 'OK: handle_new_user requer parâmetros corretamente.' || E'\n';
        ELSE
            v_result := v_result || 'ALERTA: Erro inesperado em handle_new_user: ' || v_error || E'\n';
        END IF;
    END;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Conceder permissão para authenticated
GRANT EXECUTE ON FUNCTION check_user_system() TO authenticated;

-- Para executar a verificação
SELECT check_user_system(); 