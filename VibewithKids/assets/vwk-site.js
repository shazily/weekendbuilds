window.VWK = {
    labName: 'Weekend Labs',
    seriesName: 'Vibe with Kids',
    author: 'Shazily Munawar',
    coAuthor: 'Zizou',
    linkedin: 'https://www.linkedin.com/in/shazilymunawar',
    linkedinLabel: 'Shazily Munawar',

    basePath() {
        const path = window.location.pathname;
        const last = path.split('/').pop() || '';
        if (path.endsWith('/')) return path;
        if (last.includes('.')) return path.substring(0, path.lastIndexOf('/') + 1);
        return `${path}/`;
    },

    asset(path) {
        const base = this.basePath();
        return path.startsWith('/') ? path : `${base}${path}`;
    }
};

function vwkRenderNav(active) {
    const base = VWK.basePath();
    const pages = [
        { id: 'home', label: 'Home', href: base },
        { id: 'about', label: 'About', href: `${base}about` },
        { id: 'ideas', label: 'Ideas', href: `${base}ideas` }
    ];
    return `<nav class="vwk-nav">
        <a class="vwk-nav-brand" href="${base}">${VWK.seriesName}</a>
        <div class="vwk-nav-links">${pages.map(p =>
            `<a href="${p.href}" class="${active === p.id ? 'active' : ''}">${p.label}</a>`
        ).join('')}</div>
    </nav>`;
}

function vwkRenderFooter() {
    const li = VWK.asset('assets/linkedin.svg');
    return `<footer class="vwk-footer">
        <span>Built by Shaz and Zizou</span>
        <span>·</span>
        <a href="${VWK.linkedin}" target="_blank" rel="noopener noreferrer" aria-label="Shazily on LinkedIn">
            <img class="li-icon" src="${li}" alt="" width="14" height="14">
            ${VWK.linkedinLabel}
        </a>
    </footer>`;
}
