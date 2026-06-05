(function () {
    const projects = {};
    let ready = false;
    let activeSlug = null;

    const MODAL_HTML = `<div id="nerd-modal" class="nerd-modal" aria-hidden="true">
        <div class="nerd-modal-backdrop" data-close-nerd></div>
        <div class="nerd-modal-panel" role="dialog" aria-modal="true" aria-labelledby="nerd-modal-title">
            <div class="nerd-modal-accent" id="nerd-modal-accent"></div>
            <button type="button" class="nerd-modal-close" aria-label="Close">&times;</button>
            <div class="nerd-modal-header">
                <div class="nerd-modal-kicker">Nerd info</div>
                <div class="nerd-modal-title" id="nerd-modal-title"></div>
                <div class="nerd-modal-sub" id="nerd-modal-sub"></div>
                <div class="nerd-modal-tags" id="nerd-modal-tags"></div>
            </div>
            <div class="nerd-modal-body-wrap" id="nerd-modal-body-wrap">
                <section class="nerd-section">
                    <h3>What it's for</h3>
                    <p id="nerd-modal-uses"></p>
                </section>
                <section class="nerd-section">
                    <h3>Libraries</h3>
                    <div class="nerd-lib-list" id="nerd-modal-libraries"></div>
                    <div class="nerd-stack" id="nerd-modal-stack"></div>
                </section>
                <section class="nerd-section">
                    <h3>Build your own</h3>
                    <p id="nerd-modal-prompt-hint"></p>
                    <div class="nerd-prompt-box" id="nerd-modal-prompt"></div>
                </section>
            </div>
            <div class="nerd-modal-footer">
                <button type="button" class="nerd-modal-copy" id="nerd-modal-copy">Copy starter prompt</button>
                <a class="nerd-modal-dl" id="nerd-modal-download" href="#" download>Download .html</a>
            </div>
        </div>
    </div>`;

    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    async function copyText(text) {
        if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(text);
            return;
        }
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(ta);
        if (!ok) throw new Error('copy failed');
    }

    function ensureModal() {
        if (!document.getElementById('nerd-modal')) {
            document.body.insertAdjacentHTML('beforeend', MODAL_HTML);
        }
    }

    function close() {
        const modal = document.getElementById('nerd-modal');
        if (!modal) return;
        modal.classList.remove('open');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        activeSlug = null;
    }

    function open(slug) {
        init();
        const p = projects[slug];
        if (!p?.nerdInfo) return;
        activeSlug = slug;
        const info = p.nerdInfo;
        const modal = document.getElementById('nerd-modal');
        const accent = p.accent || '#7c3aed';
        document.getElementById('nerd-modal-accent').style.background =
            `linear-gradient(90deg, ${accent}, #00d2ff)`;
        document.getElementById('nerd-modal-title').textContent = p.title || '';
        document.getElementById('nerd-modal-sub').textContent =
            [p.subtitle, p.category].filter(Boolean).join(' · ');
        let tags = p.category ? `<span class="tag">${escapeHtml(p.category)}</span>` : '';
        if (p.desktopOnly) tags += '<span class="tag meta">Desktop + webcam</span>';
        document.getElementById('nerd-modal-tags').innerHTML = tags;
        document.getElementById('nerd-modal-uses').textContent = info.uses || '';
        document.getElementById('nerd-modal-libraries').innerHTML = (info.libraries || [])
            .map(lib => `<div class="nerd-lib-item">
                <div class="nerd-lib-name">${escapeHtml(lib.name)}</div>
                <div class="nerd-lib-detail">${escapeHtml(lib.detail || '')}</div>
            </div>`).join('');
        document.getElementById('nerd-modal-stack').innerHTML = (info.stack || [])
            .map(s => `<span>${escapeHtml(s)}</span>`).join('');
        document.getElementById('nerd-modal-prompt-hint').textContent = info.promptHint || '';
        document.getElementById('nerd-modal-prompt').textContent = info.buildPrompt || '';
        const dl = document.getElementById('nerd-modal-download');
        dl.href = `${VWK.siteRoot()}${p.file || p.slug + '.html'}`;
        dl.style.display = p.file ? '' : 'none';
        document.getElementById('nerd-modal-copy').style.display = info.buildPrompt ? '' : 'none';
        modal.classList.add('open');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        document.getElementById('nerd-modal-body-wrap')?.scrollTo(0, 0);
    }

    function init() {
        if (ready) return;
        ready = true;
        ensureModal();
        const modal = document.getElementById('nerd-modal');
        modal.querySelector('.nerd-modal-close')?.addEventListener('click', close);
        modal.querySelector('[data-close-nerd]')?.addEventListener('click', close);
        modal.querySelector('.nerd-modal-panel')?.addEventListener('click', e => e.stopPropagation());
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape' && modal.classList.contains('open')) close();
        });
        document.getElementById('nerd-modal-copy')?.addEventListener('click', async () => {
            const p = activeSlug ? projects[activeSlug] : null;
            const text = p?.nerdInfo?.buildPrompt || '';
            if (!text) return;
            const btn = document.getElementById('nerd-modal-copy');
            try {
                await copyText(text);
                btn.classList.add('copied');
                const prev = btn.textContent;
                btn.textContent = 'Copied!';
                setTimeout(() => {
                    btn.classList.remove('copied');
                    btn.textContent = prev;
                }, 2000);
            } catch {
                btn.textContent = 'Copy failed';
                setTimeout(() => { btn.textContent = 'Copy starter prompt'; }, 2000);
            }
        });
    }

    window.vwkNerdInfo = {
        register(list) {
            (list || []).forEach(p => { if (p.slug) projects[p.slug] = p; });
        },
        open,
        close,
        init,
        bind(container) {
            init();
            (container || document).querySelectorAll('.nerd-info-btn[data-slug]').forEach(btn => {
                if (btn.dataset.nerdBound) return;
                btn.dataset.nerdBound = '1';
                btn.addEventListener('click', e => {
                    e.preventDefault();
                    e.stopPropagation();
                    open(btn.dataset.slug);
                });
            });
        },
        escapeHtml
    };
})();
