import { useState, useEffect } from 'react'
import {
  getVerificacaoStats,
  getDivergenciasAgrupadas,
  getProcessosDivergentes
} from '../lib/supabase'

export default function VerificadorCompetencias() {
  const [estatisticas, setEstatisticas] = useState({
    total: 0,
    verificados: 0,
    nao_verificados: 0,
    divergentes: 0,
    taxa_divergencia: 0
  })

  const [gruposDivergencias, setGruposDivergencias] = useState([])
  const [carregandoGrupos, setCarregandoGrupos] = useState(false)
  const [gruposExpandidos, setGruposExpandidos] = useState({})

  useEffect(() => {
    carregarDados()
  }, [])

  const carregarDados = async () => {
    const [stats, grupos] = await Promise.all([
      getVerificacaoStats(),
      getDivergenciasAgrupadas()
    ])
    setEstatisticas(stats)
    setGruposDivergencias(grupos)
  }

  const carregarGruposDivergencias = async () => {
    setCarregandoGrupos(true)
    try {
      // Atualizar estatísticas e grupos ao mesmo tempo
      const [stats, grupos] = await Promise.all([
        getVerificacaoStats(),
        getDivergenciasAgrupadas()
      ])
      setEstatisticas(stats)
      setGruposDivergencias(grupos)
      setGruposExpandidos({})
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setCarregandoGrupos(false)
    }
  }

  const toggleGrupo = async (grupo) => {
    const chave = `${grupo.competencia_de.codigo}|${grupo.competencia_para.codigo}`

    if (gruposExpandidos[chave]) {
      setGruposExpandidos(prev => {
        const novo = { ...prev }
        delete novo[chave]
        return novo
      })
    } else {
      setGruposExpandidos(prev => ({
        ...prev,
        [chave]: { processos: [], page: 1, total: grupo.quantidade, loading: true, totalPages: 1 }
      }))

      await carregarProcessosDoGrupo(grupo, 1)
    }
  }

  const carregarProcessosDoGrupo = async (grupo, page) => {
    const chave = `${grupo.competencia_de.codigo}|${grupo.competencia_para.codigo}`

    try {
      console.log('[VerificadorCompetencias] Carregando processos:', {
        codigoDe: grupo.competencia_de.codigo,
        codigoPara: grupo.competencia_para.codigo,
        page
      })

      const result = await getProcessosDivergentes(
        grupo.competencia_de.codigo,
        grupo.competencia_para.codigo,
        page
      )

      console.log('[VerificadorCompetencias] Processos carregados:', result)

      setGruposExpandidos(prev => ({
        ...prev,
        [chave]: {
          processos: page === 1 ? result.processos : [...(prev[chave]?.processos || []), ...result.processos],
          page: result.page,
          total: result.total,
          totalPages: result.totalPages,
          loading: false
        }
      }))
    } catch (error) {
      console.error('[VerificadorCompetencias] Erro ao carregar processos:', error)
      setGruposExpandidos(prev => ({
        ...prev,
        [chave]: { ...prev[chave], loading: false }
      }))
    }
  }

  const carregarMaisProcessos = async (grupo) => {
    const chave = `${grupo.competencia_de.codigo}|${grupo.competencia_para.codigo}`
    const grupoExpandido = gruposExpandidos[chave]

    if (!grupoExpandido || grupoExpandido.loading || grupoExpandido.page >= grupoExpandido.totalPages) {
      return
    }

    setGruposExpandidos(prev => ({
      ...prev,
      [chave]: { ...prev[chave], loading: true }
    }))

    await carregarProcessosDoGrupo(grupo, grupoExpandido.page + 1)
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="card bg-gradient-to-r from-green-600 to-blue-600 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">
              ✅ Verificador de Competências
            </h1>
            <p className="text-white/90 text-lg">
              Visualização de roteamentos automáticos de processos
            </p>
          </div>
        </div>
      </div>

      {/* Dashboard de Estatísticas */}
      <div className="card">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          📊 Resumo Geral
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total de Processos */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border-2 border-blue-200">
            <div className="text-sm text-blue-700 mb-2 font-semibold">
              Total de Processos
            </div>
            <div className="text-4xl font-bold text-blue-900">
              {estatisticas.total.toLocaleString()}
            </div>
          </div>

          {/* Já Verificados */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border-2 border-green-200">
            <div className="text-sm text-green-700 mb-2 font-semibold">
              ✅ Já Verificados
            </div>
            <div className="text-4xl font-bold text-green-900">
              {estatisticas.verificados.toLocaleString()}
            </div>
            {estatisticas.total > 0 && (
              <div className="text-xs text-green-600 mt-2">
                {((estatisticas.verificados / estatisticas.total) * 100).toFixed(1)}% do total
              </div>
            )}
          </div>

          {/* Faltam Verificar */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-6 border-2 border-orange-200">
            <div className="text-sm text-orange-700 mb-2 font-semibold">
              ⏳ Faltam Verificar
            </div>
            <div className="text-4xl font-bold text-orange-900">
              {estatisticas.nao_verificados.toLocaleString()}
            </div>
          </div>

          {/* Competências Alteradas */}
          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-6 border-2 border-red-200">
            <div className="text-sm text-red-700 mb-2 font-semibold">
              🔄 Roteamentos Detectados
            </div>
            <div className="text-4xl font-bold text-red-900">
              {estatisticas.divergentes.toLocaleString()}
            </div>
            {estatisticas.verificados > 0 && (
              <div className="text-xs text-red-600 mt-2">
                {Number(estatisticas.taxa_divergencia).toFixed(1)}% dos verificados
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Divergências Agrupadas */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Processos com Roteamento Automático
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Agrupados por combinação de competências (clique para expandir)
            </p>
          </div>
          <button
            onClick={carregarGruposDivergencias}
            disabled={carregandoGrupos}
            className="btn bg-blue-500 hover:bg-blue-600 text-white"
          >
            {carregandoGrupos ? 'Carregando...' : 'Atualizar'}
          </button>
        </div>

        {carregandoGrupos ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4 animate-spin">⏳</div>
            <p className="text-gray-600">Carregando grupos...</p>
          </div>
        ) : gruposDivergencias.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎉</div>
            <p className="text-xl text-gray-600 font-semibold">
              Nenhum roteamento detectado
            </p>
            <p className="text-gray-500 mt-2">
              Todos os processos permanecem na competência original
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Resumo */}
            <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm text-gray-600">
              <strong>{gruposDivergencias.length}</strong> grupos de roteamento |
              <strong className="ml-1">
                {gruposDivergencias.reduce((acc, g) => acc + g.quantidade, 0).toLocaleString('pt-BR')}
              </strong> processos no total
            </div>

            {/* Lista de Grupos */}
            {gruposDivergencias.map((grupo, index) => {
              const chave = `${grupo.competencia_de.codigo}|${grupo.competencia_para.codigo}`
              const expandido = gruposExpandidos[chave]
              const isExpandido = !!expandido

              return (
                <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* Cabeçalho do Grupo (clicável) */}
                  <button
                    onClick={() => toggleGrupo(grupo)}
                    className="w-full px-4 py-4 bg-gradient-to-r from-orange-50 to-red-50 hover:from-orange-100 hover:to-red-100 transition-colors flex items-center justify-between text-left"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      {/* Ícone de expandir/colapsar */}
                      <span className={`text-gray-500 transition-transform ${isExpandido ? 'rotate-90' : ''}`}>
                        ▶
                      </span>

                      {/* Competência DE */}
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-gray-500 mb-0.5">Peticionamento</div>
                        <div className="font-semibold text-gray-800 truncate">
                          {grupo.competencia_de.nome || `Código ${grupo.competencia_de.codigo}`}
                        </div>
                      </div>

                      {/* Seta */}
                      <div className="text-2xl text-gray-400 px-2">→</div>

                      {/* Competência PARA */}
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-gray-500 mb-0.5">Roteado para</div>
                        <div className="font-semibold text-red-600 truncate">
                          {grupo.competencia_para.nome || `Código ${grupo.competencia_para.codigo}`}
                        </div>
                      </div>
                    </div>

                    {/* Badge de quantidade e status */}
                    <div className="ml-4 flex-shrink-0 flex items-center gap-2">
                      {grupo.roteamentoConfirmado && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-300">
                          Aplicado
                        </span>
                      )}

                      <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-bold bg-red-100 text-red-800">
                        {grupo.quantidade.toLocaleString('pt-BR')} processos
                      </span>
                    </div>
                  </button>

                  {/* Conteúdo Expandido */}
                  {isExpandido && (
                    <div className="border-t border-gray-200 bg-white">
                      {expandido.loading && expandido.processos.length === 0 ? (
                        <div className="p-6 text-center text-gray-500">
                          <span className="animate-spin inline-block mr-2">⏳</span>
                          Carregando processos...
                        </div>
                      ) : (
                        <>
                          {/* Tabela de processos do grupo */}
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                  <th className="px-4 py-2 text-left font-semibold text-gray-600">
                                    Número do Processo
                                  </th>
                                  <th className="px-4 py-2 text-left font-semibold text-gray-600">
                                    Classe / Assunto
                                  </th>
                                  <th className="px-4 py-2 text-left font-semibold text-gray-600">
                                    Data Verificação
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {expandido.processos.map((proc, procIndex) => (
                                  <tr key={procIndex} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="px-4 py-2 font-mono text-blue-600">
                                      {proc.numero_processo}
                                    </td>
                                    <td className="px-4 py-2 text-gray-600">
                                      {proc.nome_classe && (
                                        <div className="text-xs">
                                          <span className="font-medium">Classe:</span> {proc.nome_classe}
                                        </div>
                                      )}
                                      {proc.nome_assunto && (
                                        <div className="text-xs">
                                          <span className="font-medium">Assunto:</span> {proc.nome_assunto}
                                        </div>
                                      )}
                                      {!proc.nome_classe && !proc.nome_assunto && (
                                        <span className="text-gray-400">-</span>
                                      )}
                                    </td>
                                    <td className="px-4 py-2 text-gray-500">
                                      {proc.data_verificacao
                                        ? new Date(proc.data_verificacao).toLocaleString('pt-BR')
                                        : '-'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {/* Paginação / Carregar mais */}
                          <div className="p-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                            <span className="text-sm text-gray-500">
                              Exibindo {expandido.processos.length} de {expandido.total.toLocaleString('pt-BR')} processos
                            </span>

                            {expandido.page < expandido.totalPages && (
                              <button
                                onClick={() => carregarMaisProcessos(grupo)}
                                disabled={expandido.loading}
                                className="btn bg-blue-500 hover:bg-blue-600 text-white text-sm py-1.5 px-4"
                              >
                                {expandido.loading ? 'Carregando...' : 'Carregar mais'}
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Informações */}
      <div className="card bg-blue-50">
        <h3 className="font-bold text-blue-900 mb-4">ℹ️ Como Funciona</h3>
        <div className="text-sm text-blue-800 space-y-2">
          <p>
            <strong>1. Consulta:</strong> O sistema consulta cada processo via MNI (ConsultarProcesso)
          </p>
          <p>
            <strong>2. Extração:</strong> Extrai a competência atual do processo consultado
          </p>
          <p>
            <strong>3. Comparação:</strong> Compara com a competência usada no peticionamento
          </p>
          <p>
            <strong>4. Registro:</strong> Se divergirem, registra como "roteamento automático"
          </p>
        </div>
      </div>

      {/* Nota de modo leitura */}
      <div className="card bg-yellow-50 border-2 border-yellow-200">
        <div className="flex items-center gap-3">
          <span className="text-2xl">ℹ️</span>
          <div>
            <p className="font-semibold text-yellow-800">Modo Visualização</p>
            <p className="text-sm text-yellow-700">
              Este dashboard é apenas para visualização. Para executar verificações ou aplicar roteamentos, acesse o sistema principal.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
