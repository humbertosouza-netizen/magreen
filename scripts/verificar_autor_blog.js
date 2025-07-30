const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas!');
  console.log('Certifique-se de que NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY estão definidas no .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verificarAutorBlog() {
  try {
    console.log('🔍 Verificando dados do autor do blog...\n');

    // 1. Buscar o artigo específico
    const articleId = '19bcf3d7-e969-4fab-97a4-a40183780350';
    
    console.log('📄 Buscando artigo:', articleId);
    const { data: article, error: articleError } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('id', articleId)
      .single();

    if (articleError) {
      console.error('❌ Erro ao buscar artigo:', articleError);
      return;
    }

    console.log('✅ Artigo encontrado:');
    console.log('   - Título:', article.titulo);
    console.log('   - Autor ID:', article.autor_id);
    console.log('   - Data criação:', article.data_criacao);
    console.log('');

    if (!article.autor_id) {
      console.log('⚠️  Artigo não tem autor_id definido!');
      return;
    }

    // 2. Buscar dados do autor na tabela profiles
    console.log('👤 Buscando autor na tabela profiles...');
    const { data: author, error: authorError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', article.autor_id)
      .single();

    if (authorError) {
      console.error('❌ Erro ao buscar autor:', authorError);
      return;
    }

    if (!author) {
      console.log('⚠️  Autor não encontrado na tabela profiles!');
      return;
    }

    console.log('✅ Autor encontrado:');
    console.log('   - ID:', author.id);
    console.log('   - Email:', author.email);
    console.log('   - Nome completo:', author.nome_completo);
    console.log('   - Nickname:', author.nickname);
    console.log('   - Avatar URL:', author.avatar_url);
    console.log('   - Data criação:', author.created_at);
    console.log('');

    // 3. Verificar estrutura da tabela profiles
    console.log('🔍 Verificando estrutura da tabela profiles...');
    const { data: profilesSample, error: sampleError } = await supabase
      .from('profiles')
      .select('*')
      .limit(5);

    if (sampleError) {
      console.error('❌ Erro ao buscar amostra de profiles:', sampleError);
      return;
    }

    console.log('📋 Estrutura da tabela profiles (primeiros 5 registros):');
    profilesSample.forEach((profile, index) => {
      console.log(`   ${index + 1}. ID: ${profile.id}`);
      console.log(`      - Email: ${profile.email}`);
      console.log(`      - Nome completo: ${profile.nome_completo || 'NULL'}`);
      console.log(`      - Nickname: ${profile.nickname || 'NULL'}`);
      console.log(`      - Avatar: ${profile.avatar_url || 'NULL'}`);
      console.log('');
    });

    // 4. Verificar se há outros artigos com o mesmo autor
    console.log('📚 Verificando outros artigos do mesmo autor...');
    const { data: otherArticles, error: otherError } = await supabase
      .from('blog_posts')
      .select('id, titulo, autor_id, data_criacao')
      .eq('autor_id', article.autor_id)
      .order('data_criacao', { ascending: false });

    if (otherError) {
      console.error('❌ Erro ao buscar outros artigos:', otherError);
      return;
    }

    console.log(`✅ Encontrados ${otherArticles.length} artigos do autor:`);
    otherArticles.forEach((art, index) => {
      console.log(`   ${index + 1}. ${art.titulo} (${art.id})`);
    });

    console.log('\n🎯 Resumo:');
    console.log(`   - Artigo: ${article.titulo}`);
    console.log(`   - Autor ID: ${article.autor_id}`);
    console.log(`   - Nome do autor: ${author.nickname || author.nome_completo || author.email?.split('@')[0] || 'Usuário'}`);
    console.log(`   - Total de artigos do autor: ${otherArticles.length}`);

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar verificação
verificarAutorBlog(); 