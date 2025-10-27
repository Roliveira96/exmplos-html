const { test, expect } = require('@playwright/test');

test.describe('Simulador de Financiamento Caixa', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080');
    // Aguarda a inicialização completa da aplicação
    await page.waitForFunction(() => document.getElementById('cidade')?.value === 'GUARAPUAVA');
  });

  test('should display the correct initial installment value', async ({ page }) => {
    // Adiciona um proponente com dados de exemplo
    await page.locator('.integrante-salario').fill('5.000,00');

    // Aguarda o campo de entrada ser preenchido automaticamente
    await expect(page.locator('#entradaDinheiroFinal')).not.toHaveValue('0,00');

    // Clica no botão para calcular a simulação
    await page.click('button:has-text("Calcular Simulação Completa")');

    // Aguarda a renderização dos resultados
    await page.waitForSelector('#parcelaInicialDisplay:not(:has-text("R$ 0,00"))');
    await page.waitForSelector('#tabelaAmortizacaoBody tr:first-child td:nth-child(2)');

    // Extrai o valor da "Parcela Inicial" do card de resumo
    const parcelaInicialCard = await page.locator('#parcelaInicialDisplay').innerText();

    // Extrai o valor da primeira parcela da tabela de amortização
    const primeiraParcelaTabela = await page.locator('#tabelaAmortizacaoBody tr:first-child td:nth-child(2)').innerText();

    // Compara os dois valores
    expect(parcelaInicialCard).toEqual(primeiraParcelaTabela);
  });
});
