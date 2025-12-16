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
 * Estrutura Real - Todas as classes de uma localidade (modo flexível)
 */
export async function getTodasClassesPorLocalidade(codigoLocalidade) {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('cache_estrutura_real')
    .select('codigo_classe, nome_classe')
    .eq('codigo_localidade', codigoLocalidade)
    .order('nome_classe')

  if (error) {
    console.error('Erro ao buscar todas as classes:', error)
    return []
  }

  const unique = [...new Map(data.map(item => [item.codigo_classe, item])).values()]
  return unique
}

/**
 * Estrutura Real - Todos os assuntos de uma classe na localidade (modo flexível)
 */
export async function getTodosAssuntosPorClasse(codigoLocalidade, codigoClasse) {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('cache_estrutura_real')
    .select('*')
    .eq('codigo_localidade', codigoLocalidade)
    .eq('codigo_classe', codigoClasse)
    .order('nome_assunto')

  if (error) {
    console.error('Erro ao buscar todos os assuntos:', error)
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
 * Busca diretamente da tabela analise_erros_hierarquica (fonte real dos dados)
 * e soma os total_ocorrencias por classificação
 */
export async function getResumoClassificacoes() {
  if (!supabase) return { nao_analisados: 0, combinacao_impossivel: 0, erro_corrigivel: 0, erro_sistema: 0 }

  try {
    // Buscar todos os registros com paginação para calcular totais corretos
    const PAGE_SIZE = 1000
    let allData = []
    let offset = 0
    let hasMore = true

    while (hasMore) {
      const { data, error } = await supabase
        .from('analise_erros_hierarquica')
        .select('classificacao, total_ocorrencias')
        .range(offset, offset + PAGE_SIZE - 1)

      if (error) {
        console.error('Erro ao buscar resumo:', error)
        break
      }

      if (data && data.length > 0) {
        allData = allData.concat(data)
        offset += PAGE_SIZE
        hasMore = data.length === PAGE_SIZE
      } else {
        hasMore = false
      }
    }

    // Calcular totais por classificação
    const resumo = {
      nao_analisados: 0,
      combinacao_impossivel: 0,
      erro_corrigivel: 0,
      erro_sistema: 0
    }

    for (const row of allData) {
      const ocorrencias = row.total_ocorrencias || 1
      if (row.classificacao === null) {
        resumo.nao_analisados += ocorrencias
      } else if (row.classificacao === 'combinacao_impossivel') {
        resumo.combinacao_impossivel += ocorrencias
      } else if (row.classificacao === 'erro_corrigivel') {
        resumo.erro_corrigivel += ocorrencias
      } else if (row.classificacao === 'erro_sistema') {
        resumo.erro_sistema += ocorrencias
      }
    }

    return resumo
  } catch (error) {
    console.error('Erro ao buscar resumo:', error)
    return { nao_analisados: 0, combinacao_impossivel: 0, erro_corrigivel: 0, erro_sistema: 0 }
  }
}

/**
 * Estrutura do Erro - Competências com erros
 * Busca diretamente de analise_erros_hierarquica com paginação
 * @param {string|null} classificacao - null para não analisados, 'todos' para todos classificados, ou tipo específico
 */
export async function getCompetenciasComErros(classificacao = null) {
  if (!supabase) return []

  try {
    const PAGE_SIZE = 1000
    let allData = []
    let offset = 0
    let hasMore = true

    while (hasMore) {
      let query = supabase
        .from('analise_erros_hierarquica')
        .select('codigo_competencia, nome_competencia, total_ocorrencias, classificacao')
        .range(offset, offset + PAGE_SIZE - 1)

      // Filtrar por classificação
      if (classificacao === null) {
        // Por categorizar: classificacao IS NULL
        query = query.is('classificacao', null)
      } else if (classificacao === 'todos') {
        // Todos os classificados: classificacao IS NOT NULL
        query = query.not('classificacao', 'is', null)
      } else if (classificacao) {
        // Classificação específica
        query = query.eq('classificacao', classificacao)
      }

      const { data, error } = await query

      if (error) {
        console.error('Erro ao buscar competências:', error)
        break
      }

      if (data && data.length > 0) {
        allData = allData.concat(data)
        offset += PAGE_SIZE
        hasMore = data.length === PAGE_SIZE
      } else {
        hasMore = false
      }
    }

    // Agrupar e somar total_ocorrencias por competência
    const grouped = allData.reduce((acc, item) => {
      const key = item.codigo_competencia
      if (!acc[key]) {
        acc[key] = {
          codigo: key,
          nome: item.nome_competencia,
          totalErros: 0,
          totalNaoAnalisados: 0
        }
      }
      const ocorrencias = item.total_ocorrencias || 1
      acc[key].totalErros += ocorrencias
      if (item.classificacao === null) {
        acc[key].totalNaoAnalisados += ocorrencias
      }
      return acc
    }, {})

    return Object.values(grouped).sort((a, b) => b.totalErros - a.totalErros)
  } catch (error) {
    console.error('Erro ao buscar competências:', error)
    return []
  }
}

/**
 * Estrutura do Erro - Classes por competência
 * Busca diretamente de analise_erros_hierarquica com paginação
 */
export async function getClassesComErros(codigoCompetencia, classificacao = null) {
  if (!supabase) return []

  try {
    const PAGE_SIZE = 1000
    let allData = []
    let offset = 0
    let hasMore = true

    while (hasMore) {
      let query = supabase
        .from('analise_erros_hierarquica')
        .select('codigo_classe, nome_classe, total_ocorrencias, classificacao')
        .eq('codigo_competencia', codigoCompetencia)
        .range(offset, offset + PAGE_SIZE - 1)

      // Filtrar por classificação
      if (classificacao === null) {
        query = query.is('classificacao', null)
      } else if (classificacao === 'todos') {
        query = query.not('classificacao', 'is', null)
      } else if (classificacao) {
        query = query.eq('classificacao', classificacao)
      }

      const { data, error } = await query

      if (error) {
        console.error('Erro ao buscar classes:', error)
        break
      }

      if (data && data.length > 0) {
        allData = allData.concat(data)
        offset += PAGE_SIZE
        hasMore = data.length === PAGE_SIZE
      } else {
        hasMore = false
      }
    }

    // Agrupar e somar total_ocorrencias por classe
    const grouped = allData.reduce((acc, item) => {
      const key = item.codigo_classe
      if (!acc[key]) {
        acc[key] = {
          codigo: key,
          nome: item.nome_classe,
          totalErros: 0,
          totalNaoAnalisados: 0
        }
      }
      const ocorrencias = item.total_ocorrencias || 1
      acc[key].totalErros += ocorrencias
      if (item.classificacao === null) {
        acc[key].totalNaoAnalisados += ocorrencias
      }
      return acc
    }, {})

    return Object.values(grouped).sort((a, b) => b.totalErros - a.totalErros)
  } catch (error) {
    console.error('Erro ao buscar classes:', error)
    return []
  }
}

/**
 * Estrutura do Erro - Erros por classe
 * Busca diretamente de analise_erros_hierarquica com paginação
 */
export async function getErrosPorClasse(codigoCompetencia, codigoClasse, classificacao = null) {
  if (!supabase) return []

  try {
    const PAGE_SIZE = 1000
    let allData = []
    let offset = 0
    let hasMore = true

    while (hasMore) {
      let query = supabase
        .from('analise_erros_hierarquica')
        .select('*')
        .eq('codigo_competencia', codigoCompetencia)
        .eq('codigo_classe', codigoClasse)
        .order('total_ocorrencias', { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1)

      // Filtrar por classificação
      if (classificacao === null) {
        query = query.is('classificacao', null)
      } else if (classificacao === 'todos') {
        query = query.not('classificacao', 'is', null)
      } else if (classificacao) {
        query = query.eq('classificacao', classificacao)
      }

      const { data, error } = await query

      if (error) {
        console.error('Erro ao buscar erros:', error)
        break
      }

      if (data && data.length > 0) {
        allData = allData.concat(data)
        offset += PAGE_SIZE
        hasMore = data.length === PAGE_SIZE
      } else {
        hasMore = false
      }
    }

    return allData
  } catch (error) {
    console.error('Erro ao buscar erros:', error)
    return []
  }
}

/**
 * Verificador - Estatísticas gerais
 * Busca diretamente de processos_criados (igual ao backend do peticiao)
 */
export async function getVerificacaoStats() {
  if (!supabase) return { total: 0, verificados: 0, nao_verificados: 0, divergentes: 0, taxa_divergencia: 0 }

  try {
    // Buscar TODOS os processos com paginação (Supabase limita a 1000 por query)
    const TAMANHO_PAGINA = 1000
    let todosProcessos = []
    let offset = 0
    let temMais = true

    while (temMais) {
      const { data: pagina, error } = await supabase
        .from('processos_criados')
        .select('id, data_verificacao, competencias_divergem')
        .range(offset, offset + TAMANHO_PAGINA - 1)

      if (error) {
        console.error('Erro ao buscar processos:', error)
        break
      }

      if (!pagina || pagina.length === 0) {
        temMais = false
      } else {
        todosProcessos = todosProcessos.concat(pagina)
        offset += TAMANHO_PAGINA

        if (pagina.length < TAMANHO_PAGINA) {
          temMais = false
        }
      }
    }

    const todos = todosProcessos

    // Total de processos
    const total = todos?.length || 0

    // Processos já verificados
    const verificados = todos?.filter(p => p.data_verificacao !== null).length || 0

    // Processos não verificados
    const nao_verificados = total - verificados

    // Processos com divergência
    const divergentes = todos?.filter(p => p.competencias_divergem === true).length || 0

    // Taxa de divergência
    const taxa_divergencia = verificados > 0 ? (divergentes / verificados) * 100 : 0

    return {
      total,
      verificados,
      nao_verificados,
      divergentes,
      taxa_divergencia: Math.round(taxa_divergencia * 10) / 10
    }
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error)
    return { total: 0, verificados: 0, nao_verificados: 0, divergentes: 0, taxa_divergencia: 0 }
  }
}

/**
 * Verificador - Divergências agrupadas
 * Busca diretamente de processos_criados e agrupa (igual ao backend do peticiao)
 */
export async function getDivergenciasAgrupadas() {
  if (!supabase) return []

  try {
    // Buscar com paginação
    const TAMANHO_PAGINA = 1000
    let todosProcessos = []
    let offset = 0
    let temMais = true

    while (temMais) {
      const { data: pagina, error } = await supabase
        .from('processos_criados')
        .select(`
          codigo_competencia_peticionamento,
          nome_competencia_peticionamento,
          codigo_competencia_consulta,
          nome_competencia_consulta,
          roteamento_confirmado
        `)
        .eq('competencias_divergem', true)
        .range(offset, offset + TAMANHO_PAGINA - 1)

      if (error) {
        console.error('Erro ao buscar divergências:', error)
        break
      }

      if (!pagina || pagina.length === 0) {
        temMais = false
      } else {
        todosProcessos = todosProcessos.concat(pagina)
        offset += TAMANHO_PAGINA

        if (pagina.length < TAMANHO_PAGINA) {
          temMais = false
        }
      }
    }

    // Agrupar por combinação DE → PARA
    const grupos = {}

    for (const proc of todosProcessos) {
      const chave = `${proc.codigo_competencia_peticionamento}|${proc.codigo_competencia_consulta}`

      if (!grupos[chave]) {
        grupos[chave] = {
          competencia_de: {
            codigo: proc.codigo_competencia_peticionamento,
            nome: proc.nome_competencia_peticionamento
          },
          competencia_para: {
            codigo: proc.codigo_competencia_consulta,
            nome: proc.nome_competencia_consulta
          },
          quantidade: 0,
          quantidadeConfirmados: 0,
          roteamentoConfirmado: false
        }
      }

      grupos[chave].quantidade++

      if (proc.roteamento_confirmado === true) {
        grupos[chave].quantidadeConfirmados++
      }
    }

    // Marcar grupos onde TODOS os processos foram confirmados
    const resultado = Object.values(grupos).map(g => ({
      ...g,
      roteamentoConfirmado: g.quantidadeConfirmados === g.quantidade
    }))

    // Ordenar por quantidade (maior primeiro)
    resultado.sort((a, b) => b.quantidade - a.quantidade)

    return resultado
  } catch (error) {
    console.error('Erro ao buscar divergências agrupadas:', error)
    return []
  }
}

/**
 * Verificador - Processos de um grupo de divergência
 * Busca diretamente de processos_criados (igual ao backend do peticiao)
 */
export async function getProcessosDivergentes(codigoDe, codigoPara, page = 1, limit = 50) {
  if (!supabase) return { processos: [], total: 0, page: 1, totalPages: 1 }

  const offset = (page - 1) * limit

  try {
    console.log('[getProcessosDivergentes] Buscando processos:', { codigoDe, codigoPara, page, limit, offset })

    // Buscar total
    const { count, error: countError } = await supabase
      .from('processos_criados')
      .select('*', { count: 'exact', head: true })
      .eq('codigo_competencia_peticionamento', codigoDe)
      .eq('codigo_competencia_consulta', codigoPara)
      .eq('competencias_divergem', true)

    if (countError) {
      console.error('[getProcessosDivergentes] Erro ao contar:', countError)
    }

    console.log('[getProcessosDivergentes] Total encontrado:', count)

    // Buscar página (com JOIN para pegar classe e assunto de teste_combinacoes)
    const { data, error } = await supabase
      .from('processos_criados')
      .select(`
        numero_processo,
        codigo_competencia_peticionamento,
        nome_competencia_peticionamento,
        codigo_competencia_consulta,
        nome_competencia_consulta,
        data_verificacao,
        teste_combinacoes:teste_combinacao_id (
          codigo_classe,
          nome_classe,
          codigo_assunto,
          nome_assunto
        )
      `)
      .eq('codigo_competencia_peticionamento', codigoDe)
      .eq('codigo_competencia_consulta', codigoPara)
      .eq('competencias_divergem', true)
      .order('data_verificacao', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('[getProcessosDivergentes] Erro ao buscar processos:', error)
      return { processos: [], total: 0, page: 1, totalPages: 1 }
    }

    console.log('[getProcessosDivergentes] Processos encontrados:', data?.length || 0)

    // Mapear dados para o formato esperado (achatar o join)
    const processosMapeados = (data || []).map(proc => ({
      numero_processo: proc.numero_processo,
      codigo_competencia_peticionamento: proc.codigo_competencia_peticionamento,
      nome_competencia_peticionamento: proc.nome_competencia_peticionamento,
      codigo_competencia_consulta: proc.codigo_competencia_consulta,
      nome_competencia_consulta: proc.nome_competencia_consulta,
      data_verificacao: proc.data_verificacao,
      codigo_classe: proc.teste_combinacoes?.codigo_classe,
      nome_classe: proc.teste_combinacoes?.nome_classe,
      codigo_assunto: proc.teste_combinacoes?.codigo_assunto,
      nome_assunto: proc.teste_combinacoes?.nome_assunto
    }))

    return {
      processos: processosMapeados,
      total: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / limit)
    }
  } catch (error) {
    console.error('[getProcessosDivergentes] Erro geral:', error)
    return { processos: [], total: 0, page: 1, totalPages: 1 }
  }
}

// ==========================================================
// SELEÇÃO FLEXÍVEL DE ERROS
// Usa as tabelas de cache para performance (cache_erros_*)
// ==========================================================

/**
 * Helper para buscar com paginação
 */
async function buscarComPaginacao(tabela, select, queryBuilder = null, orderBy = null) {
  if (!supabase) return []
  
  const PAGE_SIZE = 1000
  let allData = []
  let offset = 0
  let hasMore = true

  while (hasMore) {
    let query = supabase
      .from(tabela)
      .select(select)
      .range(offset, offset + PAGE_SIZE - 1)

    if (queryBuilder) {
      query = queryBuilder(query)
    }
    
    if (orderBy) {
      query = query.order(orderBy)
    }

    const { data, error } = await query

    if (error) {
      console.error(`Erro ao buscar ${tabela}:`, error)
      break
    }

    if (data && data.length > 0) {
      allData = allData.concat(data)
      offset += PAGE_SIZE
      hasMore = data.length === PAGE_SIZE
    } else {
      hasMore = false
    }
  }

  return allData
}

/**
 * Busca todas as opções de competências, classes e assuntos que têm erros
 * Usa as tabelas de cache para performance
 */
export async function getTodasOpcoesErros() {
  if (!supabase) return { competencias: [], classes: [], assuntos: [] }

  try {
    // Buscar de todas as tabelas de cache em paralelo com paginação
    const [competencias, classes, assuntos] = await Promise.all([
      buscarComPaginacao('cache_erros_competencias', '*', null, 'codigo_competencia'),
      buscarComPaginacao('cache_erros_classes', '*', null, 'codigo_classe'),
      buscarComPaginacao('cache_erros_assuntos', '*', null, 'codigo_assunto')
    ])

    return {
      competencias: competencias.map(c => ({
        codigo: c.codigo_competencia,
        nome: c.descricao_competencia || c.codigo_competencia,
        descricao: c.descricao_competencia,
        quantidade: c.total_erros || 0
      })).sort((a, b) => b.quantidade - a.quantidade),
      classes: classes.map(c => ({
        codigo: c.codigo_classe,
        nome: c.nome_classe || c.codigo_classe,
        quantidade: c.total_erros || 0
      })).sort((a, b) => b.quantidade - a.quantidade),
      assuntos: assuntos.map(a => ({
        codigo: a.codigo_assunto,
        nome: a.nome_assunto || a.codigo_assunto,
        quantidade: a.total_erros || 0
      })).sort((a, b) => b.quantidade - a.quantidade)
    }
  } catch (error) {
    console.error('Erro ao buscar opções de erros:', error)
    return { competencias: [], classes: [], assuntos: [] }
  }
}

/**
 * Busca opções filtradas baseadas nas seleções atuais
 * Usa a tabela cache_erros_relacoes para filtros bidirecionais
 */
export async function getOpcoesErrosFiltradas(competencia, classe, assunto) {
  if (!supabase) return { competencias: [], classes: [], assuntos: [] }

  // Se nenhum filtro, retornar todas opções
  if (!competencia && !classe && !assunto) {
    return getTodasOpcoesErros()
  }

  try {
    // Buscar relações com os filtros aplicados
    const relacoes = await buscarComPaginacao(
      'cache_erros_relacoes',
      'codigo_competencia, codigo_classe, codigo_assunto, total_erros',
      (query) => {
        if (competencia) query = query.eq('codigo_competencia', competencia)
        if (classe) query = query.eq('codigo_classe', classe)
        if (assunto) query = query.eq('codigo_assunto', assunto)
        return query
      }
    )

    // Extrair IDs únicos das relações
    const competenciasIds = [...new Set(relacoes.map(r => r.codigo_competencia).filter(Boolean))]
    const classesIds = [...new Set(relacoes.map(r => r.codigo_classe).filter(Boolean))]
    const assuntosIds = [...new Set(relacoes.map(r => r.codigo_assunto).filter(Boolean))]

    // Buscar detalhes das tabelas de cache
    const BATCH_SIZE = 100

    const buscarDetalhesEmBatches = async (tabela, campoId, ids) => {
      if (ids.length === 0) return []
      
      let resultados = []
      for (let i = 0; i < ids.length; i += BATCH_SIZE) {
        const batch = ids.slice(i, i + BATCH_SIZE)
        const { data, error } = await supabase
          .from(tabela)
          .select('*')
          .in(campoId, batch)

        if (!error && data) {
          resultados = resultados.concat(data)
        }
      }
      return resultados
    }

    const [competencias, classes, assuntos] = await Promise.all([
      buscarDetalhesEmBatches('cache_erros_competencias', 'codigo_competencia', competenciasIds),
      buscarDetalhesEmBatches('cache_erros_classes', 'codigo_classe', classesIds),
      buscarDetalhesEmBatches('cache_erros_assuntos', 'codigo_assunto', assuntosIds)
    ])

    return {
      competencias: competencias.map(c => ({
        codigo: c.codigo_competencia,
        nome: c.descricao_competencia || c.codigo_competencia,
        descricao: c.descricao_competencia,
        quantidade: c.total_erros || 0
      })).sort((a, b) => b.quantidade - a.quantidade),
      classes: classes.map(c => ({
        codigo: c.codigo_classe,
        nome: c.nome_classe || c.codigo_classe,
        quantidade: c.total_erros || 0
      })).sort((a, b) => b.quantidade - a.quantidade),
      assuntos: assuntos.map(a => ({
        codigo: a.codigo_assunto,
        nome: a.nome_assunto || a.codigo_assunto,
        quantidade: a.total_erros || 0
      })).sort((a, b) => b.quantidade - a.quantidade)
    }
  } catch (error) {
    console.error('Erro ao buscar opções filtradas de erros:', error)
    return { competencias: [], classes: [], assuntos: [] }
  }
}

/**
 * Busca erros relacionados aos filtros selecionados
 * Busca da tabela analise_erros_hierarquica para detalhes
 */
export async function getErrosRelacionados(competencia, classe, assunto) {
  if (!supabase) return []

  // Se nenhum filtro, retornar vazio
  if (!competencia && !classe && !assunto) {
    return []
  }

  try {
    // Buscar erros com paginação
    const erros = await buscarComPaginacao(
      'analise_erros_hierarquica',
      `
        id,
        codigo_competencia,
        nome_competencia,
        codigo_classe,
        nome_classe,
        tipo_erro,
        mensagem_erro_exemplo,
        total_ocorrencias,
        classificacao,
        descricao_analise,
        solucao_sugerida,
        created_at,
        updated_at
      `,
      (query) => {
        if (competencia) query = query.eq('codigo_competencia', competencia)
        if (classe) query = query.eq('codigo_classe', classe)
        // Nota: assunto não está na tabela hierárquica
        return query
      },
      'total_ocorrencias'
    )

    // Se filtro de assunto foi aplicado, buscar também da teste_combinacoes
    // para pegar os erros específicos do assunto
    if (assunto) {
      const errosAssunto = await buscarComPaginacao(
        'teste_combinacoes',
        `
          id,
          codigo_competencia,
          nome_competencia,
          codigo_classe,
          nome_classe,
          codigo_assunto,
          nome_assunto,
          tipo_erro,
          mensagem_erro,
          created_at
        `,
        (query) => {
          query = query.eq('status', 'erro')
          if (competencia) query = query.eq('codigo_competencia', competencia)
          if (classe) query = query.eq('codigo_classe', classe)
          if (assunto) query = query.eq('codigo_assunto', assunto)
          return query
        }
      )

      // Agrupar erros por tipo para simular a estrutura hierárquica
      const agrupados = new Map()
      errosAssunto.forEach(e => {
        const key = `${e.codigo_competencia}|${e.codigo_classe}|${e.tipo_erro}`
        if (!agrupados.has(key)) {
          agrupados.set(key, {
            id: e.id,
            codigo_competencia: e.codigo_competencia,
            nome_competencia: e.nome_competencia,
            codigo_classe: e.codigo_classe,
            nome_classe: e.nome_classe,
            codigo_assunto: e.codigo_assunto,
            nome_assunto: e.nome_assunto,
            tipo_erro: e.tipo_erro,
            mensagem_erro_exemplo: e.mensagem_erro,
            total_ocorrencias: 1,
            created_at: e.created_at
          })
        } else {
          agrupados.get(key).total_ocorrencias++
        }
      })

      return Array.from(agrupados.values())
        .sort((a, b) => b.total_ocorrencias - a.total_ocorrencias)
    }

    return erros.sort((a, b) => (b.total_ocorrencias || 0) - (a.total_ocorrencias || 0))
  } catch (error) {
    console.error('Erro ao buscar erros relacionados:', error)
    return []
  }
}
