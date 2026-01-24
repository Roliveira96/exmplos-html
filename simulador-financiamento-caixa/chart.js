// chart.js

let graficoComparativoInstance = null;

const renderizarGraficoComparativo = (dadosImovel, dadosCDI) => {
    const ctx = document.getElementById('graficoComparativo').getContext('2d');

    if (graficoComparativoInstance) {
        graficoComparativoInstance.destroy();
    }

    // Gerar os labels (e.g., "Ano 1", "Ano 2", ...)
    const labels = dadosImovel.map((_, index) => `Ano ${index + 1}`);

    graficoComparativoInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Valor do Imóvel (com valorização)',
                    data: dadosImovel,
                    borderColor: 'rgba(128, 90, 213, 1)', // Roxo
                    backgroundColor: 'rgba(128, 90, 213, 0.1)',
                    fill: true,
                    tension: 0.4,
                },
                {
                    label: 'Investimento em CDI (acumulado)',
                    data: dadosCDI,
                    borderColor: 'rgba(5, 150, 105, 1)', // Verde
                    backgroundColor: 'rgba(5, 150, 105, 0.1)',
                    fill: true,
                    tension: 0.4,
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(value);
                        }
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(context.parsed.y);
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });
};
