import { useState } from 'react'
import EstruturasRealPeticionamento from './components/EstruturasRealPeticionamento'
import EstatisticasCompetencias from './components/EstatisticasCompetencias'
import EstruturaErro from './components/EstruturaErro'
import VerificadorCompetencias from './components/VerificadorCompetencias'

const TABS = [
  { id: 'estrutura-real', label: 'Estrutura Real', icon: '📊' },
  { id: 'estatisticas', label: 'Estatísticas', icon: '📈' },
  { id: 'estrutura-erro', label: 'Estrutura do Erro', icon: '🔍' },
  { id: 'verificador', label: 'Confirmar Competências', icon: '✅' }
]

export default function App() {
  const [activeTab, setActiveTab] = useState('estrutura-real')

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-900 to-indigo-900 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-white">
            Peticiao Viewer
          </h1>
          <p className="text-blue-200 mt-1">
            Dashboard de Competências - Visualização em tempo real
          </p>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-slate-800 border-b border-slate-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-2 overflow-x-auto py-3">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 rounded-lg font-semibold transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white'
                }`}
              >
                <span className="text-xl">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'estrutura-real' && <EstruturasRealPeticionamento />}
        {activeTab === 'estatisticas' && <EstatisticasCompetencias />}
        {activeTab === 'estrutura-erro' && <EstruturaErro />}
        {activeTab === 'verificador' && <VerificadorCompetencias />}
      </main>

      {/* Footer */}
      <footer className="bg-slate-800 border-t border-slate-700 mt-8">
        <div className="max-w-7xl mx-auto px-4 py-4 text-center text-slate-400 text-sm">
          Peticiao Viewer - Dados atualizados automaticamente do sistema principal
        </div>
      </footer>
    </div>
  )
}
