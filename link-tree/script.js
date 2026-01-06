function notify(e, message) {
    e.preventDefault();
    const toast = document.getElementById('toast');
    toast.innerText = message;
    toast.classList.add('active');

    setTimeout(() => {
        toast.classList.remove('active');
    }, 3000);
}
