// listeners.js

document.addEventListener('DOMContentLoaded', () => {
    inicializarSimulador();

    const exportarJsonBtn = document.getElementById('exportarJson');
    if (exportarJsonBtn && typeof exportarResultadosParaJSON === 'function') {
        exportarJsonBtn.addEventListener('click', exportarResultadosParaJSON);
    }
});
