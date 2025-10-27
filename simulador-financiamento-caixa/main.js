const inicializarSimulador = async () => {

    if (typeof carregarDadosEstaticos === 'function') {
        await carregarDadosEstaticos();
    } else {
        console.error("Função carregarDadosEstaticos não está no escopo. Verifique a ordem dos scripts.");
        return;
    }

    const selectEstado = document.getElementById('estado');
    selectEstado.innerHTML = '';

    const siglas = Object.keys(window.CIDADES_BRASIL).sort();

    siglas.forEach(sigla => {
        const estado = window.CIDADES_BRASIL[sigla];
        const option = document.createElement('option');
        option.value = sigla;
        option.textContent = estado.nome;
        selectEstado.appendChild(option);
    });

    adicionarIntegrante('', '', 0, 0, true, true);

    document.querySelectorAll('.input-moeda').forEach(input => formatarInputMoeda(input));
    document.querySelectorAll('.input-data').forEach(input => formatarDataInput(input));
    document.querySelectorAll('.input-percent').forEach(input => formatarInputPercent(input));

    isInitialized = true;

    const tabelaCorpo = document.querySelector('#tabelaAmortizacao tbody');
    if(tabelaCorpo) tabelaCorpo.innerHTML = '<tr><td colspan="5" class="text-center p-4 text-gray-500">Preencha os dados e clique em Calcular.</td></tr>';
    const elementosDOM = buscarElementosDOM();
    if(elementosDOM) limparResultados(elementosDOM);

    toggleRendimentoAnual();
    toggleSecaoAporte();
    toggleSecaoAluguel();

    selectEstado.value = 'PR';

    atualizarCidades('Guarapuava');
};
