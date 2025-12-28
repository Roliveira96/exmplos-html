from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        page.goto('http://localhost:8080')
        page.wait_for_function("document.getElementById('cidade')?.value === 'GUARAPUAVA'")

        # Preenche os dados para a simulação
        page.locator('.integrante-salario').fill('8.000,00')
        page.locator('#valorImovel').fill('350.000,00')

        # Calcula a simulação
        page.locator('button:has-text("Calcular Simulação Completa")').click()

        # Aguarda os resultados e a renderização do gráfico
        page.wait_for_selector('#valorAcumuladoCDI:not(:has-text("R$ 0,00"))')
        page.wait_for_selector('#graficoComparativo')

        # Adiciona uma pequena espera para garantir que a animação do gráfico termine
        page.wait_for_timeout(1000)

        # Tira o screenshot da área do gráfico
        chart_area = page.locator('#graficoComparativo')
        chart_area.screenshot(path="jules-scratch/verification/verification.png")

    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
