(function () {
    if (document.getElementById('vwk-home-btn')) return;

    const a = document.createElement('a');
    a.id = 'vwk-home-btn';
    a.href = '/VibewithKids/';
    a.innerHTML = '← Vibe with Kids';
    a.setAttribute('aria-label', 'Back to Vibe with Kids home');
    document.body.appendChild(a);
})();
