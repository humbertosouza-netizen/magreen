const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  console.log('Certifique-se de que NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY estão definidas no arquivo .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupBlogContentStorage() {
  try {
    console.log('🚀 Configurando bucket para imagens do conteúdo do blog...');
    
    // Criar bucket para imagens do conteúdo
    const { data: bucketData, error: bucketError } = await supabase.storage.createBucket('blog-conteudo', {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      fileSizeLimit: 5242880 // 5MB
    });

    if (bucketError) {
      if (bucketError.message.includes('already exists')) {
        console.log('✅ Bucket "blog-conteudo" já existe');
      } else {
        console.error('❌ Erro ao criar bucket:', bucketError);
        return;
      }
    } else {
      console.log('✅ Bucket "blog-conteudo" criado com sucesso');
    }

    // Configurar políticas de acesso público para leitura
    const { error: policyError } = await supabase.storage.from('blog-conteudo').createSignedUrl('test', 60);
    
    if (policyError && !policyError.message.includes('not found')) {
      console.log('⚠️  Configurando políticas de acesso...');
      
      // Nota: As políticas RLS são configuradas via SQL no Supabase Dashboard
      console.log('📝 Para configurar políticas de acesso, vá ao Supabase Dashboard > Storage > Policies');
      console.log('   e adicione uma política para permitir acesso público de leitura ao bucket "blog-conteudo"');
    }

    console.log('✅ Configuração do storage para imagens do conteúdo concluída!');
    console.log('');
    console.log('📋 Próximos passos:');
    console.log('1. Vá ao Supabase Dashboard > Storage');
    console.log('2. Selecione o bucket "blog-conteudo"');
    console.log('3. Vá para a aba "Policies"');
    console.log('4. Adicione uma política para permitir SELECT público:');
    console.log('   - Policy name: "Public read access"');
    console.log('   - Operation: SELECT');
    console.log('   - Target roles: public');
    console.log('   - Using expression: true');
    
  } catch (error) {
    console.error('❌ Erro durante a configuração:', error);
  }
}

setupBlogContentStorage(); 