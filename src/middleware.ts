import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Definir as variáveis que serão usadas no middleware
const supabaseUrl = 'https://xgeidrcncustrvhsdwoj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnZWlkcmNuY3VzdHJ2aHNkd29qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxMzQzNTEsImV4cCI6MjA2MTcxMDM1MX0.wV4BO1KeWCaPSNNXwpVhXAfZ-n7jwoA3tV9l2SmpgJY';

// Lista de rotas públicas que não precisam de autenticação
const publicRoutes = ['/login', '/register', '/recuperar-senha', '/blog'];

// Cache para armazenar se o usuário está autenticado ou não
let authCache: {
  [key: string]: {
    timestamp: number;
    authenticated: boolean;
  }
} = {};

// Tempo de expiração do cache em milissegundos (5 segundos)
const CACHE_EXPIRATION = 5000;

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  
  // Verificar se a rota atual é uma rota pública
  const url = req.nextUrl.pathname;
  
  // Se for uma rota pública ou recurso estático, permitir acesso imediato
  if (publicRoutes.some(route => url.startsWith(route)) || 
      url.includes('/_next/') || 
      url.includes('/favicon.ico')) {
    return res;
  }
  
  // Verificar se temos a autenticação em cache para este cookie de sessão
  const sessionCookie = req.cookies.get('sb-auth-token')?.value || '';
  const cacheKey = sessionCookie.substring(0, 32); // Usar apenas parte do token como chave
  const currentTime = Date.now();
  
  // Se temos o cache válido, usá-lo para decidir
  if (authCache[cacheKey] && (currentTime - authCache[cacheKey].timestamp) < CACHE_EXPIRATION) {
    // Se o usuário não estiver autenticado e tentar acessar rota protegida, redirecionar
    if (!authCache[cacheKey].authenticated && url.startsWith('/dashboard')) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
    // Se o usuário estiver autenticado e tentar acessar login, redirecionar para dashboard
    else if (authCache[cacheKey].authenticated && url.startsWith('/login')) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    return res;
  }
  
  // Se não temos cache ou expirou, verificar autenticação
  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          res.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          res.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();
  
  // Atualizar o cache
  authCache[cacheKey] = {
    timestamp: currentTime,
    authenticated: !!session
  };
  
  // Limpar caches antigos a cada 100 requisições (aproximadamente)
  if (Math.random() < 0.01) {
    // Limpar caches mais antigos que o tempo de expiração
    Object.keys(authCache).forEach(key => {
      if (currentTime - authCache[key].timestamp > CACHE_EXPIRATION) {
        delete authCache[key];
      }
    });
  }

  // Se o usuário não estiver autenticado e tentar acessar a rota dashboard, redireciona para login
  if (!session && url.startsWith('/dashboard')) {
    const redirectUrl = new URL('/login', req.url);
    return NextResponse.redirect(redirectUrl);
  }

  // Se o usuário estiver autenticado e tentar acessar a rota login, redireciona para dashboard/estudos
  if (session && url.startsWith('/login')) {
    const redirectUrl = new URL('/dashboard/estudos', req.url);
    return NextResponse.redirect(redirectUrl);
  }

  return res;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|images|public|favicon.ico).*)'],
}; 