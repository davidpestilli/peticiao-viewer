import { useState, useEffect } from 'react'
import { getEstatisticasCompetencias } from '../lib/supabase'

export default function EstatisticasCompetencias() {
  const [stats, setStats] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [ordenacao, setOrdenacao] = useState('taxa_sucesso')
  const [ordem, setOrdem] = useState('desc')
  const [resumoGeral, setResumoGeral] = useState({
    total_testes: 0,
    total_sucesso: 0,
    total_erros: 0,
    taxa_sucesso_media: 0,
    competencias_testadas: 0
  })

  useEffect(() => {
    carregarEstatisticas()
  }, [])

  const carregarEstatisticas = async () => {
    setCarregando(true)
    try {
      const data = await getEstatisticasCompetencias()
      setStats(data)
      calcularResumoGeral(data)
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    } finally {
      setCarregando(false)
    }
  }

  const calcularResumoGeral = (statsData) => {
    const resumo = {
      total_testes: statsData.reduce((acc, s) => acc + s.total_testes, 0),
      total_sucesso: statsData.reduce((acc, s) => acc + s.total_sucesso, 0),
      total_erros: statsData.reduce((acc, s) => acc + s.total_erros, 0),
      taxa_sucesso_media: 0,
      competencias_testadas: statsData.length
    }

    if (resumo.total_testes > 0) {
      resumo.taxa_sucesso_media = (resumo.total_sucesso / resumo.total_testes) * 100
    }

    setResumoGeral(resumo)
  }

  const handleOrdenar = (campo) => {
    if (ordenacao === campo) {
      setOrdem(ordem === 'asc' ? 'desc' : 'asc')
    } else {
      setOrdenacao(campo)
      setOrdem('desc')
    }
  }

  const statsOrdenados = [...stats].sort((a, b) => {
    let valorA, valorB

    if (ordenacao === 'taxa_sucesso') {
      valorA = a.taxa_sucesso
      valorB = b.taxa_sucesso
    } else if (ordenacao === 'total_testes') {
      valorA = a.total_testes
      valorB = b.total_testes
    } else if (ordenacao === 'nome') {
      return ordem === 'asc'
        ? a.nome_competencia.localeCompare(b.nome_competencia)
        : b.nome_competencia.localeCompare(a.nome_competencia)
    }

    return ordem === 'asc' ? valorA - valorB : valorB - valorA
  })

  const getCorBarra = (taxa) => {
    if (taxa >= 80) return 'bg-green-600'
    if (taxa >= 50) return 'bg-yellow-600'
    return 'bg-red-600'
  }

  const getIconeTaxa = (taxa) => {
    if (taxa >= 80) return '✅'
    if (taxa >= 50) return '⚠️'
    return '❌'
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="card">
        <h2 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-2">
          📊 Estatísticas de Competências
        </h2>
        <p className="text-gray-600">
          Análise de sucesso por competência testada
        </p>
      </div>

      {/* Resumo Geral */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="card bg-blue-50 border-2 border-blue-200">
          <div className="text-sm text-blue-700 mb-1">Total de Testes</div>
          <div className="text-3xl font-bold text-blue-900">
            {resumoGeral.total_testes.toLocaleString()}
          </div>
        </div>

        <div className="card bg-green-50 border-2 border-green-200">
          <div className="text-sm text-green-700 mb-1">✅ Sucesso</div>
          <div className="text-3xl font-bold text-green-900">
            {resumoGeral.total_sucesso.toLocaleString()}
          </div>
        </div>

        <div className="card bg-red-50 border-2 border-red-200">
          <div className="text-sm text-red-700 mb-1">❌ Erros</div>
          <div className="text-3xl font-bold text-red-900">
            {resumoGeral.total_erros.toLocaleString()}
          </div>
        </div>

        <div className="card bg-purple-50 border-2 border-purple-200">
          <div className="text-sm text-purple-700 mb-1">Taxa Média</div>
          <div className="text-3xl font-bold text-purple-900">
            {resumoGeral.taxa_sucesso_media.toFixed(1)}%
          </div>
        </div>

        <div className="card bg-indigo-50 border-2 border-indigo-200">
          <div className="text-sm text-indigo-700 mb-1">Competências</div>
          <div className="text-3xl font-bold text-indigo-900">
            {resumoGeral.competencias_testadas}
          </div>
        </div>
      </div>

      {/* Controles de Ordenação */}
      <div className="card">
        <div className="flex items-center gap-4">
          <div className="font-semibold text-gray-700">Ordenar por:</div>
          <button
            onClick={() => handleOrdenar('taxa_sucesso')}
            className={`px-4 py-2 rounded ${
              ordenacao === 'taxa_sucesso'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Taxa de Sucesso {ordenacao === 'taxa_sucesso' && (ordem === 'desc' ? '↓' : '↑')}
          </button>
          <button
            onClick={() => handleOrdenar('total_testes')}
            className={`px-4 py-2 rounded ${
              ordenacao === 'total_testes'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Total de Testes {ordenacao === 'total_testes' && (ordem === 'desc' ? '↓' : '↑')}
          </button>
          <button
            onClick={() => handleOrdenar('nome')}
            className={`px-4 py-2 rounded ${
              ordenacao === 'nome'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Nome {ordenacao === 'nome' && (ordem === 'desc' ? '↓' : '↑')}
          </button>
        </div>
      </div>

      {/* Tabela de Estatísticas */}
      {carregando ? (
        <div className="card text-center py-12">
          <div className="text-4xl mb-4 animate-pulse">⏳</div>
          <div className="text-gray-600">Carregando estatísticas...</div>
        </div>
      ) : stats.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-4xl mb-4">📊</div>
          <div className="text-gray-600 font-semibold mb-2">
            Nenhuma estatística disponível
          </div>
          <div className="text-sm text-gray-500">
            Execute testes para gerar estatísticas
          </div>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b-2 border-gray-200">
                <tr>
                  <th className="text-left p-4 font-bold text-gray-700">Competência</th>
                  <th className="text-center p-4 font-bold text-gray-700">Taxa Sucesso</th>
                  <th className="text-center p-4 font-bold text-gray-700">Total Testes</th>
                  <th className="text-center p-4 font-bold text-gray-700">Sucesso</th>
                  <th className="text-center p-4 font-bold text-gray-700">Erros</th>
                  <th className="text-center p-4 font-bold text-gray-700">Classes</th>
                  <th className="text-center p-4 font-bold text-gray-700">Assuntos</th>
                </tr>
              </thead>
              <tbody>
                {statsOrdenados.map((stat, index) => (
                  <tr
                    key={index}
                    className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <td className="p-4">
                      <div className="font-semibold text-gray-800">
                        {stat.nome_competencia}
                      </div>
                      <div className="text-xs text-gray-500">
                        {stat.codigo_competencia}
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="flex flex-col items-center">
                        <div className="text-2xl mb-1">
                          {getIconeTaxa(stat.taxa_sucesso)}
                        </div>
                        <div className="font-bold text-lg text-gray-800 mb-2">
                          {Number(stat.taxa_sucesso).toFixed(1)}%
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div
                            className={`${getCorBarra(stat.taxa_sucesso)} h-full transition-all`}
                            style={{ width: `${stat.taxa_sucesso}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="text-center p-4">
                      <div className="font-bold text-xl text-gray-800">
                        {stat.total_testes.toLocaleString()}
                      </div>
                    </td>

                    <td className="text-center p-4">
                      <div className="font-bold text-lg text-green-700">
                        {stat.total_sucesso.toLocaleString()}
                      </div>
                    </td>

                    <td className="text-center p-4">
                      <div className="font-bold text-lg text-red-700">
                        {stat.total_erros.toLocaleString()}
                      </div>
                    </td>

                    <td className="text-center p-4">
                      <div className="text-gray-700">
                        {stat.classes_testadas}
                      </div>
                    </td>

                    <td className="text-center p-4">
                      <div className="text-gray-700">
                        {stat.assuntos_testados}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Gráficos Visuais */}
      {stats.length > 0 && (
        <div className="card">
          <h3 className="font-bold text-xl mb-6 text-gray-800">
            📈 Top 10 Competências por Taxa de Sucesso
          </h3>
          <div className="space-y-4">
            {statsOrdenados.slice(0, 10).map((stat, index) => (
              <div key={index}>
                <div className="flex justify-between items-center mb-2">
                  <div className="font-semibold text-gray-800 text-sm">
                    {stat.nome_competencia}
                  </div>
                  <div className="font-bold text-gray-700">
                    {Number(stat.taxa_sucesso).toFixed(1)}%
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-8 overflow-hidden">
                  <div
                    className={`${getCorBarra(stat.taxa_sucesso)} h-full flex items-center justify-center text-white text-sm font-semibold transition-all`}
                    style={{ width: `${stat.taxa_sucesso}%` }}
                  >
                    {stat.taxa_sucesso > 20 && `${stat.total_testes} testes`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legenda */}
      <div className="card bg-gray-50">
        <h4 className="font-bold text-gray-800 mb-3">📚 Legenda</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-4 h-4 bg-green-600 rounded"></div>
              <span className="font-semibold">✅ Alta Taxa (≥80%)</span>
            </div>
            <p className="text-gray-600 text-xs">
              Competência com excelente compatibilidade
            </p>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-4 h-4 bg-yellow-600 rounded"></div>
              <span className="font-semibold">⚠️ Média Taxa (50-79%)</span>
            </div>
            <p className="text-gray-600 text-xs">
              Algumas combinações não são válidas
            </p>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-4 h-4 bg-red-600 rounded"></div>
              <span className="font-semibold">❌ Baixa Taxa (&lt;50%)</span>
            </div>
            <p className="text-gray-600 text-xs">
              Muitas incompatibilidades encontradas
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
