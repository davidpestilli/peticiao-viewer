import { useState, useMemo } from 'react'
import { useFiltrosErrosBidirecionais } from '../hooks/useFiltrosErrosBidirecionais'
import ContainerSelecaoBidirecional from './ContainerSelecaoBidirecional'

/**
 * Componente de seleção flexível para erros
 * Permite buscar por competência, classe ou assunto
 * Utiliza o ContainerSelecaoBidirecional com input de busca + select dropdown
 */
function AbaSelecaoFlexivelErros() {
  const {
    competenciaSelecionada,
    setCompetenciaSelecionada,
    classeSelecionada,
    setClasseSelecionada,
    assuntoSelecionado,
    setAssuntoSelecionado,
    todasOpcoes,
    opcoesFiltradas,
    errosRelacionados,
    resumoErros,
    carregandoOpcoes,
    carregandoErros,
    temSelecao,
    limparSelecoes
  } = useFiltrosErrosBidirecionais()

  // Estado para controlar qual container está ativo (foco)
  const [containerAtivo, setContainerAtivo] = useState(null)

  // Estado para erro expandido
  const [erroExpandido, setErroExpandido] = useState(null)

  // Transformar opções para formato esperado pelo ContainerSelecaoBidirecional
  // O hook retorna arrays com {codigo, nome, quantidade}
  // O componente espera objetos com codigo e nome/descricao
  const transformarParaObjeto = (codigo, opcoes, campoNome) => {
    if (!codigo) return null
    const opcao = opcoes.find(o => o.codigo === codigo)
    if (!opcao) return null
    return {
      codigo: opcao.codigo,
      [campoNome]: opcao.nome,
      total_ocorrencias: opcao.quantidade
    }
  }

  // Valores selecionados como objetos (para ContainerSelecaoBidirecional)
  const competenciaObj = useMemo(() => 
    transformarParaObjeto(competenciaSelecionada, opcoesFiltradas.competencias, 'descricao'),
    [competenciaSelecionada, opcoesFiltradas.competencias]
  )

  const classeObj = useMemo(() => 
    transformarParaObjeto(classeSelecionada, opcoesFiltradas.classes, 'nome'),
    [classeSelecionada, opcoesFiltradas.classes]
  )

  const assuntoObj = useMemo(() => 
    transformarParaObjeto(assuntoSelecionado, opcoesFiltradas.assuntos, 'nome'),
    [assuntoSelecionado, opcoesFiltradas.assuntos]
  )

  // Transformar opções para formato esperado pelo ContainerSelecaoBidirecional
  const opcoesCompetencias = useMemo(() => 
    opcoesFiltradas.competencias.map(c => ({
      codigo: c.codigo,
      descricao: c.nome,
      total_ocorrencias: c.quantidade
    })),
    [opcoesFiltradas.competencias]
  )

  const opcoesClasses = useMemo(() => 
    opcoesFiltradas.classes.map(c => ({
      codigo: c.codigo,
      nome: c.nome,
      total_ocorrencias: c.quantidade
    })),
    [opcoesFiltradas.classes]
  )

  const opcoesAssuntos = useMemo(() => 
    opcoesFiltradas.assuntos.map(a => ({
      codigo: a.codigo,
      nome: a.nome,
      total_ocorrencias: a.quantidade
    })),
    [opcoesFiltradas.assuntos]
  )

  // Handlers de seleção (recebem objeto, passam código)
  const handleSelecionarCompetencia = (opcao) => {
    setCompetenciaSelecionada(opcao?.codigo || null)
  }

  const handleSelecionarClasse = (opcao) => {
    setClasseSelecionada(opcao?.codigo || null)
  }

  const handleSelecionarAssunto = (opcao) => {
    setAssuntoSelecionado(opcao?.codigo || null)
  }

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
        <ContainerSelecaoBidirecional
          tipo="competencia"
          opcoes={opcoesCompetencias}
          valorSelecionado={competenciaObj}
          onSelecionar={handleSelecionarCompetencia}
          onLimpar={() => setCompetenciaSelecionada(null)}
          loading={carregandoOpcoes}
          isAtivo={containerAtivo === 'competencia'}
          setAtivo={() => setContainerAtivo('competencia')}
          totalOriginal={todasOpcoes.competencias?.length || 0}
        />

        <ContainerSelecaoBidirecional
          tipo="classe"
          opcoes={opcoesClasses}
          valorSelecionado={classeObj}
          onSelecionar={handleSelecionarClasse}
          onLimpar={() => setClasseSelecionada(null)}
          loading={carregandoOpcoes}
          isAtivo={containerAtivo === 'classe'}
          setAtivo={() => setContainerAtivo('classe')}
          totalOriginal={todasOpcoes.classes?.length || 0}
        />

        <ContainerSelecaoBidirecional
          tipo="assunto"
          opcoes={opcoesAssuntos}
          valorSelecionado={assuntoObj}
          onSelecionar={handleSelecionarAssunto}
          onLimpar={() => setAssuntoSelecionado(null)}
          loading={carregandoOpcoes}
          isAtivo={containerAtivo === 'assunto'}
          setAtivo={() => setContainerAtivo('assunto')}
          totalOriginal={todasOpcoes.assuntos?.length || 0}
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
