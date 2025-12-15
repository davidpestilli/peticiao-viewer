import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not configured. Using mock data.')
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// Funções de consulta para cada componente

/**
 * Estrutura Real - Localidades
 */
export async function getLocalidades() {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('cache_localidades')
    .select('*')
    .order('nome')

  if (error) {
    console.error('Erro ao buscar localidades:', error)
    return []
  }
  return data || []
}

/**
 * Estrutura Real - Competências por localidade
 */
export async function getCompetenciasPorLocalidade(codigoLocalidade) {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('cache_estrutura_real')
    .select('codigo_competencia, nome_competencia')
    .eq('codigo_localidade', codigoLocalidade)
    .order('nome_competencia')

  if (error) {
    console.error('Erro ao buscar competências:', error)
    return []
  }

  // Remover duplicatas
  const unique = [...new Map(data.map(item => [item.codigo_competencia, item])).values()]
  return unique
}

/**
 * Estrutura Real - Classes por competência
 */
export async function getClassesPorCompetencia(codigoLocalidade, codigoCompetencia) {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('cache_estrutura_real')
    .select('codigo_classe, nome_classe')
    .eq('codigo_localidade', codigoLocalidade)
    .eq('codigo_competencia', codigoCompetencia)
    .order('nome_classe')

  if (error) {
    console.error('Erro ao buscar classes:', error)
    return []
  }

  const unique = [...new Map(data.map(item => [item.codigo_classe, item])).values()]
  return unique
}

/**
 * Estrutura Real - Assuntos por classe
 */
export async function getAssuntosPorClasse(codigoLocalidade, codigoCompetencia, codigoClasse) {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('cache_estrutura_real')
    .select('*')
    .eq('codigo_localidade', codigoLocalidade)
    .eq('codigo_competencia', codigoCompetencia)
    .eq('codigo_classe', codigoClasse)
    .order('nome_assunto')

  if (error) {
    console.error('Erro ao buscar assuntos:', error)
    return []
  }
  return data || []
}

/**
 * Estatísticas de Competências
 */
export async function getEstatisticasCompetencias(sistema = null) {
  if (!supabase) return []

  let query = supabase
    .from('cache_stats_competencias')
    .select('*')
    .order('taxa_sucesso', { ascending: false })

  if (sistema) {
    query = query.eq('sistema', sistema)
  }

  const { data, error } = await query

  if (error) {
    console.error('Erro ao buscar estatísticas:', error)
    return []
  }
  return data || []
}

/**
 * Estrutura do Erro - Resumo de classificações
 */
export async function getResumoClassificacoes() {
  if (!supabase) return { nao_analisados: 0, combinacao_impossivel: 0, erro_corrigivel: 0, erro_sistema: 0 }

  const { data, error } = await supabase
    .from('cache_resumo_classificacoes')
    .select('*')
    .single()

  if (error) {
    console.error('Erro ao buscar resumo:', error)
    return { nao_analisados: 0, combinacao_impossivel: 0, erro_corrigivel: 0, erro_sistema: 0 }
  }
  return data || { nao_analisados: 0, combinacao_impossivel: 0, erro_corrigivel: 0, erro_sistema: 0 }
}

/**
 * Estrutura do Erro - Competências com erros
 */
export async function getCompetenciasComErros(classificacao = null) {
  if (!supabase) return []

  let query = supabase
    .from('cache_erros_hierarquicos')
    .select('codigo_competencia, nome_competencia')

  if (classificacao && classificacao !== 'todos') {
    query = query.eq('classificacao', classificacao)
  }

  const { data, error } = await query

  if (error) {
    console.error('Erro ao buscar competências com erros:', error)
    return []
  }

  // Agrupar e contar
  const grouped = data.reduce((acc, item) => {
    const key = item.codigo_competencia
    if (!acc[key]) {
      acc[key] = { codigo: key, nome: item.nome_competencia, totalErros: 0 }
    }
    acc[key].totalErros++
    return acc
  }, {})

  return Object.values(grouped).sort((a, b) => b.totalErros - a.totalErros)
}

