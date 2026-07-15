/**
 * ATIVO360 - Módulo de Dados e Persistência (Local Storage + Supabase)
 * Gerencia a leitura, escrita e sincronização híbrida com o banco Postgres.
 */

// Chave para armazenamento no localStorage
const STORAGE_KEY = 'ativo360_pcm_db';

// Dados Padrão (Mock Data) para inicialização caso esteja vazio
const DEFAULT_DATABASE = {
  warehouses: [
    { id: 'wh-1', code: 'ALM-CENTRAL', name: 'Almoxarifado Central - PCM', location: 'Galpão A - Setor Industrial', manager: 'Carlos Augusto' },
    { id: 'wh-2', code: 'ALM-AUX', name: 'Almoxarifado Secundário', location: 'Oficina Mecânica - Bloco B', manager: 'Mariana Costa' },
    { id: 'wh-3', code: 'ALM-TRANSITO', name: 'Estoque de Trânsito', location: 'Veículos de Manutenção/Campo', manager: 'Roberto Lima' }
  ],
  categories: ['Mecânica', 'Elétrica', 'Pneumática', 'Hidráulica', 'EPI / Segurança', 'Lubrificantes & Consumíveis'],
  parts: [
    {
      id: 'part-1',
      code: 'ROL-6205-ZZ',
      name: 'Rolamento de Esferas 6205-ZZ',
      description: 'Rolamento rígido de esferas com blindagem dupla de aço. Diâmetro interno 25mm, externo 52mm.',
      category: 'Mecânica',
      unit: 'UN',
      unitCost: 45.90,
      minStock: 10,
      maxStock: 50,
      stock: { 'wh-1': 28, 'wh-2': 5, 'wh-3': 2 },
      image: 'cog'
    },
    {
      id: 'part-2',
      code: 'MOT-TRIF-7HP',
      name: 'Motor Elétrico Trifásico 7.5 CV',
      description: 'Motor elétrico de indução trifásico WEG, 4 polos, 220/380V, 60Hz, carcaça 112M.',
      category: 'Elétrica',
      unit: 'UN',
      unitCost: 1850.00,
      minStock: 2,
      maxStock: 5,
      stock: { 'wh-1': 3, 'wh-2': 0, 'wh-3': 0 },
      image: 'zap'
    },
    {
      id: 'part-3',
      code: 'VAL-SOL-24V',
      name: 'Válvula Solenoide 5/2 vias 24VCC',
      description: 'Válvula solenoide direcional pneumática, retorno por mola, conexões de 1/4" NPT.',
      category: 'Pneumática',
      unit: 'UN',
      unitCost: 198.50,
      minStock: 5,
      maxStock: 20,
      stock: { 'wh-1': 12, 'wh-2': 3, 'wh-3': 1 },
      image: 'wind'
    },
    {
      id: 'part-4',
      code: 'OLEO-MOBIL-AW68',
      name: 'Óleo Hidráulico Mobil DTE 26 (AW68)',
      description: 'Óleo lubrificante mineral para sistemas hidráulicos de alta performance que operam sob condições severas.',
      category: 'Lubrificantes & Consumíveis',
      unit: 'L',
      unitCost: 18.20,
      minStock: 100,
      maxStock: 500,
      stock: { 'wh-1': 250, 'wh-2': 40, 'wh-3': 10 },
      image: 'droplet'
    },
    {
      id: 'part-5',
      code: 'FIL-AR-COMP',
      name: 'Filtro de Ar para Compressor de Parafuso',
      description: 'Elemento filtrante de ar plissado para compressor de ar Atlas Copco GA22.',
      category: 'Pneumática',
      unit: 'UN',
      unitCost: 125.00,
      minStock: 4,
      maxStock: 12,
      stock: { 'wh-1': 6, 'wh-2': 1, 'wh-3': 0 },
      image: 'shield'
    },
    {
      id: 'part-6',
      code: 'SEN-IND-M18',
      name: 'Sensor Indutivo de Proximidade M18 PNP',
      description: 'Sensor de proximidade indutivo metalúrgico, faceado, distância de detecção 5mm, cabo de 2 metros.',
      category: 'Elétrica',
      unit: 'UN',
      unitCost: 89.90,
      minStock: 15,
      maxStock: 40,
      stock: { 'wh-1': 8, 'wh-2': 4, 'wh-3': 2 },
      image: 'activity'
    },
    {
      id: 'part-7',
      code: 'RET-TC-35-52-8',
      name: 'Retentor TC 35x52x8 NBR',
      description: 'Retentor de borracha nitrílica (NBR) com lábio duplo e mola de aço carbono para vedação de eixos rotativos.',
      category: 'Mecânica',
      unit: 'UN',
      unitCost: 12.40,
      minStock: 20,
      maxStock: 100,
      stock: { 'wh-1': 45, 'wh-2': 10, 'wh-3': 5 },
      image: 'disc'
    },
    {
      id: 'part-8',
      code: 'MAN-HID-12',
      name: 'Mangueira Hidráulica R2AT 1/2" alta pressão',
      description: 'Mangueira de borracha sintética reforçada com duas tramas de aço de alta resistência, para óleos hidráulicos.',
      category: 'Hidráulica',
      unit: 'M',
      unitCost: 38.00,
      minStock: 50,
      maxStock: 200,
      stock: { 'wh-1': 120, 'wh-2': 0, 'wh-3': 15 },
      image: 'wrench'
    }
  ],
  suppliers: [
    { id: 'sup-1', name: 'Distribuidora MRO Peças Industriais Ltda', cnpj: '12.345.678/0001-90', contact: 'comercial@mropeças.com.br - (11) 3220-4500', rating: 4.8, status: 'Ativo' },
    { id: 'sup-2', name: 'WEG Equipamentos Elétricos S.A.', cnpj: '09.876.543/0001-21', contact: 'suporte@weg.com.br - 0800 555-934', rating: 5.0, status: 'Homologado' },
    { id: 'sup-3', name: 'Pneumac Mangueiras & Conexões', cnpj: '45.321.987/0002-12', contact: 'vendas@pneumac.com.br - (21) 2505-1800', rating: 4.2, status: 'Ativo' }
  ],
  assets: [
    { id: 'ast-1', tag: 'GER-01', name: 'Gerador a Diesel Caterpillar 500kVA', location: 'Subestação Principal', critical: 'Alta' },
    { id: 'ast-2', tag: 'COMP-03', name: 'Compressor de Ar Parafuso Atlas Copco GA22', location: 'Casa de Compressores', critical: 'Média' },
    { id: 'ast-3', tag: 'BOM-08', name: 'Bomba Centrífuga Alimentadora KSB', location: 'Estação de Água de Caldeira', critical: 'Alta' },
    { id: 'ast-4', tag: 'EXT-02', name: 'Exaustor Industrial de Pó Metálico', location: 'Galpão de Solda e Usinagem', critical: 'Baixa' }
  ],
  workOrders: [
    { id: 'wo-101', code: 'OS-101', assetTag: 'GER-01', assetName: 'Gerador Caterpillar 500kVA', type: 'Preventiva', description: 'Revisão geral de 250 horas: troca de filtros e óleo lubrificante.', status: 'Aberta', date: '2026-07-12', cost: 0, parts: [] },
    { id: 'wo-102', code: 'OS-102', assetTag: 'COMP-03', assetName: 'Compressor Atlas Copco GA22', type: 'Corretiva', description: 'Ruído excessivo no motor elétrico secundário. Suspeita de falha no rolamento.', status: 'Aberta', date: '2026-07-14', cost: 0, parts: [] },
    { id: 'wo-103', code: 'OS-103', assetTag: 'BOM-08', assetName: 'Bomba Centrífuga KSB', type: 'Preditiva', description: 'Análise de vibração indicou folga no acoplamento rotativo.', status: 'Planejada', date: '2026-07-18', cost: 0, parts: [] }
  ],
  movements: [
    { id: 'mov-1', date: '2026-07-01T08:30:00Z', partId: 'part-1', partCode: 'ROL-6205-ZZ', partName: 'Rolamento de Esferas 6205-ZZ', type: 'Entrada', qty: 20, fromWhId: null, fromWhName: '-', toWhId: 'wh-1', toWhName: 'Almoxarifado Central - PCM', user: 'Carlos Augusto', reference: 'NF-10492', notes: 'Compra inicial de rolamentos via distribuidora MRO.' },
    { id: 'mov-2', date: '2026-07-05T14:15:00Z', partId: 'part-4', partCode: 'OLEO-MOBIL-AW68', partName: 'Óleo Hidráulico Mobil AW68', type: 'Entrada', qty: 200, fromWhId: null, fromWhName: '-', toWhId: 'wh-1', toWhName: 'Almoxarifado Central - PCM', user: 'Carlos Augusto', reference: 'NF-10515', notes: 'Reposição programada de tambores de óleo.' },
    { id: 'mov-3', date: '2026-07-10T10:00:00Z', partId: 'part-1', partCode: 'ROL-6205-ZZ', partName: 'Rolamento de Esferas 6205-ZZ', type: 'Transferência', qty: 5, fromWhId: 'wh-1', fromWhName: 'Almoxarifado Central - PCM', toWhId: 'wh-2', toWhName: 'Almoxarifado Secundário', user: 'Mariana Costa', reference: 'TR-041', notes: 'Abastecimento da oficina mecânica do Bloco B.' },
    { id: 'mov-4', date: '2026-07-12T16:45:00Z', partId: 'part-4', partCode: 'OLEO-MOBIL-AW68', partName: 'Óleo Hidráulico Mobil AW68', type: 'Saída', qty: 20, fromWhId: 'wh-1', fromWhName: 'Almoxarifado Central - PCM', toWhId: null, toWhName: '-', user: 'Roberto Lima', reference: 'OS-101', notes: 'Abastecimento de lubrificante na manutenção preventiva do Gerador-01.' }
  ]
};

