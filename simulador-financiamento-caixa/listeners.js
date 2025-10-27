// listeners.js

document.addEventListener('DOMContentLoaded', () => {
    inicializarSimulador();

    // Mapeamento de IDs para funções de debounce
    const inputsParaDebounce = {
        'valorImovel': preAtualizarDados,
        'entradaDinheiroFinal': verificarEntradaMinima,
        'taxaJurosManual': desselecionarLinhaDeCredito
    };

    // Aplica debounce para inputs de digitação
    Object.keys(inputsParaDebounce).forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', _.debounce(inputsParaDebounce[id], 300));
        }
    });

    // Mapeamento de IDs para funções de evento 'change' direto
    const inputsParaChange = {
        'estado': () => atualizarCidades(),
        'cidade': preAtualizarDados,
        'usarFgtsEntrada': preAtualizarDados,
        'forcarTaxaBalcao': preAtualizarDados,
        'tipoFinanciamento': () => {
            verificarSelecaoIneligivel();
            preAtualizarDados();
        },
        'ativarAporte': toggleSecaoAporte,
        'aporteTipoAnual': toggleRendimentoAnual,
        'aporteTipoMensal': toggleRendimentoAnual,
        'pretendeAlugar': toggleSecaoAlugar
    };

    // Aplica eventos 'change' diretos
    Object.keys(inputsParaChange).forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', inputsParaChange[id]);
        }
    });

    // Botões e outros elementos com clique
    const calcularBtn = document.getElementById('calcularSimulacao');
    if (calcularBtn) {
        calcularBtn.addEventListener('click', calcularSimulacaoCompleta);
    }

    const adicionarIntegranteBtn = document.getElementById('adicionarIntegrante');
    if (adicionarIntegranteBtn) {
        adicionarIntegranteBtn.addEventListener('click', () => adicionarIntegrante());
    }

    const exportarJsonBtn = document.getElementById('exportarJson');
    if (exportarJsonBtn && typeof exportarResultadosParaJSON === 'function') {
        exportarJsonBtn.addEventListener('click', exportarResultadosParaJSON);
    }
});
