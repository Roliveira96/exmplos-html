// calculations.js

const calcularDadosFamiliares = () => {
    let rendaTotal = 0;
    let fgtsAcumuladoTotal = 0;
    let fgtsMensalFuturoTotal = 0;
    let todosElegiveisFgtsEntrada = true;
    let algumElegivelFgtsFuturo = false;
    const proponentesDetalhes = [];

    const integrantes = document.querySelectorAll('#integrantesContainer > div');
    if (integrantes.length === 0) {
        return { rendaTotal: 0, fgtsAcumuladoTotal: 0, fgtsBienal: 0, todosElegiveisFgtsEntrada: false, algumElegivelFgtsFuturo: false, proponentes: [] };
    }

    integrantes.forEach(div => {
        const id = div.dataset.id;
        const nomeInput = div.querySelector('.integrante-nome');
        const salarioBrutoInput = div.querySelector('.integrante-salario');
        const fgtsAcumuladoInput = div.querySelector('.integrante-fgts-acumulado');
        const tem3AnosFgtsCheckbox = div.querySelector('.integrante-fgts-3anos');
        const usarFgtsFuturoCheckbox = div.querySelector('.integrante-usar-fgts-futuro');

        const nome = nomeInput ? nomeInput.value.trim() : `Proponente ${id}`;
        const salarioBruto = salarioBrutoInput ? unmaskMoeda(salarioBrutoInput.value) : 0;
        const fgtsAcumulado = fgtsAcumuladoInput ? unmaskMoeda(fgtsAcumuladoInput.value) : 0;
        const tem3AnosFgts = tem3AnosFgtsCheckbox ? tem3AnosFgtsCheckbox.checked : false;
        const usarFgtsFuturo = usarFgtsFuturoCheckbox ? usarFgtsFuturoCheckbox.checked : false;

        rendaTotal += salarioBruto;
        fgtsAcumuladoTotal += fgtsAcumulado;

        if (!tem3AnosFgts) {
            todosElegiveisFgtsEntrada = false;
        }

        let fgtsBienalIndividual = 0;
        if (tem3AnosFgts && usarFgtsFuturo) {
            fgtsBienalIndividual = (salarioBruto * 0.08) * 24;
            fgtsMensalFuturoTotal += salarioBruto * 0.08;
            algumElegivelFgtsFuturo = true;
        }

        proponentesDetalhes.push({
            id: id,
            nome: nome,
            salarioBruto: salarioBruto,
            fgtsAcumulado: fgtsAcumulado,
            tem3AnosFgts: tem3AnosFgts,
            usarFgtsFuturo: usarFgtsFuturo,
            fgtsBienalIndividual: fgtsBienalIndividual
        });
    });

    if (!todosElegiveisFgtsEntrada) {
        fgtsAcumuladoTotal = 0;
    }

    return {
        rendaTotal: rendaTotal,
        fgtsAcumuladoTotal: fgtsAcumuladoTotal,
        fgtsBienal: algumElegivelFgtsFuturo ? fgtsMensalFuturoTotal * 24 : 0,
        todosElegiveisFgtsEntrada: todosElegiveisFgtsEntrada,
        algumElegivelFgtsFuturo: algumElegivelFgtsFuturo,
        proponentes: proponentesDetalhes
    };
};

const definirLinhaCreditoSugerida = (rendaTotal, elegivelFgts) => {
    if (elegivelFgts && rendaTotal <= (TAXAS.PRO_COTISTA?.tetoRenda || 0)) return 'PRO_COTISTA';
    if (rendaTotal <= TAXAS.MCMV_FAIXA3.tetoRenda) return 'MCMV_FAIXA3';
    if (rendaTotal <= TAXAS.MCMV_FAIXA4.tetoRenda) return 'MCMV_FAIXA4';
    if (TAXAS.SBPE_POUPANCA) return 'SBPE_POUPANCA';
    return 'SBPE_BALCAO';
};

