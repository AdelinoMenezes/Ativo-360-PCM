# Plano de Implementação - Ajustes e Sincronização Supabase

Este plano detalha as revisões necessárias para garantir que a integração híbrida (LocalStorage + Supabase) funcione perfeitamente.

## User Review Required

> [!IMPORTANT]
> **Sensibilidade de Caixa (Case Sensitivity) no PostgreSQL:**
> No PostgreSQL, identificadores não aspeados (como nomes de colunas) são automaticamente convertidos para minúsculas. O banco de dados local da aplicação e o código JavaScript usam propriedades em `camelCase` (ex: `unitCost`, `minStock`). Se as colunas no Supabase forem criadas como minúsculas (`unitcost`, `minstock`), a aplicação quebrará ao carregar os dados. 
> Proponho aspear as colunas no `schema.sql` para preservar o `camelCase` original sem exigir refatoração massiva de todo o Javascript.

## Open Questions

Nenhuma questão em aberto no momento. O plano visa consolidar as pendências de banco de dados e sincronização observadas.

---

## Proposed Changes

### Banco de Dados (PostgreSQL)

#### [MODIFY] [schema.sql](file:///c:/Users/adeli/Documents/antigravity/Projetos/Ativo%20360%20-%20PCM/schema.sql)
- Adicionar aspas duplas nas colunas `camelCase` para preservar a compatibilidade de chaves com o frontend JavaScript:
  - Tabela `parts`: `"unitCost"`, `"minStock"`, `"maxStock"`
  - Tabela `movements`: `"partId"`, `"partCode"`, `"partName"`, `"fromWhId"`, `"fromWhName"`, `"toWhId"`, `"toWhName"`
  - Tabela `work_orders`: `"assetTag"`, `"assetName"`

---

### Módulo de Dados

#### [MODIFY] [data.js](file:///c:/Users/adeli/Documents/antigravity/Projetos/Ativo%20360%20-%20PCM/src/js/data.js)
- No método `uploadDatabaseToSupabase()`, garantir que a exclusão da tabela `assets` seja realizada na sequência correta (após limpar as ordens de serviço que possuem chave estrangeira para ativos) para evitar violações de chave primária/única no momento da inserção.

---

## Verification Plan

### Automated Tests
- N/A (Sem framework de testes automatizados no frontend estático).

### Manual Verification
1. Iniciar um servidor HTTP local usando Python (`python -m http.server 8000`).
2. Abrir a aplicação em uma instância de navegador de testes.
3. Testar o fluxo offline padrão (LocalStorage) garantindo que não existam erros de console.
4. Simular o salvamento de credenciais Supabase e verificar se a sincronização ocorre sem erros de mapeamento de campos.
