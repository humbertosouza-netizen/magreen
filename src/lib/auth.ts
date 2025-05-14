import { supabase } from './supabase';
import { UserProfile, UserRole } from '@/types/user';

// Buscar perfil do usuário atual
export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  try {
    console.log('Buscando perfil do usuário atual...');
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      console.log('Sem sessão ativa');
      return null;
    }
    
    console.log('Usuário autenticado, ID:', data.session.user.id);
    
    // Usar select específico com todos os campos necessários
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.session.user.id)
      .single();
    
    if (error) {
      console.error('Erro ao buscar perfil:', error.message);
      return null;
    }
    
    if (!profile) {
      console.log('Perfil não encontrado para o usuário:', data.session.user.id);
      return null;
    }
    
    // Garantir que o perfil tenha todos os campos necessários
    const userProfile: UserProfile = {
      id: profile.id,
      email: data.session.user.email || '',
      name: profile.nome_completo || profile.name || '',
      role: profile.role || 'user',
      avatar_url: profile.avatar_url || '',
      created_at: profile.created_at || new Date().toISOString(),
      banned: profile.banned || false
    };
    
    console.log('Perfil carregado com sucesso:', userProfile);
    return userProfile;
  } catch (error) {
    console.error('Erro ao buscar perfil de usuário:', error);
    return null;
  }
}

// Registrar um novo usuário
export async function registerUser(email: string, password: string, name?: string) {
  try {
    // 1. Criar o usuário na autenticação
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (authError || !authData.user) {
      throw authError || new Error('Falha ao criar usuário');
    }
    
    // 2. Criar o perfil do usuário no banco de dados
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: email,
        name: name || email.split('@')[0], // Nome padrão baseado no email
        role: 'user', // Por padrão, todos os usuários são comuns
        created_at: new Date().toISOString(),
        banned: false,
      });
    
    if (profileError) {
      throw profileError;
    }
    
    return { success: true, user: authData.user };
  } catch (error) {
    console.error('Erro ao registrar usuário:', error);
    return { success: false, error };
  }
}

// Atualizar o papel (role) de um usuário
export async function updateUserRole(userId: string, newRole: UserRole) {
  try {
    console.log(`Tentando atualizar papel do usuário ${userId} para ${newRole}...`);
    
    // Verificar se o usuário existe antes de tentar atualizar
    const { data: userExists, error: checkError } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', userId)
      .single();
    
    if (checkError) {
      console.error('Erro ao verificar se o usuário existe:', checkError);
      return { success: false, error: checkError };
    }
    
    if (!userExists) {
      console.error(`Usuário com ID ${userId} não encontrado`);
      return { success: false, error: 'Usuário não encontrado' };
    }
    
    console.log(`Usuário encontrado. Papel atual: ${userExists.role}. Atualizando para: ${newRole}`);
    
    // Realizar a atualização
    const { data, error } = await supabase
      .from('profiles')
      .update({ 
        role: newRole,
        updated_at: new Date().toISOString() 
      })
      .eq('id', userId);
    
    if (error) {
      console.error('Erro ao atualizar papel do usuário:', error);
      return { success: false, error };
    }
    
    console.log(`Papel do usuário ${userId} atualizado com sucesso para ${newRole}`);
    return { success: true, data };
  } catch (error) {
    console.error('Erro ao atualizar papel do usuário:', error);
    return { success: false, error };
  }
}

// Banir ou desbanir um usuário
export async function toggleUserBan(userId: string, banned: boolean, reason?: string) {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ 
        banned, 
        banned_reason: banned ? (reason || 'Violação dos termos de uso') : null 
      })
      .eq('id', userId);
    
    if (error) throw error;
    
    return { success: true };
  } catch (error) {
    console.error('Erro ao alterar status de banimento do usuário:', error);
    return { success: false, error };
  }
}