class Ativo360Database {
  constructor() {
    this.db = null;
    this.init();
  }

  // Inicializa o banco de dados carregando do LocalStorage
  init() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.db = JSON.parse(stored);
        if (!this.db.suppliers) this.db.suppliers = DEFAULT_DATABASE.suppliers;
        if (!this.db.assets) this.db.assets = DEFAULT_DATABASE.assets;
        if (!this.db.workOrders) this.db.workOrders = DEFAULT_DATABASE.workOrders;
        this.save();
      } else {
        this.db = JSON.parse(JSON.stringify(DEFAULT_DATABASE)); // Deep clone
        this.save();
      }
    } catch (error) {
      console.error('Falha ao inicializar o banco de dados LocalStorage:', error);
      this.db = JSON.parse(JSON.stringify(DEFAULT_DATABASE));
    }
  }

  // Sincroniza dados da nuvem Supabase para o cache em memória
  async syncFromSupabase() {
    const sb = window.ativo360Supabase;
    if (!sb || !sb.isConfigured()) return false;

    try {
      console.log('Sincronizando dados com o Supabase...');
      
      // Semeia se necessário antes de puxar
      await sb.seedDatabase(DEFAULT_DATABASE);

      const warehouses = await sb.fetchWarehouses();
      const parts = await sb.fetchParts();
      const suppliers = await sb.fetchSuppliers();
      const assets = await sb.fetchAssets();
      const workOrders = await sb.fetchWorkOrders();
      const movements = await sb.fetchMovements();

      if (warehouses && parts && movements) {
        this.db.warehouses = warehouses;
        this.db.parts = parts;
        this.db.suppliers = suppliers || [];
        this.db.assets = assets || [];
        this.db.workOrders = workOrders || [];
        this.db.movements = movements;
        this.save();
        console.log('Sincronização com o Supabase finalizada com sucesso.');
        return true;
      }
      return false;
    } catch (err) {
      console.error('Falha ao sincronizar dados com o Supabase:', err);
      return false;
    }
  }

  // Grava o estado no localStorage como backup offline rápido
  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.db));
      return true;
    } catch (e) {
      return false;
    }
  }

  // Restaura dados fictícios
  async resetToDefault() {
    const sb = window.ativo360Supabase;
    if (sb && sb.isConfigured()) {
      // Limpa dados remotos e reinsere sementes
      try {
        await sb.client.from('movements').delete().neq('id', '0');
        await sb.client.from('work_orders').delete().neq('id', '0');
        await sb.client.from('suppliers').delete().neq('id', '0');
        await sb.client.from('parts').delete().neq('id', '0');
        await sb.client.from('warehouses').delete().neq('id', '0');
        await sb.seedDatabase(DEFAULT_DATABASE);
        await this.syncFromSupabase();
        return this.db;
      } catch (err) {
        console.error('Falha ao resetar Supabase:', err);
      }
    }

    this.db = JSON.parse(JSON.stringify(DEFAULT_DATABASE));
    this.save();
    return this.db;
  }

  importDatabase(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.parts && parsed.warehouses && parsed.movements) {
        this.db = parsed;
        this.save();
        
        // Se Supabase ativo, sobe os dados importados
        const sb = window.ativo360Supabase;
        if (sb && sb.isConfigured()) {
          this.uploadDatabaseToSupabase();
        }
        return { success: true };
      }
      return { success: false, error: 'Formato de arquivo de backup inválido.' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async uploadDatabaseToSupabase() {
    const sb = window.ativo360Supabase;
    try {
      // Limpa e sobe
      await sb.client.from('movements').delete().neq('id', '0');
      await sb.client.from('work_orders').delete().neq('id', '0');
      await sb.client.from('assets').delete().neq('id', '0');
      await sb.client.from('suppliers').delete().neq('id', '0');
      await sb.client.from('parts').delete().neq('id', '0');
      await sb.client.from('warehouses').delete().neq('id', '0');

      await sb.client.from('warehouses').insert(this.db.warehouses);
      await sb.client.from('parts').insert(this.db.parts);
      await sb.client.from('suppliers').insert(this.db.suppliers);
      await sb.client.from('assets').insert(this.db.assets);
      await sb.client.from('work_orders').insert(this.db.workOrders);
      await sb.client.from('movements').insert(this.db.movements);
      console.log('Banco de dados local exportado para o Supabase.');
    } catch (e) {
      console.error('Falha no uploadDatabaseToSupabase:', e);
    }
  }

  exportDatabase() {
    return JSON.stringify(this.db, null, 2);
  }

  /* ==========================================================================
     MÉTODOS DE ARMAZÉNS (WAREHOUSES)
     ========================================================================== */
  getWarehouses() {
    return this.db.warehouses;
  }

  getWarehouseById(id) {
    return this.db.warehouses.find(w => w.id === id);
  }

  async addWarehouse(warehouse) {
    const newId = 'wh-' + (Date.now());
    const newWh = {
      id: newId,
      code: warehouse.code.toUpperCase().trim(),
      name: warehouse.name.trim(),
      location: warehouse.location.trim(),
      manager: warehouse.manager.trim()
    };
    
    this.db.warehouses.push(newWh);
    this.save();

    const sb = window.ativo360Supabase;
    if (sb && sb.isConfigured()) {
      try { await sb.insertWarehouse(newWh); } catch (e) { console.error(e); }
    }

    return newWh;
  }

  async updateWarehouse(id, updatedData) {
    const index = this.db.warehouses.findIndex(w => w.id === id);
    if (index !== -1) {
      const wh = {
        code: updatedData.code.toUpperCase().trim(),
        name: updatedData.name.trim(),
        location: updatedData.location.trim(),
        manager: updatedData.manager.trim()
      };
      this.db.warehouses[index] = { ...this.db.warehouses[index], ...wh };
      this.save();

      const sb = window.ativo360Supabase;
      if (sb && sb.isConfigured()) {
        try { await sb.updateWarehouse(id, wh); } catch (e) { console.error(e); }
      }
      return this.db.warehouses[index];
    }
    return null;
  }

  async deleteWarehouse(id) {
    const hasStock = this.db.parts.some(part => {
      const qty = part.stock[id] || 0;
      return qty > 0;
    });

    if (hasStock) {
      return { success: false, error: 'Este armazém possui itens em estoque e não pode ser excluído. Transfira as peças antes de apagar.' };
    }

    this.db.warehouses = this.db.warehouses.filter(w => w.id !== id);
    this.db.parts.forEach(part => {
      if (part.stock[id] !== undefined) {
        delete part.stock[id];
      }
    });
    this.save();

    const sb = window.ativo360Supabase;
    if (sb && sb.isConfigured()) {
      try { await sb.deleteWarehouse(id); } catch (e) { console.error(e); }
    }

    return { success: true };
  }

  /* ==========================================================================
     MÉTODOS DE PEÇAS (PARTS)
     ========================================================================== */
  getParts() {
    return this.db.parts;
  }

  getPartById(id) {
    return this.db.parts.find(p => p.id === id);
  }

  getTotalStockForPart(part) {
    return Object.values(part.stock || {}).reduce((sum, val) => sum + val, 0);
  }

  async addPart(partData) {
    const skuExists = this.db.parts.some(p => p.code.toLowerCase() === partData.code.toLowerCase().trim());
    if (skuExists) {
      return { success: false, error: `Já existe um item cadastrado com o SKU/Código '${partData.code}'.` };
    }

    const newId = 'part-' + (Date.now());
    const stockInit = {};
    if (partData.initialWarehouse && partData.initialQty > 0) {
      stockInit[partData.initialWarehouse] = parseInt(partData.initialQty, 10);
    } else {
      this.db.warehouses.forEach(wh => {
        stockInit[wh.id] = 0;
      });
    }

    const newPart = {
      id: newId,
      code: partData.code.toUpperCase().trim(),
      name: partData.name.trim(),
      description: partData.description.trim(),
      category: partData.category,
      unit: partData.unit.toUpperCase().trim(),
      unitCost: parseFloat(partData.unitCost) || 0,
      minStock: parseInt(partData.minStock, 10) || 0,
      maxStock: parseInt(partData.maxStock, 10) || 0,
      stock: stockInit,
      image: partData.image || 'cog'
    };

    this.db.parts.push(newPart);
    this.save();

    const sb = window.ativo360Supabase;
    if (sb && sb.isConfigured()) {
      try { await sb.insertPart(newPart); } catch (e) { console.error(e); }
    }

    if (partData.initialWarehouse && partData.initialQty > 0) {
      const wh = this.getWarehouseById(partData.initialWarehouse);
      await this.logMovement({
        partId: newId,
        partCode: newPart.code,
        partName: newPart.name,
        type: 'Entrada',
        qty: parseInt(partData.initialQty, 10),
        fromWhId: null,
        fromWhName: '-',
        toWhId: wh.id,
        toWhName: wh.name,
        user: partData.user || 'Sistema',
        reference: 'Ajuste Inicial',
        notes: 'Cadastro inicial do item com carga de estoque.'
      });
    }

    return { success: true, part: newPart };
  }

  async updatePart(id, updatedData) {
    const index = this.db.parts.findIndex(p => p.id === id);
    if (index !== -1) {
      const skuConflict = this.db.parts.some(p => p.id !== id && p.code.toLowerCase() === updatedData.code.toLowerCase().trim());
      if (skuConflict) {
        return { success: false, error: `Já existe outro item cadastrado com o SKU/Código '${updatedData.code}'.` };
      }

      const pData = {
        code: updatedData.code.toUpperCase().trim(),
        name: updatedData.name.trim(),
        description: updatedData.description.trim(),
        category: updatedData.category,
        unit: updatedData.unit.toUpperCase().trim(),
        unitCost: parseFloat(updatedData.unitCost) || 0,
        minStock: parseInt(updatedData.minStock, 10) || 0,
        maxStock: parseInt(updatedData.maxStock, 10) || 0,
        image: updatedData.image || this.db.parts[index].image
      };

      this.db.parts[index] = { ...this.db.parts[index], ...pData };
      this.save();

      const sb = window.ativo360Supabase;
      if (sb && sb.isConfigured()) {
        try { await sb.updatePart(id, pData); } catch (e) { console.error(e); }
      }
      return { success: true, part: this.db.parts[index] };
    }
    return { success: false, error: 'Peça não encontrada.' };
  }

  async deletePart(id) {
    const part = this.getPartById(id);
    if (!part) return { success: false, error: 'Peça não encontrada.' };

    const totalStock = this.getTotalStockForPart(part);
    if (totalStock > 0) {
      return { success: false, error: `Não é possível deletar esta peça porque ela ainda possui ${totalStock} unidades em estoque.` };
    }

    this.db.parts = this.db.parts.filter(p => p.id !== id);
    this.save();

    const sb = window.ativo360Supabase;
    if (sb && sb.isConfigured()) {
      try { await sb.deletePart(id); } catch (e) { console.error(e); }
    }
    return { success: true };
  }

  /* ==========================================================================
     MÉTODOS DE TRANSAÇÕES E MOVIMENTAÇÃO DE ESTOQUE
     ========================================================================== */
  getMovements() {
    return [...this.db.movements].sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  async logMovement(mov) {
    const newMov = {
      id: 'mov-' + (Date.now()) + '-' + Math.floor(Math.random() * 1000),
      date: new Date().toISOString(),
      partId: mov.partId,
      partCode: mov.partCode,
      partName: mov.partName,
      type: mov.type,
      qty: parseInt(mov.qty, 10),
      fromWhId: mov.fromWhId,
      fromWhName: mov.fromWhName || '-',
      toWhId: mov.toWhId,
      toWhName: mov.toWhName || '-',
      user: mov.user || 'Supervisor PCM',
      reference: mov.reference || '-',
      notes: mov.notes || ''
    };
    
    this.db.movements.push(newMov);
    this.save();

    const sb = window.ativo360Supabase;
    if (sb && sb.isConfigured()) {
      try { await sb.insertMovement(newMov); } catch (e) { console.error(e); }
    }
    return newMov;
  }

  async registerTransaction(transaction) {
    const { type, partId, qty, fromWhId, toWhId, user, reference, notes } = transaction;
    const part = this.getPartById(partId);
    
    if (!part) {
      return { success: false, error: 'Item não encontrado no catálogo.' };
    }
    if (qty <= 0) {
      return { success: false, error: 'A quantidade de movimentação deve ser maior que zero.' };
    }

    if (!part.stock) part.stock = {};
    if (fromWhId && part.stock[fromWhId] === undefined) part.stock[fromWhId] = 0;
    if (toWhId && part.stock[toWhId] === undefined) part.stock[toWhId] = 0;

    let fromWh = fromWhId ? this.getWarehouseById(fromWhId) : null;
    let toWh = toWhId ? this.getWarehouseById(toWhId) : null;

    if (type === 'Entrada') {
      if (!toWhId) return { success: false, error: 'Armazém de destino obrigatório para entrada.' };
      part.stock[toWhId] = (part.stock[toWhId] || 0) + qty;
      
      await this.logMovement({
        partId, partCode: part.code, partName: part.name,
        type, qty, fromWhId: null, fromWhName: '-', toWhId, toWhName: toWh.name,
        user, reference, notes
      });

    } else if (type === 'Saída') {
      if (!fromWhId) return { success: false, error: 'Armazém de origem obrigatório para saída.' };
      const currentStock = part.stock[fromWhId] || 0;
      if (currentStock < qty) {
        return { success: false, error: `Estoque insuficiente no armazém '${fromWh.name}'. Disponível: ${currentStock} ${part.unit}.` };
      }
      
      part.stock[fromWhId] = currentStock - qty;
      
      await this.logMovement({
        partId, partCode: part.code, partName: part.name,
        type, qty, fromWhId, fromWhName: fromWh.name, toWhId: null, toWhName: '-',
        user, reference, notes
      });

      if (reference && reference.startsWith('OS-')) {
        await this.addPartCostToWorkOrder(reference, part, qty);
      }

    } else if (type === 'Transferência') {
      if (!fromWhId || !toWhId) return { success: false, error: 'Armazéns de origem e destino são obrigatórios para transferência.' };
      if (fromWhId === toWhId) return { success: false, error: 'Os armazéns de origem e destino devem ser diferentes.' };
      
      const currentStock = part.stock[fromWhId] || 0;
      if (currentStock < qty) {
        return { success: false, error: `Estoque insuficiente no armazém de origem '${fromWh.name}'. Disponível: ${currentStock} ${part.unit}.` };
      }

      part.stock[fromWhId] = currentStock - qty;
      part.stock[toWhId] = (part.stock[toWhId] || 0) + qty;

      await this.logMovement({
        partId, partCode: part.code, partName: part.name,
        type, qty, fromWhId, fromWhName: fromWh.name, toWhId, toWhName: toWh.name,
        user, reference, notes
      });

    } else if (type === 'Ajuste') {
      if (!fromWhId) return { success: false, error: 'Selecione o armazém que receberá o ajuste de estoque.' };
      
      const oldQty = part.stock[fromWhId] || 0;
      const diff = qty - oldQty;
      
      part.stock[fromWhId] = qty;
      
      await this.logMovement({
        partId, partCode: part.code, partName: part.name,
        type: 'Ajuste', qty: Math.abs(diff),
        fromWhId: diff < 0 ? fromWhId : null, fromWhName: diff < 0 ? fromWh.name : '-',
        toWhId: diff > 0 ? fromWhId : null, toWhName: diff > 0 ? fromWh.name : '-',
        user, reference,
        notes: `Ajuste físico de inventário (Estoque antigo: ${oldQty} -> Novo estoque: ${qty}). Motivo: ${notes}`
      });
    }

    this.save();

    // Sincroniza o estoque atualizado da peça no Supabase
    const sb = window.ativo360Supabase;
    if (sb && sb.isConfigured()) {
      try {
        await sb.updatePart(part.id, { stock: part.stock });
      } catch (err) {
        console.error('Erro ao atualizar estoque da peça no Supabase:', err);
      }
    }

    return { success: true, updatedPart: part };
  }

  /* ==========================================================================
     MÉTODOS DE FORNECEDORES (SUPPLIERS)
     ========================================================================== */
  getSuppliers() {
    return this.db.suppliers;
  }

  async addSupplier(sup) {
    const newId = 'sup-' + (Date.now());
    const newSup = {
      id: newId,
      name: sup.name.trim(),
      cnpj: sup.cnpj.trim(),
      contact: sup.contact.trim(),
      rating: parseFloat(sup.rating) || 5.0,
      status: sup.status || 'Ativo'
    };
    
    this.db.suppliers.push(newSup);
    this.save();

    const sb = window.ativo360Supabase;
    if (sb && sb.isConfigured()) {
      try { await sb.insertSupplier(newSup); } catch (e) { console.error(e); }
    }
    return newSup;
  }

  async updateSupplier(id, updatedData) {
    const index = this.db.suppliers.findIndex(s => s.id === id);
    if (index !== -1) {
      const sup = {
        name: updatedData.name.trim(),
        cnpj: updatedData.cnpj.trim(),
        contact: updatedData.contact.trim(),
        rating: parseFloat(updatedData.rating) || 5.0,
        status: updatedData.status
      };
      this.db.suppliers[index] = { ...this.db.suppliers[index], ...sup };
      this.save();

      const sb = window.ativo360Supabase;
      if (sb && sb.isConfigured()) {
        try { await sb.updateSupplier(id, sup); } catch (e) { console.error(e); }
      }
      return this.db.suppliers[index];
    }
    return null;
  }

  async deleteSupplier(id) {
    this.db.suppliers = this.db.suppliers.filter(s => s.id !== id);
    this.save();

    const sb = window.ativo360Supabase;
    if (sb && sb.isConfigured()) {
      try { await sb.deleteSupplier(id); } catch (e) { console.error(e); }
    }
    return { success: true };
  }

  /* ==========================================================================
     MÉTODOS DE MANUTENÇÃO (ORDENS E ATIVOS)
     ========================================================================== */
  getAssets() {
    return this.db.assets;
  }

  getWorkOrders() {
    return this.db.workOrders;
  }

  async addPartCostToWorkOrder(woCode, part, qty) {
    const wo = this.db.workOrders.find(w => w.code === woCode);
    if (wo) {
      const partCost = part.unitCost * qty;
      wo.cost = (wo.cost || 0) + partCost;
      
      if (!wo.parts) wo.parts = [];
      
      const existingPart = wo.parts.find(p => p.partId === part.id);
      if (existingPart) {
        existingPart.qty += qty;
        existingPart.totalCost += partCost;
      } else {
        wo.parts.push({
          partId: part.id,
          code: part.code,
          name: part.name,
          qty: qty,
          unitCost: part.unitCost,
          totalCost: partCost
        });
      }
      this.save();

      const sb = window.ativo360Supabase;
      if (sb && sb.isConfigured()) {
        try {
          await sb.updateWorkOrder(wo.id, { cost: wo.cost, parts: wo.parts });
        } catch (e) {
          console.error(e);
        }
      }
      return true;
    }
    return false;
  }

  async addWorkOrder(woData) {
    const newId = 'wo-' + (Date.now());
    const asset = this.db.assets.find(a => a.tag === woData.assetTag);
    const newWo = {
      id: newId,
      code: 'OS-' + Math.floor(100 + Math.random() * 900),
      assetTag: woData.assetTag,
      assetName: asset ? asset.name : 'Ativo Desconhecido',
      type: woData.type,
      description: woData.description.trim(),
      status: 'Aberta',
      date: new Date().toISOString().split('T')[0],
      cost: 0,
      parts: []
    };
    
    this.db.workOrders.push(newWo);
    this.save();

    const sb = window.ativo360Supabase;
    if (sb && sb.isConfigured()) {
      try { await sb.insertWorkOrder(newWo); } catch (e) { console.error(e); }
    }
    return newWo;
  }
}

// Inicializa a instância global
const db = new Ativo360Database();
window.ativo360Db = db;
