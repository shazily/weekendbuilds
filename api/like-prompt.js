export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const id = (req.query.id || req.body?.id || '').replace(/[^a-zA-Z0-9-_]/g, '');
    if (!id) return res.status(400).json({ error: 'Missing prompt id' });

    const namespace = 'weekendbuilds-vwk';
    const base = 'https://api.countapi.xyz';

    try {
        if (req.method === 'GET') {
            const r = await fetch(`${base}/get/${namespace}/${id}`);
            const data = await r.json();
            return res.status(200).json({ id, count: data.value ?? 0 });
        }

        if (req.method === 'POST') {
            const r = await fetch(`${base}/hit/${namespace}/${id}`);
            const data = await r.json();
            return res.status(200).json({ id, count: data.value ?? 0 });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (e) {
        console.error('CountAPI error:', e);
        return res.status(502).json({ error: 'Like service unavailable' });
    }
}
