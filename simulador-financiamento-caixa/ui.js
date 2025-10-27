// ui.js

const unmaskMoeda = (valor) => {
    if (typeof valor !== 'string') return isNaN(parseFloat(valor)) ? 0 : parseFloat(valor);
    const cleaned = valor.replace(/[R$\s.]/g, '').replace(',', '.');
    return parseFloat(cleaned) || 0;
};

const formatarMoeda = (valor) => {
    if (isNaN(valor) || valor === null) valor = 0;
    if (typeof valor !== 'number') {
        valor = parseFloat(valor) || 0;
    }
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
};

const formatarInputMoeda = (input) => {
    let valor = input.value.replace(/\D/g, '');
    if (!valor) { input.value = ''; return; }
    valor = (parseInt(valor, 10) / 100).toFixed(2) + '';
    valor = valor.replace('.', ',');
    valor = valor.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
    input.value = valor;
};

const formatarDataInput = (input) => {
    let v = input.value.replace(/\D/g, '');
    v = v.replace(/(\d{2})(\d)/, '$1/$2');
    v = v.replace(/(\d{2})(\d)/, '$1/$2');
    input.value = v.slice(0, 10);
};

const formatarInputPercent = (input) => {
    let valor = input.value.replace(/\D/g, '');
    if (!valor) { input.value = ''; return; }
    if (valor.length > 4) valor = valor.slice(0, 4);
    valor = (parseInt(valor, 10) / 100).toFixed(2) + '';
    valor = valor.replace('.', ',');
    input.value = valor;
};

const unmaskPercent = (valor) => {
    if (typeof valor !== 'string') return isNaN(parseFloat(valor)) ? 0 : parseFloat(valor) / 100;
    const cleaned = valor.replace(/[%\s,]/g, '.').replace(/\.+$/, '');
    return (parseFloat(cleaned) || 0) / 100;
};

const formatarAnosMeses = (meses) => {
    if (isNaN(meses) || meses === null || meses <= 0) return '--';
    const anos = Math.floor(meses / 12);
    const mesesRestantes = Math.round(meses % 12);
    if (mesesRestantes === 12) {
        return `${anos + 1} a`;
    }
    if (mesesRestantes === 0 && anos > 0) return `${anos} a`;
    if (anos === 0) return `${mesesRestantes} m`;
    return `${anos} a ${mesesRestantes} m`;
};

const atualizarCidades = (cidadePreSelecionar = null) => {
    const estadoSelecionado = document.getElementById('estado').value;
    const selectCidade = document.getElementById('cidade');
    selectCidade.innerHTML = '';

    const estadoData = window.CIDADES_BRASIL[estadoSelecionado];

    if (!estadoData) {
        selectCidade.innerHTML = '<option value="">Selecione um Estado</option>';
        if (isInitialized) preAtualizarDados();
        return;
    }

    const cidades = estadoData.cidades.sort() || [];

    cidades.forEach(cidade => {
        const option = document.createElement('option');
        const cidadeUpper = cidade.toUpperCase();
        option.value = cidadeUpper;
        option.textContent = cidade;

        if (
            (estadoSelecionado === 'PR' && cidade === 'Guarapuava' && !cidadePreSelecionar) ||
            (cidadePreSelecionar && cidadeUpper === cidadePreSelecionar.toUpperCase())
        ) {
            option.selected = true;
        }
        selectCidade.appendChild(option);
    });

    if (isInitialized) preAtualizarDados();
};


const adicionarIntegrante = (nome = '', dtNasc = '', salario = 0, fgtsAcumulado = 0, tem3AnosFgts = true, usarFgtsFuturo = true) => {
    integranteId++;
    const template = document.getElementById('integranteTemplate');
    const clone = template.content.cloneNode(true);
    const novoIntegrante = clone.querySelector('div');

    novoIntegrante.id = `integrante-${integranteId}`;
    novoIntegrante.dataset.id = integranteId;

    const titulo = novoIntegrante.querySelector('.proponente-title');
    titulo.id = `proponenteTitulo-${integranteId}`;
    titulo.textContent = `Proponente ${integranteId}`;

    novoIntegrante.querySelector('.integrante-nome').value = nome;
    novoIntegrante.querySelector('.integrante-nascimento').value = dtNasc;
    novoIntegrante.querySelector('.integrante-salario').value = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(salario);
    novoIntegrante.querySelector('.integrante-fgts-acumulado').value = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(fgtsAcumulado);
    novoIntegrante.querySelector('.integrante-fgts-3anos').checked = tem3AnosFgts;
    novoIntegrante.querySelector('.integrante-usar-fgts-futuro').checked = usarFgtsFuturo;

    const container = document.getElementById('integrantesContainer');
    container.appendChild(clone);

    if (isInitialized) {
        preAtualizarDados();
    }
};

