const REPO = 'shazily/weekendbuilds';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const id = (req.query.id || req.body?.id || '').replace(/[^a-zA-Z0-9-_]/g, '');
    if (!id || !id.startsWith('sub-')) {
        return res.status(400).json({ error: 'Missing or invalid idea id' });
    }

    const token = process.env.GH_PAT || process.env.GITHUB_TOKEN;
    if (!token) {
        return res.status(503).json({ error: 'Like service unavailable' });
    }

    try {
        const gh = await fetch(`https://api.github.com/repos/${REPO}/dispatches`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/vnd.github+json',
                'Content-Type': 'application/json',
                'User-Agent': 'weekendbuilds-vwk'
            },
            body: JSON.stringify({
                event_type: 'community-like',
                client_payload: { id }
            })
        });

        if (!gh.ok) {
            console.error('community-like dispatch failed:', gh.status, await gh.text());
            return res.status(503).json({ error: 'Like service unavailable' });
        }

        return res.status(200).json({ ok: true, id });
    } catch (e) {
        console.error('like-idea error:', e);
        return res.status(503).json({ error: 'Like service unavailable' });
    }
}
