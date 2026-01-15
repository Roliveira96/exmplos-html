function notify(e, message) {
    // Add haptic feedback
    if (navigator.vibrate) {
        navigator.vibrate(50);
    }
}

function updateStatus() {
    const badge = document.getElementById('status-badge');
    if (!badge) return;

    const now = new Date();
    const day = now.getDay(); // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
    const hour = now.getHours();

    // Segunda (1) a Sábado (6)
    const isDayValid = day >= 1 && day <= 6;
    // Das 06:00 às 22:00 (10 PM)
    const isTimeValid = hour >= 6 && hour < 22;

    if (isDayValid && isTimeValid) {
        badge.style.display = "block";
    } else {
        badge.style.display = "none";
    }
}

// Executa quando a página carrega
// Executa assim que o DOM estiver pronto (mais rápido que 'load')
document.addEventListener('DOMContentLoaded', updateStatus);
// Atualiza a cada minuto
setInterval(updateStatus, 60000);


