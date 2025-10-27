// geolocation.js

/**
 * Variável global CIDADES_BRASIL declarada no main.js será preenchida aqui.
 * É necessário que 'let CIDADES_BRASIL = {};' esteja no escopo global do main.js.
 */

/**
 * Carrega o arquivo JSON estático de estados e cidades e preenche a variável global CIDADES_BRASIL.
 * @returns {Promise<object>} O objeto CIDADES_BRASIL carregado.
 */
const carregarDadosEstaticos = async () => {
    try {
        const response = await fetch('./estados-cidades.json');
        if (!response.ok) {
            throw new Error(`Erro ao carregar estados-cidades.json. Status: ${response.status}`);
        }
        const data = await response.json();

        window.CIDADES_BRASIL = data;

        return window.CIDADES_BRASIL;
    } catch (error) {
        console.error("Erro fatal ao carregar dados estáticos:", error);
        alert('Erro ao carregar a lista de estados e cidades. O simulador não pode ser iniciado. Verifique o arquivo estados-cidades.json.');

        window.CIDADES_BRASIL = {
            "PR": { "nome": "Paraná", "cidades": ["Guarapuava"] },
            "SP": { "nome": "São Paulo", "cidades": ["São Paulo"] }
        };
        return window.CIDADES_BRASIL;
    }
};
