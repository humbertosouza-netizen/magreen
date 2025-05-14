import Link from 'next/link';
import { redirect } from 'next/navigation';

export default function Home() {
  // Redirecionar para a página de estudos
  redirect('/dashboard/estudos');
  
  // Este código não será executado devido ao redirecionamento, 
  // mas é mantido como fallback
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-6">Bem-vindo ao Dashboard App</h1>
        <p className="text-lg mb-8">Uma aplicação de exemplo usando Next.js e Supabase</p>
        <div className="flex justify-center gap-4">
          <Link 
            href="/dashboard/estudos" 
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Acessar Estudos
          </Link>
        </div>
      </div>
    </main>
  );
}
