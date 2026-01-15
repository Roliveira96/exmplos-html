/**
 * Matrix Easter Egg - Red Pill or Blue Pill
 */

const matrixQuotes = [
    "TRINITY: O sinal está limpo? ... Você gosta dele, não gosta?",
    "CYPHER: Não seja ridícula. Só queremos as informações.",
    "NEO: De novo aquela sensação... de não saber se estou acordado ou sonhando.",
    "TRINITY: A Matrix tem você...",
    "TRINITY: Siga o coelho branco.",
    "AGENT SMITH: Sr. Anderson... Parece que você tem vivido duas vidas.",
    "AGENT SMITH: Uma delas tem futuro. A outra não.",
    "MORPHEUS: Eu imagino que, agora, você se sinta um pouco como a Alice. Caindo pela toca do coelho.",
    "MORPHEUS: A Matrix está em todo lugar. É o mundo que foi colocado diante dos seus olhos para cegá-lo da verdade.",
    "NEO: Que verdade?",
    "MORPHEUS: Que você é um escravo, Neo.",
    "MORPHEUS: Você toma a pílula azul... a história acaba, você acorda em sua cama e acredita no que quiser.",
    "MORPHEUS: Você toma a pílula vermelha... você fica no País das Maravilhas, e eu mostro quão fundo vai a toca do coelho.",
    "MORPHEUS: Bem-vindo ao mundo real.",
    "NEO: Por que meus olhos doem?",
    "MORPHEUS: Porque você nunca os usou.",
    "MORPHEUS: O que é 'real'? Se você fala do que pode sentir, cheirar, provar e ver, então 'real' são apenas sinais elétricos interpretados pelo seu cérebro.",
    "NEO: Eu sei Kung Fu.",
    "MORPHEUS: Mostre-me.",
    "MORPHEUS: Pare de tentar me bater e me bata!",
    "MORPHEUS: Você acha que é ar que está respirando agora?",
    "CYPHER: Sabe, eu sei que este bife não existe. Eu sei que quando coloco na boca, a Matrix diz ao meu cérebro que é suculento e delicioso.",
    "CYPHER: Depois de nove anos, sabe o que eu percebi? A ignorância é uma bênção.",
    "MOUSE: A mulher de vermelho. Eu que desenhei ela... Se quiser, posso arranjar um encontro.",
    "ORÁCULO: Eu diria para se sentar, mas você não vai fazer isso. E não se preocupe com o vaso.",
    "NEO: Que vaso? [CRASH]",
    "ORÁCULO: Aquele vaso.",
    "ORÁCULO: O que vai fritar sua mente mais tarde é: será que você o teria quebrado se eu não tivesse dito nada?",
    "MENINO: Não tente dobrar a colher. Isso é impossível. Apenas tente perceber a verdade: Não existe colher.",
    "ORÁCULO: Ser o Escolhido é como estar apaixonado. Ninguém pode te dizer que você está. Você apenas sabe.",
    "AGENT SMITH: Eu odeio este lugar. Este zoológico. Esta prisão. Eu preciso sair daqui.",
    "AGENT SMITH: Seres humanos são uma doença. Um câncer neste planeta. E nós somos a cura.",
    "TANK: O que você precisa? Além de um milagre.",
    "NEO: Armas. Muitas armas.",
    "TRINITY: Neo, ninguém nunca fez isso antes.",
    "NEO: É por isso que vai dar certo.",
    "TRINITY: Desvie disto.",
    "MORPHEUS: Ele está começando a acreditar.",
    "AGENT SMITH: Você ouve isso, Sr. Anderson? É o som da inevabilidade. É o som da sua morte.",
    "NEO: Meu nome... é Neo.",
    "TRINITY: Neo, eu não tenho medo mais. O Oráculo me disse que eu me apaixonaria e que o homem que eu amasse seria o Escolhido.",
    "TRINITY: Então você não pode estar morto. Porque eu amo você.",
    "NEO: Eu sei que vocês estão com medo... medo de nós. Medo da mudança.",
    "NEO: Eu não conheço o futuro. Não vim aqui dizer como isso vai acabar. Vim dizer como vai começar.",
    "NEO: Vou desligar o telefone e mostrar a essas pessoas o que vocês não querem que elas vejam.",
    "NEO: Um mundo sem regras e controles, sem fronteiras ou limites. Um mundo onde tudo é possível."
];