const removerIntegrante = (id) => {
    const el = document.getElementById(id);
    if (el) {
        el.remove();
        const container = document.getElementById('integrantesContainer');
        const divs = container.querySelectorAll('div[id^="integrante-"]');
        divs.forEach((div, index) => {
            const idNum = div.dataset.id;
            const titulo = div.querySelector(`#proponenteTitulo-${idNum}`);
            const nomeInput = div.querySelector('.integrante-nome');
            if (titulo) {
                titulo.textContent = nomeInput && nomeInput.value.trim() ? nomeInput.value.trim() : `Proponente ${index + 1}`;
            }
        });
        preAtualizarDados();
    }
};

const atualizarTituloProponente = (idNum) => {
    const div = document.getElementById(`integrante-${idNum}`);
    if (!div) return;
    const titulo = div.querySelector(`#proponenteTitulo-${idNum}`);
    const nomeInput = div.querySelector('.integrante-nome');
    const nome = nomeInput ? nomeInput.value.trim() : '';

    const container = document.getElementById('integrantesContainer');
    const todosDivs = Array.from(container.querySelectorAll('div[id^="integrante-"]'));
    const index = todosDivs.findIndex(el => el.id === `integrante-${idNum}`);

    if (titulo) {
        titulo.textContent = nome ? nome : `Proponente ${index + 1}`;
    }
};

const verificarEntradaMinima = () => {
    const entradaMinima = unmaskMoeda(document.getElementById('entradaMinimaDisplay').textContent);
    const usarFgts = document.getElementById('usarFgtsEntrada').checked;
    const { fgtsAcumuladoTotal, todosElegiveisFgtsEntrada } = calcularDadosFamiliares();
    const entradaDinheiroFinal = unmaskMoeda(document.getElementById('entradaDinheiroFinal').value);

    const fgtsNaEntrada = usarFgts && todosElegiveisFgtsEntrada ? fgtsAcumuladoTotal : 0;
    const entradaTotalFinal = entradaDinheiroFinal + fgtsNaEntrada;
    document.getElementById('entradaTotalFinalDisplay').textContent = formatarMoeda(entradaTotalFinal);

    const avisoInsuficiente = document.getElementById('avisoEntradaInsuficiente');
    if (entradaTotalFinal < entradaMinima - 0.01) {
        avisoInsuficiente.classList.remove('hidden');
    } else {
        avisoInsuficiente.classList.add('hidden');
    }
};

const verificarSelecaoIneligivel = () => {
    const select = document.getElementById('tipoFinanciamento');
    const selectedOption = select.options[select.selectedIndex];
    const avisoRenda = document.getElementById('avisoRendaSelect');
    if (selectedOption && selectedOption.disabled) {
        avisoRenda.classList.remove('hidden');
    } else {
        avisoRenda.classList.add('hidden');
    }
};

const toggleRendimentoAnual = () => {
    const aporteAnual = document.getElementById('aporteTipoAnual').checked;
    const containerRendimento = document.getElementById('rendimentoAnualContainer');
    if (aporteAnual) {
        containerRendimento.classList.remove('hidden');
    } else {
        containerRendimento.classList.add('hidden');
    }
};

const toggleSecaoAporte = () => {
    const ativar = document.getElementById('ativarAporte').checked;
    const secaoDetalhes = document.getElementById('secaoAporteDetalhes');
    const aporteInput = document.getElementById('aporteValorMensal');

    if (ativar) {
        secaoDetalhes.classList.remove('hidden');
        aporteInput.disabled = false;
    } else {
        secaoDetalhes.classList.add('hidden');
        aporteInput.disabled = true;
    }
};

