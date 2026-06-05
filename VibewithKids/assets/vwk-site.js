window.VWK = {
    labName: 'Weekend Labs',
    seriesName: 'Vibe with Kids',
    author: 'Shazily Munawar',
    coAuthor: 'Zizou',
    linkedin: 'https://www.linkedin.com/in/shazilymunawar',
    linkedinLabel: 'Shazily Munawar',

    siteRoot() {
        const match = window.location.pathname.match(/^(.*\/VibewithKids)/i);
        if (match) return `${match[1]}/`;
        const path = window.location.pathname;
        if (path.endsWith('/')) return path;
        const last = path.split('/').pop() || '';
        if (last.includes('.')) return path.substring(0, path.lastIndexOf('/') + 1);
        return `${path}/`;
    },

    basePath() {
        return this.siteRoot();
    },

    asset(path) {
        const root = this.siteRoot();
        if (path.startsWith('/')) return path;
        return `${root}${path}`;
    },

    linkedinIcon() {
        return `<svg class="li-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path fill="#0A66C2" d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 114.126 0 2.063 2.063 0 01-2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>`;
    }
};

function vwkRenderNav(active) {
    const base = VWK.siteRoot();
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
    return `<footer class="vwk-footer">
        <span>Built by Shaz and Zizou</span>
        <span>·</span>
        <a href="${VWK.linkedin}" target="_blank" rel="noopener noreferrer" aria-label="Shazily on LinkedIn">
            ${VWK.linkedinIcon()}
            ${VWK.linkedinLabel}
        </a>
        <span>·</span>
        <a href="${VWK.siteRoot()}privacy">Privacy</a>
        <span>·</span>
        <a href="${VWK.siteRoot()}terms">Terms</a>
    </footer>`;
}