const lowcodeQuotes = [
    "Iniciando wizard de criação de CRUD...",
    "Arrastando componente 'Button' para a tela...",
    "Configurando cor primária via dropdown...",
    "ERRO: Limite de blocos atingido no plano gratuito.",
    "Gerando código ilegível de 45.000 linhas...",
    "LOWCODE LIFE: Menos código, mais dor de cabeça nas customizações.",
    "Pílula Azul escolhida: Você acredita que é um desenvolvedor foda usando apenas o mouse.",
    "Acordando na sua cama... sonhando com Bubble e Webflow."
];

async function runMatrixTypewriter(phrases, color = "#00FF41") {
    console.clear();
    for (const phrase of phrases) {
        console.log("%c" + phrase, `color: ${color}; font-family: monospace; font-size: 14px; font-weight: bold; text-shadow: 0px 0px 5px #003300;`);
        await new Promise(r => setTimeout(r, 4000));
    }
}

function showPillModal() {
    // Create Modal Structure
    const modal = document.createElement('div');
    modal.id = 'pill-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.95);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        font-family: 'Space Grotesk', sans-serif;
        color: white;
        text-align: center;
        animation: fadeIn 1s forwards;
    `;

    modal.innerHTML = `
        <h2 class="text-3xl font-bold mb-12 tracking-tighter" style="text-shadow: 0 0 20px rgba(255,255,255,0.5)">
            Esta é a sua última chance. Depois disso, não há volta.
        </h2>
        <div style="display: flex; gap: 80px; align-items: center;">
            <!-- Blue Pill -->
            <div id="blue-pill" style="cursor: pointer; transition: transform 0.3s; display: flex; flex-direction: column; align-items: center;">
                <div style="width: 100px; height: 40px; background: #2563eb; border-radius: 20px; box-shadow: 0 0 30px #2563eb; margin-bottom: 20px;"></div>
                <span style="color: #60a5fa; font-weight: bold; letter-spacing: 2px;">LOWCODING LIFE</span>
            </div>

            <!-- Red Pill -->
            <div id="red-pill" style="cursor: pointer; transition: transform 0.3s; display: flex; flex-direction: column; align-items: center;">
                <div style="width: 100px; height: 40px; background: #dc2626; border-radius: 20px; box-shadow: 0 0 30px #dc2626; margin-bottom: 20px;"></div>
                <span style="color: #ef4444; font-weight: bold; letter-spacing: 2px;">THE MATRIX</span>
            </div>
        </div>
        <p style="margin-top: 60px; color: #475569; font-size: 0.9rem; max-width: 400px;">
            "Você toma a pílula azul... a história termina. Você toma a pílula vermelha... você fica no País das Maravilhas."
        </p>
    `;

    document.body.appendChild(modal);

    const blue = modal.querySelector('#blue-pill');
    const red = modal.querySelector('#red-pill');

    const hoverStyle = (el) => {
        el.onmouseenter = () => el.style.transform = 'scale(1.2)';
        el.onmouseleave = () => el.style.transform = 'scale(1)';
    };
    hoverStyle(blue);
    hoverStyle(red);

    blue.onclick = () => {
        modal.style.opacity = '0';
        setTimeout(() => {
            modal.remove();
            runMatrixTypewriter(lowcodeQuotes, "#3b82f6");
            // Add a funny visual filter for lowcoding
            document.body.style.filter = 'sepia(0.5) contrast(0.8)';
            setTimeout(() => document.body.style.filter = '', 30000);
        }, 1000);
    };

    red.onclick = () => {
        modal.style.opacity = '0';
        setTimeout(() => {
            modal.remove();
            runMatrixTypewriter(matrixQuotes, "#00FF41");
            // Add Matrix rain effect class if we wanted, but console is enough for now
            console.log("%cWake up, Neo...", "color: #00FF41; font-size: 30px; font-weight: bold;");
        }, 1000);
    };
}

// Initialize Trigger - Exposed to console only
window.chooseYourPill = () => {
    console.log("%cIniciando Protocolo de Escolha...", "color: #10b981; font-weight: bold;");
    showPillModal();
};

// Remove any visual hints or click listeners
document.addEventListener('DOMContentLoaded', () => {
    const rabbit = document.querySelector('.rabbit-mover');
    if (rabbit) {
        rabbit.style.cursor = 'default';
        rabbit.title = "";
    }

    // Optional: Keep the subtle console hint but make it about the function
    console.log("%cWake up, Neo... (Type window.chooseYourPill() to see how deep the rabbit hole goes)", "color: #0dbc79; font-size: 10px; font-family: monospace;");
});
