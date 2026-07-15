/**
 * ATIVO360 - Configurações Gerais
 * Gerencia chaves de API e conexões.
 */

const CONFIG = {
  // Permite colar chaves permanentes de desenvolvimento aqui
  SUPABASE_URL: window.localStorage.getItem('ativo360_supabase_url') || '',
  SUPABASE_KEY: window.localStorage.getItem('ativo360_supabase_key') || ''
};

window.ativo360Config = CONFIG;
