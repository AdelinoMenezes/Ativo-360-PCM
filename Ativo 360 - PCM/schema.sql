-- ============================================================================
-- SQL DDL SCHEMA - BANCO DE DADOS ATIVO360
-- Copie e cole este script no editor SQL do Console do seu projeto Supabase.
-- ============================================================================

-- Limpeza de tabelas antigas (opcional)
DROP TABLE IF EXISTS public.movements;
DROP TABLE IF EXISTS public.work_orders;
DROP TABLE IF EXISTS public.assets;
DROP TABLE IF EXISTS public.suppliers;
DROP TABLE IF EXISTS public.parts;
DROP TABLE IF EXISTS public.warehouses;

-- 1. Tabela: Armazéns/Depósitos
CREATE TABLE public.warehouses (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  location TEXT,
  manager TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabela: Catálogo de Peças / Insumos
CREATE TABLE public.parts (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  unit TEXT NOT NULL,
  "unitCost" NUMERIC(12,2) DEFAULT 0.00 NOT NULL,
  "minStock" INTEGER DEFAULT 0 NOT NULL,
  "maxStock" INTEGER DEFAULT 0 NOT NULL,
  stock JSONB DEFAULT '{}'::jsonb NOT NULL, -- Estrutura: { "id-armazem": qtd }
  image TEXT DEFAULT 'cog',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabela: Histórico de Movimentações
CREATE TABLE public.movements (
  id TEXT PRIMARY KEY,
  date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  "partId" TEXT REFERENCES public.parts(id) ON DELETE CASCADE,
  "partCode" TEXT NOT NULL,
  "partName" TEXT NOT NULL,
  type TEXT NOT NULL, -- 'Entrada', 'Saída', 'Transferência', 'Ajuste'
  qty INTEGER NOT NULL,
  "fromWhId" TEXT,
  "fromWhName" TEXT DEFAULT '-',
  "toWhId" TEXT,
  "toWhName" TEXT DEFAULT '-',
  user TEXT NOT NULL,
  reference TEXT DEFAULT '-',
  notes TEXT
);

-- 4. Tabela: Fornecedores
CREATE TABLE public.suppliers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  cnpj TEXT NOT NULL,
  contact TEXT,
  rating NUMERIC(3,2) DEFAULT 5.00 NOT NULL,
  status TEXT DEFAULT 'Ativo' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Tabela: Ativos
CREATE TABLE public.assets (
  id TEXT PRIMARY KEY,
  tag TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  location TEXT,
  critical TEXT DEFAULT 'Média' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Tabela: Ordens de Trabalho / Serviço
CREATE TABLE public.work_orders (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  "assetTag" TEXT REFERENCES public.assets(tag) ON DELETE CASCADE,
  "assetName" TEXT NOT NULL,
  type TEXT NOT NULL, -- 'Preventiva', 'Corretiva', 'Preditiva', 'Melhoria'
  description TEXT NOT NULL,
  status TEXT DEFAULT 'Aberta' NOT NULL,
  date TEXT NOT NULL,
  cost NUMERIC(12,2) DEFAULT 0.00 NOT NULL,
  parts JSONB DEFAULT '[]'::jsonb NOT NULL, -- Lista de materiais alocados
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilita Row Level Security (RLS) - Opcional. 
-- Para fins de demonstração simples com a chave 'anon', liberamos acesso total público.
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;

-- Criação de Políticas de Segurança para o ambiente corporativo compartilhado (usuários autenticados)
CREATE POLICY "Acesso compartilhado para warehouses" ON public.warehouses FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acesso compartilhado para parts" ON public.parts FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acesso compartilhado para movements" ON public.movements FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acesso compartilhado para suppliers" ON public.suppliers FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acesso compartilhado para assets" ON public.assets FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acesso compartilhado para work_orders" ON public.work_orders FOR ALL TO authenticated USING (true) WITH CHECK (true);
