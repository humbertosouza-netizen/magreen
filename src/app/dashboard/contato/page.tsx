'use client';

import { useState } from 'react';

export default function Contato() {
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
		const mailto = `mailto:contato@magreen.com.br?subject=${encodeURIComponent(subjectText)}&body=${encodeURIComponent(bodyLines.join('\n'))}`;
		window.location.href = mailto;
	};

	return (
		<main className="px-4 sm:px-6 lg:px-8 py-8 max-w-4xl mx-auto">
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
							<li>📧 E-mail: <a href="mailto:contato@magreen.com.br" className="text-blue-600 hover:underline">contato@magreen.com.br</a></li>
							<li>📸 Instagram: <a href="https://instagram.com/magreen.oficial" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">@magreen.oficial</a></li>
							<li>▶️ YouTube: <a href="https://www.youtube.com/results?search_query=MAGREEN+Cultivo+Real" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">MAGREEN Cultivo Real</a></li>
							<li>🌐 Site Oficial (fictício): <a href="https://www.magreen.com.br" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">www.magreen.com.br</a></li>
						</ul>
					</div>

					{/* Seção de formulário removida conforme solicitado */}
				</div>
			</section>
		</main>
	);
}


