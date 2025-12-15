import { useState, useEffect } from 'react'
import { getLocalidades } from '../lib/supabase'
import AbaSelecaoSequencial from './AbaSelecaoSequencial'
import AbaSelecaoFlexivel from './AbaSelecaoFlexivel'

export default function EstruturasRealPeticionamento() {
  // Estados de dados
  const [localidades, setLocalidades] = useState([])
  const [localidadeSelecionada, setLocalidadeSelecionada] = useState(null)

  // Estado da aba selecionada
  const [abaSelecionada, setAbaSelecionada] = useState('sequencial') // 'sequencial' | 'flexivel'

  // Estados gerais
  const [loading, setLoading] = useState(true)
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

  const selecionarLocalidade = (localidade) => {
    setLocalidadeSelecionada(localidade)
  }

  const voltarParaLocalidades = () => {
    setLocalidadeSelecionada(null)
    setAbaSelecionada('sequencial') // Reset aba ao voltar
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
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
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
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 text-red-700">
          {erro}
        </div>
      )}

      {!localidadeSelecionada ? (
        /* Lista de Localidades */
        <div>
          <h2 className="text-xl font-bold text-white mb-4">Selecione uma Localidade</h2>
          {localidades.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-6 text-center py-12">
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
                  className="bg-white rounded-xl shadow-md p-6 border border-gray-200 hover:shadow-xl transition-all hover:scale-105 text-left"
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
        /* Navegação por Abas */
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
            <div className="w-48"></div> {/* Spacer para centralizar o título */}
          </div>

          {/* Navegação por Abas */}
          <div className="bg-white rounded-xl shadow-md p-4 border border-gray-200 mb-6">
            <div className="flex gap-2">
              <button
                onClick={() => setAbaSelecionada('sequencial')}
                className={`flex-1 py-4 px-6 rounded-lg font-bold text-lg transition-all ${
                  abaSelecionada === 'sequencial'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <div className="text-2xl mb-1">📊</div>
                <div>Seleção Sequencial</div>
                <div className="text-xs font-normal mt-1">Comece por competência</div>
              </button>

              <button
                onClick={() => setAbaSelecionada('flexivel')}
                className={`flex-1 py-4 px-6 rounded-lg font-bold text-lg transition-all ${
                  abaSelecionada === 'flexivel'
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <div className="text-2xl mb-1">🔀</div>
                <div>Seleção Flexível</div>
                <div className="text-xs font-normal mt-1">Comece por qualquer elemento</div>
              </button>
            </div>
          </div>

          {/* Conteúdo das Abas */}
          <div>
            <div style={{ display: abaSelecionada === 'sequencial' ? 'block' : 'none' }}>
              <AbaSelecaoSequencial
                localidadeSelecionada={localidadeSelecionada.codigo}
              />
            </div>

            <div style={{ display: abaSelecionada === 'flexivel' ? 'block' : 'none' }}>
              <AbaSelecaoFlexivel
                localidadeSelecionada={localidadeSelecionada.codigo}
              />
            </div>
          </div>
        </div>
      )}

      {/* Nota de modo leitura */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
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
