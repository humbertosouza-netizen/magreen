'use client';

import { useRouter } from 'next/navigation';
import theme from '@/styles/theme';

export default function SobreNos() {
	const router = useRouter();

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
					<h1 className="text-2xl sm:text-3xl font-bold">🌱 APRESENTAÇÃO INSTITUCIONAL – MAGNIFICÊNCIA (MAGREEN)</h1>
				</header>

				<div className="space-y-6 sm:space-y-8 leading-relaxed">
					{/* Quem Somos */}
					<div>
						<h2 className="text-xl font-semibold mb-2">🔹 Quem Somos</h2>
						<p>
							Magnificência, nome social MAGREEN, é um projeto que une ciência, arte e consciência no cultivo indoor de cannabis. Nascemos do desejo de tornar o cultivo acessível, técnico e significativo para todos — de iniciantes curiosos a cultivadores experientes que buscam alto desempenho. Cultivamos mais que plantas: cultivamos autonomia, bem-estar e conhecimento real.
						</p>
					</div>

					<hr className="border-black/10 dark:border-white/10" />

					{/* Missão */}
					<div>
						<h2 className="text-xl font-semibold mb-2">🔹 Nossa Missão</h2>
						<p>
							Capacitar pessoas a cultivarem com qualidade, consciência e autonomia, oferecendo conteúdos técnicos, experimentais e educativos que inspirem uma nova geração de growers conscientes, conectados à ciência e à natureza.
						</p>
					</div>

					<hr className="border-black/10 dark:border-white/10" />

					{/* Visão */}
					<div>
						<h2 className="text-xl font-semibold mb-2">🔹 Nossa Visão</h2>
						<p>
							Ser referência no Brasil e na América Latina como plataforma de formação, experimentação e inovação em cultivo indoor de cannabis, promovendo boas práticas, sustentabilidade e valorização do autocultivo responsável.
						</p>
					</div>

					<hr className="border-black/10 dark:border-white/10" />

					{/* Valores */}
					<div>
						<h2 className="text-xl font-semibold mb-3">🔹 Nossos Valores</h2>
						<ul className="list-disc pl-6 space-y-2">
							<li>
								<span className="font-medium">✅ Ciência e Verdade</span> – dados reais, experimentos práticos e resultados transparentes.
							</li>
							<li>
								<span className="font-medium">✅ Sustentabilidade</span> – uso consciente de recursos, materiais reaproveitados e práticas de controle biológico.
							</li>
							<li>
								<span className="font-medium">✅ Liberdade com Responsabilidade</span> – defendemos o autocultivo como prática de autonomia e cuidado pessoal.
							</li>
							<li>
								<span className="font-medium">✅ Educação como Potência</span> – todo conhecimento só tem sentido se for compartilhado.
							</li>
							<li>
								<span className="font-medium">✅ Comunidade</span> – acreditamos na construção coletiva e no poder do diálogo entre cultivadores.
							</li>
						</ul>
					</div>

					<hr className="border-black/10 dark:border-white/10" />

					{/* O que encontrará */}
					<div>
						<h2 className="text-xl font-semibold mb-3">🔹 O Que Você Vai Encontrar Aqui</h2>
						<ul className="list-disc pl-6 space-y-2">
							<li>🔬 Blog de cultivos reais: experiências detalhadas com registro técnico (PPFD, CE, pH, etc.).</li>
							<li>🌿 Strain Lab: desenvolvimento e análise de variedades genéticas com foco em tricomas e terpenos.</li>
							<li>📚 Cursos para cultivadores: formações práticas para quem quer começar ou se especializar.</li>
							<li>📊 Diário de cultivo: espaço para usuários registrarem suas próprias jornadas.</li>
							<li>📲 Conteúdo nas redes sociais: dicas rápidas, bastidores, tutoriais, comparações e bastidores em tempo real.</li>
						</ul>
					</div>

					<hr className="border-black/10 dark:border-white/10" />

					{/* Redes Oficiais */}
					<div>
						<h2 className="text-xl font-semibold mb-3">Redes Oficiais</h2>
						<ul className="list-disc pl-6 space-y-2">
							<li>📸 Instagram: <span className="font-medium">@magreen.oficial</span></li>
							<li>▶️ YouTube: <span className="font-medium">MAGREEN Cultivo Real</span></li>
							<li>🌐 Site Oficial: <span className="font-medium">www.magreen.org</span></li>
							<li>📩 Contato: <a href="mailto:contato@magreen.org" className="text-blue-600 hover:underline">contato@magreen.org</a></li>
						</ul>
					</div>

					<hr className="border-black/10 dark:border-white/10" />

					{/* Frase de impacto */}
					<div>
						<h2 className="text-xl font-semibold mb-2">🔹 Frase de Impacto</h2>
						<p className="text-lg font-semibold">MAGREEN – Cultivo real, ciência aplicada, consciência cultivada.</p>
					</div>
				</div>
			</section>
		</main>
	);
}


