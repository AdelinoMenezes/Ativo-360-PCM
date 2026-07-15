/**
 * ATIVO360 - Módulo de Gráficos e Analytics (Chart.js)
 * Renderiza os painéis visuais do Dashboard do PCM.
 */

class Ativo360Charts {
  constructor() {
    this.flowChart = null;
    this.categoryChart = null;
    
    // Cores da Paleta ATIVO360 (Estudo de Marca A-DELL)
    this.colors = {
      cyan: '#00E5FF',
      blue: '#1A8CFF',
      green: '#00E676',
      yellow: '#FFC107',
      red: '#FF1744',
      purple: '#D500F9',
      grid: 'rgba(255, 255, 255, 0.05)',
      text: '#94A3B8'
    };
  }

  // Inicializa todos os gráficos
  init() {
    this.destroy(); // Destroi instâncias antigas se houver
    this.renderCategoryChart();
    this.renderFlowChart();
  }

  // Destroi gráficos para evitar vazamento de memória e bugs ao alternar abas
  destroy() {
    if (this.flowChart) {
      this.flowChart.destroy();
      this.flowChart = null;
    }
    if (this.categoryChart) {
      this.categoryChart.destroy();
      this.categoryChart = null;
    }
  }

  // Atualiza os dados dos gráficos em tempo real
  update() {
    if (!window.ativo360Db) return;
    this.init(); // Recria com as novas agregações
  }

  // 1. Gráfico de Rosca: Estoque por Categoria (Valor Total em R$)
  renderCategoryChart() {
    const ctx = document.getElementById('chart-category');
    if (!ctx) return;

    const db = window.ativo360Db;
    const parts = db.getParts();
    const categories = db.db.categories;

    // Agrega custo total por categoria
    const categoryTotals = {};
    categories.forEach(cat => {
      categoryTotals[cat] = 0;
    });

    parts.forEach(part => {
      const totalQty = db.getTotalStockForPart(part);
      const totalCost = totalQty * part.unitCost;
      if (categoryTotals[part.category] !== undefined) {
        categoryTotals[part.category] += totalCost;
      } else {
        categoryTotals[part.category] = totalCost;
      }
    });

    const labels = [];
    const data = [];
    
    Object.entries(categoryTotals).forEach(([cat, val]) => {
      // Inclui no gráfico apenas categorias com valor em estoque > 0
      if (val > 0) {
        labels.push(cat);
        data.push(Math.round(val));
      }
    });

    // Fallback se estoque estiver completamente vazio
    if (data.length === 0) {
      labels.push('Sem Estoque');
      data.push(1);
    }

    const chartColors = [
      this.colors.cyan,
      this.colors.blue,
      this.colors.green,
      this.colors.yellow,
      this.colors.purple,
      '#FF5722'
    ];

    this.categoryChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: chartColors,
          borderWidth: 1,
          borderColor: 'rgba(6, 11, 38, 0.8)',
          hoverOffset: 10
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              color: this.colors.text,
              font: {
                family: 'Outfit',
                size: 11
              },
              padding: 15,
              usePointStyle: true,
              pointStyle: 'circle'
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                let label = context.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.raw !== null) {
                  label += new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(context.raw);
                }
                return label;
              }
            }
          }
        },
        cutout: '70%'
      }
    });
  }

  // 2. Gráfico de Barras: Entradas vs Saídas por Mês (Histórico de Movimentos)
  renderFlowChart() {
    const ctx = document.getElementById('chart-flow');
    if (!ctx) return;

    const db = window.ativo360Db;
    const movements = db.getMovements();

    // Determina os últimos 6 meses
    const monthsName = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const last6Months = [];
    const inputData = new Array(6).fill(0);
    const outputData = new Array(6).fill(0);

    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      last6Months.push({
        monthIndex: d.getMonth(),
        year: d.getFullYear(),
        label: `${monthsName[d.getMonth()]}/${String(d.getFullYear()).substr(-2)}`
      });
    }

    // Filtra e agrega os movimentos
    movements.forEach(mov => {
      const date = new Date(mov.date);
      const movMonth = date.getMonth();
      const movYear = date.getFullYear();

      // Encontra a posição do mês nos últimos 6 meses
      const index = last6Months.findIndex(m => m.monthIndex === movMonth && m.year === movYear);
      if (index !== -1) {
        const totalValue = mov.qty * (db.getPartById(mov.partId)?.unitCost || 0);
        if (mov.type === 'Entrada') {
          inputData[index] += totalValue;
        } else if (mov.type === 'Saída') {
          outputData[index] += totalValue;
        }
      }
    });

    const labels = last6Months.map(m => m.label);

    this.flowChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Entradas (Custo R$)',
            data: inputData,
            backgroundColor: 'rgba(26, 140, 255, 0.65)',
            borderColor: this.colors.blue,
            borderWidth: 1,
            borderRadius: 4
          },
          {
            label: 'Saídas (Consumo R$)',
            data: outputData,
            backgroundColor: 'rgba(0, 229, 255, 0.65)',
            borderColor: this.colors.cyan,
            borderWidth: 1,
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            grid: {
              color: this.colors.grid
            },
            ticks: {
              color: this.colors.text,
              font: {
                family: 'Inter',
                size: 11
              }
            }
          },
          y: {
            grid: {
              color: this.colors.grid
            },
            ticks: {
              color: this.colors.text,
              font: {
                family: 'Inter',
                size: 11
              },
              callback: function(value) {
                return 'R$ ' + value;
              }
            }
          }
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              color: this.colors.text,
              font: {
                family: 'Outfit',
                size: 11
              },
              usePointStyle: true,
              pointStyle: 'rectRounded'
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) {
                  label = label.split(' ')[0] + ': ';
                }
                if (context.raw !== null) {
                  label += new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(context.raw);
                }
                return label;
              }
            }
          }
        }
      }
    });
  }
}

// Expõe a instância globalmente
window.ativo360Charts = new Ativo360Charts();
