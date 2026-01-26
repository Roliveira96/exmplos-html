document.addEventListener('DOMContentLoaded', () => {
    const confirmedList = document.getElementById('confirmed-list');
    const declinedList = document.getElementById('declined-list');

    function loadLists() {
        const responses = JSON.parse(localStorage.getItem('presence_responses')) || [];

        // Clear current lists
        confirmedList.innerHTML = '';
        declinedList.innerHTML = '';

        responses.forEach(response => {
            const li = document.createElement('li');
            li.textContent = `Código: ${response.code}`;

            if (response.status === 'confirmed') {
                confirmedList.appendChild(li);
            } else if (response.status === 'declined') {
                declinedList.appendChild(li);
            }
        });
    }

    loadLists();

    // Optional: Auto-refresh every few seconds to see updates in real-time if testing with two windows
    // setInterval(loadLists, 5000);
});
