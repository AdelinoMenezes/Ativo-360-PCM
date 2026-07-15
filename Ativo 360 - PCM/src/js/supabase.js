/**
 * ATIVO360 - Módulo do Cliente Supabase
 * Gerencia autenticação de usuários e operações de dados assíncronas no banco Postgres.
 */

class Ativo360Supabase {
  constructor() {
    this.client = null;
    this.init();
  }

  // Inicializa o SDK do Supabase
  init() {
    const config = window.ativo360Config;
    if (config && config.SUPABASE_URL && config.SUPABASE_KEY && window.supabase) {
      try {
        this.client = window.supabase.createClient(config.SUPABASE_URL, config.SUPABASE_KEY);
        console.log('Supabase configurado e inicializado com sucesso.');
      } catch (err) {
        console.error('Falha ao inicializar o cliente Supabase:', err);
        this.client = null;
      }
    } else {
      console.warn('Supabase não configurado. Utilizando modo offline (LocalStorage).');
      this.client = null;
    }
  }

  isConfigured() {
    return this.client !== null;
  }

  /* ==========================================================================
     MÉTODOS DE AUTENTICAÇÃO (AUTH)
     ========================================================================== */
  async signUp(email, password) {
    if (!this.isConfigured()) return { error: 'Supabase não conectado.' };
    try {
      const { data, error } = await this.client.auth.signUp({ email, password });
      if (error) throw error;
      return { success: true, user: data.user };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async signIn(email, password) {
    if (!this.isConfigured()) return { error: 'Supabase não conectado.' };
    try {
      const { data, error } = await this.client.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return { success: true, user: data.user, session: data.session };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async signOut() {
    if (!this.isConfigured()) return;
    await this.client.auth.signOut();
  }

  async getCurrentUser() {
    if (!this.isConfigured()) return null;
    try {
      const { data: { user } } = await this.client.auth.getUser();
      return user;
    } catch (err) {
      return null;
    }
  }

  /* ==========================================================================
     MÉTODOS DE BANCO DE DADOS (DATABASE SYNC)
     ========================================================================== */
  
  // 1. ARMAZÉNS (WAREHOUSES)
  async fetchWarehouses() {
    if (!this.isConfigured()) return null;
    const { data, error } = await this.client.from('warehouses').select('*').order('code');
    if (error) { console.error('Erro fetchWarehouses:', error); return null; }
    return data;
  }

  async insertWarehouse(wh) {
    if (!this.isConfigured()) return null;
    const { data, error } = await this.client.from('warehouses').insert([wh]).select();
    if (error) throw error;
    return data[0];
  }

  async updateWarehouse(id, wh) {
    if (!this.isConfigured()) return null;
    const { data, error } = await this.client.from('warehouses').update(wh).eq('id', id).select();
    if (error) throw error;
    return data[0];
  }

  async deleteWarehouse(id) {
    if (!this.isConfigured()) return null;
    const { error } = await this.client.from('warehouses').delete().eq('id', id);
    if (error) throw error;
    return true;
  }

  // 2. PEÇAS (PARTS)
  async fetchParts() {
    if (!this.isConfigured()) return null;
    const { data, error } = await this.client.from('parts').select('*').order('code');
    if (error) { console.error('Erro fetchParts:', error); return null; }
    return data;
  }

  async insertPart(part) {
    if (!this.isConfigured()) return null;
    const { data, error } = await this.client.from('parts').insert([part]).select();
    if (error) throw error;
    return data[0];
  }

  async updatePart(id, part) {
    if (!this.isConfigured()) return null;
    const { data, error } = await this.client.from('parts').update(part).eq('id', id).select();
    if (error) throw error;
    return data[0];
  }

  async deletePart(id) {
    if (!this.isConfigured()) return null;
    const { error } = await this.client.from('parts').delete().eq('id', id);
    if (error) throw error;
    return true;
  }

  // 3. MOVIMENTAÇÕES (MOVEMENTS)
  async fetchMovements() {
    if (!this.isConfigured()) return null;
    const { data, error } = await this.client.from('movements').select('*').order('date', { ascending: false });
    if (error) { console.error('Erro fetchMovements:', error); return null; }
    return data;
  }

  async insertMovement(mov) {
    if (!this.isConfigured()) return null;
    const { data, error } = await this.client.from('movements').insert([mov]).select();
    if (error) throw error;
    return data[0];
  }

  // 4. FORNECEDORES (SUPPLIERS)
  async fetchSuppliers() {
    if (!this.isConfigured()) return null;
    const { data, error } = await this.client.from('suppliers').select('*').order('name');
    if (error) { console.error('Erro fetchSuppliers:', error); return null; }
    return data;
  }

  async insertSupplier(sup) {
    if (!this.isConfigured()) return null;
    const { data, error } = await this.client.from('suppliers').insert([sup]).select();
    if (error) throw error;
    return data[0];
  }

  async updateSupplier(id, sup) {
    if (!this.isConfigured()) return null;
    const { data, error } = await this.client.from('suppliers').update(sup).eq('id', id).select();
    if (error) throw error;
    return data[0];
  }

  async deleteSupplier(id) {
    if (!this.isConfigured()) return null;
    const { error } = await this.client.from('suppliers').delete().eq('id', id);
    if (error) throw error;
    return true;
  }

  // 5. ATIVOS E ORDENS (MAINTENANCE)
  async fetchAssets() {
    if (!this.isConfigured()) return null;
    const { data, error } = await this.client.from('assets').select('*').order('tag');
    if (error) { console.error('Erro fetchAssets:', error); return null; }
    return data;
  }

  async fetchWorkOrders() {
    if (!this.isConfigured()) return null;
    const { data, error } = await this.client.from('work_orders').select('*').order('code');
    if (error) { console.error('Erro fetchWorkOrders:', error); return null; }
    return data;
  }

  async insertWorkOrder(wo) {
    if (!this.isConfigured()) return null;
    const { data, error } = await this.client.from('work_orders').insert([wo]).select();
    if (error) throw error;
    return data[0];
  }

  async updateWorkOrder(id, wo) {
    if (!this.isConfigured()) return null;
    const { data, error } = await this.client.from('work_orders').update(wo).eq('id', id).select();
    if (error) throw error;
    return data[0];
  }

  // Sincroniza semente de dados fictícios para começar
  async seedDatabase(defaultDb) {
    if (!this.isConfigured()) return;
    try {
      // 1. Armazéns
      const currentWhs = await this.fetchWarehouses();
      if (!currentWhs || currentWhs.length === 0) {
        await this.client.from('warehouses').insert(defaultDb.warehouses);
      }
      
      // 2. Peças
      const currentParts = await this.fetchParts();
      if (!currentParts || currentParts.length === 0) {
        await this.client.from('parts').insert(defaultDb.parts);
      }

      // 3. Fornecedores
      const currentSups = await this.fetchSuppliers();
      if (!currentSups || currentSups.length === 0) {
        await this.client.from('suppliers').insert(defaultDb.suppliers);
      }

      // 4. Ativos
      const currentAssets = await this.fetchAssets();
      if (!currentAssets || currentAssets.length === 0) {
        await this.client.from('assets').insert(defaultDb.assets);
      }

      // 5. Ordens de Serviço
      const currentWos = await this.fetchWorkOrders();
      if (!currentWos || currentWos.length === 0) {
        await this.client.from('work_orders').insert(defaultDb.workOrders);
      }

      // 6. Movimentações
      const currentMovs = await this.fetchMovements();
      if (!currentMovs || currentMovs.length === 0) {
        await this.client.from('movements').insert(defaultDb.movements);
      }
      
      console.log('Dados semeados com sucesso no Supabase.');
    } catch (err) {
      console.error('Erro ao semear dados no Supabase:', err);
    }
  }
}

// Expõe a instância globalmente
window.ativo360Supabase = new Ativo360Supabase();
