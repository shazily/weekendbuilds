export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { text, author } = req.body || {};
    if (!text || typeof text !== 'string' || text.trim().length < 10) {
        return res.status(400).json({ error: 'Prompt must be at least 10 characters' });
    }
    if (text.length > 500) {
        return res.status(400).json({ error: 'Prompt too long (max 500 chars)' });
    }

    const payload = {
        text: text.trim(),
        author: (author || 'Anonymous').trim().slice(0, 60),
        submittedAt: new Date().toISOString()
    };

    const token = process.env.GITHUB_TOKEN;
    if (token) {
        try {
            const issueRes = await fetch('https://api.github.com/repos/shazily/weekendbuilds/issues', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/vnd.github+json',
                    'Content-Type': 'application/json',
                    'User-Agent': 'weekendbuilds-vwk'
                },
                body: JSON.stringify({
                    title: `[Prompt] ${payload.text.slice(0, 72)}${payload.text.length > 72 ? '…' : ''}`,
                    body: `**Submitted by:** ${payload.author}\n**Date:** ${payload.submittedAt}\n\n---\n\n${payload.text}`,
                    labels: ['prompt-submission']
                })
            });

            if (issueRes.ok) {
                const issue = await issueRes.json();
                return res.status(200).json({ ok: true, stored: 'github', issueUrl: issue.html_url });
            }
        } catch (e) {
            console.error('GitHub issue failed:', e);
        }
    }

    return res.status(200).json({ ok: true, stored: 'pending', message: 'Received — will appear after review' });
}
