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
