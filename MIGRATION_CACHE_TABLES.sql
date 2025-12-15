-- ============================================
-- TABELAS CACHE PARA PETICIAO-VIEWER
-- Site de visualização apenas leitura
-- ============================================

-- ============================================
-- 1. CACHE DE LOCALIDADES (Estrutura Real)
-- ============================================
CREATE TABLE IF NOT EXISTS cache_localidades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nome VARCHAR(255) NOT NULL,
    total_competencias INTEGER DEFAULT 0,
    total_classes INTEGER DEFAULT 0,
    total_assuntos INTEGER DEFAULT 0,
    ultima_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cache_localidades_codigo ON cache_localidades(codigo);

-- ============================================
-- 2. CACHE DE ESTRUTURA REAL (hierarquia completa)
-- ============================================
CREATE TABLE IF NOT EXISTS cache_estrutura_real (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_localidade VARCHAR(50) NOT NULL,
    codigo_competencia VARCHAR(50) NOT NULL,
    nome_competencia VARCHAR(255),
    codigo_classe VARCHAR(50) NOT NULL,
    nome_classe VARCHAR(255),
    codigo_assunto VARCHAR(50) NOT NULL,
    nome_assunto TEXT,
    total_testes INTEGER DEFAULT 0,
    total_sucesso INTEGER DEFAULT 0,
    ultima_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT unique_estrutura_real UNIQUE (
        codigo_localidade, codigo_competencia, codigo_classe, codigo_assunto
    )
);

CREATE INDEX IF NOT EXISTS idx_cache_estrutura_localidade ON cache_estrutura_real(codigo_localidade);
CREATE INDEX IF NOT EXISTS idx_cache_estrutura_competencia ON cache_estrutura_real(codigo_competencia);

-- ============================================
-- 3. CACHE DE ESTATÍSTICAS POR COMPETÊNCIA
-- ============================================
CREATE TABLE IF NOT EXISTS cache_stats_competencias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_competencia VARCHAR(50) NOT NULL,
    nome_competencia VARCHAR(255),
    sistema VARCHAR(50) NOT NULL,
    total_testes INTEGER DEFAULT 0,
    total_sucesso INTEGER DEFAULT 0,
    total_erros INTEGER DEFAULT 0,
    taxa_sucesso DECIMAL(5,2) DEFAULT 0,
    classes_testadas INTEGER DEFAULT 0,
    assuntos_testados INTEGER DEFAULT 0,
    total_auto_classificados INTEGER DEFAULT 0,
    ultima_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT unique_stats_comp UNIQUE (codigo_competencia, sistema)
);

CREATE INDEX IF NOT EXISTS idx_cache_stats_sistema ON cache_stats_competencias(sistema);
CREATE INDEX IF NOT EXISTS idx_cache_stats_taxa ON cache_stats_competencias(taxa_sucesso DESC);

-- ============================================
-- 4. CACHE DE RESUMO DE CLASSIFICAÇÕES (Estrutura do Erro)
-- ============================================
CREATE TABLE IF NOT EXISTS cache_resumo_classificacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nao_analisados INTEGER DEFAULT 0,
    combinacao_impossivel INTEGER DEFAULT 0,
    erro_corrigivel INTEGER DEFAULT 0,
    erro_sistema INTEGER DEFAULT 0,
    total_geral INTEGER DEFAULT 0,
    ultima_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir registro inicial se não existir
INSERT INTO cache_resumo_classificacoes (nao_analisados, combinacao_impossivel, erro_corrigivel, erro_sistema)
VALUES (0, 0, 0, 0)
ON CONFLICT DO NOTHING;

-- ============================================
-- 5. CACHE DE ERROS HIERÁRQUICOS
-- ============================================
CREATE TABLE IF NOT EXISTS cache_erros_hierarquicos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_competencia VARCHAR(50) NOT NULL,
    nome_competencia VARCHAR(255),
    codigo_classe VARCHAR(50) NOT NULL,
    nome_classe VARCHAR(255),
    tipo_erro VARCHAR(100),
    mensagem_erro_exemplo TEXT,
    mensagem_erro_hash VARCHAR(64),
    classificacao VARCHAR(50),
    descricao_analise TEXT,
    solucao_sugerida TEXT,
    total_ocorrencias INTEGER DEFAULT 0,
    ultima_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cache_erros_competencia ON cache_erros_hierarquicos(codigo_competencia);