const preAtualizarDados = () => {
    if (!isInitialized) return;

    const dadosFamiliares = calcularDadosFamiliares();
    const valorImovel = unmaskMoeda(document.getElementById('valorImovel').value);
    const usarFgtsEntradaCheckbox = document.getElementById('usarFgtsEntrada');
    const forcarTaxaBalcao = document.getElementById('forcarTaxaBalcao').checked;

    document.getElementById('rendaFamiliarDisplay').textContent = formatarMoeda(dadosFamiliares.rendaTotal);

    const fgtsAcumuladoDisplay = document.getElementById('fgtsAcumuladoTotalDisplay');
    const entradaFgtsDisponivelDisplay = document.getElementById('entradaFgtsDisponivelDisplay');
    const avisoFgts = document.getElementById('avisoFgtsElegibilidade');

    fgtsAcumuladoDisplay.textContent = formatarMoeda(dadosFamiliares.fgtsAcumuladoTotal);

    if (!dadosFamiliares.todosElegiveisFgtsEntrada) {
        avisoFgts.classList.remove('hidden');
        usarFgtsEntradaCheckbox.disabled = true;
        usarFgtsEntradaCheckbox.checked = false;
        entradaFgtsDisponivelDisplay.textContent = formatarMoeda(0);
    } else {
        avisoFgts.classList.add('hidden');
        usarFgtsEntradaCheckbox.disabled = false;
        entradaFgtsDisponivelDisplay.textContent = usarFgtsEntradaCheckbox.checked ? formatarMoeda(dadosFamiliares.fgtsAcumuladoTotal) : formatarMoeda(0);
    }

    const linhaSugeridaKey = definirLinhaCreditoSugerida(dadosFamiliares.rendaTotal, dadosFamiliares.todosElegiveisFgtsEntrada);
    const selectFinanciamento = document.getElementById('tipoFinanciamento');
    let linhaFinalKey = forcarTaxaBalcao ? 'SBPE_BALCAO' : linhaSugeridaKey;
    const valorAtualSelect = selectFinanciamento.value;

    selectFinanciamento.innerHTML = '';
    let temOpcaoValidaSelecionada = false;

    Object.keys(TAXAS).forEach(key => {
        const taxa = TAXAS[key];
        if (!taxa) return;

        const option = document.createElement('option');
        option.value = taxa.taxa;
        option.id = key;
        let isEligible = dadosFamiliares.rendaTotal <= taxa.tetoRenda || taxa.tetoRenda === Infinity;
        let motivoInelegibilidade = '';

        if (taxa.requerFgts && !dadosFamiliares.todosElegiveisFgtsEntrada) {
            isEligible = false;
            motivoInelegibilidade = ' - Requer FGTS';
        }
        if (dadosFamiliares.rendaTotal > taxa.tetoRenda && taxa.tetoRenda !== Infinity) {
            isEligible = false;
            motivoInelegibilidade = ' - Renda excede';
        }
        const flagIpca = taxa.ipca ? ' (IPCA + Tx Fixa)' : '';

        option.textContent = `${taxa.nome}${flagIpca} (${(taxa.taxa * 100).toFixed(2)}% a.a.)`;

        if (!isEligible) {
            option.disabled = true;
            option.classList.add('ineligible');
            option.textContent += motivoInelegibilidade;
        }
        if (key === linhaFinalKey && isEligible) {
            option.selected = true;
            temOpcaoValidaSelecionada = true;
        }

        selectFinanciamento.appendChild(option);
    });

    if (!temOpcaoValidaSelecionada) {
        const primeiraElegivel = Array.from(selectFinanciamento.options).find(opt => !opt.disabled);
        if (primeiraElegivel) {
            primeiraElegivel.selected = true;
            linhaFinalKey = primeiraElegivel.id;
        } else {
            console.warn("Nenhuma linha de crédito elegível encontrada.");
            linhaFinalKey = null;
        }
    }

    selectFinanciamento.disabled = forcarTaxaBalcao;
    if (forcarTaxaBalcao) {
        const balcaoOption = selectFinanciamento.querySelector('#SBPE_BALCAO');
        if (balcaoOption) balcaoOption.selected = true;
        linhaFinalKey = 'SBPE_BALCAO';
    }

    const linhaFinalSelecionada = linhaFinalKey ? TAXAS[linhaFinalKey] : null;
    const cotaAtual = linhaFinalSelecionada ? (linhaFinalSelecionada.cota || COTA_FINANCIAMENTO_PADRAO) : COTA_FINANCIAMENTO_PADRAO;
    let entradaMinima = valorImovel * (1 - cotaAtual);

    if (dadosFamiliares.rendaTotal > 0) {
        const maxParcela = dadosFamiliares.rendaTotal * 0.30;
        const taxaAnual = linhaFinalSelecionada ? linhaFinalSelecionada.taxa : TAXAS.SBPE_BALCAO.taxa;
        const taxaMensal = taxaAnual / 12;

        const valorFinanciadoMax = maxParcela * (1 - Math.pow(1 + taxaMensal, -PRAZO_MESES)) / taxaMensal;
        const valorFinanciadoPelaCota = valorImovel * cotaAtual;

        if (valorFinanciadoPelaCota > valorFinanciadoMax) {
            entradaMinima = valorImovel - valorFinanciadoMax;
        }
    }

    document.getElementById('entradaMinimaDisplay').textContent = formatarMoeda(entradaMinima);

    const entradaDinheiroFinalInput = document.getElementById('entradaDinheiroFinal');
    if (entradaDinheiroFinalInput.value === '0,00' || entradaDinheiroFinalInput.value === '') {
        const fgtsParaEntrada = usarFgtsEntradaCheckbox.checked && dadosFamiliares.todosElegiveisFgtsEntrada ? dadosFamiliares.fgtsAcumuladoTotal : 0;
        const entradaNecessariaDinheiro = Math.max(0, entradaMinima - fgtsParaEntrada);
        entradaDinheiroFinalInput.value = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(entradaNecessariaDinheiro);
    }

    verificarEntradaMinima();
    verificarSelecaoIneligivel();
};