// Listar todos os usuários (apenas para administradores)
export async function listUsers(page = 1, limit = 10): Promise<{ users: UserProfile[], count: number }> {
  try {
    // Calcular o offset com base na página e limite
    const offset = (page - 1) * limit;
    
    // Não precisamos mais sincronizar usuários, pois o sistema está funcionando
    // await syncMissingUsers();
    
    // Buscar a contagem total
    const { count, error: countError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    
    if (countError) throw countError;
    
    // Buscar os usuários com paginação
    const { data: users, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) throw error;
    
    return {
      users: users || [],
      count: count || 0
    };
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    return { users: [], count: 0 };
  }
}

// Adicionar interface para o tipo de usuário retornado pela função RPC
interface AuthUser {
  id: string;
  email: string | null;
  created_at: string | null;
  raw_user_meta_data: {
    nickname?: string;
    [key: string]: any;
  } | null;
}

// Função auxiliar para sincronizar usuários ausentes
async function syncMissingUsers(): Promise<void> {
  try {
    // Desabilitamos esta verificação pois o sistema já está funcionando
    // E a função get_auth_users pode não estar disponível em todos os ambientes
    return;
    
    /* Código original comentado:
    // 1. Obter todos os IDs de usuários em auth
    const { data: authUsers, error: authError } = await supabase.rpc('get_auth_users');
    
    if (authError || !authUsers) {
      console.error('Erro ao buscar usuários de auth:', authError);
      return;
    }
    
    // 2. Obter todos os IDs de perfis existentes
    const { data: profileIds, error: profileError } = await supabase
      .from('profiles')
      .select('id');
    
    if (profileError) {
      console.error('Erro ao buscar IDs de perfis:', profileError);
      return;
    }
    
    // 3. Encontrar usuários que não têm perfil
    const profileIdSet = new Set(profileIds?.map(p => p.id));
    const usersWithoutProfile = authUsers.filter((user: AuthUser) => !profileIdSet.has(user.id));
    
    if (usersWithoutProfile.length === 0) {
      // Nenhum perfil faltando, nada a fazer
      return;
    }
    
    console.log(`Encontrados ${usersWithoutProfile.length} usuários sem perfil. Criando perfis...`);
    
    // 4. Criar perfis para usuários que não têm
    for (const user of usersWithoutProfile as AuthUser[]) {
      // Definir tipo para o perfil
      const newProfile: {
        id: string; 
        nome_completo: string;
        email: string;
        role: string;
        telefone: string;
        bio: string;
        avatar_url: string;
        banned: boolean;
        created_at: string;
        updated_at: string;
      } = {
        id: user.id,
        nome_completo: user.raw_user_meta_data?.nickname || (user.email?.split('@')[0] || ''),
        email: user.email || '',
        role: 'USUARIO', // Usar o valor 'USUARIO' em maiúsculas conforme existente no banco
        telefone: '',
        bio: '',
        avatar_url: '',
        banned: false,
        created_at: user.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { error: insertError } = await supabase
        .from('profiles')
        .insert(newProfile);
      
      if (insertError) {
        console.error(`Erro ao criar perfil para usuário ${user.id}:`, insertError);
      } else {
        console.log(`Perfil criado com sucesso para usuário ${user.id}`);
      }
    }
    */
  } catch (error) {
    // Capturamos o erro silenciosamente para não afetar a experiência do usuário
    // console.error('Erro ao sincronizar usuários:', error);
  }
}

// Buscar um usuário específico pelo ID
export async function getUserById(userId: string): Promise<UserProfile | null> {
  try {
    const { data: user, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error || !user) {
      console.error('Erro ao buscar usuário:', error);
      return null;
    }
    
    return user as UserProfile;
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    return null;
  }
}

// Função para forçar a verificação e correção do papel do usuário
export async function verificarECorrigirRoleAdmin(email: string): Promise<boolean> {
  try {
    console.log(`Verificando papel do usuário ${email}...`);
    
    // Primeiro verificar se o usuário existe
    const { data: usuario, error: userError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single();
    
    if (userError) {
      console.error('Erro ao buscar usuário por email:', userError.message);
      
      // Tentar na tabela 'perfis' se profiles falhar
      const { data: perfilData, error: perfilError } = await supabase
        .from('perfis')
        .select('*')
        .eq('email', email)
        .single();
      
      if (perfilError) {
        console.error('Erro ao buscar usuário por email na tabela perfis:', perfilError.message);
        return false;
      }
      
      if (!perfilData) {
        console.log(`Usuário com email ${email} não encontrado em nenhuma tabela`);
        return false;
      }
      
      // Se o usuário não é admin, atualizar para admin na tabela perfis
      if (perfilData.role !== 'admin') {
        console.log(`Atualizando papel do usuário ${email} para admin na tabela perfis...`);
        
        const { error: updateError } = await supabase
          .from('perfis')
          .update({ role: 'admin', updated_at: new Date().toISOString() })
          .eq('id', perfilData.id);
        
        if (updateError) {
          console.error('Erro ao atualizar papel do usuário na tabela perfis:', updateError.message);
          return false;
        }
        
        console.log(`Usuário ${email} foi promovido a administrador com sucesso na tabela perfis!`);
        return true;
      } else {
        console.log(`Usuário ${email} já é administrador na tabela perfis`);
        return true;
      }
    }
    
    if (!usuario) {
      console.log(`Usuário com email ${email} não encontrado na tabela profiles`);
      return false;
    }
    
    console.log('Dados do usuário encontrado na tabela profiles:', usuario);
    
    // Se o usuário não é admin, atualizar para admin
    if (usuario.role !== 'admin') {
      console.log(`Atualizando papel do usuário ${email} para admin...`);
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: 'admin', updated_at: new Date().toISOString() })
        .eq('id', usuario.id);
      
      if (updateError) {
        console.error('Erro ao atualizar papel do usuário:', updateError.message);
        return false;
      }
      
      console.log(`Usuário ${email} foi promovido a administrador com sucesso!`);
      return true;
    } else {
      console.log(`Usuário ${email} já é administrador`);
      return true;
    }
  } catch (error) {
    console.error('Erro ao verificar/corrigir papel do usuário:', error);
    return false;
  }
}

