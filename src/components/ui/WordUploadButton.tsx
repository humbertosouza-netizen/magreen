'use client';

import { useState } from 'react';
import theme from '@/styles/theme';

interface WordUploadButtonProps {
  onWordProcessed: (data: {
    titulo: string;
    resumo: string;
    conteudo: string;
    categoria: string;
    tags: string[];
  }) => void;
  onError: (error: string) => void;
}

export default function WordUploadButton({ onWordProcessed, onError }: WordUploadButtonProps) {
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);

  const handleWordUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Verificar se é um arquivo Word
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/msword', // .doc
    ];
    
    if (!validTypes.includes(file.type)) {
      onError('Por favor, selecione um arquivo Word (.doc ou .docx)');
      return;
    }

    // Verificar tamanho do arquivo (máximo 50MB)
    if (file.size > 50 * 1024 * 1024) {
      onError('Arquivo muito grande. O tamanho máximo é 50MB.');
      return;
    }

    try {
      setUploading(true);
      setProcessing(true);

      // Converter arquivo para base64
      const base64 = await fileToBase64(file);

      // Enviar para API de processamento
      const response = await fetch('/api/process-word', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file: base64,
          fileName: file.name,
          fileType: file.type,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao processar arquivo Word');
      }

      const processedData = await response.json();
      
      // Aplicar os dados processados
      onWordProcessed(processedData);
      
    } catch (error: any) {
      console.error('Erro ao processar arquivo Word:', error);
      onError(error.message || 'Erro ao processar arquivo Word');
    } finally {
      setUploading(false);
      setProcessing(false);
      // Limpar o input
      e.target.value = '';
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remover o prefixo "data:application/...;base64,"
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  return (
    <div className="mb-6 p-4 rounded-lg" style={{
      backgroundColor: 'rgba(127, 219, 63, 0.05)',
      border: '1px solid rgba(127, 219, 63, 0.2)',
      boxShadow: '0 2px 8px rgba(127, 219, 63, 0.1)'
    }}>
      <div className="flex items-center mb-2">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-5 w-5 mr-2" 
          viewBox="0 0 24 24" 
          fill="currentColor"
          style={{ color: theme.colors.primary }}
        >
          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
        </svg>
        <h3 className="text-sm font-semibold" style={{ color: theme.colors.textPrimary }}>
          Upload Inteligente de Word
        </h3>
      </div>
      
      <label 
        htmlFor="word-upload" 
        className="inline-flex items-center px-4 py-3 rounded-lg cursor-pointer transition-all transform hover:scale-105"
        style={{
          backgroundColor: uploading || processing ? 'rgba(127, 219, 63, 0.2)' : 'rgba(127, 219, 63, 0.1)',
          color: theme.colors.textPrimary,
          border: '2px solid rgba(127, 219, 63, 0.4)',
          boxShadow: '0 4px 15px rgba(127, 219, 63, 0.2)',
          opacity: uploading || processing ? 0.7 : 1
        }}
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-5 w-5 mr-2" 
          viewBox="0 0 24 24" 
          fill="currentColor"
        >
          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
        </svg>
        {uploading ? 'Enviando arquivo...' : processing ? 'Processando com IA...' : '📄 Selecionar Arquivo Word'}
        <input
          id="word-upload"
          type="file"
          accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={handleWordUpload}
          className="hidden"
          disabled={uploading || processing}
        />
      </label>
      
      {(uploading || processing) && (
        <div className="mt-3 flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-t-transparent mr-2" 
               style={{ borderColor: theme.colors.primary, borderTopColor: 'transparent' }}></div>
          <span className="text-sm" style={{ color: theme.colors.primary }}>
            {uploading ? 'Enviando arquivo...' : 'A IA está organizando seu conteúdo...'}
          </span>
        </div>
      )}
      
      <p className="text-xs mt-3" style={{ color: theme.colors.textSecondary }}>
        <strong>✨ Funcionalidade Inteligente:</strong> A IA irá extrair e organizar automaticamente o título, resumo, conteúdo, categoria e tags do seu documento Word. Suporte para arquivos .doc e .docx até 50MB.
      </p>
    </div>
  );
}
