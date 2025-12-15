-- ============================================
-- MIGRAÇÃO: Tabelas de Cache para Seleção Flexível
-- Para o peticiao-viewer
-- ============================================

-- ============================================
-- 1. CACHE DE METADATA (substitui cache_localidades para filtros)
-- ============================================
CREATE TABLE IF NOT EXISTS cache_estrutura_real_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_localidade VARCHAR(50) NOT NULL UNIQUE,
    nome_localidade VARCHAR(255) NOT NULL,
    total_processos INTEGER DEFAULT 0,
    total_competencias INTEGER DEFAULT 0,
    total_classes INTEGER DEFAULT 0,
    total_assuntos INTEGER DEFAULT 0,
    ultima_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cache_meta_localidade ON cache_estrutura_real_metadata(codigo_localidade);

-- ============================================
-- 2. CACHE DE COMPETÊNCIAS ÚNICAS
-- ============================================
CREATE TABLE IF NOT EXISTS cache_estrutura_real_competencias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_localidade VARCHAR(50) NOT NULL,
    codigo_competencia VARCHAR(50) NOT NULL,
    descricao_competencia VARCHAR(255),
    total_combinacoes INTEGER DEFAULT 0,
    ultima_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT unique_comp_localidade UNIQUE (codigo_localidade, codigo_competencia)
);

CREATE INDEX IF NOT EXISTS idx_cache_comp_localidade ON cache_estrutura_real_competencias(codigo_localidade);
CREATE INDEX IF NOT EXISTS idx_cache_comp_codigo ON cache_estrutura_real_competencias(codigo_competencia);

-- ============================================
-- 3. CACHE DE CLASSES ÚNICAS
-- ============================================
CREATE TABLE IF NOT EXISTS cache_estrutura_real_classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_localidade VARCHAR(50) NOT NULL,
    codigo_classe VARCHAR(50) NOT NULL,
    nome_classe VARCHAR(255),
    total_combinacoes INTEGER DEFAULT 0,
    ultima_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT unique_classe_localidade UNIQUE (codigo_localidade, codigo_classe)
);

CREATE INDEX IF NOT EXISTS idx_cache_classe_localidade ON cache_estrutura_real_classes(codigo_localidade);
CREATE INDEX IF NOT EXISTS idx_cache_classe_codigo ON cache_estrutura_real_classes(codigo_classe);

-- ============================================
-- 4. CACHE DE ASSUNTOS ÚNICOS
-- ============================================
CREATE TABLE IF NOT EXISTS cache_estrutura_real_assuntos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_localidade VARCHAR(50) NOT NULL,
    codigo_assunto VARCHAR(50) NOT NULL,
    nome_assunto TEXT,
    total_ocorrencias INTEGER DEFAULT 0,
    ultima_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT unique_assunto_localidade UNIQUE (codigo_localidade, codigo_assunto)
);

CREATE INDEX IF NOT EXISTS idx_cache_assunto_localidade ON cache_estrutura_real_assuntos(codigo_localidade);
CREATE INDEX IF NOT EXISTS idx_cache_assunto_codigo ON cache_estrutura_real_assuntos(codigo_assunto);

-- ============================================
-- 5. CACHE DE RELAÇÕES (combinações válidas)
-- Esta é a tabela mais importante para filtros bidirecionais
-- ============================================
CREATE TABLE IF NOT EXISTS cache_estrutura_real_relacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_localidade VARCHAR(50) NOT NULL,
    codigo_competencia VARCHAR(50) NOT NULL,
    codigo_classe VARCHAR(50) NOT NULL,
    codigo_assunto VARCHAR(50) NOT NULL,
    total_ocorrencias INTEGER DEFAULT 0,
    ultima_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT unique_relacao UNIQUE (codigo_localidade, codigo_competencia, codigo_classe, codigo_assunto)
);

CREATE INDEX IF NOT EXISTS idx_cache_rel_localidade ON cache_estrutura_real_relacoes(codigo_localidade);
CREATE INDEX IF NOT EXISTS idx_cache_rel_competencia ON cache_estrutura_real_relacoes(codigo_competencia);
CREATE INDEX IF NOT EXISTS idx_cache_rel_classe ON cache_estrutura_real_relacoes(codigo_classe);
CREATE INDEX IF NOT EXISTS idx_cache_rel_assunto ON cache_estrutura_real_relacoes(codigo_assunto);
CREATE INDEX IF NOT EXISTS idx_cache_rel_comp_classe ON cache_estrutura_real_relacoes(codigo_localidade, codigo_competencia, codigo_classe);

-- ============================================
-- HABILITAR RLS E POLÍTICAS DE LEITURA
-- ============================================
ALTER TABLE cache_estrutura_real_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE cache_estrutura_real_competencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE cache_estrutura_real_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE cache_estrutura_real_assuntos ENABLE ROW LEVEL SECURITY;
ALTER TABLE cache_estrutura_real_relacoes ENABLE ROW LEVEL SECURITY;

-- Políticas de leitura pública
DROP POLICY IF EXISTS "Allow public read" ON cache_estrutura_real_metadata;
DROP POLICY IF EXISTS "Allow public read" ON cache_estrutura_real_competencias;
DROP POLICY IF EXISTS "Allow public read" ON cache_estrutura_real_classes;
DROP POLICY IF EXISTS "Allow public read" ON cache_estrutura_real_assuntos;
DROP POLICY IF EXISTS "Allow public read" ON cache_estrutura_real_relacoes;

CREATE POLICY "Allow public read" ON cache_estrutura_real_metadata FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON cache_estrutura_real_competencias FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON cache_estrutura_real_classes FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON cache_estrutura_real_assuntos FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON cache_estrutura_real_relacoes FOR SELECT USING (true);

-- ============================================
-- VERIFICAÇÃO
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '✅ Tabelas de cache para seleção flexível criadas!';
    RAISE NOTICE '📊 5 Tabelas:';
    RAISE NOTICE '   - cache_estrutura_real_metadata';
    RAISE NOTICE '   - cache_estrutura_real_competencias';
    RAISE NOTICE '   - cache_estrutura_real_classes';
    RAISE NOTICE '   - cache_estrutura_real_assuntos';
    RAISE NOTICE '   - cache_estrutura_real_relacoes';
    RAISE NOTICE '🔓 Políticas de leitura pública configuradas';
END $$;
