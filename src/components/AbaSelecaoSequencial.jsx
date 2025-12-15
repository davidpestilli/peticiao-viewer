import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Componente da aba de seleção sequencial
 * Navegação em cascata: Competência → Classe → Assunto
 * Usa as tabelas de cache específicas para filtros
 *
 * @param {object} props
 * @param {string} props.localidadeSelecionada - Código da localidade selecionada
 */
export default function AbaSelecaoSequencial({ localidadeSelecionada }) {
  // Estados de dados
  const [competencias, setCompetencias] = useState([])
  const [competenciaSelecionada, setCompetenciaSelecionada] = useState(null)
  const [classes, setClasses] = useState([])
  const [classeSelecionada, setClasseSelecionada] = useState(null)
  const [assuntos, setAssuntos] = useState([])

  // Estados de loading
  const [loadingCompetencias, setLoadingCompetencias] = useState(false)
  const [loadingClasses, setLoadingClasses] = useState(false)
  const [loadingAssuntos, setLoadingAssuntos] = useState(false)

  /**
   * Busca todos os registros com paginação para evitar limite de 1000
   */
  const buscarTodosComPaginacao = async (tabela, select, filtros = {}, orderBy = null) => {
    let todosRegistros = []
    let offset = 0
    const TAMANHO_PAGINA = 1000
    let temMais = true

    while (temMais) {
      let query = supabase
        .from(tabela)
        .select(select)
        .range(offset, offset + TAMANHO_PAGINA - 1)

      // Aplicar filtros
      Object.entries(filtros).forEach(([campo, valor]) => {
        if (valor !== null && valor !== undefined) {
          query = query.eq(campo, valor)
        }
      })

      if (orderBy) {
        query = query.order(orderBy)
      }

      const { data, error } = await query

      if (error) throw error

      if (data && data.length > 0) {
        todosRegistros = todosRegistros.concat(data)
        offset += TAMANHO_PAGINA
        temMais = data.length === TAMANHO_PAGINA
      } else {
        temMais = false
      }
    }

    return todosRegistros
  }

  // Carregar competências quando localidade é selecionada
  useEffect(() => {
    if (localidadeSelecionada) {
      carregarCompetencias()
    }
  }, [localidadeSelecionada])

  const carregarCompetencias = async () => {
    setLoadingCompetencias(true)
    try {
      const data = await buscarTodosComPaginacao(
        'cache_estrutura_real_competencias',
        'codigo_competencia, descricao_competencia, total_combinacoes',
        { codigo_localidade: localidadeSelecionada },
        'descricao_competencia'
      )
      setCompetencias(data.map(c => ({
        codigo_competencia: c.codigo_competencia,
        nome_competencia: c.descricao_competencia || `Competência ${c.codigo_competencia}`,
        total_combinacoes: c.total_combinacoes
      })))
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
      // Buscar relações para esta competência
      const relacoes = await buscarTodosComPaginacao(
        'cache_estrutura_real_relacoes',
        'codigo_classe',
        {
          codigo_localidade: localidadeSelecionada,
          codigo_competencia: competencia.codigo_competencia
        }
      )

      // Extrair classes únicas
      const classesIds = [...new Set(relacoes.map(r => r.codigo_classe))]

      if (classesIds.length === 0) {
        setClasses([])
        return
      }

      // Buscar detalhes das classes (com batching)
      const BATCH_SIZE = 100
      let classesData = []
      for (let i = 0; i < classesIds.length; i += BATCH_SIZE) {
        const batch = classesIds.slice(i, i + BATCH_SIZE)
        const { data, error } = await supabase
          .from('cache_estrutura_real_classes')
          .select('codigo_classe, nome_classe, total_combinacoes')
          .eq('codigo_localidade', localidadeSelecionada)
          .in('codigo_classe', batch)
          .order('nome_classe')

        if (error) throw error
        classesData = classesData.concat(data || [])
      }

      setClasses(classesData.map(c => ({
        codigo_classe: c.codigo_classe,
        nome_classe: c.nome_classe || `Classe ${c.codigo_classe}`,
        total_combinacoes: c.total_combinacoes
      })))
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
      // Buscar relações para esta competência + classe
      const relacoes = await buscarTodosComPaginacao(
        'cache_estrutura_real_relacoes',
        'codigo_assunto',
        {
          codigo_localidade: localidadeSelecionada,
          codigo_competencia: competenciaSelecionada.codigo_competencia,
          codigo_classe: classe.codigo_classe
        }
      )

      // Extrair assuntos únicos
      const assuntosIds = [...new Set(relacoes.map(r => r.codigo_assunto))]

      if (assuntosIds.length === 0) {
        setAssuntos([])
        return
      }

      // Buscar detalhes dos assuntos (com batching)
      const BATCH_SIZE = 100
      let assuntosData = []
      for (let i = 0; i < assuntosIds.length; i += BATCH_SIZE) {
        const batch = assuntosIds.slice(i, i + BATCH_SIZE)
        const { data, error } = await supabase
          .from('cache_estrutura_real_assuntos')
          .select('codigo_assunto, nome_assunto, total_ocorrencias')
          .eq('codigo_localidade', localidadeSelecionada)
          .in('codigo_assunto', batch)
          .order('nome_assunto')

        if (error) throw error
        assuntosData = assuntosData.concat(data || [])
      }

      setAssuntos(assuntosData.map(a => ({
        codigo_assunto: a.codigo_assunto,
        nome_assunto: a.nome_assunto || `Assunto ${a.codigo_assunto}`,
        total_ocorrencias: a.total_ocorrencias
      })))
    } catch (e) {
      console.error('Erro ao carregar assuntos:', e)
    } finally {
      setLoadingAssuntos(false)
    }
  }

  return (
    <div>
      {/* Instruções */}
      <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-6 mb-6">
        <div className="flex items-start gap-3">
          <div className="text-3xl">📊</div>
          <div>
            <h4 className="font-bold text-blue-900 mb-2">Como funciona a seleção sequencial?</h4>
            <p className="text-blue-800 text-sm">
              Navegue pela estrutura hierárquica: primeiro selecione uma <strong>Competência</strong>,
              depois uma <strong>Classe</strong>, e por fim um <strong>Assunto</strong>.
              Cada seleção filtra as opções do próximo nível.
            </p>
          </div>
        </div>
      </div>

      {/* Grid de 3 colunas */}
      <div className="grid grid-cols-3 gap-4">
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
                      : 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-800'
                  }`}
                >
                  <div className="font-bold truncate">{comp.nome_competencia}</div>
                  <div className={`text-xs mt-1 ${competenciaSelecionada?.codigo_competencia === comp.codigo_competencia ? 'opacity-70' : 'text-gray-500'}`}>{comp.codigo_competencia}</div>
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
                      : 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-800'
                  }`}
                >
                  <div className="font-bold truncate">{classe.nome_classe}</div>
                  <div className={`text-xs mt-1 ${classeSelecionada?.codigo_classe === classe.codigo_classe ? 'opacity-70' : 'text-gray-500'}`}>{classe.codigo_classe}</div>
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
                  className="p-3 rounded-lg border-2 border-gray-200 bg-white"
                >
                  <div className="font-semibold text-gray-800 text-sm">{assunto.nome_assunto}</div>
                  <div className="text-xs text-gray-500 mt-1">{assunto.codigo_assunto}</div>
                  <div className="mt-2 flex gap-2 flex-wrap">
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

      </div>
    </div>
  )
}
