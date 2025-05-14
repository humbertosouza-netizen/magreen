-- Criar a tabela de notificações
CREATE TABLE IF NOT EXISTS notificacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descricao TEXT,
  tipo TEXT CHECK (tipo IN ('evento', 'webinar', 'conteudo', 'interacao')),
  data TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  lida BOOLEAN DEFAULT false,
  link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Estabelecer segurança em nível de linha (RLS)
ALTER TABLE notificacoes ENABLE ROW LEVEL SECURITY;

-- Criar políticas para que os usuários possam ver/atualizar apenas suas próprias notificações
CREATE POLICY "Usuários podem ver suas próprias notificações" 
  ON notificacoes FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias notificações" 
  ON notificacoes FOR UPDATE 
  USING (auth.uid() = user_id);

-- Criar índices para otimizar consultas comuns
CREATE INDEX IF NOT EXISTS notificacoes_user_id_idx ON notificacoes (user_id);
CREATE INDEX IF NOT EXISTS notificacoes_lida_idx ON notificacoes (user_id, lida);
CREATE INDEX IF NOT EXISTS notificacoes_tipo_idx ON notificacoes (user_id, tipo);

-- Função para criar notificações para um usuário
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_titulo TEXT,
  p_descricao TEXT,
  p_tipo TEXT,
  p_link TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO notificacoes (user_id, titulo, descricao, tipo, link)
  VALUES (p_user_id, p_titulo, p_descricao, p_tipo, p_link)
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para marcar notificações como lidas
CREATE OR REPLACE FUNCTION mark_notification_as_read(
  p_notification_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT user_id INTO v_user_id FROM notificacoes WHERE id = p_notification_id;
  
  -- Verificar se a notificação pertence ao usuário atual
  IF v_user_id != auth.uid() THEN
    RETURN false;
  END IF;
  
  UPDATE notificacoes SET lida = true WHERE id = p_notification_id;
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para marcar todas as notificações de um usuário como lidas
CREATE OR REPLACE FUNCTION mark_all_notifications_as_read() 
RETURNS VOID AS $$
BEGIN
  UPDATE notificacoes SET lida = true WHERE user_id = auth.uid() AND lida = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Exemplos de inserção de dados para testes (comente em produção)
-- INSERT INTO notificacoes (user_id, titulo, descricao, tipo, link) 
-- VALUES 
--   ('ID_DO_USUÁRIO', 'Webinar: Introdução ao Next.js', 'Participe do nosso webinar sobre Next.js e aprenda a construir aplicações modernas.', 'webinar', 'https://exemplo.com/webinar-nextjs'),
--   ('ID_DO_USUÁRIO', 'Novo conteúdo disponível', 'Acabamos de adicionar novos tutoriais sobre Supabase e autenticação.', 'conteudo', 'https://exemplo.com/tutoriais-supabase'),
--   ('ID_DO_USUÁRIO', 'Evento presencial: Meetup de desenvolvedores', 'Venha participar do nosso encontro mensal de desenvolvedores front-end.', 'evento', 'https://exemplo.com/meetup-devs'),
--   ('ID_DO_USUÁRIO', 'Maria comentou no seu post', 'Maria deixou um comentário no seu projeto "Dashboard React".', 'interacao', 'https://exemplo.com/posts/15'); 