/**
 * ATIVO360 - Controlador Principal da Aplicação (SPA)
 * Gerencia roteamento, autenticação, modais, formulários de CRUD e integração com Supabase.
 */

document.addEventListener("DOMContentLoaded", async () => {
  const db = window.ativo360Db;
  const charts = window.ativo360Charts;
  const sb = window.ativo360Supabase;

  // Cache de Elementos DOM
  const elements = {
    sidebar: document.getElementById('app-sidebar'),
    sidebarToggle: document.getElementById('sidebar-toggle'),
    navItems: document.querySelectorAll('.nav-item'),
    viewContainers: document.querySelectorAll('.view-container'),
    viewTitle: document.getElementById('view-title'),
    viewSubtitle: document.getElementById('view-subtitle'),
    dynamicHeaderActions: document.getElementById('dynamic-header-actions'),
    toastWrapper: document.getElementById('toast-wrapper'),
    
    // Autenticação & Telas
    loginScreen: document.getElementById('login-screen'),
    formLogin: document.getElementById('form-login'),
    loginEmail: document.getElementById('login-email'),
    loginPassword: document.getElementById('login-password'),
    btnLoginSubmit: document.getElementById('btn-login-submit'),
    btnLoginText: document.getElementById('btn-login-text'),
    linkRegister: document.getElementById('link-register'),
    loginFormTitle: document.getElementById('login-form-title'),
    loginFooterText: document.getElementById('login-footer-text'),
    btnTogglePassword: document.getElementById('btn-toggle-password'),
    btnOpenSetup: document.getElementById('btn-open-setup'),
    btnLogoutSidebar: document.getElementById('btn-logout-sidebar'),
    
    // Modais
    modalPart: document.getElementById('modal-part'),
    modalMovement: document.getElementById('modal-movement'),
    modalWarehouse: document.getElementById('modal-warehouse'),
    modalWOConsume: document.getElementById('modal-wo-consume'),
    modalNewWO: document.getElementById('modal-new-wo'),
    modalSupabaseSetup: document.getElementById('modal-supabase-setup'),
    
    // Formulários
    formPart: document.getElementById('form-part'),
    formMovement: document.getElementById('form-movement'),
    formWarehouse: document.getElementById('form-warehouse'),
    formWOConsume: document.getElementById('form-wo-consume'),
    formNewWO: document.getElementById('form-new-wo'),
    formSupabaseSetup: document.getElementById('form-supabase-setup'),
    
    // Filtros e Buscas
    catalogSearch: document.getElementById('catalog-search'),
    filterCategory: document.getElementById('filter-category'),
    filterWarehouse: document.getElementById('filter-warehouse'),
    filterStatus: document.getElementById('filter-status'),
    movementSearch: document.getElementById('movement-search'),
    filterMovType: document.getElementById('filter-mov-type'),
    filterMovWarehouse: document.getElementById('filter-mov-warehouse')
  };

  let currentView = 'dashboard';
  let isRegisterMode = false;

  /* ==========================================================================
     INICIALIZAÇÃO & PROTEÇÃO DE ROTAS
     ========================================================================== */
  async function init() {
    setupEventListeners();
    setupAuthListeners();
    setupSetupListeners();
    
    // Verifica sessão ativa
    if (sb.isConfigured()) {
      const user = await sb.getCurrentUser();
      if (user) {
        handleAuthSuccess(user);
      } else {
        showLoginScreen();
      }
    } else {
      showLoginScreen();
    }
  }

  // Exibe a tela de login
  function showLoginScreen() {
    elements.loginScreen.classList.remove('hidden');
    if (!sb.isConfigured()) {
      showToast('Demonstração Offline', 'Conexão em nuvem inativa. Use o painel de setup no rodapé para conectar.', 'info');
    }
  }

  // Login bem sucedido
  async function handleAuthSuccess(user) {
    elements.loginScreen.classList.add('hidden');
    showToast('Acesso concedido', `Conectado como ${user.email}`, 'success');
    
    // Atualiza dados na barra lateral
    document.querySelector('.user-name').textContent = user.email.split('@')[0];
    document.querySelector('.user-role').textContent = 'Supervisor PCM';
    document.querySelector('.avatar').textContent = user.email.slice(0, 2).toUpperCase();

    // Sincroniza do Supabase
    if (sb.isConfigured()) {
      showToast('Sincronizando...', 'Carregando dados estruturados em nuvem.', 'info');
      await db.syncFromSupabase();
    }

    // Inicializa views
    populateSelectOptions();
    navigate('dashboard');
  }

  // Popula todos os selects dinâmicos da aplicação
  function populateSelectOptions() {
    // 1. Categorias
    const categories = db.db.categories;
    const catSelects = [elements.filterCategory, document.getElementById('part-category')];
    
    catSelects.forEach(sel => {
      if (!sel) return;
      const firstOpt = sel.options[0];
      sel.innerHTML = '';
      if (firstOpt && sel.id === 'filter-category') sel.appendChild(firstOpt);
      
      categories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.textContent = cat;
        sel.appendChild(opt);
      });
    });

    // 2. Armazéns
    const warehouses = db.getWarehouses();
    const whSelects = [
      elements.filterWarehouse,
      elements.filterMovWarehouse,
      document.getElementById('part-init-wh'),
      document.getElementById('mov-from-wh'),
      document.getElementById('mov-to-wh'),
      document.getElementById('wo-consume-wh')
    ];

    whSelects.forEach(sel => {
      if (!sel) return;
      const firstOpt = sel.options[0];
      sel.innerHTML = '';
      if (firstOpt && (sel.id.startsWith('filter') || sel.id === 'part-init-wh')) {
        sel.appendChild(firstOpt);
      }
      
      warehouses.forEach(wh => {
        const opt = document.createElement('option');
        opt.value = wh.id;
        opt.textContent = `${wh.code} - ${wh.name}`;
        sel.appendChild(opt);
      });
    });

    // 3. Peças para seleção na Movimentação
    const parts = db.getParts();
    const partSelects = [
      document.getElementById('mov-part'),
      document.getElementById('wo-consume-part')
    ];

    partSelects.forEach(sel => {
      if (!sel) return;
      sel.innerHTML = '';
      parts.forEach(part => {
        const opt = document.createElement('option');
        opt.value = part.id;
        opt.textContent = `${part.code} - ${part.name}`;
        sel.appendChild(opt);
      });
    });

    // 4. Ativos para seleção na OS
    const assets = db.getAssets();
    const assetSelect = document.getElementById('wo-new-asset');
    if (assetSelect) {
      assetSelect.innerHTML = '';
      assets.forEach(asset => {
        const opt = document.createElement('option');
        opt.value = asset.tag;
        opt.textContent = `${asset.tag} - ${asset.name}`;
        assetSelect.appendChild(opt);
      });
    }
  }

  // Navegação simples de abas
  function navigate(viewName) {
    currentView = viewName;
    
    // Atualiza classes ativas da sidebar
    elements.navItems.forEach(item => {
      if (item.getAttribute('data-view') === viewName) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // Alterna visibilidade dos containers
    elements.viewContainers.forEach(container => {
      if (container.id === `view-${viewName}`) {
        container.classList.add('active');
      } else {
        container.classList.remove('active');
      }
    });

    // Atualiza cabeçalho e botões dinâmicos
    updateHeader(viewName);
    
    // Renderiza a view correspondente
    renderView(viewName);

    // Fecha o menu lateral no mobile após clicar
    if (window.innerWidth <= 768) {
      elements.sidebar.classList.remove('mobile-active');
    }
  }

  // Atualiza títulos e botões no Header conforme a aba ativa
  function updateHeader(view) {
    elements.dynamicHeaderActions.innerHTML = '';

    switch (view) {
      case 'dashboard':
        elements.viewTitle.textContent = 'Visão Geral';
        elements.viewSubtitle.textContent = 'Acompanhe métricas, níveis críticos e movimentações de estoque em tempo real.';
        elements.dynamicHeaderActions.innerHTML = `
          <button class="btn btn-primary" id="hdr-btn-mov"><i data-lucide="arrow-left-right"></i> Registrar Movimento</button>
        `;
        document.getElementById('hdr-btn-mov').onclick = () => openModal('movement');
        break;
      case 'catalog':
        elements.viewTitle.textContent = 'Catálogo de Peças';
        elements.viewSubtitle.textContent = 'Gerencie insumos mecânicos, elétricos e lubrificantes de reposição.';
        elements.dynamicHeaderActions.innerHTML = `
          <button class="btn btn-primary" id="hdr-btn-part"><i data-lucide="plus"></i> Cadastrar Peça</button>
        `;
        document.getElementById('hdr-btn-part').onclick = () => openModal('part');
        break;
      case 'warehouses':
        elements.viewTitle.textContent = 'Armazéns e Almoxarifados';
        elements.viewSubtitle.textContent = 'Visualize localizações físicas e gerencie depósitos de peças.';
        elements.dynamicHeaderActions.innerHTML = `
          <button class="btn btn-primary" id="hdr-btn-wh"><i data-lucide="plus"></i> Novo Armazém</button>
        `;
        document.getElementById('hdr-btn-wh').onclick = () => openModal('warehouse');
        break;
      case 'movements':
        elements.viewTitle.textContent = 'Histórico de Movimentações';
        elements.viewSubtitle.textContent = 'Rastreabilidade total de Entradas, Saídas, Ajustes e Transferências.';
        elements.dynamicHeaderActions.innerHTML = `
          <button class="btn btn-primary" id="hdr-btn-mov-2"><i data-lucide="arrow-left-right"></i> Registrar Movimento</button>
        `;
        document.getElementById('hdr-btn-mov-2').onclick = () => openModal('movement');
        break;
      case 'maintenance':
        elements.viewTitle.textContent = 'Planejamento e Controle de Manutenção (PCM)';
        elements.viewSubtitle.textContent = 'Aloque e consuma peças do estoque diretamente em ordens de serviço ativas.';
        break;
      case 'suppliers':
        elements.viewTitle.textContent = 'Lista de Fornecedores';
        elements.viewSubtitle.textContent = 'Contatos e homologação de parceiros de suprimentos industriais.';
        elements.dynamicHeaderActions.innerHTML = `
          <button class="btn btn-primary" id="hdr-btn-sup"><i data-lucide="plus"></i> Novo Fornecedor</button>
        `;
        document.getElementById('hdr-btn-sup').onclick = () => openSupplierModal();
        break;
      case 'settings':
        elements.viewTitle.textContent = 'Configurações de Sistema';
        elements.viewSubtitle.textContent = 'Auditorias, backups e restauração de dados de fábrica.';
        break;
    }
    lucide.createIcons();
  }

  // Renderiza dados dinâmicos da view selecionada
  function renderView(view) {
    switch (view) {
      case 'dashboard':
        renderDashboard();
        break;
      case 'catalog':
        renderCatalog();
        break;
      case 'warehouses':
        renderWarehouses();
        break;
      case 'movements':
        renderMovements();
        break;
      case 'maintenance':
        renderMaintenance();
        break;
      case 'suppliers':
        renderSuppliers();
        break;
    }
  }

  /* ==========================================================================
     VIEWS - RENDERIZADORES
     ========================================================================== */
  
  function renderDashboard() {
    const parts = db.getParts();
    const movements = db.getMovements();

    document.getElementById('stat-total-items').textContent = parts.length;
    
    let criticalCount = 0;
    let totalStockValue = 0;
    const criticalListHtml = [];

    parts.forEach(part => {
      const totalQty = db.getTotalStockForPart(part);
      totalStockValue += totalQty * part.unitCost;

      if (totalQty < part.minStock) {
        criticalCount++;
        criticalListHtml.push(`
          <div class="alert-item">
            <i data-lucide="alert-triangle" style="color: var(--status-danger);"></i>
            <div class="alert-item-info">
              <div class="alert-item-name">${part.name}</div>
              <div class="alert-item-details">
                <span>SKU: ${part.code}</span>
                <span>Estoque: <strong class="alert-item-qty">${totalQty} ${part.unit}</strong> (Mín: ${part.minStock})</span>
              </div>
            </div>
            <button class="btn btn-secondary btn-sm" onclick="window.quickBuyPart('${part.id}')">Repor</button>
          </div>
        `);
      }
    });

    document.getElementById('stat-critical-items').textContent = criticalCount;
    document.getElementById('badge-critical-count').textContent = `${criticalCount} Insumos`;
    document.getElementById('stat-total-value').textContent = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalStockValue);
    document.getElementById('stat-total-movements').textContent = movements.length;

    const alertListContainer = document.getElementById('critical-stock-alerts');
    if (criticalListHtml.length > 0) {
      alertListContainer.innerHTML = criticalListHtml.join('');
    } else {
      alertListContainer.innerHTML = `
        <div class="alert-item" style="background: rgba(0, 230, 118, 0.03); border-color: rgba(0, 230, 118, 0.15); color: var(--status-success); justify-content: center; padding: 20px;">
          <i data-lucide="check-circle" style="margin-right: 8px;"></i> Todos os níveis de estoque estão normais.
        </div>
      `;
    }

    charts.update();
    lucide.createIcons();
  }

  function renderCatalog() {
    const parts = db.getParts();
    const searchVal = elements.catalogSearch.value.toLowerCase();
    const catVal = elements.filterCategory.value;
    const whVal = elements.filterWarehouse.value;
    const statusVal = elements.filterStatus.value;

    const tbody = document.getElementById('parts-table-body');
    tbody.innerHTML = '';

    const filteredParts = parts.filter(part => {
      const matchSearch = part.name.toLowerCase().includes(searchVal) || 
                          part.code.toLowerCase().includes(searchVal) || 
                          part.description.toLowerCase().includes(searchVal);
      
      const matchCategory = catVal === '' || part.category === catVal;
      
      let matchWarehouse = true;
      if (whVal !== '') {
        matchWarehouse = (part.stock[whVal] || 0) > 0;
      }

      const totalQty = db.getTotalStockForPart(part);
      let matchStatus = true;
      if (statusVal === 'critical') {
        matchStatus = totalQty < part.minStock;
      } else if (statusVal === 'normal') {
        matchStatus = totalQty >= part.minStock && totalQty <= part.maxStock;
      } else if (statusVal === 'max') {
        matchStatus = totalQty > part.maxStock;
      }

      return matchSearch && matchCategory && matchWarehouse && matchStatus;
    });

    if (filteredParts.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 40px 0;">
            <i data-lucide="package-search" style="width: 40px; height: 40px; margin-bottom: 10px;"></i>
            <p>Nenhuma peça de reposição encontrada.</p>
          </td>
        </tr>
      `;
      lucide.createIcons();
      return;
    }

    filteredParts.forEach(part => {
      const totalQty = db.getTotalStockForPart(part);
      let statusClass = 'normal';
      let percent = Math.min(100, (totalQty / part.maxStock) * 100);
      if (totalQty < part.minStock) statusClass = 'critical';
      else if (totalQty > part.maxStock) statusClass = 'warning';

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="item-code">${part.code}</td>
        <td>
          <div style="font-weight: 600; color: var(--text-primary);">${part.name}</div>
          <div style="font-size: 11px; color: var(--text-muted); max-width: 250px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${part.description}
          </div>
        </td>
        <td><span class="badge badge-info">${part.category}</span></td>
        <td style="font-weight: 600;">R$ ${part.unitCost.toFixed(2)}</td>
        <td style="font-weight: bold; color: var(--text-primary);">${totalQty} ${part.unit}</td>
        <td>
          <div class="stock-level-indicator">
            <div class="stock-numeric">
              <span>${Math.round(percent)}%</span>
              <span>Min: ${part.minStock}</span>
            </div>
            <div class="stock-bar-bg">
              <div class="stock-bar-fill ${statusClass}" style="width: ${percent}%;"></div>
            </div>
          </div>
        </td>
        <td>
          <div class="item-actions">
            <button class="btn-icon edit" onclick="window.editPart('${part.id}')"><i data-lucide="edit-2"></i></button>
            <button class="btn-icon delete" onclick="window.deletePart('${part.id}')"><i data-lucide="trash-2"></i></button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });
    lucide.createIcons();
  }

  function renderWarehouses() {
    const warehouses = db.getWarehouses();
    const parts = db.getParts();
    const container = document.getElementById('warehouses-container');
    container.innerHTML = '';

    warehouses.forEach(wh => {
      let totalQty = 0;
      let totalVal = 0;

      parts.forEach(part => {
        const qty = part.stock[wh.id] || 0;
        totalQty += qty;
        totalVal += qty * part.unitCost;
      });

      const card = document.createElement('div');
      card.className = 'glass-card warehouse-card';
      card.innerHTML = `
        <div class="warehouse-header">
          <div class="wh-title">
            <span class="wh-code-badge">${wh.code}</span>
            <h4>${wh.name}</h4>
          </div>
          <div class="item-actions">
            <button class="btn-icon edit" onclick="window.editWarehouse('${wh.id}')"><i data-lucide="edit-2"></i></button>
            <button class="btn-icon delete" onclick="window.deleteWarehouse('${wh.id}')"><i data-lucide="trash-2"></i></button>
          </div>
        </div>
        
        <div class="wh-details">
          <div class="wh-detail-row">
            <span class="wh-detail-label">Localização:</span>
            <span class="wh-detail-value">${wh.location}</span>
          </div>
          <div class="wh-detail-row">
            <span class="wh-detail-label">Responsável:</span>
            <span class="wh-detail-value">${wh.manager}</span>
          </div>
        </div>
        
        <div class="wh-totals">
          <div class="wh-total-box">
            <div class="wh-total-label">Total Itens</div>
            <div class="wh-total-val" style="color: var(--accent-cyan);">${totalQty}</div>
          </div>
          <div class="wh-total-box">
            <div class="wh-total-label">Valor Total</div>
            <div class="wh-total-val" style="color: var(--status-success);">R$ ${totalVal.toFixed(2)}</div>
          </div>
        </div>
      `;
      container.appendChild(card);
    });
    lucide.createIcons();
  }

  function renderMovements() {
    const movements = db.getMovements();
    const searchVal = elements.movementSearch.value.toLowerCase();
    const typeVal = elements.filterMovType.value;
    const whVal = elements.filterMovWarehouse.value;

    const tbody = document.getElementById('movements-table-body');
    tbody.innerHTML = '';

    const filteredMovs = movements.filter(mov => {
      const matchSearch = mov.partCode.toLowerCase().includes(searchVal) || 
                          mov.partName.toLowerCase().includes(searchVal) || 
                          mov.reference.toLowerCase().includes(searchVal) ||
                          mov.user.toLowerCase().includes(searchVal);
      
      const matchType = typeVal === '' || mov.type === typeVal;
      const matchWarehouse = whVal === '' || mov.fromWhId === whVal || mov.toWhId === whVal;

      return matchSearch && matchType && matchWarehouse;
    });

    if (filteredMovs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;">Sem movimentações registradas.</td></tr>`;
      return;
    }

    filteredMovs.forEach(mov => {
      const date = new Date(mov.date);
      const formattedDate = date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      
      let badgeClass = 'badge-info';
      if (mov.type === 'Entrada') badgeClass = 'badge-success';
      else if (mov.type === 'Saída') badgeClass = 'badge-danger';
      else if (mov.type === 'Transferência') badgeClass = 'badge-info';
      else if (mov.type === 'Ajuste') badgeClass = 'badge-warning';

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="font-size: 12px;">${formattedDate}</td>
        <td class="item-code">${mov.partCode}</td>
        <td>
          <div style="font-weight: 600; color: var(--text-primary);">${mov.partName}</div>
          <div style="font-size: 11px; color: var(--text-muted);">${mov.notes}</div>
        </td>
        <td><span class="badge ${badgeClass}">${mov.type}</span></td>
        <td style="font-weight: bold; color: var(--text-primary);">${mov.qty}</td>
        <td>${mov.fromWhName}</td>
        <td>${mov.toWhName}</td>
        <td style="font-family: monospace;">${mov.reference}</td>
        <td>${mov.user}</td>
      `;
      tbody.appendChild(tr);
    });
    lucide.createIcons();
  }

  function renderMaintenance() {
    const wos = db.getWorkOrders();
    const woList = document.getElementById('wo-list-container');
    woList.innerHTML = '';

    wos.forEach(wo => {
      const card = document.createElement('div');
      card.className = 'wo-card';
      
      let partsHtml = '';
      if (wo.parts && wo.parts.length > 0) {
        partsHtml = `
          <div class="wo-parts-list">
            <strong style="margin-bottom: 4px; display: block; font-size: 10px; color: var(--accent-cyan);">Materiais Alocados:</strong>
            ${wo.parts.map(p => `
              <div class="wo-part-row">
                <span>${p.code} (${p.qty} UN)</span>
                <span>R$ ${p.totalCost.toFixed(2)}</span>
              </div>
            `).join('')}
          </div>
        `;
      }

      card.innerHTML = `
        <div class="wo-header">
          <span class="wo-code">${wo.code}</span>
          <span class="badge ${wo.status === 'Aberta' ? 'badge-success' : 'badge-warning'}">${wo.status}</span>
        </div>
        <div class="wo-info">
          <h4>${wo.assetName} [${wo.assetTag}]</h4>
          <p>${wo.description}</p>
        </div>
        ${partsHtml}
        <div class="wo-footer">
          <span>Custo Total: <strong class="wo-cost">R$ ${wo.cost.toFixed(2)}</strong></span>
          ${wo.status === 'Aberta' ? `<button class="btn btn-secondary btn-sm" onclick="window.openWOConsumeModal('${wo.code}', '${wo.assetTag} - ${wo.assetName}')"><i data-lucide="plus"></i> Consumir</button>` : ''}
        </div>
      `;
      woList.appendChild(card);
    });

    const assets = db.getAssets();
    const assetList = document.getElementById('asset-list-container');
    assetList.innerHTML = '';

    assets.forEach(asset => {
      const item = document.createElement('div');
      item.className = 'wo-card';
      item.style.borderLeft = `3px solid ${asset.critical === 'Alta' ? 'var(--status-danger)' : 'var(--status-warning)'}`;
      item.innerHTML = `
        <div class="wo-header">
          <strong style="color: var(--text-primary); font-size: 15px;">${asset.name}</strong>
          <span class="wh-code-badge">${asset.tag}</span>
        </div>
        <div style="font-size: 13px; color: var(--text-secondary); margin-top: 4px;">
          <div><strong>Local:</strong> ${asset.location}</div>
          <div><strong>Criticidade:</strong> ${asset.critical}</div>
        </div>
      `;
      assetList.appendChild(item);
    });
    lucide.createIcons();
  }

  function renderSuppliers() {
    const suppliers = db.getSuppliers();
    const tbody = document.getElementById('suppliers-table-body');
    tbody.innerHTML = '';

    suppliers.forEach(sup => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="font-weight: 600; color: var(--text-primary);">${sup.name}</td>
        <td>${sup.cnpj}</td>
        <td>${sup.contact}</td>
        <td>
          <div style="display:flex; align-items:center; gap:4px; color:var(--status-warning);">
            <i data-lucide="star" style="width:14px; fill:var(--status-warning);"></i>
            ${sup.rating.toFixed(1)}
          </div>
        </td>
        <td><span class="badge badge-success">${sup.status}</span></td>
        <td>
          <div class="item-actions">
            <button class="btn-icon edit" onclick="window.editSupplier('${sup.id}')"><i data-lucide="edit-2"></i></button>
            <button class="btn-icon delete" onclick="window.deleteSupplier('${sup.id}')"><i data-lucide="trash-2"></i></button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });
    lucide.createIcons();
  }

  /* ==========================================================================
     LÓGICA DE LOGIN / CADASTRO (SUPABASE AUTH)
     ========================================================================== */
  function setupAuthListeners() {
    
    // Alterna Visibilidade da Senha (Olhinho)
    elements.btnTogglePassword.addEventListener('click', () => {
      const type = elements.loginPassword.getAttribute('type') === 'password' ? 'text' : 'password';
      elements.loginPassword.setAttribute('type', type);
      const icon = elements.btnTogglePassword.querySelector('i');
      if (type === 'text') {
        icon.setAttribute('data-lucide', 'eye-off');
      } else {
        icon.setAttribute('data-lucide', 'eye');
      }
      lucide.createIcons();
    });

    // Alterna entre modo Entrar e Registrar
    elements.linkRegister.addEventListener('click', (e) => {
      e.preventDefault();
      isRegisterMode = !isRegisterMode;
      if (isRegisterMode) {
        elements.loginFormTitle.textContent = 'Registrar conta';
        elements.btnLoginText.textContent = 'Criar Conta';
        elements.loginFooterText.innerHTML = 'Já possui uma conta? <a href="#" id="link-login-toggle">Conecte-se</a>';
        
        document.getElementById('link-login-toggle').onclick = (ev) => {
          ev.preventDefault();
          elements.linkRegister.click();
        };
      } else {
        elements.loginFormTitle.textContent = 'Login';
        elements.btnLoginText.textContent = 'Entrar';
        elements.loginFooterText.innerHTML = 'Não tem uma conta ainda? <a href="#" id="link-register">Registre-se grátis</a>';
        
        // Re-vincula listener
        elements.linkRegister = document.getElementById('link-register');
        setupAuthListeners();
      }
    });

    // Envio do formulário de Login/Registro
    elements.formLogin.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = elements.loginEmail.value;
      const password = elements.loginPassword.value;

      elements.btnLoginSubmit.disabled = true;
      elements.btnLoginText.textContent = 'Carregando...';

      if (sb.isConfigured()) {
        if (isRegisterMode) {
          const res = await sb.signUp(email, password);
          if (res.success) {
            showToast('Cadastro realizado!', 'Verifique seu e-mail para confirmar a conta.', 'success');
            // Retorna ao login
            elements.linkRegister.click();
          } else {
            showToast('Erro ao cadastrar', res.error, 'error');
          }
        } else {
          const res = await sb.signIn(email, password);
          if (res.success) {
            handleAuthSuccess(res.user);
          } else {
            showToast('Erro de login', res.error, 'error');
          }
        }
      } else {
        // Fallback offline (Bypass de segurança de demonstração)
        showToast('Modo de Demonstração', 'Acesso concedido off-line com sucesso.', 'info');
        handleAuthSuccess({ email: email || 'demo@ativo360.com' });
      }

      elements.btnLoginSubmit.disabled = false;
      elements.btnLoginText.textContent = isRegisterMode ? 'Criar Conta' : 'Entrar';
      lucide.createIcons();
    });

    // Ação de Logout
    elements.btnLogoutSidebar.addEventListener('click', async () => {
      if (confirm('Deseja realmente desconectar de sua conta?')) {
        if (sb.isConfigured()) {
          await sb.signOut();
        }
        elements.loginEmail.value = '';
        elements.loginPassword.value = '';
        showLoginScreen();
        showToast('Logout efetuado', 'Você saiu do sistema.', 'info');
      }
    });
  }

  /* ==========================================================================
     LÓGICA DE CONFIGURAÇÃO DE CREDENCIAIS DO SUPABASE
     ========================================================================== */
  function setupSetupListeners() {
    
    // Abre modal de setup
    elements.btnOpenSetup.onclick = () => {
      document.getElementById('setup-url').value = window.ativo360Config.SUPABASE_URL || '';
      document.getElementById('setup-key').value = window.ativo360Config.SUPABASE_KEY || '';
      elements.modalSupabaseSetup.classList.add('active');
    };

    // Fecha modal
    document.getElementById('btn-close-setup-modal').onclick = () => closeModal(elements.modalSupabaseSetup);
    document.getElementById('btn-cancel-setup-modal').onclick = () => closeModal(elements.modalSupabaseSetup);

    // Salva chaves no setup
    elements.formSupabaseSetup.onsubmit = async (e) => {
      e.preventDefault();
      const url = document.getElementById('setup-url').value.trim();
      const key = document.getElementById('setup-key').value.trim();

      window.localStorage.setItem('ativo360_supabase_url', url);
      window.localStorage.setItem('ativo360_supabase_key', key);
      
      window.ativo360Config.SUPABASE_URL = url;
      window.ativo360Config.SUPABASE_KEY = key;

      // Re-inicializa módulo
      sb.init();
      closeModal(elements.modalSupabaseSetup);

      if (sb.isConfigured()) {
        showToast('Supabase conectado', 'As credenciais foram atualizadas. Tentando autenticação...', 'success');
        const user = await sb.getCurrentUser();
        if (user) {
          handleAuthSuccess(user);
        } else {
          showLoginScreen();
        }
      } else {
        showToast('Conexão offline', 'Credenciais inválidas.', 'error');
      }
    };
  }

  /* ==========================================================================
     MODAIS - UTILS
     ========================================================================== */
  function openModal(modalType) {
    if (modalType === 'part') {
      elements.formPart.reset();
      document.getElementById('part-form-id').value = '';
      document.getElementById('modal-part-title').textContent = 'Cadastrar Peça de Reposição';
      document.getElementById('initial-stock-section').style.display = 'block';
      elements.modalPart.classList.add('active');
    } 
    else if (modalType === 'movement') {
      elements.formMovement.reset();
      document.getElementById('movement-error-msg').style.display = 'none';
      toggleMovementFields();
      elements.modalMovement.classList.add('active');
    }
    else if (modalType === 'warehouse') {
      elements.formWarehouse.reset();
      document.getElementById('wh-form-id').value = '';
      document.getElementById('modal-warehouse-title').textContent = 'Adicionar Novo Armazém';
      elements.modalWarehouse.classList.add('active');
    }
  }

  function closeModal(modalElement) {
    modalElement.classList.remove('active');
  }

  function toggleMovementFields() {
    const type = document.getElementById('mov-type').value;
    const fromWhContainer = document.getElementById('mov-from-wh-container');
    const toWhContainer = document.getElementById('mov-to-wh-container');
    const fromLabel = document.getElementById('mov-from-label');

    if (type === 'Entrada') {
      fromWhContainer.style.display = 'none';
      toWhContainer.style.display = 'block';
    } else if (type === 'Saída') {
      fromWhContainer.style.display = 'block';
      toWhContainer.style.display = 'none';
      fromLabel.textContent = 'Armazém de Origem';
    } else if (type === 'Transferência') {
      fromWhContainer.style.display = 'block';
      toWhContainer.style.display = 'block';
      fromLabel.textContent = 'Armazém de Origem';
    } else if (type === 'Ajuste') {
      fromWhContainer.style.display = 'block';
      toWhContainer.style.display = 'none';
      fromLabel.textContent = 'Armazém a Ajustar';
    }
  }

  function validateStockForMovement() {
    const type = document.getElementById('mov-type').value;
    const partId = document.getElementById('mov-part').value;
    const fromWhId = document.getElementById('mov-from-wh').value;
    const qty = parseInt(document.getElementById('mov-qty').value, 10) || 0;
    const errorMsg = document.getElementById('movement-error-msg');

    if ((type === 'Saída' || type === 'Transferência') && partId && fromWhId) {
      const part = db.getPartById(partId);
      const available = part.stock[fromWhId] || 0;
      
      if (available < qty) {
        errorMsg.textContent = `Estoque insuficiente! Disponível no armazém: ${available} ${part.unit}.`;
        errorMsg.style.display = 'block';
        return false;
      }
    }
    errorMsg.style.display = 'none';
    return true;
  }

  function showToast(title, desc, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    let icon = 'check-circle';
    if (type === 'error') icon = 'x-circle';
    else if (type === 'info') icon = 'info';

    toast.innerHTML = `
      <div class="toast-icon"><i data-lucide="${icon}"></i></div>
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        <div class="toast-desc">${desc}</div>
      </div>
    `;
    elements.toastWrapper.appendChild(toast);
    lucide.createIcons();

    setTimeout(() => {
      toast.style.animation = 'slide-in 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28) reverse forwards';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  /* ==========================================================================
     MÉTODOS EXPOSTOS NA WINDOW
     ========================================================================== */
  
  window.quickBuyPart = (partId) => {
    openModal('movement');
    document.getElementById('mov-type').value = 'Entrada';
    document.getElementById('mov-part').value = partId;
    toggleMovementFields();
  };

  window.editPart = (partId) => {
    const part = db.getPartById(partId);
    if (!part) return;

    document.getElementById('part-form-id').value = part.id;
    document.getElementById('part-code').value = part.code;
    document.getElementById('part-category').value = part.category;
    document.getElementById('part-name').value = part.name;
    document.getElementById('part-description').value = part.description;
    document.getElementById('part-unit').value = part.unit;
    document.getElementById('part-cost').value = part.unitCost;
    document.getElementById('part-min').value = part.minStock;
    document.getElementById('part-max').value = part.maxStock;
    document.getElementById('initial-stock-section').style.display = 'none';
    document.getElementById('modal-part-title').textContent = 'Editar Insumo';
    elements.modalPart.classList.add('active');
  };

  window.deletePart = async (partId) => {
    const part = db.getPartById(partId);
    if (confirm(`Deseja realmente excluir '${part.name}' do catálogo?`)) {
      const res = await db.deletePart(partId);
      if (res.success) {
        showToast('Peça excluída', 'O item foi removido do catálogo.', 'success');
        renderView(currentView);
        populateSelectOptions();
      } else {
        showToast('Falha ao excluir', res.error, 'error');
      }
    }
  };

  window.editWarehouse = (whId) => {
    const wh = db.getWarehouseById(whId);
    if (!wh) return;

    document.getElementById('wh-form-id').value = wh.id;
    document.getElementById('wh-code').value = wh.code;
    document.getElementById('wh-name').value = wh.name;
    document.getElementById('wh-location').value = wh.location;
    document.getElementById('wh-manager').value = wh.manager;
    document.getElementById('modal-warehouse-title').textContent = 'Editar Armazém';
    elements.modalWarehouse.classList.add('active');
  };

  window.deleteWarehouse = async (whId) => {
    const wh = db.getWarehouseById(whId);
    if (confirm(`Confirma a exclusão do armazém '${wh.name}'?`)) {
      const res = await db.deleteWarehouse(whId);
      if (res.success) {
        showToast('Armazém excluído', 'O armazém foi removido com sucesso.', 'success');
        renderView(currentView);
        populateSelectOptions();
      } else {
        showToast('Erro ao remover', res.error, 'error');
      }
    }
  };

  window.openWOConsumeModal = (woCode, displayTitle) => {
    document.getElementById('wo-consume-code').value = woCode;
    document.getElementById('wo-consume-display').value = `${woCode} - ${displayTitle}`;
    document.getElementById('wo-consume-qty').value = 1;
    document.getElementById('wo-consume-error-msg').style.display = 'none';
    elements.modalWOConsume.classList.add('active');
  };

  window.openSupplierModal = () => {
    let supModal = document.getElementById('modal-supplier');
    if (!supModal) {
      supModal = document.createElement('div');
      supModal.id = 'modal-supplier';
      supModal.className = 'modal-overlay';
      supModal.innerHTML = `
        <div class="modal-container">
          <div class="modal-header">
            <h3>Cadastrar Fornecedor</h3>
            <button class="btn-close-modal" onclick="document.getElementById('modal-supplier').classList.remove('active')">&times;</button>
          </div>
          <form id="form-supplier">
            <div class="modal-body">
              <div class="form-group row-2">
                <div>
                  <label for="sup-name">Razão Social</label>
                  <input type="text" id="sup-name" class="form-control" required placeholder="Ex: Metalúrgica Alfa Ltda">
                </div>
                <div>
                  <label for="sup-cnpj">CNPJ / Tax ID</label>
                  <input type="text" id="sup-cnpj" class="form-control" required placeholder="Ex: 00.000.000/0001-00">
                </div>
              </div>
              <div class="form-group">
                <label for="sup-contact">Contato (E-mail / Fone)</label>
                <input type="text" id="sup-contact" class="form-control" required placeholder="Ex: vendas@metalurgicaalfa.com.br - (11) 9999-9999">
              </div>
              <div class="form-group row-2">
                <div>
                  <label for="sup-rating">Avaliação (1.0 - 5.0)</label>
                  <input type="number" id="sup-rating" class="form-control" min="1" max="5" step="0.1" value="5.0" required>
                </div>
                <div>
                  <label for="sup-status">Status de Qualificação</label>
                  <select id="sup-status" class="form-control" required>
                    <option value="Ativo">Ativo</option>
                    <option value="Homologado">Homologado (Auditorado)</option>
                    <option value="Suspenso">Suspenso</option>
                  </select>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" onclick="document.getElementById('modal-supplier').classList.remove('active')">Cancelar</button>
              <button type="submit" class="btn btn-primary">Salvar Fornecedor</button>
            </div>
          </form>
        </div>
      `;
      document.body.appendChild(supModal);
      
      document.getElementById('form-supplier').onsubmit = async (e) => {
        e.preventDefault();
        const name = document.getElementById('sup-name').value;
        const cnpj = document.getElementById('sup-cnpj').value;
        const contact = document.getElementById('sup-contact').value;
        const rating = document.getElementById('sup-rating').value;
        const status = document.getElementById('sup-status').value;

        await db.addSupplier({ name, cnpj, contact, rating, status });
        showToast('Fornecedor salvo', 'Parceiro comercial registrado com sucesso.', 'success');
        supModal.classList.remove('active');
        renderView('suppliers');
      };
    }
    document.getElementById('form-supplier').reset();
    supModal.classList.add('active');
  };

  window.deleteSupplier = async (id) => {
    if (confirm('Deseja realmente remover este fornecedor do cadastro?')) {
      await db.deleteSupplier(id);
      showToast('Fornecedor removido', 'O registro foi excluído.', 'success');
      renderView('suppliers');
    }
  };

  /* ==========================================================================
     GERENCIADORES DE EVENTOS DE FORMULÁRIO E MUDANÇAS
     ========================================================================== */
  function setupEventListeners() {
    elements.sidebarToggle.onclick = () => elements.sidebar.classList.toggle('collapsed');
    
    // Gaveta mobile
    elements.sidebarToggle.addEventListener('click', () => {
      if (window.innerWidth <= 768) {
        elements.sidebar.classList.toggle('mobile-active');
      }
    });

    elements.navItems.forEach(item => {
      item.onclick = () => navigate(item.getAttribute('data-view'));
    });

    // Fechamento de modais
    document.getElementById('btn-close-part-modal').onclick = () => closeModal(elements.modalPart);
    document.getElementById('btn-cancel-part-modal').onclick = () => closeModal(elements.modalPart);
    document.getElementById('btn-close-mov-modal').onclick = () => closeModal(elements.modalMovement);
    document.getElementById('btn-cancel-mov-modal').onclick = () => closeModal(elements.modalMovement);
    document.getElementById('btn-close-wh-modal').onclick = () => closeModal(elements.modalWarehouse);
    document.getElementById('btn-cancel-wh-modal').onclick = () => closeModal(elements.modalWarehouse);
    document.getElementById('btn-close-wo-consume-modal').onclick = () => closeModal(elements.modalWOConsume);
    document.getElementById('btn-cancel-wo-consume-modal').onclick = () => closeModal(elements.modalWOConsume);

    // Filtros Catálogo
    elements.catalogSearch.oninput = () => renderCatalog();
    elements.filterCategory.onchange = () => renderCatalog();
    elements.filterWarehouse.onchange = () => renderCatalog();
    elements.filterStatus.onchange = () => renderCatalog();

    // Filtros Movimentações
    elements.movementSearch.oninput = () => renderMovements();
    elements.filterMovType.onchange = () => renderMovements();
    elements.filterMovWarehouse.onchange = () => renderMovements();

    // Novo Insumo
    elements.formPart.onsubmit = async (e) => {
      e.preventDefault();
      const id = document.getElementById('part-form-id').value;
      const partData = {
        code: document.getElementById('part-code').value,
        category: document.getElementById('part-category').value,
        name: document.getElementById('part-name').value,
        description: document.getElementById('part-description').value,
        unit: document.getElementById('part-unit').value,
        unitCost: document.getElementById('part-cost').value,
        minStock: document.getElementById('part-min').value,
        maxStock: document.getElementById('part-max').value,
        initialWarehouse: document.getElementById('part-init-wh').value,
        initialQty: document.getElementById('part-init-qty').value,
        user: 'Supervisor PCM'
      };

      if (id) {
        const res = await db.updatePart(id, partData);
        if (res.success) {
          showToast('Insumo atualizado', 'As especificações da peça foram salvas.', 'success');
          closeModal(elements.modalPart);
          renderView(currentView);
          populateSelectOptions();
        } else {
          showToast('Erro ao atualizar', res.error, 'error');
        }
      } else {
        const res = await db.addPart(partData);
        if (res.success) {
          showToast('Cadastro realizado', 'Nova peça inserida no catálogo.', 'success');
          closeModal(elements.modalPart);
          renderView(currentView);
          populateSelectOptions();
        } else {
          showToast('Erro no cadastro', res.error, 'error');
        }
      }
    };

    // Registrar Movimento
    elements.movType = document.getElementById('mov-type');
    elements.movType.onchange = () => {
      toggleMovementFields();
      validateStockForMovement();
    };
    document.getElementById('mov-part').onchange = () => validateStockForMovement();
    document.getElementById('mov-from-wh').onchange = () => validateStockForMovement();
    document.getElementById('mov-qty').oninput = () => validateStockForMovement();

    elements.formMovement.onsubmit = async (e) => {
      e.preventDefault();
      if (!validateStockForMovement()) return;

      const transaction = {
        type: document.getElementById('mov-type').value,
        partId: document.getElementById('mov-part').value,
        qty: parseInt(document.getElementById('mov-qty').value, 10),
        fromWhId: document.getElementById('mov-from-wh').value,
        toWhId: document.getElementById('mov-to-wh').value,
        reference: document.getElementById('mov-reference').value,
        notes: document.getElementById('mov-notes').value,
        user: document.querySelector('.user-name').textContent || 'Supervisor PCM'
      };

      const res = await db.registerTransaction(transaction);
      if (res.success) {
        showToast('Transação concluída', 'Estoque e movimentação atualizados.', 'success');
        closeModal(elements.modalMovement);
        renderView(currentView);
      } else {
        showToast('Falha na transação', res.error, 'error');
      }
    };

    // Salvar Armazém
    elements.formWarehouse.onsubmit = async (e) => {
      e.preventDefault();
      const id = document.getElementById('wh-form-id').value;
      const whData = {
        code: document.getElementById('wh-code').value,
        name: document.getElementById('wh-name').value,
        location: document.getElementById('wh-location').value,
        manager: document.getElementById('wh-manager').value
      };

      if (id) {
        await db.updateWarehouse(id, whData);
        showToast('Armazém atualizado', 'Dados salvos com sucesso.', 'success');
      } else {
        await db.addWarehouse(whData);
        showToast('Armazém criado', 'Depósito disponível para estocagem.', 'success');
      }

      closeModal(elements.modalWarehouse);
      renderView(currentView);
      populateSelectOptions();
    };

    // Consumir material na OS
    elements.formWOConsume.onsubmit = async (e) => {
      e.preventDefault();
      const partId = document.getElementById('wo-consume-part').value;
      const whId = document.getElementById('wo-consume-wh').value;
      const qty = parseInt(document.getElementById('wo-consume-qty').value, 10);
      const woCode = document.getElementById('wo-consume-code').value;
      
      const part = db.getPartById(partId);
      const available = part.stock[whId] || 0;

      if (available < qty) {
        showToast('Erro de alocação', 'Estoque insuficiente no armazém.', 'error');
        return;
      }

      const res = await db.registerTransaction({
        type: 'Saída',
        partId,
        qty,
        fromWhId: whId,
        toWhId: null,
        reference: woCode,
        notes: `Consumo de material alocado na OS ${woCode}.`,
        user: document.querySelector('.user-name').textContent || 'Técnico Manutenção'
      });

      if (res.success) {
        showToast('Material alocado', `Insumo debitado do estoque e lançado na OS ${woCode}.`, 'success');
        closeModal(elements.modalWOConsume);
        renderView('maintenance');
      } else {
        showToast('Erro de transação', res.error, 'error');
      }
    };

    // Nova OS
    document.getElementById('btn-new-wo').onclick = () => {
      elements.formNewWO.reset();
      elements.modalNewWO.classList.add('active');
    };
    document.getElementById('btn-close-new-wo-modal').onclick = () => closeModal(elements.modalNewWO);
    document.getElementById('btn-cancel-new-wo-modal').onclick = () => closeModal(elements.modalNewWO);

    elements.formNewWO.onsubmit = async (e) => {
      e.preventDefault();
      const woData = {
        assetTag: document.getElementById('wo-new-asset').value,
        type: document.getElementById('wo-new-type').value,
        description: document.getElementById('wo-new-desc').value
      };

      await db.addWorkOrder(woData);
      showToast('OS aberta', 'OS criada e disponível para alocação de materiais.', 'success');
      closeModal(elements.modalNewWO);
      renderView('maintenance');
    };

    // Configurações (Export, Import, Reset)
    document.getElementById('btn-export-db').onclick = () => {
      const dataStr = db.exportDatabase();
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_ativo360_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      showToast('Backup gerado', 'Arquivo baixado.', 'success');
    };

    document.getElementById('btn-import-db').onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (event) => {
        const res = db.importDatabase(event.target.result);
        if (res.success) {
          showToast('Backup restaurado', 'Dados carregados com sucesso.', 'success');
          populateSelectOptions();
          navigate('dashboard');
        } else {
          showToast('Falha na restauração', res.error, 'error');
        }
      };
      reader.readAsText(file);
    };

    document.getElementById('btn-reset-db').onclick = async () => {
      if (confirm('Apagar todas as alterações e restaurar os dados iniciais?')) {
        await db.resetToDefault();
        showToast('Dados restaurados', 'Banco redefinido para demonstração.', 'info');
        populateSelectOptions();
        navigate('dashboard');
      }
    };
  }

  // Inicializa o fluxo
  init();
});