const toggleSecaoAluguel = () => {
    const pretendeAlugar = document.getElementById('pretendeAlugar').checked;
    const secaoDetalhes = document.getElementById('secaoAluguelDetalhes');
    if (pretendeAlugar) {
        secaoDetalhes.classList.remove('hidden');
    } else {
        secaoDetalhes.classList.add('hidden');
    }
};

const buscarElementosDOM = () => {
    const ids = [
        'entradaMinimaDisplay', 'entradaFgtsDisponivelDisplay', 'entradaDinheiroFinal',
        'entradaTotalFinalDisplay', 'avisoEntradaInsuficiente', 'tipoFinanciamento',
        'valorFinanciadoDisplay', 'parcelaInicialDisplay',
        'tempoPadrao', 'custoTotalPadrao', 'jurosPadrao',
        'tempoAporte', 'custoTotalAporte', 'jurosAporte',
        'economiaTotal',
        'tabelaAmortizacao', 'valorAluguel', 'aporteValorMensal', 'aporteRendimentoAnual',
        'valorImovel', 'taxaAumentoAluguelInput', 'ativarAporte', 'aporteTipoMensal', 'pretendeAlugar',
        'detalheFgtsContainer',
        'taxaValorizacaoImovel', 'valorOriginalImovel', 'tempoQuitacaoValorizacao',
        'taxaValorizacaoUsada', 'valorFinalEstimadoImovel', 'ganhoValorizacaoEstimado'
    ];
    const elementos = {};
    let erro = false;
    ids.forEach(id => {
        elementos[id] = document.getElementById(id);
        if (!elementos[id] && id !== 'tabelaAmortizacao') {
            console.error(`Erro: Elemento com ID '${id}' não encontrado.`);
            erro = true;
        } else if (id === 'tabelaAmortizacao') {
            elementos['tabelaCorpo'] = document.querySelector('#tabelaAmortizacao tbody');
            if (!elementos['tabelaCorpo']) {
                console.error("Erro: Tbody da tabela não encontrado.");
                erro = true;
            }
        }
    });
    return erro ? null : elementos;
};

const limparResultados = (elementosDOM) => {
    elementosDOM.parcelaInicialDisplay.textContent = formatarMoeda(0);
    elementosDOM.tempoPadrao.textContent = '--';
    elementosDOM.custoTotalPadrao.textContent = formatarMoeda(0);
    elementosDOM.jurosPadrao.textContent = formatarMoeda(0);
    elementosDOM.tempoAporte.textContent = '--';
    elementosDOM.custoTotalAporte.textContent = formatarMoeda(0);
    elementosDOM.jurosAporte.textContent = formatarMoeda(0);
    elementosDOM.economiaTotal.textContent = formatarMoeda(0);
    elementosDOM.tabelaCorpo.innerHTML = '<tr><td colspan="5" class="text-center p-4 text-gray-500">Financiamento não necessário.</td></tr>';
    elementosDOM.detalheFgtsContainer.innerHTML = '<p class="text-center text-gray-500">Calcule a simulação para ver os detalhes.</p>';
    elementosDOM.valorOriginalImovel.textContent = formatarMoeda(0);
    elementosDOM.tempoQuitacaoValorizacao.textContent = '--';
    elementosDOM.taxaValorizacaoUsada.textContent = '0,00%';
    elementosDOM.valorFinalEstimadoImovel.textContent = formatarMoeda(0);
    elementosDOM.ganhoValorizacaoEstimado.textContent = formatarMoeda(0);
};

