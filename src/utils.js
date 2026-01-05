export function printPos(pos) {
    return "(" + pos?.x.toFixed(0) + " " + pos?.y.toFixed(0) + " " + pos?.z.toFixed(0) + ")";
}

export function showTemporaryMessage(text) {
    let message = document.getElementById('temporary-message');
    if (message) {
        message.remove();
    }
    message = document.createElement('div');
    message.id = 'temporary-message';
    message.textContent = text;
    document.body.appendChild(message);
    setTimeout(() => {
        message.classList.add('hidden');
        setTimeout(() => message.remove(), 500);
    }, 2000);
}