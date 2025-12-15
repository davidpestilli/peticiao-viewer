import { useState, useEffect } from 'react'
import {
  getResumoClassificacoes,
  getCompetenciasComErros,
  getClassesComErros,
  getErrosPorClasse
} from '../lib/supabase'

export default function EstruturaErro() {
  const [estadoAtivo, setEstadoAtivo] = useState('por_categorizar')
  const [resumoClassificacoes, setResumoClassificacoes] = useState({
    nao_analisados: 0,
    combinacao_impossivel: 0,
    erro_corrigivel: 0,
    erro_sistema: 0
  })

  const [competencias, setCompetencias] = useState([])
  const [competenciaSelecionada, setCompetenciaSelecionada] = useState(null)
  const [loadingCompetencias, setLoadingCompetencias] = useState(false)

  const [classes, setClasses] = useState([])
  const [classeSelecionada, setClasseSelecionada] = useState(null)
  const [loadingClasses, setLoadingClasses] = useState(false)

  const [erros, setErros] = useState([])
  const [loadingErros, setLoadingErros] = useState(false)
  const [erroExpandido, setErroExpandido] = useState(null)

  const [filtroClassificacao, setFiltroClassificacao] = useState('todos')

  useEffect(() => {
    carregarResumo()
  }, [])

  useEffect(() => {
    setCompetenciaSelecionada(null)
    setClasseSelecionada(null)
    setClasses([])
    setErros([])
    carregarCompetencias()
  }, [estadoAtivo, filtroClassificacao])

  const carregarResumo = async () => {
    const data = await getResumoClassificacoes()
    setResumoClassificacoes(data)
  }

  const carregarCompetencias = async () => {
    setLoadingCompetencias(true)
    try {
      // null = por categorizar (classificacao IS NULL)
      // 'todos' = todos os categorizados (classificacao IS NOT NULL)
      // 'combinacao_impossivel', 'erro_corrigivel', 'erro_sistema' = filtro específico
      const classificacaoFiltro = estadoAtivo === 'por_categorizar' ? null : filtroClassificacao
      const data = await getCompetenciasComErros(classificacaoFiltro)
      setCompetencias(data)
    } catch (error) {
      console.error('Erro ao carregar competências:', error)
      setCompetencias([])
    } finally {
      setLoadingCompetencias(false)
    }
  }

  const carregarClasses = async (codigoCompetencia) => {
    setLoadingClasses(true)
    try {
      const classificacaoFiltro = estadoAtivo === 'por_categorizar' ? null : filtroClassificacao
      const data = await getClassesComErros(codigoCompetencia, classificacaoFiltro)
      setClasses(data)
    } catch (error) {
      console.error('Erro ao carregar classes:', error)
      setClasses([])
    } finally {
      setLoadingClasses(false)
    }
  }

  const carregarErros = async (codigoCompetencia, codigoClasse) => {
    setLoadingErros(true)
    try {
      const classificacaoFiltro = estadoAtivo === 'por_categorizar' ? null : filtroClassificacao
      const data = await getErrosPorClasse(codigoCompetencia, codigoClasse, classificacaoFiltro)
      setErros(data)
    } catch (error) {
      console.error('Erro ao carregar erros:', error)
      setErros([])
    } finally {
      setLoadingErros(false)
    }
  }

  const handleSelecionarCompetencia = async (competencia) => {
    setCompetenciaSelecionada(competencia)
    setClasseSelecionada(null)
    setErros([])
    await carregarClasses(competencia.codigo)
  }

  const handleSelecionarClasse = async (classe) => {
    setClasseSelecionada(classe)
    await carregarErros(competenciaSelecionada.codigo, classe.codigo)
  }

  const getClassificacaoLabel = (classificacao) => {
    switch (classificacao) {
      case 'combinacao_impossivel': return '🚫 Combinação Impossível'
      case 'erro_corrigivel': return '🔧 Erro Corrigível'
      case 'erro_sistema': return '⚠️ Erro do Sistema'
      default: return '❓ Não Classificado'
    }
  }

  const totalNaoAnalisados = resumoClassificacoes.nao_analisados || 0
  const totalCategorizados = (resumoClassificacoes.combinacao_impossivel || 0) +
                              (resumoClassificacoes.erro_corrigivel || 0) +
                              (resumoClassificacoes.erro_sistema || 0)
  const totalGeral = totalNaoAnalisados + totalCategorizados
  const percentualProgresso = totalGeral > 0 ? Math.round((totalCategorizados / totalGeral) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="card">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-2">
              🔍 Estrutura do Erro
            </h2>
            <p className="text-gray-600">
              Visualize erros organizados por Competência → Classe → Assunto
            </p>
          </div>
        </div>

        {/* Barra de Progresso */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-600">Progresso da Categorização</span>
            <span className="font-bold text-gray-800">{percentualProgresso}% ({totalCategorizados}/{totalGeral})</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-green-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${percentualProgresso}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Tabs de Estado */}
      <div className="flex gap-2">
        <button
          onClick={() => setEstadoAtivo('por_categorizar')}
          className={`flex-1 py-4 px-6 rounded-lg font-bold text-lg transition-all flex items-center justify-center gap-3 ${
            estadoAtivo === 'por_categorizar'
              ? 'bg-red-500 text-white shadow-lg scale-105'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <span className="text-2xl">🔴</span>
          <span>Por Categorizar</span>
          <span className={`px-3 py-1 rounded-full text-sm ${
            estadoAtivo === 'por_categorizar' ? 'bg-red-600' : 'bg-gray-300'
          }`}>
            {totalNaoAnalisados}
          </span>
        </button>

        <button
          onClick={() => setEstadoAtivo('categorizados')}
          className={`flex-1 py-4 px-6 rounded-lg font-bold text-lg transition-all flex items-center justify-center gap-3 ${
            estadoAtivo === 'categorizados'
              ? 'bg-green-500 text-white shadow-lg scale-105'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <span className="text-2xl">✅</span>
          <span>Categorizados</span>
          <span className={`px-3 py-1 rounded-full text-sm ${
            estadoAtivo === 'categorizados' ? 'bg-green-600' : 'bg-gray-300'
          }`}>
            {totalCategorizados}
          </span>
        </button>
      </div>

      {/* Filtro de Classificação (apenas para Categorizados) */}
      {estadoAtivo === 'categorizados' && (
        <div className="card bg-green-50 border-2 border-green-200">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="font-semibold text-green-800">Filtrar por:</span>

            <button
              onClick={() => setFiltroClassificacao('todos')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                filtroClassificacao === 'todos'
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-green-100'
              }`}
            >
              📊 Todos ({totalCategorizados})
            </button>

            <button
              onClick={() => setFiltroClassificacao('combinacao_impossivel')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                filtroClassificacao === 'combinacao_impossivel'
                  ? 'bg-red-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-red-100'
              }`}
            >
              🚫 Combinação Impossível ({resumoClassificacoes.combinacao_impossivel})
            </button>

            <button
              onClick={() => setFiltroClassificacao('erro_corrigivel')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                filtroClassificacao === 'erro_corrigivel'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-blue-100'
              }`}
            >
              🔧 Erro Corrigível ({resumoClassificacoes.erro_corrigivel})
            </button>

            <button
              onClick={() => setFiltroClassificacao('erro_sistema')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                filtroClassificacao === 'erro_sistema'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-yellow-100'
              }`}
            >
              ⚠️ Erro do Sistema ({resumoClassificacoes.erro_sistema})
            </button>
          </div>
        </div>
      )}

      {/* Grid de 3 Colunas */}
      {estadoAtivo === 'por_categorizar' && !loadingCompetencias && competencias.length === 0 ? (
        <div className="card bg-green-50 border-2 border-green-300 text-center py-16">
          <div className="text-6xl mb-4">🎉</div>
          <h3 className="text-2xl font-bold text-green-800 mb-2">
            Parabéns! Não há erros para categorizar
          </h3>
          <p className="text-green-700">
            Todos os erros foram classificados. Você pode visualizá-los na aba "Categorizados".
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">

          {/* Container 1: Competências */}
          <div className="border-2 border-gray-300 rounded-lg bg-white shadow-sm">
            <div className={`p-4 border-b-2 ${
              estadoAtivo === 'por_categorizar'
                ? 'bg-red-100 border-red-300'
                : 'bg-green-100 border-green-300'
            }`}>
              <h3 className={`text-lg font-bold ${
                estadoAtivo === 'por_categorizar' ? 'text-red-900' : 'text-green-900'
              }`}>
                Competências
              </h3>
              <p className={`text-sm ${
                estadoAtivo === 'por_categorizar' ? 'text-red-700' : 'text-green-700'
              }`}>
                {estadoAtivo === 'por_categorizar' ? 'Com erros pendentes' : 'Com erros classificados'}
              </p>
            </div>

            <div className="p-3 space-y-2 max-h-[500px] overflow-y-auto">
              {loadingCompetencias ? (
                <div className="text-center py-8">
                  <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                  <p className="text-gray-500 mt-2">Carregando...</p>
                </div>
              ) : competencias.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {estadoAtivo === 'por_categorizar'
                    ? '✅ Nenhum erro pendente!'
                    : 'Nenhuma competência encontrada'}
                </div>
              ) : (
                competencias.map((comp, idx) => (
                  <button
                    key={comp.codigo || idx}
                    onClick={() => handleSelecionarCompetencia(comp)}
                    className={`w-full p-3 text-left rounded-lg border-2 transition-all ${
                      competenciaSelecionada?.codigo === comp.codigo
                        ? estadoAtivo === 'por_categorizar'
                          ? 'bg-red-500 text-white border-red-700'
                          : 'bg-green-500 text-white border-green-700'
                        : 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-800'
                    }`}
                  >
                    <div className={`font-bold ${
                      competenciaSelecionada?.codigo === comp.codigo ? '' : 'text-gray-800'
                    }`}>[{comp.codigo}]</div>
                    <div className={`text-sm mt-1 truncate ${
                      competenciaSelecionada?.codigo === comp.codigo ? '' : 'text-gray-700'
                    }`}>{comp.nome}</div>
                    <div className={`text-xs mt-2 flex items-center gap-1 ${
                      competenciaSelecionada?.codigo === comp.codigo ? 'opacity-80' : 'text-gray-600'
                    }`}>
                      {estadoAtivo === 'por_categorizar' ? (
                        <>⚠️ {comp.totalErros || 0} pendente(s)</>
                      ) : (
                        <>✅ {comp.totalErros || 0} erro(s)</>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Container 2: Classes */}
          <div className="border-2 border-gray-300 rounded-lg bg-white shadow-sm">
            <div className={`p-4 border-b-2 ${
              estadoAtivo === 'por_categorizar'
                ? 'bg-orange-100 border-orange-300'
                : 'bg-teal-100 border-teal-300'
            }`}>
              <h3 className={`text-lg font-bold ${
                estadoAtivo === 'por_categorizar' ? 'text-orange-900' : 'text-teal-900'
              }`}>
                Classes
              </h3>
              <p className={`text-sm ${
                estadoAtivo === 'por_categorizar' ? 'text-orange-700' : 'text-teal-700'
              }`}>
                {competenciaSelecionada
                  ? `De ${competenciaSelecionada.nome?.substring(0, 20)}...`
                  : 'Selecione uma competência'}
              </p>
            </div>

            <div className="p-3 space-y-2 max-h-[500px] overflow-y-auto">
              {!competenciaSelecionada ? (
                <div className="text-center py-8 text-gray-500">
                  ← Selecione uma competência
                </div>
              ) : loadingClasses ? (
                <div className="text-center py-8">
                  <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                </div>
              ) : classes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Nenhuma classe encontrada
                </div>
              ) : (
                classes.map((classe, idx) => (
                  <button
                    key={classe.codigo || idx}
                    onClick={() => handleSelecionarClasse(classe)}
                    className={`w-full p-3 text-left rounded-lg border-2 transition-all ${
                      classeSelecionada?.codigo === classe.codigo
                        ? estadoAtivo === 'por_categorizar'
                          ? 'bg-orange-500 text-white border-orange-700'
                          : 'bg-teal-500 text-white border-teal-700'
                        : 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-800'
                    }`}
                  >
                    <div className="font-bold">[{classe.codigo}]</div>
                    <div className="text-sm mt-1 truncate">{classe.nome}</div>
                    <div className={`text-xs mt-2 ${
                      classeSelecionada?.codigo === classe.codigo ? 'opacity-80' : 'text-gray-600'
                    }`}>
                      {classe.totalErros || 0} erro(s)
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Container 3: Erros */}
          <div className="border-2 border-gray-300 rounded-lg bg-white shadow-sm">
            <div className={`p-4 border-b-2 ${
              estadoAtivo === 'por_categorizar'
                ? 'bg-yellow-100 border-yellow-300'
                : 'bg-purple-100 border-purple-300'
            }`}>
              <h3 className={`text-lg font-bold ${
                estadoAtivo === 'por_categorizar' ? 'text-yellow-900' : 'text-purple-900'
              }`}>
                {estadoAtivo === 'por_categorizar' ? 'Erros Pendentes' : 'Erros Classificados'}
              </h3>
              <p className={`text-sm ${
                estadoAtivo === 'por_categorizar' ? 'text-yellow-700' : 'text-purple-700'
              }`}>
                {classeSelecionada
                  ? `Classe ${classeSelecionada.codigo}`
                  : 'Selecione uma classe'}
              </p>
            </div>

            <div className="p-3 space-y-2 max-h-[500px] overflow-y-auto">
              {!classeSelecionada ? (
                <div className="text-center py-8 text-gray-500">
                  ← Selecione uma classe
                </div>
              ) : loadingErros ? (
                <div className="text-center py-8">
                  <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                </div>
              ) : erros.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {estadoAtivo === 'por_categorizar'
                    ? '✅ Nenhum erro pendente!'
                    : 'Nenhum erro encontrado'}
                </div>
              ) : (
                erros.map((erro, idx) => {
                  const chave = erro.id || `${erro.tipo_erro}-${idx}`
                  const isExpandido = erroExpandido === chave

                  return (
                    <div
                      key={chave}
                      className="p-3 rounded-lg border-2 border-gray-200 bg-white cursor-pointer hover:border-purple-300 text-gray-800"
                      onClick={() => setErroExpandido(isExpandido ? null : chave)}
                    >
                      {estadoAtivo === 'categorizados' && (
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-1 text-xs font-bold rounded ${
                            erro.classificacao === 'combinacao_impossivel' ? 'bg-red-100 text-red-800' :
                            erro.classificacao === 'erro_corrigivel' ? 'bg-blue-100 text-blue-800' :
                            erro.classificacao === 'erro_sistema' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {getClassificacaoLabel(erro.classificacao)}
                          </span>
                          <span className="text-xs text-gray-500">
                            {erro.total_ocorrencias || 1} ocorrência(s)
                          </span>
                        </div>
                      )}

                      {erro.tipo_erro && erro.tipo_erro !== 'ERRO_DESCONHECIDO' && (
                        <div className="text-sm text-gray-600 mb-1">
                          <span className="font-mono text-xs bg-gray-100 px-1 rounded">{erro.tipo_erro}</span>
                        </div>
                      )}

                      {estadoAtivo === 'por_categorizar' && (
                        <div className="text-xs text-gray-500 mt-1">
                          📊 {erro.total_ocorrencias || 1} ocorrência(s)
                        </div>
                      )}

                      {isExpandido && (
                        <div className="mt-3 p-3 bg-gray-50 rounded border border-gray-200">
                          <div className="text-xs text-gray-600 mb-2">
                            <strong>Mensagem:</strong>
                          </div>
                          <div className="text-sm text-gray-800 font-mono whitespace-pre-wrap">
                            {erro.mensagem_erro_exemplo || 'Sem mensagem'}
                          </div>
                          {erro.descricao_analise && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <div className="text-xs text-gray-600 mb-1">
                                <strong>Análise:</strong>
                              </div>
                              <div className="text-sm text-gray-700">
                                {erro.descricao_analise}
                              </div>
                            </div>
                          )}
                          {erro.solucao_sugerida && (
                            <div className="mt-2">
                              <div className="text-xs text-gray-600 mb-1">
                                <strong>Solução Sugerida:</strong>
                              </div>
                              <div className="text-sm text-green-700">
                                {erro.solucao_sugerida}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Nota de modo leitura */}
      <div className="card bg-blue-50 border-2 border-blue-200">
        <div className="flex items-center gap-3">
          <span className="text-2xl">ℹ️</span>
          <div>
            <p className="font-semibold text-blue-800">Modo Visualização</p>
            <p className="text-sm text-blue-700">
              Este dashboard é apenas para visualização. Para classificar erros, acesse o sistema principal.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
