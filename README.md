# AgencyFinance

Software web de gestão financeira para agência de marketing — single-page, persistência local em IndexedDB, design cinematográfico.

## Stack

- **React 18 + TypeScript** (Vite)
- **Tailwind CSS** + tokens cinematográficos custom
- **Framer Motion** — animações de entrada, layout transitions, AnimatePresence
- **Recharts** — gráficos com gradientes e tooltips custom
- **Zustand** — estado global
- **React Hook Form + Zod-ready** — formulários
- **Radix UI** — primitivas acessíveis (Dialog, Select, Switch, Label)
- **idb** — wrapper IndexedDB
- **date-fns** — datas e localização pt-BR
- **Lucide** — ícones

## Como rodar

```bash
cd agencyfinance
npm install
npm run dev
```

Abre em http://localhost:5173 com um seed de demonstração (6 clientes, 6 meses de lançamentos). Tudo persiste no IndexedDB do navegador.

## Comandos

- `npm run dev` — dev server com HMR
- `npm run build` — build de produção (TypeScript + Vite)
- `npm run preview` — preview do build
- `npm run typecheck` — apenas TypeScript

## Identidade visual

**Conceito:** "Cosmic Finance" — combinando o cometa do brand asset com tipografia editorial e dados em verde pulse. Não é dashboard genérico.

**Paleta primária (sistema):**
- `#00072d` Rich Black · `#051650` Dark Navy · `#0a2472` Bangladesh Blue · `#123499` Caribbean Blue · `#5eaf73` Mist (accent suave)

**Paleta de dados (gráficos):**
- `#5DD62C` Pulse · `#337418` Forest · `#0F0F0F` Ink · `#202020` Slate · `#F8F8F8` Paper

**Tipografia:**
- `Space Grotesk` (display) — geométrica, com contraste de tracking
- `Inter` (corpo) — features tipográficas habilitadas (cv02, cv03, ss01)
- `JetBrains Mono` (números) — `font-variant-numeric: tabular-nums`

**Motion:**
- Easing principal: `cubic-bezier(0.16, 1, 0.3, 1)` (out-expo)
- Spring suave em layout transitions
- Starfield canvas em background com twinkle e drift
- AnimatedNumber em KPIs (interpolação cúbica)
- Stagger reveals em cards e tabelas
- `prefers-reduced-motion` respeitado em todos os pontos

## Arquitetura

```
src/
├── App.tsx                    # Shell + roteamento de abas
├── main.tsx
├── types/index.ts             # Client, Receivable, Payable, AppMeta
├── lib/
│   ├── db.ts                  # IndexedDB (idb) + backup/restore
│   ├── seed.ts                # Dados de demonstração
│   ├── selectors.ts           # summarizeMonth, buildAlerts, timeline
│   ├── format.ts              # formatBRL, datas pt-BR, helpers
│   ├── csv.ts                 # Export CSV com BOM UTF-8
│   ├── colors.ts              # Paletas chart/categoria
│   └── utils.ts               # cn(), uid()
├── stores/useStore.ts         # Zustand — hydrate, upserts, theme
├── components/
│   ├── ui/                    # button, card, dialog, select, ...
│   ├── shell/                 # Header, Sidebar, Starfield, KpiCard
│   ├── dashboard/             # ChartTooltip
│   ├── crm/                   # ClientForm, ClientDetailDrawer
│   ├── receivables/           # ReceivableForm
│   └── payables/              # PayableForm
├── pages/
│   ├── Dashboard.tsx          # KPIs, gráficos, alertas
│   ├── CRM.tsx                # Tabela de clientes + detail drawer
│   ├── Receivables.tsx        # Status workflow 3 etapas + recorrência
│   ├── Payables.tsx           # Categorias + barras inline
│   └── CashFlow.tsx           # Consolidado + timeline + comparativo
└── styles/tokens.css          # CSS vars, glass, tabular, mask
```

## Funcionalidades

### Dashboard
- 4 KPI cards animados (faturamento, despesas, lucro, margem) com delta vs mês anterior
- Bar chart Receita vs Despesas (6 meses) com gradientes
- Donut chart Composição de Despesas por categoria
- Line chart Evolução do Lucro
- Painel de Alertas Inteligentes (atrasos, vencimentos 7 dias, renovações 30 dias)

### CRM
- Tabela com avatar, busca multi-campo, filtros por status, ordenação clicável
- KPIs: clientes ativos, MRR total, ticket médio
- Drawer lateral com perfil completo + histórico de pagamentos do cliente
- Form em drawer (Dialog) com validação React Hook Form
- Bloqueio de exclusão de cliente com lançamentos vinculados
- Badge de alerta para contratos com renovação ≤ 30 dias
- Link WhatsApp e mailto

### Contas a Receber
- Workflow de 3 status: Pendente → Pago pelo cliente → Confirmado na conta
- Click no badge para avançar status (rápido)
- Filtros por status, tipo, cliente, busca
- Totalizadores por status
- Geração automática de recorrências para contratos ativos no mês selecionado
- Pré-preenchimento automático ao escolher cliente (puxa valor do contrato)
- Export CSV

### Contas a Pagar
- Categorias predefinidas + categoria customizada
- Workflow de 3 status: Pendente → Pago → Confirmado no extrato
- Toggle "recorrente" para despesas fixas
- Vinculação opcional a cliente (análise de margem)
- Gráfico inline de barras horizontais por categoria
- Filtros por status, tipo, categoria, busca
- Export CSV

### Fluxo de Caixa
- Resumo do mês: faturamento (recorrente + variável), despesas (fixa + variável), lucro, margem
- Situação real: já recebido, a receber, já pago, a pagar, saldo disponível, saldo projetado
- Composed chart semanal com entradas, saídas e saldo acumulado
- Timeline cronológica do mês (entradas em verde, saídas em vermelho)
- Notas livres por mês
- Comparativo dos últimos 3 meses

### Globais
- Backup completo em JSON (header → ícone download)
- Importar backup JSON (header → ícone upload)
- Reset com seed de demonstração
- Toggle tema dark/light (default dark)
- Seletor de período: dia/semana/mês/ano + navegação por setas
- IndexedDB com auto-hydration na primeira execução
- Acessibilidade: focus rings, aria-hidden em decorativos, prefers-reduced-motion

## Notas técnicas

- **Sem backend:** tudo client-side, IndexedDB persiste por navegador/origin
- **Sem auth:** single-user, single-tenant
- **Sem cookies:** zero privacy footprint
- **Performance:** chart re-render só com mudança real (memo de selectors); motion pausa em reduced-motion
- **Acessibilidade:** Radix primitives, contraste WCAG AA, navegação por teclado funciona

## O que ficou de fora (deferred)

- Projeção cintilante de 3 meses (a estrutura existe via `previousMonthKeys`, faltou só a UI dedicada)
- Relatório dedicado de inadimplência (já visível em alertas + lista filtrada por overdue)
- Recurrence cron job (a geração é manual via botão "Gerar recorrências")

## Licença

Uso interno.
