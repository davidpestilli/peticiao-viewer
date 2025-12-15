import { useState, useEffect } from 'react'

/**
 * Componente reutilizável para seleção bidirecional de competência, classe ou assunto
 * Combina autocomplete + select dropdown + estados visuais dinâmicos
 *
 * @param {object} props
 * @param {string} props.tipo - 'competencia', 'classe' ou 'assunto'
 * @param {array} props.opcoes - Array de opções disponíveis (filtradas)
 * @param {object|null} props.valorSelecionado - Valor atualmente selecionado
 * @param {function} props.onSelecionar - Callback quando seleciona um valor
 * @param {function} props.onLimpar - Callback quando limpa a seleção
 * @param {boolean} props.loading - Se está carregando dados
 * @param {boolean} props.isAtivo - Se este container está com foco
 * @param {function} props.setAtivo - Callback para marcar como ativo
 * @param {number} props.totalOriginal - Total de opções sem filtro (para badge)
 */
export default function ContainerSelecaoBidirecional({
  tipo,
  opcoes,
  valorSelecionado,
  onSelecionar,
  onLimpar,
  loading,
  isAtivo,
  setAtivo,
  totalOriginal
}) {
  // Estados locais do autocomplete
  const [busca, setBusca] = useState('')
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false)
  const [selectValue, setSelectValue] = useState('')

  // Debounce da busca
  const [buscaDebounced, setBuscaDebounced] = useState('')
  useEffect(() => {
    const timer = setTimeout(() => {
      setBuscaDebounced(busca)
    }, 300)
    return () => clearTimeout(timer)
  }, [busca])

  // Configurações por tipo
  const config = {
    competencia: {
      titulo: 'Competências',
      cor: 'blue',
      placeholder: 'Buscar competência...',
      campoNome: 'descricao',
      icon: '⚖️'
    },
    classe: {
      titulo: 'Classes',
      cor: 'green',
      placeholder: 'Buscar classe...',
      campoNome: 'nome',
      icon: '📋'
    },
    assunto: {
      titulo: 'Assuntos',
      cor: 'purple',
      placeholder: 'Buscar assunto...',
      campoNome: 'nome',
      icon: '📌'
    }
  }[tipo]

  // Filtrar opções para autocomplete
  const opcoesFiltradas = opcoes.filter(opc => {
    if (!buscaDebounced || buscaDebounced.length < 2) return false
    const termoBusca = buscaDebounced.toLowerCase()
    const nome = opc[config.campoNome]?.toLowerCase() || ''
    const codigo = opc.codigo?.toLowerCase() || ''
    return nome.includes(termoBusca) || codigo.includes(termoBusca)
  }).slice(0, 50) // Limite de 50 resultados

  // Determinar classes do container baseado no estado
  const getContainerClasses = () => {
    let base = 'border rounded-lg p-4 transition-all duration-300'

    if (valorSelecionado) {
      // Selecionado: cor do tipo
      if (config.cor === 'blue') return `${base} border-blue-500 border-2 bg-blue-50`
      if (config.cor === 'green') return `${base} border-green-500 border-2 bg-green-50`
      if (config.cor === 'purple') return `${base} border-purple-500 border-2 bg-purple-50`
    } else if (isAtivo) {
      // Ativo (foco): azul com shadow
      return `${base} border-blue-500 border-2 bg-blue-50 shadow-lg`
    } else if (opcoes.length < totalOriginal && totalOriginal > 0) {
      // Filtrado (opções reduzidas): roxo
      return `${base} border-purple-400 bg-purple-50`
    }
    // Padrão: cinza
    return `${base} border-gray-300 bg-white`
  }

  // Handler para seleção via autocomplete
  const handleSelecionarAutocomplete = (opcao) => {
    onSelecionar(opcao)
    setBusca('')
    setMostrarSugestoes(false)
    setSelectValue('') // Limpar select
  }

  // Handler para seleção via select
  const handleSelecionarSelect = (e) => {
    const codigo = e.target.value
    if (!codigo) return

    const opcaoSelecionada = opcoes.find(opc => opc.codigo === codigo)
    if (opcaoSelecionada) {
      onSelecionar(opcaoSelecionada)
      setSelectValue('') // Reset select após seleção
    }
  }

  // Classes dinâmicas para header
  const getHeaderClasses = () => {
    if (config.cor === 'blue') return 'text-blue-900'
    if (config.cor === 'green') return 'text-green-900'
    if (config.cor === 'purple') return 'text-purple-900'
    return 'text-gray-900'
  }

  // Classes para o card de valor selecionado
  const getSelectedCardClasses = () => {
    if (config.cor === 'blue') return 'border-blue-600 bg-blue-100'
    if (config.cor === 'green') return 'border-green-600 bg-green-100'
    if (config.cor === 'purple') return 'border-purple-600 bg-purple-100'
    return 'border-gray-600 bg-gray-100'
  }

  const getSelectedTextClasses = () => {
    if (config.cor === 'blue') return { code: 'text-blue-700', name: 'text-blue-900', extra: 'text-blue-600' }
    if (config.cor === 'green') return { code: 'text-green-700', name: 'text-green-900', extra: 'text-green-600' }
    if (config.cor === 'purple') return { code: 'text-purple-700', name: 'text-purple-900', extra: 'text-purple-600' }
    return { code: 'text-gray-700', name: 'text-gray-900', extra: 'text-gray-600' }
  }

  return (
    <div
      className={getContainerClasses()}
      onFocus={setAtivo}
      tabIndex={0}
    >
      {/* Header com título e badge */}
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-lg font-bold ${getHeaderClasses()} flex items-center gap-2`}>
          <span>{config.icon}</span>
          <span>{config.titulo}</span>
        </h3>

        {/* Badge contador */}
        <span className={`px-3 py-1 text-sm font-bold rounded-full ${
          valorSelecionado
            ? 'bg-green-600 text-white'
            : opcoes.length < totalOriginal && totalOriginal > 0
              ? 'bg-purple-600 text-white'
              : 'bg-indigo-600 text-white'
        }`}>
          {valorSelecionado ? (
            <>✓ Selecionado</>
          ) : (
            <>
              {opcoes.length} opção{opcoes.length !== 1 ? 's' : ''}
              {opcoes.length < totalOriginal && totalOriginal > 0 && ` de ${totalOriginal}`}
            </>
          )}
        </span>
      </div>

      {/* Card de valor selecionado */}
      {valorSelecionado && (
        <div className={`mb-4 p-3 rounded-lg border-2 ${getSelectedCardClasses()}`}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className={`font-mono text-xs ${getSelectedTextClasses().code} font-bold mb-1`}>
                [{valorSelecionado.codigo}]
              </div>
              <div className={`text-sm ${getSelectedTextClasses().name} font-semibold`}>
                {valorSelecionado[config.campoNome]}
              </div>
              {valorSelecionado.total_combinacoes && (
                <div className={`text-xs ${getSelectedTextClasses().extra} mt-1`}>
                  {valorSelecionado.total_combinacoes} registro{valorSelecionado.total_combinacoes !== 1 ? 's' : ''}
                </div>
              )}
              {valorSelecionado.total_ocorrencias && (
                <div className={`text-xs ${getSelectedTextClasses().extra} mt-1`}>
                  {valorSelecionado.total_ocorrencias} ocorrência{valorSelecionado.total_ocorrencias !== 1 ? 's' : ''}
                </div>
              )}
            </div>
            <button
              onClick={onLimpar}
              className="ml-2 px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition font-semibold"
            >
              ✕ Limpar
            </button>
          </div>
        </div>
      )}

      {/* Autocomplete */}
      {!valorSelecionado && (
        <div className="relative mb-3">
          <input
            type="text"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
            value={busca}
            onChange={(e) => {
              setBusca(e.target.value)
              setMostrarSugestoes(true)
            }}
            onFocus={() => {
              setMostrarSugestoes(true)
              setAtivo()
            }}
            onBlur={() => setTimeout(() => setMostrarSugestoes(false), 200)}
            placeholder={`🔍 ${config.placeholder}`}
            disabled={loading}
          />

          {/* Dica de caracteres mínimos */}
          {busca.length > 0 && busca.length < 2 && (
            <p className={`text-xs ${getSelectedTextClasses().extra} mt-1`}>
              💡 Digite pelo menos 2 caracteres
            </p>
          )}

          {/* Dropdown de sugestões */}
          {mostrarSugestoes && buscaDebounced.length >= 2 && (
            <div className="absolute z-50 w-full mt-1 bg-white border-2 border-blue-400 rounded-lg shadow-2xl max-h-80 overflow-y-auto">
              {opcoesFiltradas.length > 0 ? (
                opcoesFiltradas.map((opc, index) => (
                  <button
                    key={`autocomplete-${index}-${opc.codigo}`}
                    onClick={() => handleSelecionarAutocomplete(opc)}
                    className="w-full text-left px-4 py-2 hover:bg-blue-100 border-b border-gray-200 transition-colors"
                  >
                    <div className="font-mono text-xs text-blue-600 font-bold">
                      [{opc.codigo}]
                    </div>
                    <div className="text-sm text-gray-900">{opc[config.campoNome]}</div>
                    {opc.total_combinacoes && (
                      <div className="text-xs text-gray-500 mt-1">
                        {opc.total_combinacoes} registro{opc.total_combinacoes !== 1 ? 's' : ''}
                      </div>
                    )}
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-gray-500 text-center text-sm">
                  ❌ Nenhum resultado encontrado
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Select dropdown */}
      {!valorSelecionado && (
        <div className="mb-2">
          <select
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
            value={selectValue}
            onChange={handleSelecionarSelect}
            onFocus={setAtivo}
            disabled={loading || opcoes.length === 0}
          >
            <option value="" className="text-gray-900">
              {loading
                ? 'Carregando...'
                : opcoes.length === 0
                  ? 'Nenhuma opção disponível'
                  : `Selecione ${tipo === 'competencia' ? 'a competência' : tipo === 'classe' ? 'a classe' : 'o assunto'}`
              }
            </option>
            {opcoes.map((opc, idx) => (
              <option key={opc.codigo || `opt-${idx}`} value={opc.codigo} className="text-gray-900">
                [{opc.codigo}] {opc[config.campoNome] || 'N/A'}
                {opc.total_combinacoes ? ` (${opc.total_combinacoes})` : ''}
                {opc.total_ocorrencias ? ` (${opc.total_ocorrencias})` : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Loading spinner */}
      {loading && (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      )}

      {/* Mensagem quando aguardando seleção */}
      {!valorSelecionado && !loading && opcoes.length === 0 && (
        <div className="text-center py-4 text-gray-500 text-sm">
          💡 Selecione outro elemento primeiro
        </div>
      )}
    </div>
  )
}
