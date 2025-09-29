import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const testData = {
      titulo: "Teste de Upload de Word",
      resumo: "Este é um resumo de teste para verificar se a funcionalidade está funcionando corretamente.",
      conteudo: "<p>Este é um conteúdo de teste em HTML.</p>",
      categoria: "Teste",
      tags: ["teste", "word", "upload", "api"]
    };
    
    console.log('Dados de teste retornados:', testData);
    return NextResponse.json(testData);
  } catch (error: any) {
    console.error('Erro no teste:', error);
    return NextResponse.json({ 
      error: error.message || 'Erro interno do servidor' 
    }, { status: 500 });
  }
}

