import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Hook customizado para gerenciar filtragem bidirecional de competências, classes e assuntos
 * Permite começar a seleção por qualquer elemento (competência, classe ou assunto)
 * e atualiza dinamicamente as opções disponíveis nos outros elementos
 *
 * IMPORTANTE: Este hook usa as tabelas de cache específicas:
 * - cache_estrutura_real_competencias
 * - cache_estrutura_real_classes
 * - cache_estrutura_real_assuntos
 * - cache_estrutura_real_relacoes
 *
 * @param {string} codigoLocalidade - Código da localidade para filtrar
 * @returns {object} Estado e funções para gerenciar a seleção bidirecional
 */
export function useFiltrosBidirecionais(codigoLocalidade) {
  // Estados de seleção atual
  const [selecoes, setSelecoes] = useState({
    competencia: null,
    classe: null,
    assunto: null
  })

  // Estados de opções disponíveis (filtradas dinamicamente baseado nas seleções)
  const [opcoesDisponiveis, setOpcoesDisponiveis] = useState({
    competencias: [],
    classes: [],
    assuntos: []
  })

  // Estados de opções totais (sem filtro - para referência)
  const [opcaoesTotais, setOpcaoesTotais] = useState({
    competencias: [],
    classes: [],
    assuntos: []
  })

  // Estados de controle
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState(null)
  const [carregamentoInicial, setCarregamentoInicial] = useState(true)

  /**
   * Busca todos os registros com paginação para evitar limite de 1000 do Supabase
   */
  const buscarTodosComPaginacao = async (tabela, select, filtros = {}) => {
    let todosRegistros = []
    let offset = 0
    const TAMANHO_PAGINA = 1000
    let temMais = true

    while (temMais) {
      let query = supabase
        .from(tabela)
        .select(select)
        .range(offset, offset + TAMANHO_PAGINA - 1)

      // Aplicar filtros
      Object.entries(filtros).forEach(([campo, valor]) => {
        if (valor !== null && valor !== undefined) {
          query = query.eq(campo, valor)
        }
      })

      const { data, error } = await query

      if (error) throw error

      if (data && data.length > 0) {
        todosRegistros = todosRegistros.concat(data)
        offset += TAMANHO_PAGINA
        temMais = data.length === TAMANHO_PAGINA
      } else {
        temMais = false
      }
    }

    return todosRegistros
  }

  /**
   * Busca todos os registros de uma tabela com paginação
   */
  const buscarTodosRegistros = async (tabela, select, codigoLoc, orderBy = null) => {
    let todosRegistros = []
    let offset = 0
    const TAMANHO_PAGINA = 1000
    let temMais = true

    while (temMais) {
      let query = supabase
        .from(tabela)
        .select(select)
        .eq('codigo_localidade', codigoLoc)
        .range(offset, offset + TAMANHO_PAGINA - 1)

      if (orderBy) {
        query = query.order(orderBy)
      }

      const { data, error } = await query

      if (error) throw error

      if (data && data.length > 0) {
        todosRegistros = todosRegistros.concat(data)
        offset += TAMANHO_PAGINA
        temMais = data.length === TAMANHO_PAGINA
      } else {
        temMais = false
      }
    }

    return todosRegistros
  }

  /**
   * Carrega todas as opções iniciais das tabelas de cache
   */
  const carregarOpcaoesTotais = async () => {
    if (!codigoLocalidade || !supabase) return

    setLoading(true)
    setErro(null)

    try {
      // Buscar competências com paginação
      const competenciasData = await buscarTodosRegistros(
        'cache_estrutura_real_competencias',
        'codigo_competencia, descricao_competencia, total_combinacoes',
        codigoLocalidade,
        'descricao_competencia'
      )

      const competencias = competenciasData.map(c => ({
        codigo: c.codigo_competencia,
        descricao: c.descricao_competencia || `Competência ${c.codigo_competencia}`,
        total_combinacoes: c.total_combinacoes
      }))

      // Buscar classes com paginação
      const classesData = await buscarTodosRegistros(
        'cache_estrutura_real_classes',
        'codigo_classe, nome_classe, total_combinacoes',
        codigoLocalidade,
        'nome_classe'
      )

      const classes = classesData.map(c => ({
        codigo: c.codigo_classe,
        nome: c.nome_classe || `Classe ${c.codigo_classe}`,
        total_combinacoes: c.total_combinacoes
      }))

      // Buscar assuntos com paginação (pode ter muitos!)
      const assuntosData = await buscarTodosRegistros(
        'cache_estrutura_real_assuntos',
        'codigo_assunto, nome_assunto, total_ocorrencias',
        codigoLocalidade,
        'nome_assunto'
      )

      const assuntos = assuntosData.map(a => ({
        codigo: a.codigo_assunto,
        nome: a.nome_assunto || `Assunto ${a.codigo_assunto}`,
        total_ocorrencias: a.total_ocorrencias
      }))

      const opcoes = {
        competencias,
        classes,
        assuntos
      }

      console.log(`[useFiltrosBidirecionais] Opções carregadas: ${competencias.length} competências, ${classes.length} classes, ${assuntos.length} assuntos`)

      setOpcaoesTotais(opcoes)
      setOpcoesDisponiveis(opcoes)
    } catch (error) {
      console.error('Erro ao carregar opções totais:', error)
      setErro(error.message || 'Erro ao carregar opções. Tente novamente.')
    } finally {
      setLoading(false)
      setCarregamentoInicial(false)
    }
  }

  /**
   * Carrega opções filtradas baseado nas seleções usando a tabela de relações
   */
  const carregarOpcoesFiltradas = async () => {
    if (!codigoLocalidade || !supabase) return

    const temSelecao = selecoes.competencia || selecoes.classe || selecoes.assunto
    if (!temSelecao) {
      setOpcoesDisponiveis(opcaoesTotais)
      return
    }

    setLoading(true)
    setErro(null)

    try {
      // Buscar relações filtradas com paginação
      const filtros = {
        codigo_localidade: codigoLocalidade
      }

      if (selecoes.competencia) {
        filtros.codigo_competencia = selecoes.competencia.codigo
      }
      if (selecoes.classe) {
        filtros.codigo_classe = selecoes.classe.codigo
      }
      if (selecoes.assunto) {
        filtros.codigo_assunto = selecoes.assunto.codigo
      }

      const relacoes = await buscarTodosComPaginacao(
        'cache_estrutura_real_relacoes',
        'codigo_competencia, codigo_classe, codigo_assunto',
        filtros
      )

      console.log(`[useFiltrosBidirecionais] Relações encontradas: ${relacoes.length}`)

      // Extrair IDs únicos das relações
      const competenciasIds = [...new Set(relacoes.map(r => r.codigo_competencia))]
      const classesIds = [...new Set(relacoes.map(r => r.codigo_classe))]
      const assuntosIds = [...new Set(relacoes.map(r => r.codigo_assunto))]

      // Buscar detalhes das tabelas específicas
      const BATCH_SIZE = 100

      // Helper para buscar com batching (evitar limite do .in())
      const buscarComBatching = async (tabela, campoId, ids, selectFields) => {
        if (ids.length === 0) return []

        let resultados = []
        for (let i = 0; i < ids.length; i += BATCH_SIZE) {
          const batch = ids.slice(i, i + BATCH_SIZE)
          const { data, error } = await supabase
            .from(tabela)
            .select(selectFields)
            .eq('codigo_localidade', codigoLocalidade)
            .in(campoId, batch)

          if (error) throw error
          resultados = resultados.concat(data || [])
        }
        return resultados
      }

      const [competenciasData, classesData, assuntosData] = await Promise.all([
        buscarComBatching(
          'cache_estrutura_real_competencias',
          'codigo_competencia',
          competenciasIds,
          'codigo_competencia, descricao_competencia, total_combinacoes'
        ),
        buscarComBatching(
          'cache_estrutura_real_classes',
          'codigo_classe',
          classesIds,
          'codigo_classe, nome_classe, total_combinacoes'
        ),
        buscarComBatching(
          'cache_estrutura_real_assuntos',
          'codigo_assunto',
          assuntosIds,
          'codigo_assunto, nome_assunto, total_ocorrencias'
        )
      ])

      setOpcoesDisponiveis({
        competencias: competenciasData.map(c => ({
          codigo: c.codigo_competencia,
          descricao: c.descricao_competencia || `Competência ${c.codigo_competencia}`,
          total_combinacoes: c.total_combinacoes
        })).sort((a, b) => (a.descricao || '').localeCompare(b.descricao || '')),
        classes: classesData.map(c => ({
          codigo: c.codigo_classe,
          nome: c.nome_classe || `Classe ${c.codigo_classe}`,
          total_combinacoes: c.total_combinacoes
        })).sort((a, b) => (a.nome || '').localeCompare(b.nome || '')),
        assuntos: assuntosData.map(a => ({
          codigo: a.codigo_assunto,
          nome: a.nome_assunto || `Assunto ${a.codigo_assunto}`,
          total_ocorrencias: a.total_ocorrencias
        })).sort((a, b) => (a.nome || '').localeCompare(b.nome || ''))
      })
    } catch (error) {
      console.error('Erro ao carregar opções filtradas:', error)
      setErro(error.message)
      // Manter opções anteriores em caso de erro
    } finally {
      setLoading(false)
    }
  }

  // Efeito: Carregar opções totais ao montar
  useEffect(() => {
    if (codigoLocalidade) {
      carregarOpcaoesTotais()
    }
  }, [codigoLocalidade])

  // Efeito: Recarregar opções filtradas quando há seleções
  useEffect(() => {
    if (codigoLocalidade && !carregamentoInicial) {
      carregarOpcoesFiltradas()
    }
  }, [codigoLocalidade, selecoes.competencia, selecoes.classe, selecoes.assunto, carregamentoInicial])

  /**
   * Seleciona uma competência e atualiza filtros
   */
  const selecionarCompetencia = (competencia) => {
    setSelecoes(prev => ({ ...prev, competencia }))
  }

  /**
   * Seleciona uma classe e atualiza filtros
   */
  const selecionarClasse = (classe) => {
    setSelecoes(prev => ({ ...prev, classe }))
  }

  /**
   * Seleciona um assunto e atualiza filtros
   */
  const selecionarAssunto = (assunto) => {
    setSelecoes(prev => ({ ...prev, assunto }))
  }

  /**
   * Limpa a seleção de um tipo específico
   */
  const limparSelecao = (tipo) => {
    setSelecoes(prev => ({ ...prev, [tipo]: null }))
  }

  /**
   * Limpa todas as seleções
   */
  const limparTudo = () => {
    setSelecoes({ competencia: null, classe: null, assunto: null })
  }

  return {
    // Estados de seleção
    selecoes,

    // Opções disponíveis (filtradas)
    opcoesDisponiveis,

    // Opções totais (sem filtro)
    opcaoesTotais,

    // Estados de controle
    loading,
    erro,

    // Funções de seleção
    selecionarCompetencia,
    selecionarClasse,
    selecionarAssunto,

    // Funções de limpeza
    limparSelecao,
    limparTudo
  }
}
