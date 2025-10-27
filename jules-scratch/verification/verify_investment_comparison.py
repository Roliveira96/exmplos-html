from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto('http://localhost:8080')

        # Aguarda a inicialização completa da aplicação
        page.wait_for_function("document.getElementById('cidade')?.value === 'GUARAPUAVA'")

        # Adiciona um proponente com dados de exemplo
        page.locator('.integrante-salario').fill('8.000,00')

        # Define a taxa CDI
        page.locator('#taxaCDI').fill('12,00')

        # Clica no botão para calcular a simulação
        page.click('button:has-text("Calcular Simulação Completa")')

        # Aguarda a renderização dos resultados
        page.wait_for_selector('#valorAcumuladoCDI:not(:has-text("R$ 0,00"))')

        page.screenshot(path='jules-scratch/verification/verification.png')
        browser.close()

run()
