const urlParams = new URLSearchParams(window.location.search);
const error = urlParams.get('error');
if (error) {
    const el = document.getElementById('error-msg');
    el.textContent = error;
    el.classList.remove('hidden');
}
