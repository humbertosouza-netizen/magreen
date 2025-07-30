const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://xgeidrcncustrvhsdwoj.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ Variável SUPABASE_SERVICE_ROLE_KEY não encontrada');
  console.log('Por favor, adicione a variável SUPABASE_SERVICE_ROLE_KEY ao seu ambiente');
  console.log('Você pode encontrá-la no Supabase Dashboard > Settings > API > service_role key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createBlogContentBucket() {
  try {
    console.log('🚀 Verificando se o bucket blog-conteudo existe...');
    
    // Verificar se o bucket já existe
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Erro ao listar buckets:', listError);
      return;
    }
    
    const bucketExists = buckets.some(bucket => bucket.name === 'blog-conteudo');
    
    if (bucketExists) {
      console.log('✅ Bucket "blog-conteudo" já existe');
    } else {
      console.log('📦 Criando bucket "blog-conteudo"...');
      
      const { data: bucketData, error: bucketError } = await supabase.storage.createBucket('blog-conteudo', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        fileSizeLimit: 5242880 // 5MB
      });

      if (bucketError) {
        console.error('❌ Erro ao criar bucket:', bucketError);
        return;
      }
      
      console.log('✅ Bucket "blog-conteudo" criado com sucesso');
    }
    
    console.log('');
    console.log('📋 Próximos passos:');
    console.log('1. Execute o script SQL: database/create_blog_content_bucket.sql');
    console.log('2. Ou configure as políticas manualmente no Supabase Dashboard');
    console.log('3. Teste o upload de imagem na página de criação de post');
    
  } catch (error) {
    console.error('❌ Erro durante a criação do bucket:', error);
  }
}

createBlogContentBucket(); 