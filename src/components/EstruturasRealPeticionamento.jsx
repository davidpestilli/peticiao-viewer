import { useState, useEffect } from 'react'
import {
  getLocalidades,
  getCompetenciasPorLocalidade,
  getClassesPorCompetencia,
  getAssuntosPorClasse
} from '../lib/supabase'

export default function EstruturasRealPeticionamento() {
  // Estados de dados
  const [localidades, setLocalidades] = useState([])
  const [localidadeSelecionada, setLocalidadeSelecionada] = useState(null)
  const [competencias, setCompetencias] = useState([])
  const [competenciaSelecionada, setCompetenciaSelecionada] = useState(null)
  const [classes, setClasses] = useState([])
  const [classeSelecionada, setClasseSelecionada] = useState(null)
  const [assuntos, setAssuntos] = useState([])

  // Estados de loading
  const [loading, setLoading] = useState(true)
  const [loadingCompetencias, setLoadingCompetencias] = useState(false)
  const [loadingClasses, setLoadingClasses] = useState(false)
  const [loadingAssuntos, setLoadingAssuntos] = useState(false)

  const [erro, setErro] = useState(null)

  useEffect(() => {
    carregarLocalidades()
  }, [])

  const carregarLocalidades = async () => {
    try {
      setLoading(true)
      setErro(null)
      const data = await getLocalidades()
      setLocalidades(data)
    } catch (e) {
      console.error('Erro:', e)
      setErro(e.message)
    } finally {
      setLoading(false)
    }
  }

  const selecionarLocalidade = async (localidade) => {
    setLocalidadeSelecionada(localidade)
    setCompetenciaSelecionada(null)
    setClasseSelecionada(null)
    setCompetencias([])
    setClasses([])
    setAssuntos([])

    setLoadingCompetencias(true)
    try {
      const data = await getCompetenciasPorLocalidade(localidade.codigo)
      setCompetencias(data)
    } catch (e) {
      console.error('Erro ao carregar competências:', e)
    } finally {
      setLoadingCompetencias(false)
    }
  }

  const selecionarCompetencia = async (competencia) => {
    setCompetenciaSelecionada(competencia)
    setClasseSelecionada(null)
    setClasses([])
    setAssuntos([])

    setLoadingClasses(true)
    try {
      const data = await getClassesPorCompetencia(localidadeSelecionada.codigo, competencia.codigo_competencia)
      setClasses(data)
    } catch (e) {
      console.error('Erro ao carregar classes:', e)
    } finally {
      setLoadingClasses(false)
    }
  }

  const selecionarClasse = async (classe) => {
    setClasseSelecionada(classe)
    setAssuntos([])

    setLoadingAssuntos(true)
    try {
      const data = await getAssuntosPorClasse(
        localidadeSelecionada.codigo,
        competenciaSelecionada.codigo_competencia,
        classe.codigo_classe
      )
      setAssuntos(data)
    } catch (e) {
      console.error('Erro ao carregar assuntos:', e)
    } finally {
      setLoadingAssuntos(false)
    }
  }

  const voltarParaLocalidades = () => {
    setLocalidadeSelecionada(null)
    setCompetenciaSelecionada(null)
    setClasseSelecionada(null)
    setCompetencias([])
    setClasses([])
    setAssuntos([])
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-300 font-medium">Carregando estruturas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">📊 Estrutura Real de Peticionamento</h1>
            <p className="text-gray-600">
              Visualize as competências REAIS resultantes dos peticionamentos.
              Analise por que combinações iguais geram competências diferentes.
            </p>
          </div>
        </div>
      </div>

      {erro && (
        <div className="card bg-red-50 border-2 border-red-200 text-red-700">
          {erro}
        </div>
      )}

      {!localidadeSelecionada ? (
        /* Lista de Localidades */
        <div>
          <h2 className="text-xl font-bold text-white mb-4">Selecione uma Localidade</h2>
          {localidades.length === 0 ? (
            <div className="card text-center py-12">
              <div className="text-4xl mb-4">📊</div>
              <p className="text-gray-600 font-semibold">Nenhuma localidade encontrada</p>
              <p className="text-sm text-gray-500 mt-2">Execute testes para popular os dados</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {localidades.map(localidade => (
                <button
                  key={localidade.codigo}
                  onClick={() => selecionarLocalidade(localidade)}
                  className="card hover:shadow-xl transition-all hover:scale-105 text-left"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-3xl">📍</span>
                    <div>
                      <div className="font-bold text-gray-800 text-lg">{localidade.nome}</div>
                      <div className="text-sm text-gray-500">Código: {localidade.codigo}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-blue-50 rounded p-2">
                      <div className="text-xl font-bold text-blue-700">{localidade.total_competencias || 0}</div>
                      <div className="text-xs text-blue-600">Competências</div>
                    </div>
                    <div className="bg-green-50 rounded p-2">
                      <div className="text-xl font-bold text-green-700">{localidade.total_classes || 0}</div>
                      <div className="text-xs text-green-600">Classes</div>
                    </div>
                    <div className="bg-purple-50 rounded p-2">
                      <div className="text-xl font-bold text-purple-700">{localidade.total_assuntos || 0}</div>
                      <div className="text-xs text-purple-600">Assuntos</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Navegação em Cascata */
        <div>
          {/* Botão Voltar + Nome da Localidade */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={voltarParaLocalidades}
              className="px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition font-medium"
            >
              ← Voltar para Localidades
            </button>
            <h2 className="text-2xl font-bold text-white">
              📍 {localidadeSelecionada.nome}
            </h2>
          </div>

          {/* Grid de 4 colunas */}
          <div className="grid grid-cols-4 gap-4">
            {/* Coluna 1: Competências */}
            <div className="border-2 border-gray-300 rounded-lg bg-white shadow-sm">
              <div className="p-4 border-b-2 bg-blue-100 border-blue-300">
                <h3 className="text-lg font-bold text-blue-900">Competências</h3>
                <p className="text-sm text-blue-700">{competencias.length} encontrada(s)</p>
              </div>
              <div className="p-3 space-y-2 max-h-[500px] overflow-y-auto">
                {loadingCompetencias ? (
                  <div className="text-center py-8">
                    <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                  </div>
                ) : competencias.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Nenhuma competência
                  </div>
                ) : (
                  competencias.map((comp, idx) => (
                    <button
                      key={comp.codigo_competencia || idx}
                      onClick={() => selecionarCompetencia(comp)}
                      className={`w-full p-3 text-left rounded-lg border-2 transition-all ${
                        competenciaSelecionada?.codigo_competencia === comp.codigo_competencia
                          ? 'bg-blue-500 text-white border-blue-700'
                          : 'bg-gray-50 hover:bg-gray-100 border-gray-200'
                      }`}
                    >
                      <div className="font-bold truncate">{comp.nome_competencia}</div>
                      <div className="text-xs mt-1 opacity-70">{comp.codigo_competencia}</div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Coluna 2: Classes */}
            <div className="border-2 border-gray-300 rounded-lg bg-white shadow-sm">
              <div className="p-4 border-b-2 bg-green-100 border-green-300">
                <h3 className="text-lg font-bold text-green-900">Classes</h3>
                <p className="text-sm text-green-700">
                  {competenciaSelecionada ? `${classes.length} encontrada(s)` : 'Selecione competência'}
                </p>
              </div>
              <div className="p-3 space-y-2 max-h-[500px] overflow-y-auto">
                {!competenciaSelecionada ? (
                  <div className="text-center py-8 text-gray-500">
                    ← Selecione uma competência
                  </div>
                ) : loadingClasses ? (
                  <div className="text-center py-8">
                    <div className="animate-spin h-8 w-8 border-2 border-green-500 border-t-transparent rounded-full mx-auto"></div>
                  </div>
                ) : classes.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Nenhuma classe
                  </div>
                ) : (
                  classes.map((classe, idx) => (
                    <button
                      key={classe.codigo_classe || idx}
                      onClick={() => selecionarClasse(classe)}
                      className={`w-full p-3 text-left rounded-lg border-2 transition-all ${
                        classeSelecionada?.codigo_classe === classe.codigo_classe
                          ? 'bg-green-500 text-white border-green-700'
                          : 'bg-gray-50 hover:bg-gray-100 border-gray-200'
                      }`}
                    >
                      <div className="font-bold truncate">{classe.nome_classe}</div>
                      <div className="text-xs mt-1 opacity-70">{classe.codigo_classe}</div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Coluna 3: Assuntos */}
            <div className="border-2 border-gray-300 rounded-lg bg-white shadow-sm">
              <div className="p-4 border-b-2 bg-purple-100 border-purple-300">
                <h3 className="text-lg font-bold text-purple-900">Assuntos</h3>
                <p className="text-sm text-purple-700">
                  {classeSelecionada ? `${assuntos.length} encontrado(s)` : 'Selecione classe'}
                </p>
              </div>
              <div className="p-3 space-y-2 max-h-[500px] overflow-y-auto">
                {!classeSelecionada ? (
                  <div className="text-center py-8 text-gray-500">
                    ← Selecione uma classe
                  </div>
                ) : loadingAssuntos ? (
                  <div className="text-center py-8">
                    <div className="animate-spin h-8 w-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto"></div>
                  </div>
                ) : assuntos.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Nenhum assunto
                  </div>
                ) : (
                  assuntos.map((assunto, idx) => (
                    <div
                      key={assunto.codigo_assunto || idx}
                      className="p-3 rounded-lg border-2 border-gray-200 bg-gray-50"
                    >
                      <div className="font-semibold text-gray-800 text-sm">{assunto.nome_assunto}</div>
                      <div className="text-xs text-gray-500 mt-1">{assunto.codigo_assunto}</div>
                      <div className="mt-2 flex gap-2">
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                          ✅ {assunto.total_sucesso || 0} sucesso
                        </span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                          📊 {assunto.total_testes || 0} testes
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Coluna 4: Resumo */}
            <div className="border-2 border-gray-300 rounded-lg bg-white shadow-sm">
              <div className="p-4 border-b-2 bg-orange-100 border-orange-300">
                <h3 className="text-lg font-bold text-orange-900">Resumo</h3>
                <p className="text-sm text-orange-700">Seleção atual</p>
              </div>
              <div className="p-4 space-y-4">
                {localidadeSelecionada && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="text-xs text-blue-600 font-semibold">Localidade</div>
                    <div className="font-bold text-blue-800">{localidadeSelecionada.nome}</div>
                  </div>
                )}
                {competenciaSelecionada && (
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="text-xs text-green-600 font-semibold">Competência</div>
                    <div className="font-bold text-green-800">{competenciaSelecionada.nome_competencia}</div>
                  </div>
                )}
                {classeSelecionada && (
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <div className="text-xs text-purple-600 font-semibold">Classe</div>
                    <div className="font-bold text-purple-800">{classeSelecionada.nome_classe}</div>
                  </div>
                )}
                {!competenciaSelecionada && !classeSelecionada && (
                  <div className="text-center py-8 text-gray-500">
                    Selecione itens para ver o resumo
                  </div>
                )}
              </div>
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
              Este dashboard é apenas para visualização. Para atualizar o cache, acesse o sistema principal.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
