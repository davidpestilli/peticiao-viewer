import { useState, useMemo } from 'react'
import { useFiltrosErrosBidirecionais } from '../hooks/useFiltrosErrosBidirecionais'

/**
 * Componente de seleção flexível para erros
 * Permite buscar por competência, classe ou assunto
 */
function AbaSelecaoFlexivelErros() {
  const {
    competenciaSelecionada,
    setCompetenciaSelecionada,
    classeSelecionada,
    setClasseSelecionada,
    assuntoSelecionado,
    setAssuntoSelecionado,
    opcoesFiltradas,
    errosRelacionados,
    resumoErros,
    carregandoOpcoes,
    carregandoErros,
    temSelecao,
    limparSelecoes
  } = useFiltrosErrosBidirecionais()

  // Estado para busca em cada container
  const [buscaCompetencia, setBuscaCompetencia] = useState('')
  const [buscaClasse, setBuscaClasse] = useState('')
  const [buscaAssunto, setBuscaAssunto] = useState('')

  // Estado para erro expandido
  const [erroExpandido, setErroExpandido] = useState(null)

  // Filtrar opções baseado na busca
  const competenciasFiltradas = useMemo(() => {
    if (!buscaCompetencia) return opcoesFiltradas.competencias
    const termo = buscaCompetencia.toLowerCase()
    return opcoesFiltradas.competencias.filter(c => 
      c.nome.toLowerCase().includes(termo) || 
      c.codigo.toString().includes(termo)
    )
  }, [opcoesFiltradas.competencias, buscaCompetencia])

  const classesFiltradas = useMemo(() => {
    if (!buscaClasse) return opcoesFiltradas.classes
    const termo = buscaClasse.toLowerCase()
    return opcoesFiltradas.classes.filter(c => 
      c.nome.toLowerCase().includes(termo) || 
      c.codigo.toString().includes(termo)
    )
  }, [opcoesFiltradas.classes, buscaClasse])

  const assuntosFiltrados = useMemo(() => {
    if (!buscaAssunto) return opcoesFiltradas.assuntos
    const termo = buscaAssunto.toLowerCase()
    return opcoesFiltradas.assuntos.filter(a => 
      a.nome.toLowerCase().includes(termo) || 
      a.codigo.toString().includes(termo)
    )
  }, [opcoesFiltradas.assuntos, buscaAssunto])

  // Componente de item selecionável
  const ItemSelecionavel = ({ item, selecionado, onClick, tipo }) => (
    <div
      onClick={() => onClick(selecionado ? null : item.codigo)}
      className={`p-2 rounded cursor-pointer transition-colors border ${
        selecionado 
          ? 'bg-blue-600 text-white border-blue-700' 
          : 'bg-gray-700 hover:bg-gray-600 border-gray-600'
      }`}
    >
      <div className="flex justify-between items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="text-xs text-gray-400 mb-0.5">
            {tipo} {item.codigo}
          </div>
          <div className="text-sm font-medium truncate" title={item.nome}>
            {item.nome}
          </div>
        </div>
        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
          selecionado ? 'bg-blue-500' : 'bg-gray-600'
        }`}>
          {item.quantidade}
        </span>
      </div>
    </div>
  )

  // Container de seleção
  const ContainerSelecao = ({ 
    titulo, 
    icone, 
    items, 
    itemSelecionado, 
    setItemSelecionado, 
    busca, 
    setBusca,
    tipo,
    carregando 
  }) => (
    <div className="bg-gray-800 rounded-lg border border-gray-700 flex flex-col h-full">
      <div className="p-3 border-b border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <span>{icone}</span>
            {titulo}
            <span className="text-xs text-gray-400">({items.length})</span>
          </h3>
          {itemSelecionado && (
            <button
              onClick={() => setItemSelecionado(null)}
              className="text-xs text-red-400 hover:text-red-300"
            >
              Limpar
            </button>
          )}
        </div>
        <input
          type="text"
          placeholder={`Buscar ${titulo.toLowerCase()}...`}
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
        />
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1" style={{ maxHeight: '300px' }}>
        {carregando ? (
          <div className="text-center py-4 text-gray-400">Carregando...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-4 text-gray-500">Nenhum item encontrado</div>
        ) : (
          items.map(item => (
            <ItemSelecionavel
              key={item.codigo}
              item={item}
              selecionado={itemSelecionado === item.codigo}
              onClick={setItemSelecionado}
              tipo={tipo}
            />
          ))
        )}
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Cabeçalho com resumo */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              🔎 Seleção Flexível de Erros
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Selecione competência, classe ou assunto em qualquer ordem para filtrar os erros
            </p>
          </div>
          {temSelecao && (
            <button
              onClick={limparSelecoes}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-medium transition-colors"
            >
              Limpar Filtros
            </button>
          )}
        </div>

        {/* Resumo de seleção */}
        {temSelecao && (
          <div className="mt-4 flex flex-wrap gap-2">
            {competenciaSelecionada && (
              <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-xs font-medium">
                Competência: {competenciaSelecionada}
              </span>
            )}
            {classeSelecionada && (
              <span className="px-3 py-1 bg-green-600 text-white rounded-full text-xs font-medium">
                Classe: {classeSelecionada}
              </span>
            )}
            {assuntoSelecionado && (
              <span className="px-3 py-1 bg-purple-600 text-white rounded-full text-xs font-medium">
                Assunto: {assuntoSelecionado}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Grade de seleção */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ContainerSelecao
          titulo="Competências"
          icone="🏛️"
          items={competenciasFiltradas}
          itemSelecionado={competenciaSelecionada}
          setItemSelecionado={setCompetenciaSelecionada}
          busca={buscaCompetencia}
          setBusca={setBuscaCompetencia}
          tipo="Cód."
          carregando={carregandoOpcoes}
        />

        <ContainerSelecao
          titulo="Classes"
          icone="📁"
          items={classesFiltradas}
          itemSelecionado={classeSelecionada}
          setItemSelecionado={setClasseSelecionada}
          busca={buscaClasse}
          setBusca={setBuscaClasse}
          tipo="Cód."
          carregando={carregandoOpcoes}
        />

        <ContainerSelecao
          titulo="Assuntos"
          icone="📋"
          items={assuntosFiltrados}
          itemSelecionado={assuntoSelecionado}
          setItemSelecionado={setAssuntoSelecionado}
          busca={buscaAssunto}
          setBusca={setBuscaAssunto}
          tipo="Cód."
          carregando={carregandoOpcoes}
        />
      </div>

      {/* Resumo de erros */}
      {temSelecao && resumoErros.total > 0 && (
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
            📊 Distribuição dos Erros
            <span className="text-sm text-gray-400">({resumoErros.total} erros)</span>
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="bg-gray-700 rounded p-3 text-center">
              <div className="text-2xl font-bold text-white">{resumoErros.total}</div>
              <div className="text-xs text-gray-400">Total</div>
            </div>
            <div className="bg-green-900/50 rounded p-3 text-center">
              <div className="text-2xl font-bold text-green-400">{resumoErros.classificados}</div>
              <div className="text-xs text-gray-400">Classificados</div>
            </div>
            <div className="bg-yellow-900/50 rounded p-3 text-center">
              <div className="text-2xl font-bold text-yellow-400">{resumoErros.naoClassificados}</div>
              <div className="text-xs text-gray-400">Não Classificados</div>
            </div>
          </div>

          {Object.keys(resumoErros.porTipoErro).length > 0 && (
            <div className="border-t border-gray-700 pt-3">
              <h4 className="text-sm font-medium text-gray-300 mb-2">Por Tipo de Erro:</h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(resumoErros.porTipoErro).map(([tipo, qtd]) => (
                  <span 
                    key={tipo} 
                    className="px-2 py-1 bg-gray-700 rounded text-xs text-gray-300"
                  >
                    {tipo}: <span className="font-bold text-white">{qtd}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Lista de erros relacionados */}
      {temSelecao && (
        <div className="bg-gray-800 rounded-lg border border-gray-700">
          <div className="p-4 border-b border-gray-700">
            <h3 className="font-semibold text-white flex items-center gap-2">
              ⚠️ Erros Encontrados
              {carregandoErros && <span className="text-sm text-gray-400">(carregando...)</span>}
            </h3>
          </div>
          
          <div className="max-h-[500px] overflow-y-auto">
            {carregandoErros ? (
              <div className="p-8 text-center text-gray-400">
                Carregando erros...
              </div>
            ) : errosRelacionados.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                Nenhum erro encontrado para os filtros selecionados
              </div>
            ) : (
              <div className="divide-y divide-gray-700">
                {errosRelacionados.map(erro => (
                  <div key={erro.id} className="p-4 hover:bg-gray-700/50 transition-colors">
                    <div 
                      className="cursor-pointer"
                      onClick={() => setErroExpandido(erroExpandido === erro.id ? null : erro.id)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          {/* Classificação do erro */}
                          <div className="flex items-center gap-2 mb-2">
                            {erro.erro_classificado ? (
                              <span className="px-2 py-0.5 bg-green-600 text-white text-xs rounded">
                                ✓ {erro.nome_erro_classificado || 'Classificado'}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-yellow-600 text-white text-xs rounded">
                                Não Classificado
                              </span>
                            )}
                          </div>

                          {/* Preview do erro */}
                          <div className="text-sm text-red-400 font-mono bg-red-900/20 rounded p-2 truncate">
                            {erro.erro_texto?.substring(0, 150)}
                            {erro.erro_texto?.length > 150 && '...'}
                          </div>

                          {/* Info resumida */}
                          <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-400">
                            <span title="Competência">🏛️ {erro.codigo_competencia}</span>
                            <span title="Classe">📁 {erro.codigo_classe}</span>
                            <span title="Assunto">📋 {erro.codigo_assunto}</span>
                          </div>
                        </div>

                        <button className="text-gray-400 hover:text-white">
                          {erroExpandido === erro.id ? '▼' : '▶'}
                        </button>
                      </div>
                    </div>

                    {/* Detalhes expandidos */}
                    {erroExpandido === erro.id && (
                      <div className="mt-4 space-y-3 pl-4 border-l-2 border-gray-600">
                        {/* Competência completa */}
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Competência</div>
                          <div className="text-sm text-white">
                            <span className="text-gray-400">{erro.codigo_competencia}</span> - {erro.nome_competencia}
                          </div>
                        </div>

                        {/* Classe completa */}
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Classe</div>
                          <div className="text-sm text-white">
                            <span className="text-gray-400">{erro.codigo_classe}</span> - {erro.nome_classe}
                          </div>
                        </div>

                        {/* Assunto completo */}
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Assunto</div>
                          <div className="text-sm text-white">
                            <span className="text-gray-400">{erro.codigo_assunto}</span> - {erro.nome_assunto}
                          </div>
                        </div>

                        {/* Erro completo */}
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Mensagem de Erro Completa</div>
                          <div className="text-sm text-red-400 font-mono bg-red-900/20 rounded p-3 whitespace-pre-wrap break-all max-h-[300px] overflow-y-auto">
                            {erro.erro_texto}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Instrução inicial */}
      {!temSelecao && (
        <div className="bg-gray-800/50 rounded-lg p-8 text-center border border-dashed border-gray-600">
          <div className="text-4xl mb-4">🔎</div>
          <h3 className="text-lg font-medium text-white mb-2">
            Selecione um filtro para começar
          </h3>
          <p className="text-gray-400 text-sm max-w-md mx-auto">
            Escolha uma competência, classe ou assunto acima para ver os erros relacionados.
            Você pode combinar filtros para refinar a busca.
          </p>
        </div>
      )}
    </div>
  )
}

export default AbaSelecaoFlexivelErros