/**
 * Estrutura do Erro - Classes por competência
 */
export async function getClassesComErros(codigoCompetencia, classificacao = null) {
  if (!supabase) return []

  let query = supabase
    .from('cache_erros_hierarquicos')
    .select('codigo_classe, nome_classe')
    .eq('codigo_competencia', codigoCompetencia)

  if (classificacao && classificacao !== 'todos') {
    query = query.eq('classificacao', classificacao)
  }

  const { data, error } = await query

  if (error) {
    console.error('Erro ao buscar classes com erros:', error)
    return []
  }

  // Agrupar e contar
  const grouped = data.reduce((acc, item) => {
    const key = item.codigo_classe
    if (!acc[key]) {
      acc[key] = { codigo: key, nome: item.nome_classe, totalErros: 0 }
    }
    acc[key].totalErros++
    return acc
  }, {})

  return Object.values(grouped).sort((a, b) => b.totalErros - a.totalErros)
}

/**
 * Estrutura do Erro - Erros por classe
 */
export async function getErrosPorClasse(codigoCompetencia, codigoClasse, classificacao = null) {
  if (!supabase) return []

  let query = supabase
    .from('cache_erros_hierarquicos')
    .select('*')
    .eq('codigo_competencia', codigoCompetencia)
    .eq('codigo_classe', codigoClasse)

  if (classificacao && classificacao !== 'todos') {
    query = query.eq('classificacao', classificacao)
  }

  const { data, error } = await query.order('total_ocorrencias', { ascending: false })

  if (error) {
    console.error('Erro ao buscar erros:', error)
    return []
  }
  return data || []
}

/**
 * Verificador - Estatísticas gerais
 */
export async function getVerificacaoStats() {
  if (!supabase) return { total: 0, verificados: 0, nao_verificados: 0, divergentes: 0, taxa_divergencia: 0 }

  const { data, error } = await supabase
    .from('cache_verificacao_stats')
    .select('*')
    .single()

  if (error) {
    console.error('Erro ao buscar stats verificação:', error)
    return { total: 0, verificados: 0, nao_verificados: 0, divergentes: 0, taxa_divergencia: 0 }
  }
  return data || { total: 0, verificados: 0, nao_verificados: 0, divergentes: 0, taxa_divergencia: 0 }
}

/**
 * Verificador - Divergências agrupadas
 */
export async function getDivergenciasAgrupadas() {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('cache_divergencias_agrupadas')
    .select('*')
    .order('quantidade', { ascending: false })

  if (error) {
    console.error('Erro ao buscar divergências:', error)
    return []
  }

  // Formatar para o componente
  return (data || []).map(d => ({
    competencia_de: { codigo: d.codigo_competencia_de, nome: d.nome_competencia_de },
    competencia_para: { codigo: d.codigo_competencia_para, nome: d.nome_competencia_para },
    quantidade: d.quantidade,
    roteamentoConfirmado: d.roteamento_confirmado
  }))
}

/**
 * Verificador - Processos de um grupo de divergência
 */
export async function getProcessosDivergentes(codigoDe, codigoPara, page = 1, limit = 50) {
  if (!supabase) return { processos: [], total: 0, page: 1, totalPages: 1 }

  const offset = (page - 1) * limit

  const { data, error, count } = await supabase
    .from('cache_processos_divergentes')
    .select('*', { count: 'exact' })
    .eq('codigo_competencia_de', codigoDe)
    .eq('codigo_competencia_para', codigoPara)
    .order('data_verificacao', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('Erro ao buscar processos:', error)
    return { processos: [], total: 0, page: 1, totalPages: 1 }
  }

  return {
    processos: data || [],
    total: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / limit)
  }
}