const calcularAmortizacao = (valorFinanciado, taxaAnual, prazoMeses, aporteTipo, aporteValorMensal, aporteRendimentoAnual, fgtsBienal, proponentes, ativarAporte, objetivoAporte) => {
    if (valorFinanciado <= 0 || prazoMeses <= 0 || taxaAnual < 0) {
        return { tempoMeses: 0, totalJuros: 0, parcelaInicial: 0, parcelas: [], custoTotalPago: 0, fgtsAmortizadoTotal: 0 };
    }

    const algumElegivelFgtsFuturo = proponentes.some(p => p.tem3AnosFgts && p.usarFgtsFuturo);

    if (!ativarAporte) {
        aporteValorMensal = 0;
        fgtsBienal = 0;
    }

    let saldoDevedor = valorFinanciado;
    const taxaMensalFinanciamento = taxaAnual / 12;
    const taxaMensalRendimentoAporte = aporteRendimentoAnual / 12;
    let amortizacaoFixa = valorFinanciado / prazoMeses;
    let totalJuros = 0;
    let fgtsAmortizadoTotal = 0;
    let parcelas = [];
    let mes = 0;
    let acumuladoAporteAnual = 0;

    while (saldoDevedor > 0.01 && mes < 1000) {
        mes++;

        const jurosDoMes = saldoDevedor * taxaMensalFinanciamento;
        const parcelaProgramada = amortizacaoFixa + jurosDoMes + SEGUROS_MENSAIS;

        let aporteExtraDoMes = 0;
        let aporteBienalAplicado = 0;
        if (ativarAporte) {
            if (aporteTipo === 'mensal') {
                aporteExtraDoMes = aporteValorMensal;
            } else if (aporteTipo === 'anual') {
                acumuladoAporteAnual = (acumuladoAporteAnual + aporteValorMensal) * (1 + taxaMensalRendimentoAporte);
                if (mes % 12 === 0) {
                    aporteExtraDoMes = acumuladoAporteAnual;
                    acumuladoAporteAnual = 0;
                }
            }

            if (mes > 0 && mes % 24 === 0 && algumElegivelFgtsFuturo) {
                const fgtsDoAporte = fgtsBienal;
                aporteExtraDoMes += fgtsDoAporte;
                aporteBienalAplicado = fgtsDoAporte;
                fgtsAmortizadoTotal += fgtsDoAporte;
            }
        }

        const parcelaTotalPaga = parcelaProgramada + aporteExtraDoMes;
        let totalAmortizadoNoMes = amortizacaoFixa + aporteExtraDoMes;
        totalAmortizadoNoMes = Math.min(totalAmortizadoNoMes, saldoDevedor);

        const novoSaldo = Math.max(0, saldoDevedor - totalAmortizadoNoMes);
        totalJuros += jurosDoMes;

        parcelas.push({
            mes: mes,
            saldoDevedor: saldoDevedor,
            juros: jurosDoMes,
            amortizacao: amortizacaoFixa,
            parcela: parcelaProgramada,
            parcelaTotalPaga: parcelaTotalPaga,
            amortizacaoTotal: totalAmortizadoNoMes,
            aporteAplicado: aporteExtraDoMes,
            aporteBienal: aporteBienalAplicado,
            novoSaldo: novoSaldo,
        });

        saldoDevedor = novoSaldo;
        if (saldoDevedor <= 0.01) {
            saldoDevedor = 0;
            if (parcelas.length > 0) { parcelas[parcelas.length - 1].novoSaldo = 0; }
            break;
        }

        if (objetivoAporte === 'parcela' && aporteExtraDoMes > 0) {
            const mesesRestantes = prazoMeses - mes;
            if (mesesRestantes > 0) {
                amortizacaoFixa = saldoDevedor / mesesRestantes;
            } else {
                amortizacaoFixa = saldoDevedor;
            }
        }
    }
    const custoTotalReal = valorFinanciado + totalJuros + (SEGUROS_MENSAIS * mes);

    return {
        tempoMeses: mes,
        totalJuros: totalJuros,
        parcelaInicial: parcelas.length > 0 ? parcelas[0].parcela : 0,
        parcelas: parcelas,
        custoTotalPago: custoTotalReal,
        fgtsAmortizadoTotal: fgtsAmortizadoTotal
    };
};