const renderizarTabelaFluxoCaixa = (tabelaCorpo, parcelasCalculadas, valorAluguelInicial, taxaAumentoAluguel, pretendeAlugar) => {
    tabelaCorpo.innerHTML = '';
    if (!parcelasCalculadas || parcelasCalculadas.length === 0) {
        tabelaCorpo.innerHTML = '<tr><td colspan="5" class="text-center p-4 text-gray-500">Erro ao calcular parcelas.</td></tr>';
        return;
    }

    let aluguelMensalAtual = valorAluguelInicial;

    parcelasCalculadas.forEach(p => {
        const ano = Math.ceil(p.mes / 12);
        if (p.mes % 12 === 1 && ano > 1) {
            aluguelMensalAtual *= (1 + taxaAumentoAluguel);
        }

        const fluxoCaixaMensal = aluguelMensalAtual - p.parcelaTotalPaga;

        const tr = document.createElement('tr');
        tr.className = `text-xs ${fluxoCaixaMensal >= -0.01 ? 'bg-green-50 hover:bg-green-100' : 'bg-white hover:bg-gray-50'}`;

        let rowHTML = `
            <td class="px-2 py-1 text-gray-700">${p.mes}</td>
            <td class="px-2 py-1 text-gray-700 text-right">${formatarMoeda(p.parcelaTotalPaga)}</td>
        `;

        if (pretendeAlugar) {
            rowHTML += `
                <td class="px-2 py-1 font-semibold ${aluguelMensalAtual >= p.parcelaTotalPaga - 0.01 ? 'text-green-700' : 'text-yellow-700'} text-right">${formatarMoeda(aluguelMensalAtual)}</td>
                <td class="px-2 py-1 ${fluxoCaixaMensal >= -0.01 ? 'text-green-800 font-bold' : 'text-red-600'} text-right" data-testid="fluxo-caixa">${formatarMoeda(fluxoCaixaMensal)}</td>
            `;
        }

        rowHTML += `<td class="px-2 py-1 text-gray-700 text-right">${formatarMoeda(p.novoSaldo)}</td>`;
        tr.innerHTML = rowHTML;
        tabelaCorpo.appendChild(tr);
    });
};

const renderizarDetalheFgts = (proponentes, usarFgtsEntrada, ativarAporte, fgtsAmortizadoTotalCalculado) => {
    const container = document.getElementById('detalheFgtsContainer');
    container.innerHTML = '';

    let html = '<ul class="space-y-2">';
    let fgtsTotalEntrada = 0;
    let fgtsTotalAmortizacaoBienal = 0;

    proponentes.forEach(p => {
        const nomeProponente = p.nome || `Proponente ${p.id}`;
        const fgtsEntradaUsado = (usarFgtsEntrada && p.tem3AnosFgts) ? p.fgtsAcumulado : 0;
        const proponentesAmortizando = proponentes.filter(prop => prop.tem3AnosFgts && prop.usarFgtsFuturo).length;
        const fgtsAmortizadoIndividual = (ativarAporte && p.usarFgtsFuturo && p.tem3AnosFgts && proponentesAmortizando > 0) ? (fgtsAmortizadoTotalCalculado / proponentesAmortizando) : 0;

        html += `
            <li class="border-b pb-2 last:border-b-0">
                <strong class="text-indigo-700">${nomeProponente}:</strong>
                <div class="flex justify-between text-xs mt-1">
                    <span>FGTS usado na Entrada:</span>
                    <span class="${fgtsEntradaUsado > 0 ? 'text-blue-600' : 'text-gray-500'}">${formatarMoeda(fgtsEntradaUsado)}</span>
                </div>
                <div class="flex justify-between text-xs">
                    <span>FGTS Amortização Bienal (Total):</span>
                    <span class="${fgtsAmortizadoIndividual > 0 ? 'text-green-600' : 'text-gray-500'}">${formatarMoeda(fgtsAmortizadoIndividual)}</span>
                </div>
            </li>
        `;
        fgtsTotalEntrada += fgtsEntradaUsado;
    });

    fgtsTotalAmortizacaoBienal = fgtsAmortizadoTotalCalculado;

    html += `</ul>`;
    html += `<div class="mt-4 pt-3 border-t font-semibold">
                 <div class="flex justify-between text-blue-800"><span>FGTS Total na Entrada:</span> <span>${formatarMoeda(fgtsTotalEntrada)}</span></div>
                 <div class="flex justify-between text-green-800"><span>FGTS Total Amortizado (Bienal):</span> <span>${formatarMoeda(fgtsTotalAmortizacaoBienal)}</span></div>
             </div>`;

    container.innerHTML = html;
};
