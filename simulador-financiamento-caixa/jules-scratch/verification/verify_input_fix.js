const { chromium } = require('playwright');
const assert = require('assert');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto('http://localhost:8080');

  // Aguarda a inicialização completa da aplicação
  await page.waitForFunction(() => document.getElementById('cidade')?.value === 'GUARAPUAVA');

  // 1. Verifica se o input de aporte está desabilitado inicialmente
  const aporteInput = await page.locator('#aporteValorMensal');
  let isDisabled = await aporteInput.isDisabled();
  assert.strictEqual(isDisabled, true, 'ERRO: O input de aporte deveria estar desabilitado no início.');
  console.log('OK: Input de aporte está desabilitado inicialmente.');

  // 2. Ativa a seção de aporte e verifica se o input é habilitado
  await page.check('#ativarAporte');
  isDisabled = await aporteInput.isDisabled();
  assert.strictEqual(isDisabled, false, 'ERRO: O input de aporte deveria estar habilitado após ativar a opção.');
  console.log('OK: Input de aporte foi habilitado corretamente.');

  // 3. Desativa a seção de aporte e verifica se o input é desabilitado novamente
  await page.uncheck('#ativarAporte');
  isDisabled = await aporteInput.isDisabled();
  assert.strictEqual(isDisabled, true, 'ERRO: O input de aporte deveria ser desabilitado novamente.');
  console.log('OK: Input de aporte foi desabilitado corretamente.');

  // Tira um screenshot para verificação final
  await page.screenshot({ path: 'jules-scratch/verification/verification.png' });
  console.log('Screenshot de verificação salvo em jules-scratch/verification/verification.png');

  await browser.close();
})();
