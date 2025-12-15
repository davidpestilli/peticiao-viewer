import { useState } from 'react'
import { useFiltrosBidirecionais } from '../hooks/useFiltrosBidirecionais'
import ContainerSelecaoBidirecional from './ContainerSelecaoBidirecional'

/**
 * Componente da aba de seleção flexível
 * Permite começar a seleção por qualquer elemento (competência, classe ou assunto)
 * Os campos se atualizam dinamicamente mostrando apenas opções válidas
 *
 * @param {object} props
 * @param {string} props.localidadeSelecionada - Código da localidade selecionada
 */
export default function AbaSelecaoFlexivel({ localidadeSelecionada }) {
  // Hook customizado para gerenciar filtragem bidirecional
  const {
    selecoes,
    opcoesDisponiveis,
    opcaoesTotais,
    loading,
    erro,
    selecionarCompetencia,
    selecionarClasse,
    selecionarAssunto,
    limparSelecao,
    limparTudo
  } = useFiltrosBidirecionais(localidadeSelecionada)

  // Estado para controlar qual container está ativo (foco)
  const [containerAtivo, setContainerAtivo] = useState(null)

  // Verificar se há combinação completa selecionada
  const combinacaoCompleta = selecoes.competencia && selecoes.classe && selecoes.assunto

  // Verificar se não há opções disponíveis em algum campo (edge case)
  const semOpcoesCompetencia = opcoesDisponiveis.competencias.length === 0 && (selecoes.classe || selecoes.assunto)
  const semOpcoesClasse = opcoesDisponiveis.classes.length === 0 && (selecoes.competencia || selecoes.assunto)
  const semOpcoesAssunto = opcoesDisponiveis.assuntos.length === 0 && (selecoes.competencia || selecoes.classe)

  return (
    <div>
      {/* Instruções */}
      <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-6 mb-6">
        <div className="flex items-start gap-3">
          <div className="text-3xl">💡</div>
          <div>
            <h4 className="font-bold text-blue-900 mb-2">Como funciona a seleção flexível?</h4>
            <p className="text-blue-800 text-sm">
              Você pode começar selecionando qualquer elemento (competência, classe ou assunto).
              Os outros campos se ajustam automaticamente, mostrando apenas as opções válidas
              baseadas em testes bem-sucedidos. Quanto mais você seleciona, mais específicos ficam os resultados.
            </p>
          </div>
        </div>
      </div>

      {/* Toast de erro */}
      {erro && (
        <div className="bg-red-50 border-2 border-red-400 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-2 text-red-800">
            <span className="text-2xl">❌</span>
            <div>
              <div className="font-bold">Erro ao carregar dados</div>
              <div className="text-sm">{erro}</div>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="ml-auto px-3 py-1 bg-red-200 text-red-900 rounded hover:bg-red-300 transition text-sm font-semibold"
            >
              Recarregar
            </button>
          </div>
        </div>
      )}

      {/* Grid de 3 containers */}
      <div className="grid grid-cols-3 gap-6 mb-6">
        {/* Container: Competências */}
        <ContainerSelecaoBidirecional
          tipo="competencia"
          opcoes={opcoesDisponiveis.competencias}
          valorSelecionado={selecoes.competencia}
          onSelecionar={selecionarCompetencia}
          onLimpar={() => limparSelecao('competencia')}
          loading={loading}
          isAtivo={containerAtivo === 'competencia'}
          setAtivo={() => setContainerAtivo('competencia')}
          totalOriginal={opcaoesTotais.competencias?.length || 0}
        />

        {/* Container: Classes */}
        <ContainerSelecaoBidirecional
          tipo="classe"
          opcoes={opcoesDisponiveis.classes}
          valorSelecionado={selecoes.classe}
          onSelecionar={selecionarClasse}
          onLimpar={() => limparSelecao('classe')}
          loading={loading}
          isAtivo={containerAtivo === 'classe'}
          setAtivo={() => setContainerAtivo('classe')}
          totalOriginal={opcaoesTotais.classes?.length || 0}
        />

        {/* Container: Assuntos */}
        <ContainerSelecaoBidirecional
          tipo="assunto"
          opcoes={opcoesDisponiveis.assuntos}
          valorSelecionado={selecoes.assunto}
          onSelecionar={selecionarAssunto}
          onLimpar={() => limparSelecao('assunto')}
          loading={loading}
          isAtivo={containerAtivo === 'assunto'}
          setAtivo={() => setContainerAtivo('assunto')}
          totalOriginal={opcaoesTotais.assuntos?.length || 0}
        />
      </div>

      {/* Aviso: Nenhuma opção válida */}
      {(semOpcoesCompetencia || semOpcoesClasse || semOpcoesAssunto) && (
        <div className="bg-yellow-50 border-2 border-yellow-400 rounded-xl p-6 mb-6">
          <div className="flex items-start gap-2">
            <span className="text-2xl">⚠️</span>
            <div>
              <div className="font-bold text-yellow-900 mb-2">
                Nenhuma {semOpcoesCompetencia ? 'competência' : semOpcoesClasse ? 'classe' : 'assunto'} válida
              </div>
              <div className="text-sm text-yellow-800 mb-3">
                A combinação selecionada não possui {semOpcoesCompetencia ? 'competências' : semOpcoesClasse ? 'classes' : 'assuntos'} registradas em testes bem-sucedidos.
                Tente limpar algumas seleções para ver mais opções.
              </div>
              <div className="flex gap-2">
                {selecoes.competencia && (
                  <button
                    onClick={() => limparSelecao('competencia')}
                    className="px-3 py-1 bg-yellow-200 text-yellow-900 rounded hover:bg-yellow-300 transition text-sm font-semibold"
                  >
                    Limpar competência
                  </button>
                )}
                {selecoes.classe && (
                  <button
                    onClick={() => limparSelecao('classe')}
                    className="px-3 py-1 bg-yellow-200 text-yellow-900 rounded hover:bg-yellow-300 transition text-sm font-semibold"
                  >
                    Limpar classe
                  </button>
                )}
                {selecoes.assunto && (
                  <button
                    onClick={() => limparSelecao('assunto')}
                    className="px-3 py-1 bg-yellow-200 text-yellow-900 rounded hover:bg-yellow-300 transition text-sm font-semibold"
                  >
                    Limpar assunto
                  </button>
                )}
                <button
                  onClick={limparTudo}
                  className="px-3 py-1 bg-red-200 text-red-900 rounded hover:bg-red-300 transition text-sm font-semibold"
                >
                  Limpar tudo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Indicador de combinação completa */}
      {combinacaoCompleta && (
        <div className="bg-green-50 border-2 border-green-400 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <span className="text-3xl">✅</span>
            <div className="flex-1">
              <div className="font-bold text-green-900 mb-2">Combinação Completa</div>
              <div className="text-sm text-green-800">
                Você selecionou uma combinação válida de competência, classe e assunto.
                Esta combinação foi testada com sucesso e pode ser usada para peticionamento.
              </div>
            </div>
            <button
              onClick={limparTudo}
              className="px-4 py-2 bg-green-200 text-green-900 rounded-lg hover:bg-green-300 transition font-semibold"
            >
              Nova seleção
            </button>
          </div>

          {/* Detalhes da combinação */}
          <div className="mt-4 pt-4 border-t-2 border-green-200">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="font-bold text-green-700 mb-1">⚖️ Competência</div>
                <div className="text-green-900">
                  [{selecoes.competencia.codigo}] {selecoes.competencia.descricao}
                </div>
              </div>
              <div>
                <div className="font-bold text-green-700 mb-1">📋 Classe</div>
                <div className="text-green-900">
                  [{selecoes.classe.codigo}] {selecoes.classe.nome}
                </div>
              </div>
              <div>
                <div className="font-bold text-green-700 mb-1">📌 Assunto</div>
                <div className="text-green-900">
                  [{selecoes.assunto.codigo}] {selecoes.assunto.nome}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Botão limpar tudo (quando há seleções mas não completas) */}
      {(selecoes.competencia || selecoes.classe || selecoes.assunto) && !combinacaoCompleta && (
        <div className="flex justify-end">
          <button
            onClick={limparTudo}
            className="px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition font-semibold"
          >
            🗑️ Limpar todas as seleções
          </button>
        </div>
      )}
    </div>
  )
}
