function notify(e, message) {
    // e.preventDefault(); // Removed to allow link navigation

    // Add haptic feedback
    if (navigator.vibrate) {
        navigator.vibrate(50);
    }

    const toast = document.getElementById('toast');
    toast.innerText = message;
    toast.classList.add('active');

    setTimeout(() => {
        toast.classList.remove('active');
    }, 3000);
}

function updateStatus() {
    const badge = document.getElementById('status-badge');
    const now = new Date();
    const day = now.getDay(); // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
    const hour = now.getHours();

    // Segunda (1) a Sábado (6)
    const isDayValid = day >= 1 && day <= 6;
    // Das 06:00 às 22:00 (10 PM)
    // < 22 significa até 21:59
    const isTimeValid = hour >= 6 && hour < 22;

    if (isDayValid && isTimeValid) {
        badge.innerText = "Online";
        badge.style.display = "block"; // Ou o display original do CSS (provavelmente inline-block ou block)
    } else {
        badge.style.display = "none";
    }
}

// Executa quando a página carrega
window.addEventListener('load', updateStatus);
// Atualiza a cada minuto para garantir (caso a pessoa deixe a aba aberta)
setInterval(updateStatus, 60000);