// Função específica para tornar o usuário empresarialkluge@gmail.com um administrador
export async function updateEmpresarialKlugeToAdmin(): Promise<boolean> {
  try {
    console.log('Iniciando atualização do usuário empresarialkluge@gmail.com para admin...');
    
    // Primeiro vamos buscar o ID do usuário na tabela users
    const { data: authUser, error: authError } = await supabase
      .rpc('get_user_id_by_email', { 
        user_email: 'empresarialkluge@gmail.com' 
      });
    
    let userId = null;
    
    if (authError || !authUser) {
      console.error('Erro ao buscar ID do usuário:', authError);
      
      // Buscar diretamente na tabela auth.users (requer permissão)
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', 'empresarialkluge@gmail.com')
        .single();
      
      if (userError || !userData) {
        console.error('Não foi possível encontrar o ID do usuário:', userError);
      } else {
        userId = userData.id;
      }
    } else {
      userId = authUser;
    }
    
    // Tentar todas as tabelas possíveis
    // 1. Tabela 'profiles'
    try {
      const { error: profilesError } = await supabase
        .from('profiles')
        .update({ 
          role: 'admin',
          tipo: 'admin',
          admin: true,
          is_admin: true
        })
        .eq('email', 'empresarialkluge@gmail.com');
      
      if (profilesError) {
        console.error('Erro ao atualizar na tabela profiles por email:', profilesError);
        
        if (userId) {
          // Tentar com ID
          const { error: idError } = await supabase
            .from('profiles')
            .update({ 
              role: 'admin',
              tipo: 'admin',
              admin: true,
              is_admin: true
            })
            .eq('id', userId);
            
          if (idError) {
            console.error('Erro ao atualizar na tabela profiles por ID:', idError);
          } else {
            console.log('Usuário atualizado com sucesso na tabela profiles por ID!');
          }
        }
      } else {
        console.log('Usuário atualizado com sucesso na tabela profiles por email!');
      }
    } catch (e) {
      console.error('Exceção ao tentar atualizar profiles:', e);
    }
    
    // 2. Tabela 'perfis'
    try {
      const { error: perfisError } = await supabase
        .from('perfis')
        .update({ 
          role: 'admin',
          tipo: 'admin',
          admin: true,
          is_admin: true
        })
        .eq('email', 'empresarialkluge@gmail.com');
      
      if (perfisError) {
        console.error('Erro ao atualizar na tabela perfis por email:', perfisError);
        
        if (userId) {
          // Tentar com ID
          const { error: idError } = await supabase
            .from('perfis')
            .update({ 
              role: 'admin',
              tipo: 'admin',
              admin: true,
              is_admin: true
            })
            .eq('id', userId);
            
          if (idError) {
            console.error('Erro ao atualizar na tabela perfis por ID:', idError);
          } else {
            console.log('Usuário atualizado com sucesso na tabela perfis por ID!');
          }
        }
      } else {
        console.log('Usuário atualizado com sucesso na tabela perfis por email!');
      }
    } catch (e) {
      console.error('Exceção ao tentar atualizar perfis:', e);
    }
    
    // 3. Tabela 'user_profiles'
    try {
      const { error: userProfilesError } = await supabase
        .from('user_profiles')
        .update({ role: 'admin' })
        .eq('email', 'empresarialkluge@gmail.com');
      
      if (userProfilesError) {
        console.error('Erro ao atualizar na tabela user_profiles por email:', userProfilesError);
        
        if (userId) {
          // Tentar com ID
          const { error: idError } = await supabase
            .from('user_profiles')
            .update({ role: 'admin' })
            .eq('id', userId);
            
          if (idError) {
            console.error('Erro ao atualizar na tabela user_profiles por ID:', idError);
          } else {
            console.log('Usuário atualizado com sucesso na tabela user_profiles por ID!');
          }
        }
      } else {
        console.log('Usuário atualizado com sucesso na tabela user_profiles por email!');
      }
    } catch (e) {
      console.error('Exceção ao tentar atualizar user_profiles:', e);
    }
    
    console.log('Processo de atualização do usuário concluído. Consulte os logs para detalhes.');
    return true;
  } catch (error) {
    console.error('Erro global durante a atualização do usuário:', error);
    return false;
  }
} 