CREATE INDEX IF NOT EXISTS idx_cache_erros_classe ON cache_erros_hierarquicos(codigo_classe);
CREATE INDEX IF NOT EXISTS idx_cache_erros_classificacao ON cache_erros_hierarquicos(classificacao);

-- ============================================
-- 6. CACHE DE VERIFICAÇÃO (Confirmar Competências)
-- ============================================
CREATE TABLE IF NOT EXISTS cache_verificacao_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    total INTEGER DEFAULT 0,
    verificados INTEGER DEFAULT 0,
    nao_verificados INTEGER DEFAULT 0,
    divergentes INTEGER DEFAULT 0,
    taxa_divergencia DECIMAL(5,2) DEFAULT 0,
    ultima_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir registro inicial se não existir
INSERT INTO cache_verificacao_stats (total, verificados, nao_verificados, divergentes)
VALUES (0, 0, 0, 0)
ON CONFLICT DO NOTHING;

-- ============================================
-- 7. CACHE DE DIVERGÊNCIAS AGRUPADAS
-- ============================================
CREATE TABLE IF NOT EXISTS cache_divergencias_agrupadas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_competencia_de VARCHAR(50) NOT NULL,
    nome_competencia_de VARCHAR(255),
    codigo_competencia_para VARCHAR(50) NOT NULL,
    nome_competencia_para VARCHAR(255),
    quantidade INTEGER DEFAULT 0,
    roteamento_confirmado BOOLEAN DEFAULT FALSE,
    ultima_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT unique_divergencia UNIQUE (codigo_competencia_de, codigo_competencia_para)
);

CREATE INDEX IF NOT EXISTS idx_cache_divergencias_de ON cache_divergencias_agrupadas(codigo_competencia_de);
CREATE INDEX IF NOT EXISTS idx_cache_divergencias_para ON cache_divergencias_agrupadas(codigo_competencia_para);

-- ============================================
-- 8. CACHE DE PROCESSOS DIVERGENTES (para expandir grupos)
-- ============================================
CREATE TABLE IF NOT EXISTS cache_processos_divergentes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_processo VARCHAR(20) NOT NULL,
    codigo_competencia_de VARCHAR(50) NOT NULL,
    codigo_competencia_para VARCHAR(50) NOT NULL,
    nome_classe VARCHAR(255),
    nome_assunto TEXT,
    data_verificacao TIMESTAMP WITH TIME ZONE,
    ultima_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cache_proc_div_competencias
    ON cache_processos_divergentes(codigo_competencia_de, codigo_competencia_para);

-- ============================================
-- HABILITAR RLS (Row Level Security) PARA LEITURA PÚBLICA
-- ============================================

-- Desabilitar RLS para permitir leitura anônima
ALTER TABLE cache_localidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE cache_estrutura_real ENABLE ROW LEVEL SECURITY;
ALTER TABLE cache_stats_competencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE cache_resumo_classificacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE cache_erros_hierarquicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE cache_verificacao_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE cache_divergencias_agrupadas ENABLE ROW LEVEL SECURITY;
ALTER TABLE cache_processos_divergentes ENABLE ROW LEVEL SECURITY;

-- Criar políticas de leitura pública (SELECT para anon)
CREATE POLICY "Allow public read" ON cache_localidades FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON cache_estrutura_real FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON cache_stats_competencias FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON cache_resumo_classificacoes FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON cache_erros_hierarquicos FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON cache_verificacao_stats FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON cache_divergencias_agrupadas FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON cache_processos_divergentes FOR SELECT USING (true);

-- ============================================
-- VERIFICAÇÃO
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '✅ Tabelas cache criadas com sucesso!';
    RAISE NOTICE '📊 8 Tabelas de cache para peticiao-viewer';
    RAISE NOTICE '🔓 Políticas de leitura pública configuradas';
END $$;
