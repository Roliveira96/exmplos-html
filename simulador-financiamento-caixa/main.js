   // --- Constantes Globais ---
        const PRAZO_MESES = 420; // 35 anos
        const COTA_FINANCIAMENTO_PADRAO = 0.80; // 80%
        // Taxas aproximadas baseadas em pesquisa (Out/2025)
        const TAXAS = {
            MCMV_FAIXA3: { nome: 'MCMV Faixa 3 (Renda até R$ 8.600)', taxa: 0.0816, tetoRenda: 8600, cota: 0.80 },
            MCMV_FAIXA4: { nome: 'MCMV Classe Média (R$ 8.6k a R$ 12k)', taxa: 0.0950, tetoRenda: 12000, cota: 0.80 },
            // Pró-Cotista (exige conta FGTS ativa, recursos limitados - pode não estar sempre disponível)
            PRO_COTISTA: { nome: 'Pró-Cotista FGTS (Renda até ~R$12k*)', taxa: 0.0901, tetoRenda: 12000, cota: 0.80, requerFgts: true }, // Taxa ~9.01% + TR
            SBPE_POUPANCA: { nome: 'SBPE Poupança+TR (Renda Livre)', taxa: 0.1038, tetoRenda: Infinity, cota: 0.80 }, // Ex: Poup(6.17%) + 4.12% + TR
            SBPE_IPCA: { nome: 'SBPE IPCA+Tx Fixa (Renda Livre)', taxa: 0.0800, tetoRenda: Infinity, cota: 0.80, ipca: true }, // Ex: IPCA + 5-8% a.a. (usando 8% como exemplo)
            SBPE_BALCAO: { nome: 'SBPE TR Balcão (Renda > R$ 12k)', taxa: 0.1149, tetoRenda: Infinity, cota: 0.80 }
             // * Pró-Cotista pode ter limite de renda variável dependendo da regra anual, 12k é um valor comum. Requer FGTS.
             // SBPE IPCA: A taxa final varia MUITO com o IPCA. O 8% é apenas a parte fixa (exemplo).
        };
        const SEGUROS_MENSAIS = 50.00; // Estimativa MIP/DFI

        // Dados de Localidades (Amostra)
        const CIDADES_POR_ESTADO = {
            PR: ["Guarapuava", "Curitiba", "Londrina", "Maringá"],
            SC: ["Florianópolis", "Joinville", "Blumenau"],
            SP: ["São Paulo", "Campinas", "Guarulhos", "Santos"],
            RJ: ["Rio de Janeiro", "Niterói", "Duque de Caxias"],
            MG: ["Belo Horizonte", "Uberlândia", "Contagem"]
        };

        let integranteId = 0;
        let isInitialized = false;

        // --- Funções de Formatação e Mascara ---
        const unmaskMoeda = (valor) => {
            if (typeof valor !== 'string') return isNaN(parseFloat(valor)) ? 0 : parseFloat(valor);
            const cleaned = valor.replace(/[R$\s.]/g, '').replace(',', '.');
            return parseFloat(cleaned) || 0;
        };

        const formatarMoeda = (valor) => {
            if (isNaN(valor)) valor = 0;
            return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
        }

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
            if (isNaN(meses) || meses <= 0) return '--';
            const anos = Math.floor(meses / 12);
            const mesesRestantes = Math.round(meses % 12);
            if (mesesRestantes === 0 && anos > 0) return `${anos} a`;
            if (anos === 0) return `${mesesRestantes} m`;
            return `${anos} a ${mesesRestantes} m`;
        };

        // --- Funções de UI ---
         const atualizarCidades = () => {
            const estadoSelecionado = document.getElementById('estado').value;
            const selectCidade = document.getElementById('cidade');
            selectCidade.innerHTML = ''; // Limpa cidades anteriores

            const cidades = CIDADES_POR_ESTADO[estadoSelecionado] || [];
            cidades.forEach(cidade => {
                const option = document.createElement('option');
                option.value = cidade.toUpperCase(); // Valor em maiúsculo, se necessário
                option.textContent = cidade;
                // Pré-seleciona Guarapuava se for PR
                if (estadoSelecionado === 'PR' && cidade === 'Guarapuava') {
                    option.selected = true;
                }
                selectCidade.appendChild(option);
            });
             if (isInitialized) preAtualizarDados(); // Reavalia condições se estado/cidade mudar
        };


        const adicionarIntegrante = (nome = '', dtNasc = '', salario = 0, fgtsAcumulado = 0, tem3AnosFgts = true, usarFgtsFuturo = true) => {
            integranteId++;
            const container = document.getElementById('integrantesContainer');
            const novoIntegrante = document.createElement('div');
            novoIntegrante.id = `integrante-${integranteId}`;
            novoIntegrante.className = 'p-4 bg-white rounded-lg shadow space-y-3 border border-gray-200';

            const formattedSalario = typeof salario === 'number' ? new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(salario) : '';
            const formattedFgts = typeof fgtsAcumulado === 'number' ? new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(fgtsAcumulado) : '';

            novoIntegrante.innerHTML = `
                <div class="flex justify-between items-center">
                    <h3 class="font-semibold text-indigo-700">Proponente ${integranteId}</h3>
                    <button onclick="removerIntegrante('${novoIntegrante.id}')" class="text-red-500 hover:text-red-700 text-xs font-bold px-2 py-1 rounded hover:bg-red-50">Remover</button>
                </div>
                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="block text-xs font-medium text-gray-600">Nome:</label>
                        <input type="text" value="${nome}" placeholder="Nome Proponente" class="integrante-nome mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 text-sm border">
                    </div>
                     <div>
                        <label class="block text-xs font-medium text-gray-600">Data Nasc.:</label>
                        <input type="text" value="${dtNasc}" placeholder="DD/MM/AAAA" class="integrante-nascimento mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 text-sm border input-data" oninput="formatarDataInput(this)">
                    </div>
                </div>
                 <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="block text-xs font-medium text-gray-600">Salário Bruto Médio (R$):</label>
                        <input type="text" value="${formattedSalario}" class="integrante-salario mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 text-sm border input-moeda" oninput="formatarInputMoeda(this); preAtualizarDados()">
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-gray-600">FGTS Acumulado (R$):</label>
                        <input type="text" value="${formattedFgts}" class="integrante-fgts-acumulado mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 text-sm border input-moeda" oninput="formatarInputMoeda(this); preAtualizarDados()">
                    </div>
                 </div>
                 <div class="grid grid-cols-2 gap-3 mt-2">
                     <div class="flex items-center">
                         <input type="checkbox" id="fgts3anos-${integranteId}" ${tem3AnosFgts ? 'checked' : ''} class="integrante-fgts-3anos h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" onchange="preAtualizarDados()">
                         <label for="fgts3anos-${integranteId}" class="ml-2 block text-xs text-gray-800">Possui 3 anos trab. (FGTS)?</label>
                     </div>
                      <div class="flex items-center">
                         <input type="checkbox" id="usarFgtsFuturo-${integranteId}" ${usarFgtsFuturo ? 'checked' : ''} class="integrante-usar-fgts-futuro h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" onchange="preAtualizarDados()">
                         <label for="usarFgtsFuturo-${integranteId}" class="ml-2 block text-xs text-gray-800">Usar FGTS futuro p/ Amortizar?</label>
                     </div>
                 </div>
            `;
            container.appendChild(novoIntegrante);
            if(isInitialized) preAtualizarDados();
        };

        const removerIntegrante = (id) => {
            const el = document.getElementById(id);
            if (el) {
                el.remove();
                preAtualizarDados();
            }
        };

        // --- Funções de Cálculo Intermediário ---
        const calcularDadosFamiliares = () => {
            let rendaTotal = 0;
            let fgtsAcumuladoTotal = 0;
            let fgtsMensalFuturoTotal = 0;
            let todosElegiveisFgtsEntrada = true; // Para usar o FGTS ACUMULADO na entrada
            let algumElegivelFgtsFuturo = false; // Para usar FGTS FUTURO na amortização bienal

            const integrantes = document.querySelectorAll('#integrantesContainer > div');
             if (integrantes.length === 0) {
                 return { rendaTotal: 0, fgtsAcumuladoTotal: 0, fgtsBienal: 0, todosElegiveisFgtsEntrada: false, algumElegivelFgtsFuturo: false };
             }

            integrantes.forEach(div => {
                const salarioBrutoInput = div.querySelector('.integrante-salario');
                const fgtsAcumuladoInput = div.querySelector('.integrante-fgts-acumulado');
                const tem3AnosFgtsCheckbox = div.querySelector('.integrante-fgts-3anos');
                const usarFgtsFuturoCheckbox = div.querySelector('.integrante-usar-fgts-futuro');

                const salarioBruto = salarioBrutoInput ? unmaskMoeda(salarioBrutoInput.value) : 0;
                const fgtsAcumulado = fgtsAcumuladoInput ? unmaskMoeda(fgtsAcumuladoInput.value) : 0;
                const tem3AnosFgts = tem3AnosFgtsCheckbox ? tem3AnosFgtsCheckbox.checked : false;
                const usarFgtsFuturo = usarFgtsFuturoCheckbox ? usarFgtsFuturoCheckbox.checked : false;

                rendaTotal += salarioBruto;
                fgtsAcumuladoTotal += fgtsAcumulado;


                if (!tem3AnosFgts) {
                    todosElegiveisFgtsEntrada = false;
                }

                // Calcula FGTS futuro APENAS se o proponente for elegível E quiser usar
                if (tem3AnosFgts && usarFgtsFuturo) {
                    fgtsMensalFuturoTotal += salarioBruto * 0.08;
                    algumElegivelFgtsFuturo = true;
                }
            });

             // Zera FGTS acumulado se a família não for elegível para entrada
             if (!todosElegiveisFgtsEntrada) {
                 fgtsAcumuladoTotal = 0;
             }

            return {
                rendaTotal: rendaTotal,
                fgtsAcumuladoTotal: fgtsAcumuladoTotal,
                fgtsBienal: algumElegivelFgtsFuturo ? fgtsMensalFuturoTotal * 24 : 0,
                todosElegiveisFgtsEntrada: todosElegiveisFgtsEntrada,
                algumElegivelFgtsFuturo: algumElegivelFgtsFuturo
            };
        };

         const definirLinhaCreditoSugerida = (rendaTotal) => {
             // Prioriza Pró-Cotista se a renda permitir (simulação, pois depende de disponibilidade de recurso)
             if (rendaTotal <= (TAXAS.PRO_COTISTA?.tetoRenda || 0)) return 'PRO_COTISTA'; // Verifica se PRO_COTISTA existe
             if (rendaTotal <= TAXAS.MCMV_FAIXA3.tetoRenda) return 'MCMV_FAIXA3';
             if (rendaTotal <= TAXAS.MCMV_FAIXA4.tetoRenda) return 'MCMV_FAIXA4';
             // SBPE Poupança pode ser interessante antes do Balcão
             if (TAXAS.SBPE_POUPANCA) return 'SBPE_POUPANCA'; // Verifica se SBPE_POUPANCA existe
             return 'SBPE_BALCAO';
        };

        // --- Função de Pré-Atualização (Inputs) ---
        const preAtualizarDados = () => {
             if (!isInitialized) return;

             const dadosFamiliares = calcularDadosFamiliares();
             const valorImovel = unmaskMoeda(document.getElementById('valorImovel').value);
             const usarFgtsEntradaCheckbox = document.getElementById('usarFgtsEntrada');
             const forcarTaxaBalcao = document.getElementById('forcarTaxaBalcao').checked;

             // Atualiza Renda Familiar
             document.getElementById('rendaFamiliarDisplay').textContent = formatarMoeda(dadosFamiliares.rendaTotal);

             // Atualiza FGTS Acumulado e aviso de elegibilidade PARA ENTRADA
             const fgtsAcumuladoDisplay = document.getElementById('fgtsAcumuladoTotalDisplay');
             const entradaFgtsDisponivelDisplay = document.getElementById('entradaFgtsDisponivelDisplay');
             const avisoFgts = document.getElementById('avisoFgtsElegibilidade');

             fgtsAcumuladoDisplay.textContent = formatarMoeda(dadosFamiliares.fgtsAcumuladoTotal); // Mostra o total acumulado

             // Verifica elegibilidade para USAR FGTS NA ENTRADA
             if (!dadosFamiliares.todosElegiveisFgtsEntrada) {
                 avisoFgts.classList.remove('hidden');
                 usarFgtsEntradaCheckbox.disabled = true;
                 usarFgtsEntradaCheckbox.checked = false; // Desmarca se não elegível
                 entradaFgtsDisponivelDisplay.textContent = formatarMoeda(0); // Zera FGTS disponível para entrada
             } else {
                 avisoFgts.classList.add('hidden');
                 usarFgtsEntradaCheckbox.disabled = false;
                 // Mostra o FGTS disponível para entrada APENAS se o checkbox estiver marcado
                 entradaFgtsDisponivelDisplay.textContent = usarFgtsEntradaCheckbox.checked ? formatarMoeda(dadosFamiliares.fgtsAcumuladoTotal) : formatarMoeda(0);
             }

             // Define a linha de crédito e atualiza o select
             const linhaSugeridaKey = definirLinhaCreditoSugerida(dadosFamiliares.rendaTotal);
             const selectFinanciamento = document.getElementById('tipoFinanciamento');
             let linhaFinalKey = forcarTaxaBalcao ? 'SBPE_BALCAO' : linhaSugeridaKey;
             const valorAtualSelect = selectFinanciamento.value;

             selectFinanciamento.innerHTML = '';
             let temOpcaoValidaSelecionada = false;

             // Adiciona as opções de financiamento com faixas de renda
             Object.keys(TAXAS).forEach(key => {
                  const taxa = TAXAS[key];
                  if (!taxa) return; // Pula se a taxa não estiver definida (ex: Pró-Cotista pode não existir)

                  const option = document.createElement('option');
                  option.value = taxa.taxa;
                  option.id = key;
                  // Elegibilidade por renda E por FGTS (para Pró-Cotista)
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
                  // Adiciona flag IPCA
                  const flagIpca = taxa.ipca ? ' (IPCA + Tx Fixa)' : '';

                  option.textContent = `${taxa.nome}${flagIpca} (${(taxa.taxa * 100).toFixed(2)}% a.a.)`;

                  if (!isEligible) {
                      option.disabled = true;
                      option.classList.add('ineligible');
                      option.textContent += motivoInelegibilidade;
                  }
                  // Seleciona a opção correta
                  if (key === linhaFinalKey && isEligible) {
                      option.selected = true;
                      temOpcaoValidaSelecionada = true;
                  }

                  selectFinanciamento.appendChild(option);
             });


             // Fallback
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

             // Forçar Balcão
             selectFinanciamento.disabled = forcarTaxaBalcao;
             if (forcarTaxaBalcao) {
                 selectFinanciamento.value = TAXAS.SBPE_BALCAO.taxa;
                 linhaFinalKey = 'SBPE_BALCAO';
             }


             // Atualiza Entrada Mínima
             const linhaFinalSelecionada = linhaFinalKey ? TAXAS[linhaFinalKey] : null;
             const cotaAtual = linhaFinalSelecionada ? (linhaFinalSelecionada.cota || COTA_FINANCIAMENTO_PADRAO) : COTA_FINANCIAMENTO_PADRAO;
             const entradaMinima = valorImovel * (1 - cotaAtual);
             document.getElementById('entradaMinimaDisplay').textContent = formatarMoeda(entradaMinima);

             // Atualiza entrada em dinheiro (se vazio/zero)
             const entradaDinheiroFinalInput = document.getElementById('entradaDinheiroFinal');
             if (entradaDinheiroFinalInput.value === '0,00' || entradaDinheiroFinalInput.value === '') {
                 const fgtsParaEntrada = usarFgtsEntradaCheckbox.checked && dadosFamiliares.todosElegiveisFgtsEntrada ? dadosFamiliares.fgtsAcumuladoTotal : 0;
                 const entradaNecessariaDinheiro = Math.max(0, entradaMinima - fgtsParaEntrada);
                 entradaDinheiroFinalInput.value = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(entradaNecessariaDinheiro);
             }

             verificarEntradaMinima();
             verificarSelecaoIneligivel();
             atualizarAporteAluguelLink(); // Atualiza o link aporte=aluguel
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
            if (ativar) {
                secaoDetalhes.classList.remove('hidden');
            } else {
                secaoDetalhes.classList.add('hidden');
            }
            atualizarAporteAluguelLink(); // Reavalia o link
        };

        const toggleSecaoAluguel = () => {
            const pretendeAlugar = document.getElementById('pretendeAlugar').checked;
            const secaoDetalhes = document.getElementById('secaoAluguelDetalhes');
            const cardFluxoCaixa = document.getElementById('cardFluxoCaixa');
            if (pretendeAlugar) {
                secaoDetalhes.classList.remove('hidden');
                cardFluxoCaixa.classList.remove('hidden');
            } else {
                secaoDetalhes.classList.add('hidden');
                cardFluxoCaixa.classList.add('hidden');
            }
            atualizarAporteAluguelLink(); // Reavalia o link
        };

        const atualizarAporteAluguelLink = (foiAluguelQueMudou = false) => {
            const ativarAporte = document.getElementById('ativarAporte').checked;
            const pretendeAlugar = document.getElementById('pretendeAlugar').checked;
            const aporteInput = document.getElementById('aporteValorMensal');
            const aluguelInput = document.getElementById('valorAluguel');

            if (ativarAporte && pretendeAlugar) {
                // Se foi o aluguel que mudou, atualiza o aporte
                if (foiAluguelQueMudou) {
                    aporteInput.value = aluguelInput.value;
                    formatarInputMoeda(aporteInput); // Reformatar
                }
                aporteInput.disabled = true; // Desabilita edição direta do aporte
            } else if (ativarAporte) {
                aporteInput.disabled = false; // Habilita edição se não aluga
                 // Se o aluguel mudou mas não está ligado ao aporte, não faz nada no aporte
            } else {
                 aporteInput.disabled = true; // Desabilita se aporte não está ativo
            }
        };


        // --- Funções de Cálculo SAC e Amortização ---
        const calcularAmortizacao = (valorFinanciado, taxaAnual, prazoMeses, aporteTipo, aporteValorMensal, aporteRendimentoAnual, fgtsBienal, algumElegivelFgtsFuturo, ativarAporte) => {
             if (valorFinanciado <= 0 || prazoMeses <= 0 || taxaAnual < 0) {
                return { tempoMeses: 0, totalJuros: 0, parcelaInicial: 0, parcelas: [] };
            }
             // Zera aportes se não estiver ativo
             if (!ativarAporte) {
                 aporteValorMensal = 0;
                 fgtsBienal = 0; // Se não tem aporte, não considera FGTS bienal aqui
             }

            let saldoDevedor = valorFinanciado;
            const taxaMensalFinanciamento = taxaAnual / 12;
            const taxaMensalRendimentoAporte = aporteRendimentoAnual / 12;
            const amortizacaoFixa = valorFinanciado / prazoMeses;
            let totalJuros = 0;
            let parcelas = [];
            let mes = 0;
            let acumuladoAporteAnual = 0;

            while (saldoDevedor > 0.01 && mes < 1000) {
                mes++;

                const jurosDoMes = saldoDevedor * taxaMensalFinanciamento;
                const parcelaRequerida = amortizacaoFixa + jurosDoMes + SEGUROS_MENSAIS;

                let aporteExtraDoMes = 0;
                let aporteBienalAplicado = 0;

                // Lógica de Aporte (somente se ativo)
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

                    // Aplica FGTS bienal (só se aporte ativo E elegível)
                    if (mes > 0 && mes % 24 === 0 && algumElegivelFgtsFuturo) {
                        aporteExtraDoMes += fgtsBienal;
                        aporteBienalAplicado = fgtsBienal;
                    }
                }

                let totalAmortizado = amortizacaoFixa + aporteExtraDoMes;
                totalAmortizado = Math.min(totalAmortizado, saldoDevedor);

                // Parcela Paga = Base + Aporte Mensal (se mensal e ativo)
                const parcelaTotalPaga = parcelaRequerida + (ativarAporte && aporteTipo === 'mensal' ? aporteValorMensal : 0);

                const novoSaldo = Math.max(0, saldoDevedor - totalAmortizado);
                totalJuros += jurosDoMes;

                parcelas.push({
                    mes: mes,
                    saldoDevedor: saldoDevedor,
                    juros: jurosDoMes,
                    amortizacao: amortizacaoFixa,
                    parcela: parcelaRequerida,
                    parcelaTotalPaga: parcelaTotalPaga,
                    amortizacaoTotal: totalAmortizado,
                    aporteAplicado: aporteExtraDoMes,
                    aporteBienal: aporteBienalAplicado,
                    novoSaldo: novoSaldo,
                });

                saldoDevedor = novoSaldo;
                if (saldoDevedor <= 0.01) {
                    saldoDevedor = 0;
                    if (parcelas.length > 0) { parcelas[parcelas.length-1].novoSaldo = 0; }
                    break;
                }
            }

            return {
                tempoMeses: mes,
                totalJuros: totalJuros,
                parcelaInicial: parcelas.length > 0 ? parcelas[0].parcela : 0,
                parcelas: parcelas
            };
        };


        // --- Função Principal de Cálculo e Atualização da UI ---
        const calcularSimulacaoCompleta = () => {
             // 1. Busca Elementos do DOM
             const elementosDOM = buscarElementosDOM();
             if (!elementosDOM) return;

             // 2. Coleta Dados dos Inputs
             const valorImovel = unmaskMoeda(elementosDOM.valorImovel.value);
             const entradaDinheiroFinal = unmaskMoeda(elementosDOM.entradaDinheiroFinal.value);
             const ativarAporte = elementosDOM.ativarAporte.checked; // Verifica se o aporte está ativo
             const aporteTipo = elementosDOM.aporteTipoMensal.checked ? 'mensal' : 'anual';
             const aporteValorMensal = unmaskMoeda(elementosDOM.aporteValorMensal.value);
             const aporteRendimentoAnual = unmaskPercent(elementosDOM.aporteRendimentoAnual.value);
             const pretendeAlugar = elementosDOM.pretendeAlugar.checked;
             const valorAluguel = unmaskMoeda(elementosDOM.valorAluguel.value);
             const taxaAnual = parseFloat(elementosDOM.tipoFinanciamento.value);
             const usarFgtsEntrada = document.getElementById('usarFgtsEntrada').checked;
             const taxaAumentoAluguel = unmaskPercent(document.getElementById('taxaAumentoAluguelInput').value);

             // 3. Calcula Dados Familiares e Valida Entrada
             const { rendaTotal, fgtsAcumuladoTotal, fgtsBienal, todosElegiveisFgtsEntrada, algumElegivelFgtsFuturo } = calcularDadosFamiliares();
             const fgtsNaEntrada = usarFgtsEntrada && todosElegiveisFgtsEntrada ? fgtsAcumuladoTotal : 0;
             const entradaTotalFinal = entradaDinheiroFinal + fgtsNaEntrada;
             const entradaMinima = unmaskMoeda(elementosDOM.entradaMinimaDisplay.textContent);

             if (entradaTotalFinal < entradaMinima - 0.01) {
                 alert('A entrada total final (Dinheiro + FGTS) é menor que a entrada mínima exigida. Ajuste o valor.');
                 elementosDOM.avisoEntradaInsuficiente.classList.remove('hidden');
                 return;
             } else {
                 elementosDOM.avisoEntradaInsuficiente.classList.add('hidden');
             }

             // 4. Calcula Valor a Financiar
             const valorFinanciado = Math.max(0, valorImovel - entradaTotalFinal);
             elementosDOM.valorFinanciadoDisplay.textContent = formatarMoeda(valorFinanciado);

             // Exibe aviso sobre FGTS bienal se não for elegível ou não quiser usar
             const avisoFgtsBienal = document.getElementById('avisoFgtsBienal');
             if (!algumElegivelFgtsFuturo && ativarAporte) { // Só mostra o aviso se o aporte estiver ativo mas FGTS não
                  avisoFgtsBienal.classList.remove('hidden');
             } else {
                  avisoFgtsBienal.classList.add('hidden');
             }


             if (valorFinanciado <= 0) {
                 alert('Entrada cobre o valor do imóvel. Não há financiamento a calcular.');
                 limparResultados(elementosDOM);
                 return;
             }

             // 5. Cálculos de Amortização
             const resultadoPadrao = calcularAmortizacao(valorFinanciado, taxaAnual, PRAZO_MESES, 'mensal', 0, 0, 0, false, false); // Padrão NUNCA tem aporte nem FGTS futuro
             const resultadoAporte = calcularAmortizacao(valorFinanciado, taxaAnual, PRAZO_MESES, aporteTipo, aporteValorMensal, aporteRendimentoAnual, fgtsBienal, algumElegivelFgtsFuturo, ativarAporte); // Usa os dados reais E o flag ativarAporte

             // 6. Exibição de Resultados Principais
             elementosDOM.fgtsBienalDisplay.textContent = formatarMoeda(ativarAporte && algumElegivelFgtsFuturo ? fgtsBienal : 0); // Mostra só se aporte ativo e elegível
             elementosDOM.tempoPadrao.textContent = formatarAnosMeses(resultadoPadrao.tempoMeses);
             elementosDOM.jurosPadrao.textContent = formatarMoeda(resultadoPadrao.totalJuros);
             elementosDOM.tempoAporte.textContent = formatarAnosMeses(resultadoAporte.tempoMeses);
             elementosDOM.jurosAporte.textContent = formatarMoeda(resultadoAporte.totalJuros);
             const economiaJurosValor = resultadoPadrao.totalJuros - resultadoAporte.totalJuros;
             elementosDOM.economiaJuros.textContent = formatarMoeda(economiaJurosValor);

             const parcelaInicialValor = resultadoAporte.parcelas.length > 0 ? resultadoAporte.parcelas[0].parcela : 0;
             elementosDOM.parcelaInicialDisplay.textContent = formatarMoeda(parcelaInicialValor);

             // 7. Renderização da Tabela de Fluxo de Caixa (somente se pretende alugar)
             if (pretendeAlugar) {
                 renderizarTabelaFluxoCaixa(elementosDOM.tabelaCorpo, resultadoAporte.parcelas, valorAluguel, valorFinanciado, taxaAumentoAluguel);
             } else {
                  elementosDOM.tabelaCorpo.innerHTML = '<tr><td colspan="5" class="text-center p-4 text-gray-500">Opção de aluguel não selecionada.</td></tr>';
             }
        };

        const buscarElementosDOM = () => {
             const ids = [
                'entradaMinimaDisplay', 'entradaFgtsDisponivelDisplay', 'entradaDinheiroFinal',
                'entradaTotalFinalDisplay', 'avisoEntradaInsuficiente', 'tipoFinanciamento',
                'valorFinanciadoDisplay', 'parcelaInicialDisplay', 'fgtsBienalDisplay',
                'tempoPadrao', 'jurosPadrao', 'tempoAporte', 'jurosAporte', 'economiaJuros',
                'tabelaAmortizacao', 'valorAluguel', 'aporteValorMensal', 'aporteRendimentoAnual',
                'valorImovel', 'taxaAumentoAluguelInput', 'ativarAporte', 'aporteTipoMensal', 'pretendeAlugar' // Adicionados os checkboxes/radios
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
             elementosDOM.fgtsBienalDisplay.textContent = formatarMoeda(0);
             elementosDOM.tempoPadrao.textContent = '--';
             elementosDOM.jurosPadrao.textContent = formatarMoeda(0);
             elementosDOM.tempoAporte.textContent = '--';
             elementosDOM.jurosAporte.textContent = formatarMoeda(0);
             elementosDOM.economiaJuros.textContent = formatarMoeda(0);
             elementosDOM.tabelaCorpo.innerHTML = '<tr><td colspan="5" class="text-center p-4 text-gray-500">Financiamento não necessário.</td></tr>';
        };

         const renderizarTabelaFluxoCaixa = (tabelaCorpo, parcelasCalculadas, valorAluguelInicial, valorFinanciadoInicial, taxaAumentoAluguel) => {
             tabelaCorpo.innerHTML = '';
             if (!parcelasCalculadas || parcelasCalculadas.length === 0) {
                 tabelaCorpo.innerHTML = '<tr><td colspan="5" class="text-center p-4 text-gray-500">Erro ao calcular parcelas.</td></tr>';
                 return;
             }

             let aluguelMensalAtual = valorAluguelInicial;
             const parcelasPorAno = 12;
             let saldoDevedorFinalAno = valorFinanciadoInicial;
             const maxAnos = Math.ceil(parcelasCalculadas[parcelasCalculadas.length - 1].mes / parcelasPorAno);

             for (let ano = 1; ano <= maxAnos; ano++) {
                 // Encontra o índice da última parcela calculada *para este ano*
                 let indiceRealFinal = -1;
                 for (let i = parcelasCalculadas.length - 1; i >= 0; i--) {
                     if (Math.ceil(parcelasCalculadas[i].mes / parcelasPorAno) === ano) {
                         indiceRealFinal = i;
                         break;
                     }
                 }

                 if (indiceRealFinal === -1) {
                      if (saldoDevedorFinalAno <= 0.01) break;
                      console.warn(`Nenhuma parcela encontrada para o ano ${ano}.`);
                      continue;
                 }


                 const ultimaParcelaDoAno = parcelasCalculadas[indiceRealFinal];
                 // Parcela Paga = Parcela Base (decrescente) + Aporte Mensal (se tipo for mensal)
                 const parcelaFinalAnoPaga = ultimaParcelaDoAno.parcelaTotalPaga;
                 saldoDevedorFinalAno = ultimaParcelaDoAno.novoSaldo;


                 // Reajuste do Aluguel no início de cada novo ano (exceto ano 1)
                 if (ano > 1) {
                     aluguelMensalAtual *= (1 + taxaAumentoAluguel);
                 }

                 const fluxoCaixaMensal = aluguelMensalAtual - parcelaFinalAnoPaga;

                 const tr = document.createElement('tr');
                 tr.className = `text-xs ${fluxoCaixaMensal >= -0.01 ? 'bg-green-50 hover:bg-green-100' : 'bg-white hover:bg-gray-50'}`;

                 tr.innerHTML = `
                     <td class="px-2 py-1 text-gray-700">${ano}</td>
                     <td class="px-2 py-1 text-gray-700 text-right">${formatarMoeda(parcelaFinalAnoPaga)}</td>
                     <td class="px-2 py-1 font-semibold ${aluguelMensalAtual >= parcelaFinalAnoPaga - 0.01 ? 'text-green-700' : 'text-yellow-700'} text-right">${formatarMoeda(aluguelMensalAtual)}</td>
                     <td class="px-2 py-1 ${fluxoCaixaMensal >= -0.01 ? 'text-green-800 font-bold' : 'text-red-600'} text-right">${formatarMoeda(fluxoCaixaMensal)}</td>
                     <td class="px-2 py-1 text-gray-700 text-right">${formatarMoeda(saldoDevedorFinalAno)}</td>
                 `;
                 tabelaCorpo.appendChild(tr);

                  // Parar se quitou
                 if (saldoDevedorFinalAno <= 0.01) break;
             }
             if (tabelaCorpo.innerHTML === '') {
                 tabelaCorpo.innerHTML = '<tr><td colspan="5" class="text-center p-4 text-gray-500">Erro ao gerar tabela. Verifique os dados.</td></tr>';
             }
        }


        // --- Inicialização da Interface ---
        const inicializarSimulador = () => {
             atualizarCidades(); // Carrega cidades iniciais

            // Adiciona um proponente inicial vazio
            adicionarIntegrante('', '', 0, 0, true, true);

            document.querySelectorAll('.input-moeda').forEach(input => formatarInputMoeda(input));
             document.querySelectorAll('.input-data').forEach(input => formatarDataInput(input));
             document.querySelectorAll('.input-percent').forEach(input => formatarInputPercent(input));

            isInitialized = true;
            preAtualizarDados(); // Chama uma vez para inicializar os displays
             // Limpa a tabela e resultados iniciais
             const tabelaCorpo = document.querySelector('#tabelaAmortizacao tbody');
             if(tabelaCorpo) tabelaCorpo.innerHTML = '<tr><td colspan="5" class="text-center p-4 text-gray-500">Preencha os dados e clique em Calcular.</td></tr>';
             const resultadosIniciais = ['valorFinanciadoDisplay', 'parcelaInicialDisplay', 'tempoPadrao', 'jurosPadrao', 'tempoAporte', 'jurosAporte', 'economiaJuros', 'fgtsBienalDisplay'];
             resultadosIniciais.forEach(id => {
                 const el = document.getElementById(id);
                 if(el) {
                     if (id.includes('tempo')) el.textContent = '--';
                     else el.textContent = formatarMoeda(0);
                 }
             });
            toggleRendimentoAnual(); // Ajusta visibilidade inicial
            toggleSecaoAporte();    // Ajusta visibilidade inicial
            toggleSecaoAluguel();   // Ajusta visibilidade inicial


        };

        document.addEventListener('DOMContentLoaded', inicializarSimulador);