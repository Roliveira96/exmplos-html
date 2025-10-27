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

  test('should correctly calculate amortization and cash flow with independent "Aporte" and "Aluguel" values', async ({ page }) => {
    // Adiciona um proponente com dados de exemplo
    await page.locator('.integrante-salario').fill('10.000,00');

    // Ativa e preenche o Aporte
    await page.check('#ativarAporte');
    await page.locator('#aporteValorMensal').fill('500,00');

    // Ativa e preenche o Aluguel
    await page.check('#pretendeAlugar');
    await page.locator('#valorAluguel').fill('1.200,00');

    // Clica no botão para calcular a simulação
    await page.click('button:has-text("Calcular Simulação Completa")');

    // Aguarda a renderização dos resultados
    await page.waitForSelector('#parcelaInicialDisplay:not(:has-text("R$ 0,00"))');
    await page.waitForSelector('#tabelaAmortizacaoBody tr:first-child td:nth-child(2)');

    // Verifica o fluxo de caixa (Lucro/Prejuízo)
    const unmaskTest = (value) => {
        const cleaned = value.replace(/[R$\s.]/g, '').replace(',', '.');
        return parseFloat(cleaned) || 0;
    };

    const primeiraParcelaTabela = await page.locator('#tabelaAmortizacaoBody tr:first-child td:nth-child(2)').innerText();
    const valorPrimeiraParcelaTabela = unmaskTest(primeiraParcelaTabela);

    const aluguelTabela = await page.locator('#tabelaAmortizacaoBody tr:first-child td:nth-child(4)').innerText();
    const valorAluguelTabela = unmaskTest(aluguelTabela);

    const lucroPrejuizo = await page.locator('[data-testid="fluxo-caixa"]').first().innerText();
    const valorLucroPrejuizo = unmaskTest(lucroPrejuizo);

    expect(valorLucroPrejuizo).toBeCloseTo(valorAluguelTabela - valorPrimeiraParcelaTabela, 2);
  });

  test('should correctly calculate and display the investment comparison', async ({ page }) => {
    // Adiciona um proponente com dados de exemplo
    await page.locator('.integrante-salario').fill('8.000,00');

    // Define a taxa CDI
    await page.locator('#taxaCDI').fill('12,00');

    // Clica no botão para calcular a simulação
    await page.click('button:has-text("Calcular Simulação Completa")');

    // Aguarda a renderização dos resultados
    await page.waitForSelector('#valorAcumuladoCDI:not(:has-text("R$ 0,00"))');

    // Verifica se os valores são calculados e exibidos
    const valorImovelComValorizacao = await page.locator('#valorImovelComValorizacao').innerText();
    const valorAcumuladoCDI = await page.locator('#valorAcumuladoCDI').innerText();

    expect(valorImovelComValorizacao).not.toEqual('R$ 0,00');
    expect(valorAcumuladoCDI).not.toEqual('R$ 0,00');
  });
});
