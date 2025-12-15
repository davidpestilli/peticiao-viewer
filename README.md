# Peticiao Viewer

Dashboard de visualização de competências do sistema Peticiao. Site estático hospedado no GitHub Pages que consome dados diretamente do Supabase.

## Componentes

- **Estrutura Real** - Visualiza a hierarquia de peticionamento (Localidade → Competência → Classe → Assunto)
- **Estatísticas** - Taxa de sucesso por competência testada
- **Estrutura do Erro** - Erros organizados hierarquicamente com classificações
- **Confirmar Competências** - Visualização de roteamentos automáticos

## Setup

### 1. Criar tabelas no Supabase

Execute o script SQL em `MIGRATION_CACHE_TABLES.sql` no seu banco Supabase.

### 2. Configurar variáveis de ambiente

Crie um arquivo `.env` baseado em `.env.example`:

```bash
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_anon_publica
```

### 3. Instalar dependências

```bash
npm install
```

### 4. Rodar localmente

```bash
npm run dev
```

### 5. Build para produção

```bash
npm run build
```

## Deploy no GitHub Pages

### Configurar Secrets

No repositório GitHub, adicione os seguintes secrets em Settings → Secrets and variables → Actions:

- `VITE_SUPABASE_URL` - URL do seu projeto Supabase
- `VITE_SUPABASE_ANON_KEY` - Chave anon (pública) do Supabase

### Habilitar GitHub Pages

1. Vá em Settings → Pages
2. Source: GitHub Actions

O deploy acontece automaticamente quando há push na branch `main`.

## Sincronização com Peticiao

### Atualizar Cache Manualmente

No projeto `peticiao`, execute:

```bash
node backend/scripts/atualizarCacheViewer.js
```

### Sincronização Automática

O workflow `sync-viewer.yml` no repositório `peticiao` dispara um rebuild do viewer quando os componentes relevantes são alterados.

Para configurar:

1. Crie um Personal Access Token com permissão `repo`
2. Adicione como secret `VIEWER_DISPATCH_TOKEN` no repositório `peticiao`

## Estrutura do Projeto

```
peticiao-viewer/
├── src/
│   ├── components/          # Componentes React (modo leitura)
│   │   ├── EstruturasRealPeticionamento.jsx
│   │   ├── EstatisticasCompetencias.jsx
│   │   ├── EstruturaErro.jsx
│   │   └── VerificadorCompetencias.jsx
│   ├── lib/
│   │   └── supabase.js      # Cliente e funções de consulta
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── .github/
│   └── workflows/
│       └── deploy.yml       # GitHub Actions para deploy
├── MIGRATION_CACHE_TABLES.sql  # SQL para criar tabelas cache
└── package.json
```

## Tabelas Cache no Supabase

| Tabela | Descrição |
|--------|-----------|
| `cache_localidades` | Lista de localidades com contadores |
| `cache_estrutura_real` | Hierarquia completa de peticionamento |
| `cache_stats_competencias` | Estatísticas por competência |
| `cache_resumo_classificacoes` | Resumo de erros classificados |
| `cache_erros_hierarquicos` | Erros organizados por competência/classe |
| `cache_verificacao_stats` | Estatísticas de verificação |
| `cache_divergencias_agrupadas` | Grupos de roteamento automático |
| `cache_processos_divergentes` | Processos com divergência (expandir grupos) |
