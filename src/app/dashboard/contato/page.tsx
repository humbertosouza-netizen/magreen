'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import theme from '@/styles/theme';

export default function Contato() {
	const router = useRouter();
	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [subject, setSubject] = useState('');
	const [message, setMessage] = useState('');

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const subjectText = subject.trim() || 'Contato via Dashboard MAGREEN';
		const bodyLines = [
			name ? `Nome: ${name}` : '',
			email ? `E-mail: ${email}` : '',
			'',
			message || ''
		].filter(Boolean);
		const mailto = `mailto:contato@magreen.org?subject=${encodeURIComponent(subjectText)}&body=${encodeURIComponent(bodyLines.join('\n'))}`;
		window.location.href = mailto;
	};

	return (
		<main className="px-4 sm:px-6 lg:px-8 py-8 max-w-4xl mx-auto">
			{/* Botão de voltar */}
			<div className="mb-6">
				<button
					onClick={() => router.back()}
					className="flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors blog-clickable-element"
					style={{
						backgroundColor: 'rgba(31, 41, 55, 0.8)',
						borderColor: theme.colors.primary + '40',
						color: theme.colors.textPrimary
					}}
				>
					<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
					</svg>
					Voltar
				</button>
			</div>

			<section className="bg-white/70 dark:bg-black/30 backdrop-blur rounded-xl shadow-sm border border-black/5 dark:border-white/10 p-6 sm:p-8">
				<header className="mb-6 sm:mb-8">
					<h1 className="text-2xl sm:text-3xl font-bold">📩 Fale Conosco</h1>
					<p className="text-sm opacity-80 mt-1">Tem dúvidas, sugestões ou parcerias? Estamos por aqui.</p>
				</header>

				<div className="space-y-6 sm:space-y-8 leading-relaxed">
					{/* Canais oficiais */}
					<div>
						<h2 className="text-xl font-semibold mb-3">Canais Oficiais</h2>
						<ul className="list-disc pl-6 space-y-2">
							<li>📧 E-mail: <a href="mailto:contato@magreen.org" className="text-blue-600 hover:underline">contato@magreen.org</a></li>
							<li>📸 Instagram: <a href="https://instagram.com/magreen.oficial" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">@magreen.oficial</a></li>
							<li>▶️ YouTube: <a href="https://www.youtube.com/results?search_query=MAGREEN+Cultivo+Real" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">MAGREEN Cultivo Real</a></li>
							<li>🌐 Site Oficial: <a href="https://www.magreen.org" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">www.magreen.org</a></li>
						</ul>
					</div>

					{/* Seção de formulário removida conforme solicitado */}
				</div>
			</section>
		</main>
	);
}


