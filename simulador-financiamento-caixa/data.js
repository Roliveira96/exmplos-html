// data.js

const PRAZO_MESES = 420;
const COTA_FINANCIAMENTO_PADRAO = 0.80;
const TAXAS = {
    MCMV_FAIXA1: {nome: 'MCMV Faixa 1 (Renda até R$ 2.850)', taxa: 0.045, tetoRenda: 2850, cota: 0.80},
    MCMV_FAIXA2: {nome: 'MCMV Faixa 2 (Renda até R$ 4.700)', taxa: 0.070, tetoRenda: 4700, cota: 0.80},
    MCMV_FAIXA3: {nome: 'MCMV Faixa 3 (Renda até R$ 8.600)', taxa: 0.0816, tetoRenda: 8600, cota: 0.80},
    MCMV_FAIXA4: {nome: 'MCMV Faixa 4 (Renda até R$ 12.000)', taxa: 0.105, tetoRenda: 12000, cota: 0.80},
    PRO_COTISTA: {
        nome: 'Pró-Cotista FGTS (Renda até R$ 12.000)',
        taxa: 0.0901,
        tetoRenda: 12000,
        cota: 0.80,
        requerFgts: true
    },
    SBPE_TR: {nome: 'SBPE TR (Renda Livre)', taxa: 0.1099, tetoRenda: Infinity, cota: 0.80},
    SBPE_POUPANCA: {nome: 'SBPE Poupança+TR (Renda Livre)', taxa: 0.1023, tetoRenda: Infinity, cota: 0.80}
};
const SEGUROS_MENSAIS = 50.00;

let integranteId = 0;
let isInitialized = false;