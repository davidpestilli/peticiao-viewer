import { useState, useEffect, useMemo } from 'react'
import { getTodasOpcoesErros, getOpcoesErrosFiltradas, getErrosRelacionados } from '../lib/supabase'

/**
 * Hook para filtros bidirecionais de erros
 * Permite selecionar competência, classe ou assunto em qualquer ordem
 * e filtra as outras opções baseado nas seleções
 */
export function useFiltrosErrosBidirecionais() {
  // Estado das seleções
  const [competenciaSelecionada, setCompetenciaSelecionada] = useState(null)
  const [classeSelecionada, setClasseSelecionada] = useState(null)
  const [assuntoSelecionado, setAssuntoSelecionado] = useState(null)

  // Estado das opções
  const [todasOpcoes, setTodasOpcoes] = useState({
    competencias: [],
    classes: [],
    assuntos: []
  })
  const [opcoesFiltradas, setOpcoesFiltradas] = useState({
    competencias: [],
    classes: [],
    assuntos: []
  })

  // Erros relacionados à seleção atual
  const [errosRelacionados, setErrosRelacionados] = useState([])

  // Estados de loading
  const [carregandoOpcoes, setCarregandoOpcoes] = useState(false)
  const [carregandoErros, setCarregandoErros] = useState(false)

  // Carregar todas as opções no início
  useEffect(() => {
    async function carregarTodasOpcoes() {
      setCarregandoOpcoes(true)
      try {
        const opcoes = await getTodasOpcoesErros()
        setTodasOpcoes(opcoes)
        setOpcoesFiltradas(opcoes)
      } catch (error) {
        console.error('Erro ao carregar opções:', error)
      } finally {
        setCarregandoOpcoes(false)
      }
    }
    carregarTodasOpcoes()
  }, [])

  // Atualizar opções filtradas quando seleção mudar
  useEffect(() => {
    async function atualizarOpcoesFiltradas() {
      // Se nenhuma seleção, usar todas as opções
      if (!competenciaSelecionada && !classeSelecionada && !assuntoSelecionado) {
        setOpcoesFiltradas(todasOpcoes)
        return
      }

      setCarregandoOpcoes(true)
      try {
        const opcoes = await getOpcoesErrosFiltradas(
          competenciaSelecionada,
          classeSelecionada,
          assuntoSelecionado
        )
        setOpcoesFiltradas(opcoes)
      } catch (error) {
        console.error('Erro ao atualizar opções filtradas:', error)
      } finally {
        setCarregandoOpcoes(false)
      }
    }
    atualizarOpcoesFiltradas()
  }, [competenciaSelecionada, classeSelecionada, assuntoSelecionado, todasOpcoes])

  // Carregar erros relacionados quando houver alguma seleção
  useEffect(() => {
    async function carregarErrosRelacionados() {
      // Se nenhuma seleção, limpar erros
      if (!competenciaSelecionada && !classeSelecionada && !assuntoSelecionado) {
        setErrosRelacionados([])
        return
      }

      setCarregandoErros(true)
      try {
        const erros = await getErrosRelacionados(
          competenciaSelecionada,
          classeSelecionada,
          assuntoSelecionado
        )
        setErrosRelacionados(erros)
      } catch (error) {
        console.error('Erro ao carregar erros relacionados:', error)
      } finally {
        setCarregandoErros(false)
      }
    }
    carregarErrosRelacionados()
  }, [competenciaSelecionada, classeSelecionada, assuntoSelecionado])

  // Função para limpar todas as seleções
  const limparSelecoes = () => {
    setCompetenciaSelecionada(null)
    setClasseSelecionada(null)
    setAssuntoSelecionado(null)
  }

  // Verificar se há alguma seleção ativa
  const temSelecao = useMemo(() => {
    return competenciaSelecionada || classeSelecionada || assuntoSelecionado
  }, [competenciaSelecionada, classeSelecionada, assuntoSelecionado])

  // Contagem de erros por classificação
  const resumoErros = useMemo(() => {
    const classificados = errosRelacionados.filter(e => e.erro_classificado)
    const naoClassificados = errosRelacionados.filter(e => !e.erro_classificado)
    
    // Agrupar por tipo de erro classificado
    const porTipoErro = {}
    classificados.forEach(e => {
      const tipo = e.nome_erro_classificado || 'Sem nome'
      if (!porTipoErro[tipo]) {
        porTipoErro[tipo] = 0
      }
      porTipoErro[tipo]++
    })

    return {
      total: errosRelacionados.length,
      classificados: classificados.length,
      naoClassificados: naoClassificados.length,
      porTipoErro
    }
  }, [errosRelacionados])

  return {
    // Seleções
    competenciaSelecionada,
    setCompetenciaSelecionada,
    classeSelecionada,
    setClasseSelecionada,
    assuntoSelecionado,
    setAssuntoSelecionado,

    // Opções
    todasOpcoes,
    opcoesFiltradas,

    // Erros
    errosRelacionados,
    resumoErros,

    // Estados
    carregandoOpcoes,
    carregandoErros,
    temSelecao,

    // Ações
    limparSelecoes
  }
}

export default useFiltrosErrosBidirecionais
