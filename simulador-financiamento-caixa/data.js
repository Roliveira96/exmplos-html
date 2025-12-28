// data.js

const PRAZO_MESES = 420;
const COTA_FINANCIAMENTO_PADRAO = 0.80;
const TAXAS = {
    MCMV_FAIXA3: { nome: 'MCMV Faixa 3 (Renda até R$ 8.600)', taxa: 0.0816, tetoRenda: 8600, cota: 0.80 },
    MCMV_FAIXA4: { nome: 'MCMV Classe Média (R$ 8.6k a R$ 12k)', taxa: 0.0950, tetoRenda: 12000, cota: 0.80 },
    PRO_COTISTA: { nome: 'Pró-Cotista FGTS (Renda até ~R$12k*)', taxa: 0.0901, tetoRenda: 12000, cota: 0.80, requerFgts: true },
    SBPE_POUPANCA: { nome: 'SBPE Poupança+TR (Renda Livre)', taxa: 0.1038, tetoRenda: Infinity, cota: 0.80 },
    SBPE_IPCA: { nome: 'SBPE IPCA+Tx Fixa (Renda Livre)', taxa: 0.0800, tetoRenda: Infinity, cota: 0.80, ipca: true },
    SBPE_BALCAO: { nome: 'SBPE TR Balcão (Renda > R$ 12k)', taxa: 0.1149, tetoRenda: Infinity, cota: 0.80 }
};
const SEGUROS_MENSAIS = 50.00;

let integranteId = 0;
let isInitialized = false;
