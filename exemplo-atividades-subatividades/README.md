# Regras de Negócio e Migração: Seleção de Times e Usuários

Este documento detalha as especificações e regras de fluxo de dados necessárias para migrar o protótipo de atribuição de times e membros do planejador de atividades para o ambiente de produção.

---

## 1. Estrutura de Atribuição no Card de Atividades

### Posição e Layout
- O elemento de atribuição (avatar) deve ser posicionado **imediatamente antes do título da atividade**, após os ícones de arrasto e nível.
- **Estado Padrão**: Exibe apenas o ícone do Time (ex: `💻`, `🎨`) ou as iniciais do Usuário (ex: `AS`, `BS`).
- **Estado de Hover**: O elemento de atribuição deve expandir horizontalmente de forma suave (via transição CSS de `max-width`), revelando o nome completo do time ou do usuário.

### Cores e Identidade Visual
- Cada Time possui uma cor de destaque correspondente (accent color).
- Os avatares de **Times** usam a cor do time correspondente no fundo e na borda.
- Os avatares de **Usuários** utilizam a cor do time ao qual pertencem. Se o Usuário "Bruno Souza" pertence ao time "Desenvolvimento" (verde), seu avatar deve ter bordas e fundo verdes.

---

## 2. Dados de Mockup do Sistema

### Times (Equipes)
Cada time possui um identificador, nome, ícone representativo e paleta de cores CSS:
- **Desenvolvimento**: Ícone `💻`, Cor `#10b981` (Verde)
- **Design UX/UI**: Ícone `🎨`, Cor `#6366f1` (Indigo/Roxo)
- **Suporte técnico**: Ícone `🛠️`, Cor `#0ea5e9` (Azul Claro)
- **Gerenciamento**: Ícone `📋`, Cor `#f59e0b` (Laranja)
- **Sem equipe**: Ícone `👥`, Cor `#64748b` (Cinza)

### Usuários
Cada usuário possui um nome, iniciais para o avatar e a chave de relacionamento do seu time correspondente:
- **Ana Silva**: Time `Design UX/UI`, Iniciais `AS`
- **Bruno Souza**: Time `Desenvolvimento`, Iniciais `BS`
- **Carlos Santos**: Time `Desenvolvimento`, Iniciais `CS`
- **Daniel Rocha**: Time `Suporte técnico`, Iniciais `DR`
- **Elisa Costa**: Time `Gerenciamento`, Iniciais `EC`

---

## 3. Comportamento do Popover de Seleção

Ao clicar no avatar de atribuição no card, deve abrir um menu suspenso (popover) com as seguintes características:

### Abas (Tabs)
1. **Aba Times**:
   - Lista todos os times cadastrados com seus respectivos ícones e cores.
   - Mostra um indicador (Check) se o time atual for o atribuído.
2. **Aba Usuários**:
   - Lista todos os usuários.
   - **Exibição de Foto**: Exibe uma foto/avatar do usuário (simulado via API de avatar dinâmico) ao lado de seu nome.
   - **Cor de Fundo da Linha**: O background de cada linha (botão) de usuário na listagem assume a cor de fundo do seu time (`teamInfo.bg` e `teamInfo.border`), tornando a listagem colorida e visualmente categorizada.
   - **Hover de Equipe (Tooltip)**: Ao manter o mouse sobre o item de um usuário na lista, exibe-se um tooltip (atributo `title` do HTML) indicando o time a que ele pertence (ex: `Equipe: Desenvolvimento`).
   - Mostra um indicador (Check) se o usuário atual for o atribuído.

### Barra de Pesquisa (Filtro Misto)
- Um input de busca posicionado no topo do popover.
- Ao digitar qualquer caractere, a visualização de abas é suspensa temporariamente, exibindo uma **lista mista**:
  - Seção **Times**: Mostra os times cujo nome contenha o termo pesquisado.
  - Seção **Usuários**: Mostra os usuários cujo nome contenha o termo pesquisado.
- Se a pesquisa for limpa, o popover retorna à aba ativa anteriormente.

---

## 4. Cores Dinâmicas do Card (Background e Borda)

Para facilitar a identificação visual rápida no fluxo de trabalho:

### Cor de Fundo (Baseada no Time)
O card de cada atividade assume como cor de fundo a cor sutil (`bg` de opacidade reduzida a `12%`) correspondente ao time atribuído:
- **Desenvolvimento**: `rgba(16, 185, 129, 0.12)` (Verde)
- **Design UX/UI**: `rgba(99, 102, 241, 0.12)` (Indigo/Roxo)
- **Suporte técnico**: `rgba(14, 165, 233, 0.12)` (Azul Claro)
- **Gerenciamento**: `rgba(245, 158, 11, 0.12)` (Laranja)
- **Sem equipe**: `rgba(100, 116, 139, 0.12)` (Cinza)

> [!NOTE]
> Se a atividade for atribuída a um usuário individual, ela herdará a cor de fundo correspondente ao time ao qual esse usuário pertence.

### Cor do Indicador Lateral da Frente (Baseado na Prioridade)
A barra vertical de destaque localizada na frente (borda esquerda) do card reflete o nível de prioridade definido para a atividade:
- **Nenhuma prioridade** (ou sem valor definido): Cinza (`#475569`)
- **Baixa**: Verde (`#10b981`)
- **Média**: Azul (`#3b82f6`)
- **Alta**: Amarela (`#eab308`)
- **Urgente (Crítica)**: Vermelha (`#ef4444`)

---

## 5. Estrutura de Dados da Atividade (JSON Schema)

Para suportar essa especificação em produção, o objeto da atividade deve ser atualizado para comportar tanto times quanto usuários como responsáveis:

```json
{
  "id": "act-1",
  "title": "Planejar Arquitetura",
  "assignee": {
    "type": "team",
    "name": "Desenvolvimento"
  }
}
```
ou
```json
{
  "id": "act-1",
  "title": "Planejar Arquitetura",
  "assignee": {
    "type": "user",
    "name": "Ana Silva"
  }
}
```

---

## 6. Regras para o Backend / Produção
1. **Integridade de Chaves**: Caso um usuário seja removido ou troque de time no banco de dados, o sistema deve atualizar o relacionamento de cores no card do planejador de forma dinâmica.
2. **Atribuição Múltipla**: No futuro, o campo `assignee` pode ser alterado para um array para suportar múltiplos responsáveis no mesmo card.