const calcularSimulacaoCompleta = () => {
    const elementosDOM = buscarElementosDOM();
    if (!elementosDOM) return;

    const valorImovel = unmaskMoeda(elementosDOM.valorImovel.value);
    const entradaDinheiroFinal = unmaskMoeda(elementosDOM.entradaDinheiroFinal.value);
    const ativarAporte = elementosDOM.ativarAporte.checked;
    const aporteTipo = elementosDOM.aporteTipoMensal.checked ? 'mensal' : 'anual';
    const aporteValorMensal = unmaskMoeda(elementosDOM.aporteValorMensal.value);
    const aporteRendimentoAnual = unmaskPercent(elementosDOM.aporteRendimentoAnual.value);
    const pretendeAlugar = elementosDOM.pretendeAlugar.checked;
    const valorAluguel = unmaskMoeda(elementosDOM.valorAluguel.value);
    const taxaAnual = parseFloat(elementosDOM.tipoFinanciamento.value);
    const usarFgtsEntrada = document.getElementById('usarFgtsEntrada').checked;
    const taxaAumentoAluguel = unmaskPercent(document.getElementById('taxaAumentoAluguelInput').value);
    const taxaValorizacaoImovel = unmaskPercent(document.getElementById('taxaValorizacaoImovel').value);
    const objetivoAporte = document.querySelector('input[name="objetivoAporte"]:checked').value;

    const dadosFamiliares = calcularDadosFamiliares();
    const fgtsNaEntrada = usarFgtsEntrada && dadosFamiliares.todosElegiveisFgtsEntrada ? dadosFamiliares.fgtsAcumuladoTotal : 0;
    const entradaTotalFinal = entradaDinheiroFinal + fgtsNaEntrada;
    const entradaMinima = unmaskMoeda(elementosDOM.entradaMinimaDisplay.textContent);

    if (entradaTotalFinal < entradaMinima - 0.01) {
        console.error('A entrada total final (Dinheiro + FGTS) é menor que a entrada mínima exigida. Ajuste o valor.');
        elementosDOM.avisoEntradaInsuficiente.classList.remove('hidden');
        return;
    } else {
        elementosDOM.avisoEntradaInsuficiente.classList.add('hidden');
    }

    const valorFinanciado = Math.max(0, valorImovel - entradaTotalFinal);
    elementosDOM.valorFinanciadoDisplay.textContent = formatarMoeda(valorFinanciado);

    const avisoFgtsBienal = document.getElementById('avisoFgtsBienal');
    if (!dadosFamiliares.algumElegivelFgtsFuturo && ativarAporte) {
        avisoFgtsBienal.classList.remove('hidden');
    } else {
        avisoFgtsBienal.classList.add('hidden');
    }


    if (valorFinanciado <= 0) {
        console.warn('Entrada cobre o valor do imóvel. Não há financiamento a calcular.');
        limparResultados(elementosDOM);
        return;
    }

    const resultadoPadrao = calcularAmortizacao(valorFinanciado, taxaAnual, PRAZO_MESES, 'mensal', 0, 0, 0, [], false, 'prazo');
    const resultadoAporte = calcularAmortizacao(valorFinanciado, taxaAnual, PRAZO_MESES, aporteTipo, aporteValorMensal, aporteRendimentoAnual, dadosFamiliares.fgtsBienal, dadosFamiliares.proponentes, ativarAporte, objetivoAporte);

    elementosDOM.tempoPadrao.textContent = formatarAnosMeses(resultadoPadrao.tempoMeses);
    elementosDOM.custoTotalPadrao.textContent = formatarMoeda(resultadoPadrao.custoTotalPago);
    elementosDOM.jurosPadrao.textContent = formatarMoeda(resultadoPadrao.totalJuros);
    elementosDOM.tempoAporte.textContent = formatarAnosMeses(resultadoAporte.tempoMeses);
    elementosDOM.custoTotalAporte.textContent = formatarMoeda(resultadoAporte.custoTotalPago);
    elementosDOM.jurosAporte.textContent = formatarMoeda(resultadoAporte.totalJuros);
    const economiaTotalValor = resultadoPadrao.custoTotalPago - resultadoAporte.custoTotalPago;
    elementosDOM.economiaTotal.textContent = formatarMoeda(economiaTotalValor);

    const parcelaInicialValor = resultadoAporte.parcelas.length > 0 ? resultadoAporte.parcelas[0].parcelaTotalPaga : 0;
    elementosDOM.parcelaInicialDisplay.textContent = formatarMoeda(parcelaInicialValor);

    const statusAprovacao = document.getElementById('statusAprovacao');
    const statusAprovacaoMensagem = document.getElementById('statusAprovacaoMensagem');
    const maxParcela = dadosFamiliares.rendaTotal * 0.30;

    if (parcelaInicialValor > maxParcela) {
        statusAprovacao.classList.remove('hidden', 'bg-green-100');
        statusAprovacao.classList.add('bg-red-100');
        statusAprovacaoMensagem.textContent = 'Reprovado (parcela excede 30% da renda)';
    } else {
        statusAprovacao.classList.remove('hidden', 'bg-red-100');
        statusAprovacao.classList.add('bg-green-100');
        statusAprovacaoMensagem.textContent = 'Aprovado';
    }

    const colunasAluguel = document.querySelectorAll('[data-coluna-aluguel]');
    colunasAluguel.forEach(col => col.style.display = pretendeAlugar ? '' : 'none');

    renderizarTabelaFluxoCaixa(elementosDOM.tabelaCorpo, resultadoAporte.parcelas, valorAluguel, taxaAumentoAluguel, pretendeAlugar);

    renderizarDetalheFgts(dadosFamiliares.proponentes, usarFgtsEntrada, ativarAporte, resultadoAporte.fgtsAmortizadoTotal);

    const tempoQuitacaoAnos = resultadoAporte.tempoMeses / 12;
    const valorFinalEstimado = valorImovel * Math.pow((1 + taxaValorizacaoImovel), tempoQuitacaoAnos);
    const ganhoValorizacao = valorFinalEstimado - valorImovel;

    elementosDOM.valorOriginalImovel.textContent = formatarMoeda(valorImovel);
    elementosDOM.tempoQuitacaoValorizacao.textContent = formatarAnosMeses(resultadoAporte.tempoMeses);
    elementosDOM.taxaValorizacaoUsada.textContent = `${(taxaValorizacaoImovel * 100).toFixed(2)}%`.replace('.', ',');
    elementosDOM.valorFinalEstimadoImovel.textContent = formatarMoeda(valorFinalEstimado);
    elementosDOM.ganhoValorizacaoEstimado.textContent = formatarMoeda(ganhoValorizacao);
};
