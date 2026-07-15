# 🌲 Floresta Colaborativa (Antigravity Team) - Ativo 360 - PCM

Este ecossistema de especialistas simula os papéis necessários para desenhar, codificar, otimizar e auditar a arquitetura do sistema Ativo 360 - PCM.

---

## 🏛️ 1. Camada de Dados & Infraestrutura (Foco: `schema.sql` e `supabase.js`)

### 📐 Arquiteto de Dados
* **Papel:** Desenhar e garantir a escalabilidade do modelo relacional no PostgreSQL (Supabase).
* **Tarefas imediatas:**
  * Modelar as tabelas `pecas`, `almoxarifados`, `fornecedores`, `ativos`, `ordens_servico` e `movimentacoes`.
  * Definir restrições de integridade (chaves estrangeiras, `ON DELETE RESTRICT/CASCADE`).

### 📊 Analista de Dados
* **Papel:** Estruturar as métricas de performance do PCM que alimentarão o dashboard.
* **Tarefas imediatas:**
  * Mapear indicadores cruciais como MTBF (Tempo Médio Entre Falhas) e MTTR (Tempo Médio de Reparo).
  * Preparar a agregação dos dados no `data.js` para consumo do `charts.js`.

### 🛡️ DBA (Administrador de Banco de Dados)
* **Papel:** Garantir segurança, performance e integridade dos dados na nuvem.
* **Tarefas imediatas:**
  * Escrever as políticas de RLS (Row Level Security) para compartilhamento seguro de dados dentro da mesma Unidade Organizacional (UO).
  * Criar índices (`CREATE INDEX`) em colunas de alta busca como a TAG dos ativos.

---

## 💻 2. Camada de Engenharia de Software (Foco: `app.js`, `data.js` e `index.html`)

### 🏗️ Engenheiro de Software (Full-Stack)
* **Papel:** Desenvolver a lógica de integração, tratamento de erros e fallback de dados.
* **Tarefas imediatas:**
  * Criar a lógica assíncrona (`async/await`) no `supabase.js` para autenticação e operações de CRUD.
  * Implementar o mecanismo de Fallback (se o Supabase estiver sem chaves configuradas, usar o `localStorage` do navegador de forma transparente).

### 🎨 Designer de Interface (UI/UX) / Frontend Developer
* **Papel:** Traduzir a identidade visual "A-DELL SOLUTIONS" em uma experiência responsiva e moderna.
* **Tarefas imediatas:**
  * Implementar o estilo Glassmorphism (efeito vidro fosco) na tela de login.
  * Garantir a consistência da paleta de cores (tons de lilás, azul e o botão laranja vibrante).