document.addEventListener('DOMContentLoaded', () => {
    const codeInput = document.getElementById('code-input');
    const enterBtn = document.getElementById('enter-btn');
    const modal = document.getElementById('invite-modal');
    const confirmBtn = document.getElementById('confirm-btn');
    const declineBtn = document.getElementById('decline-btn');
    const currentCodeSpan = document.getElementById('current-code');

    let currentCode = '';

    enterBtn.addEventListener('click', () => {
        const code = codeInput.value.trim();
        if (code) {
            currentCode = code;
            currentCodeSpan.textContent = code;
            modal.classList.add('active');
        } else {
            alert('Por favor, digite um código.');
        }
    });

    // Close modal if clicking outside content
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });

    confirmBtn.addEventListener('click', () => {
        saveResponse(currentCode, 'confirmed');
        modal.classList.remove('active');
        alert(`Presença confirmada para o código: ${currentCode}`);
        codeInput.value = '';
    });

    declineBtn.addEventListener('click', () => {
        saveResponse(currentCode, 'declined');
        modal.classList.remove('active');
        alert(`Convite recusado para o código: ${currentCode}`);
        codeInput.value = '';
    });

    function saveResponse(code, status) {
        const responses = JSON.parse(localStorage.getItem('presence_responses')) || [];
        
        // Remove previous response for this code if exists
        const filtered = responses.filter(r => r.code !== code);
        
        filtered.push({
            code: code,
            status: status,
            timestamp: new Date().toISOString()
        });

        localStorage.setItem('presence_responses', JSON.stringify(filtered));
    }
});
