import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Usar as mesmas credenciais que src/lib/supabase.ts
const supabaseUrl = 'https://xgeidrcncustrvhsdwoj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnZWlkcmNuY3VzdHJ2aHNkd29qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxMzQzNTEsImV4cCI6MjA2MTcxMDM1MX0.wV4BO1KeWCaPSNNXwpVhXAfZ-n7jwoA3tV9l2SmpgJY';

// Criar um cliente Supabase no servidor
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
  }
});

export async function POST(request: Request) {
  try {
    // Obter ID do artigo da requisição
    const { id } = await request.json();
    
    if (!id) {
      return NextResponse.json({ error: 'ID do artigo não fornecido' }, { status: 400 });
    }
    
    // Verificar se o artigo existe
    const { data: articleExists, error: existsError } = await supabase
      .from('blog_posts')
      .select('id')
      .eq('id', id)
      .single();
    
    if (existsError) {
      console.error('Erro ao verificar artigo:', existsError);
      return NextResponse.json({ error: 'Artigo não encontrado' }, { status: 404 });
    }
    
    try {
      // Buscar visualizações atuais do artigo (pode falhar se a coluna não existir)
      const { data, error: fetchError } = await supabase
        .from('blog_posts')
        .select('visualizacoes')
        .eq('id', id)
        .single();
      
      if (fetchError) {
        // Se o erro for relacionado à coluna ausente, apenas logamos o erro
        // e continuamos assumindo que visualizacoes é 0
        console.log('Aviso: coluna visualizacoes pode não existir:', fetchError.message);
      }
      
      // Incrementar contagem (use 0 como padrão se data for null ou visualizacoes não existir)
      const currentViews = data?.visualizacoes || 0;
      const newViews = currentViews + 1;
      
      // Tentar atualizar - isso pode falhar se a coluna não existir
      const { error: updateError } = await supabase
        .from('blog_posts')
        .update({ visualizacoes: newViews })
        .eq('id', id);
      
      if (updateError) {
        // Se o erro for relacionado à coluna ausente, apenas retornamos sucesso parcial
        console.log('Aviso: não foi possível atualizar visualizações:', updateError.message);
        return NextResponse.json({ 
          success: true, 
          partial: true, 
          message: 'Artigo encontrado, mas não foi possível incrementar visualizações.'
        });
      }
      
      // Sucesso
      return NextResponse.json({ success: true, views: newViews });
    } catch (e) {
      // Erro inesperado ao processar visualizações
      console.error('Erro ao processar visualizações:', e);
      return NextResponse.json({ 
        success: true, 
        partial: true, 
        message: 'Artigo encontrado, mas ocorreu um erro ao processar visualizações.'
      });
    }
  } catch (e) {
    console.error('Erro no servidor:', e);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 