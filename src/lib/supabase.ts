import { createBrowserClient } from '@supabase/ssr';

// Definir as variáveis diretamente
const supabaseUrl = 'https://xgeidrcncustrvhsdwoj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnZWlkcmNuY3VzdHJ2aHNkd29qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxMzQzNTEsImV4cCI6MjA2MTcxMDM1MX0.wV4BO1KeWCaPSNNXwpVhXAfZ-n7jwoA3tV9l2SmpgJY';

// Opções otimizadas para o cliente
const clientOptions = {
  auth: {
    persistSession: true, // Manter session entre páginas
    autoRefreshToken: true, // Renovar token automaticamente
    detectSessionInUrl: false, // Não detectar session na URL (para SPA)
  },
  realtime: {
    params: {
      eventsPerSecond: 1 // Limitar eventos de realtime
    }
  }
};

// Criar um cliente único e exportá-lo
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey, clientOptions); 