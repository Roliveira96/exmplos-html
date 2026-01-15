# Guia de Instalação Segura na Hostinger (Node.js)

Este guia descreve como colocar seu currículo e o servidor proxy (que protege sua chave da ElevenLabs) no ar usando a funcionalidade de **Node.js** da Hostinger.

## Pré-requisitos
- Plano de Hospedagem na Hostinger que suporte Node.js (Planos comuns "Premium" ou "Business" geralmente suportam).
- Acesso ao hPanel.

---

## Passo 1: Preparar os arquivos
Localmente, em seu computador:
1. Certifique-se de que a pasta `node_modules` e o arquivo `.env` **NÃO** estejam incluídos se você for fazer upload bruto (vamos configurar as chaves de forma segura no painel).
2. Selecione os seguintes arquivos/pastas e crie um arquivo **ZIP**:
   - `public/` (pasta com o site)
   - `package.json`
   - `server.js`
   
   *Não incluir a pasta `curriculo`, apenas o conteúdo dela.*

## Passo 2: Criar Aplicação Node.js na Hostinger
1. Faça login no **hPanel** da Hostinger.
2. Vá em **Sites** > Selecione seu domínio > **Gerenciar**.
3. Na barra lateral ou busca, procure por **Avançado** > **Aplicativo Node.js**.
4. Clique em **Criar Nova Aplicação**:
   - **Versão do Node.js:** Escolha a versão mais recente recomendada (ex: 18 ou 20).
   - **Modo da Aplicação:** `Production`.
   - **Raiz da Aplicação:** Digite o nome da pasta onde os arquivos ficarão (ex: `curriculo-app`).
   - **URL da Aplicação:** Deixe em branco para usar a raiz do domínio, ou digite uma subrota (ex: `curriculo`).
   - **Arquivo de Inicialização:** Digite `server.js`.
5. Clique em **Criar**.

## Passo 3: Upload dos Arquivos
1. Após criar, a aplicação aparecerá na lista. Clique no botão de **Gerenciador de Arquivos** (ou abra o Gerenciador de Arquivos separadamente).
2. Navegue até a pasta que você definiu como Raiz (ex: `domains/seudominio.com/public_html/curriculo-app` ou apenas `curriculo-app` na raiz se não for public_html).
3. **Apague** quaisquer arquivos de exemplo que a Hostinger tenha criado lá.
4. **Faça Upload** do seu arquivo ZIP e extraia o conteúdo lá dentro.

## Passo 4: Instalar Dependências
1. Volte para a tela de configuração do **Aplicativo Node.js** no hPanel.
2. Você verá um botão chamado **NPM Install**. Clique nele.
   - Isso vai ler seu `package.json` e baixar as bibliotecas necessárias (Express, Cors, etc.) diretamente no servidor.

## Passo 5: Configuração Segura das Chaves (.env)
Esta é a parte mais importante para a segurança.
1. Na mesma tela de configuração do Node.js, procure por **Variáveis de Ambiente** (Environment Variables).
2. Adicione suas chaves aqui:
   - **Chave:** `ELEVENLABS_API_KEY` | **Valor:** `sua_chave_real_aqui`
   - **Chave:** `VOICE_ID` | **Valor:** `pNInz6obpgDQGcFmaJgB` (ou outro ID de sua escolha)
   - **Chave:** `PORT` | **Valor:** `3000` (ou deixe que o sistema gerencie, mas é bom definir).
3. Salve as variáveis.

## Passo 6: Iniciar e Testar
1. Clique no botão **Reiniciar** (Restart) na aplicação Node.js.
2. Acesse seu site (ex: `https://studio4you.com.br`).
3. Abra o Console do Navegador (F12) para monitorar erros.
4. Teste o botão "Ouvir minha história".

## Ajustes Finais (Se necessário)
Se o site abrir mas o CSS/JS não carregar, pode ser necessário ajustar o arquivo `.htaccess` na pasta `public_html` para garantir que todas as requisições sejam redirecionadas para o Node.js, mas a ferramenta automática da Hostinger costuma fazer isso sozinha.

Se precisar de HTTPS forçado, certifique-se de que o SSL está ativado no painel da Hostinger em **Segurança > SSL**.
