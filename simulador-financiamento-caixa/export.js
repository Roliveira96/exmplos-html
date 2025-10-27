// export.js

const exportarResultadosParaJSON = () => {
    // 1. Coletar todos os dados de entrada
    const dadosDeEntrada = {
        valorImovel: unmaskMoeda(document.getElementById('valorImovel').value),
        estado: document.getElementById('estado').value,
        cidade: document.getElementById('cidade').value,
        tipoImovel: document.getElementById('tipoImovel').value,
        condicaoImovel: document.getElementById('condicaoImovel').value,
        proponentes: calcularDadosFamiliares(),
        usarFgtsEntrada: document.getElementById('usarFgtsEntrada').checked,
        ativarAporte: document.getElementById('ativarAporte').checked,
        aporte: {
            tipo: document.getElementById('aporteTipoMensal').checked ? 'mensal' : 'anual',
            objetivo: document.querySelector('input[name="objetivoAporte"]:checked').value,
            valorMensal: unmaskMoeda(document.getElementById('aporteValorMensal').value),
            rendimentoAnual: unmaskPercent(document.getElementById('aporteRendimentoAnual').value),
        },
        entradaDinheiroFinal: unmaskMoeda(document.getElementById('entradaDinheiroFinal').value),
        linhaDeCredito: {
            selecionada: document.getElementById('tipoFinanciamento').options[document.getElementById('tipoFinanciamento').selectedIndex].id,
            taxaAnual: parseFloat(document.getElementById('tipoFinanciamento').value),
            forcadaTaxaBalcao: document.getElementById('forcarTaxaBalcao').checked,
        },
        aluguel: {
            pretendeAlugar: document.getElementById('pretendeAlugar').checked,
            valorMensalInicial: unmaskMoeda(document.getElementById('valorAluguel').value),
            reajusteAnual: unmaskPercent(document.getElementById('taxaAumentoAluguelInput').value),
        },
        valorizacaoImovelAnual: unmaskPercent(document.getElementById('taxaValorizacaoImovel').value),
    };

    // 2. Executar os cálculos para obter os resultados
    const dadosFamiliares = dadosDeEntrada.proponentes;
    const fgtsNaEntrada = dadosDeEntrada.usarFgtsEntrada && dadosFamiliares.todosElegiveisFgtsEntrada ? dadosFamiliares.fgtsAcumuladoTotal : 0;
    const entradaTotalFinal = dadosDeEntrada.entradaDinheiroFinal + fgtsNaEntrada;
    const valorFinanciado = Math.max(0, dadosDeEntrada.valorImovel - entradaTotalFinal);

    const resultadoAporte = calcularAmortizacao(
        valorFinanciado,
        dadosDeEntrada.linhaDeCredito.taxaAnual,
        PRAZO_MESES,
        dadosDeEntrada.aporte.tipo,
        dadosDeEntrada.aporte.valorMensal,
        dadosDeEntrada.aporte.rendimentoAnual,
        dadosFamiliares.fgtsBienal,
        dadosFamiliares.proponentes,
        dadosDeEntrada.ativarAporte,
        dadosDeEntrada.aporte.objetivo
    );

    const resultadoPadrao = calcularAmortizacao(valorFinanciado, dadosDeEntrada.linhaDeCredito.taxaAnual, PRAZO_MESES, 'mensal', 0, 0, 0, [], false, 'prazo');

    const tempoQuitacaoAnos = resultadoAporte.tempoMeses / 12;
    const valorFinalEstimado = dadosDeEntrada.valorImovel * Math.pow((1 + dadosDeEntrada.valorizacaoImovelAnual), tempoQuitacaoAnos);


    const dadosDeSaida = {
        valorFinanciado: valorFinanciado,
        parcelaInicial: resultadoAporte.parcelas.length > 0 ? resultadoAporte.parcelas[0].parcelaTotalPaga : 0,
        resumo: {
            padrao: {
                tempoMeses: resultadoPadrao.tempoMeses,
                custoTotal: resultadoPadrao.custoTotalPago,
                jurosTotal: resultadoPadrao.totalJuros,
            },
            comAporte: {
                tempoMeses: resultadoAporte.tempoMeses,
                custoTotal: resultadoAporte.custoTotalPago,
                jurosTotal: resultadoAporte.totalJuros,
            },
            economiaTotal: resultadoPadrao.custoTotalPago - resultadoAporte.custoTotalPago,
        },
        detalhesFgts: {
            proponentes: dadosFamiliares.proponentes,
            totalUsadoEntrada: fgtsNaEntrada,
            totalAmortizadoBienal: resultadoAporte.fgtsAmortizadoTotal,
        },
        valorizacao: {
            valorOriginal: dadosDeEntrada.valorImovel,
            valorFinalEstimado: valorFinalEstimado,
            ganhoEstimado: valorFinalEstimado - dadosDeEntrada.valorImovel,
        },
        fluxoDeCaixaCompleto: resultadoAporte.parcelas,
    };

    // 3. Combinar tudo em um único objeto
    const dadosCompletos = {
        timestamp: new Date().toISOString(),
        dadosDeEntrada: dadosDeEntrada,
        resultados: dadosDeSaida,
    };

    // 4. Criar e baixar o arquivo JSON
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dadosCompletos, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "simulacao_financiamento.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
};
