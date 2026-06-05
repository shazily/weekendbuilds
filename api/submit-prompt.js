const REPO = 'shazily/weekendbuilds';

function normalizeCategories(body) {
    if (Array.isArray(body.categories) && body.categories.length) {
        return body.categories.map(c => String(c).trim()).filter(Boolean);
    }
    if (body.category && typeof body.category === 'string') {
        return body.category.split(',').map(c => c.trim()).filter(Boolean);
    }
    return [];
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { name, text, prompt, author, childSafe } = req.body || {};
    const categories = normalizeCategories(req.body || {});
    const type = req.body?.type === 'prompt' ? 'prompt' : 'idea';

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
        return res.status(400).json({ error: 'Please add an idea name.' });
    }
    if (name.length > 80) {
        return res.status(400).json({ error: 'Idea name is too long (max 80 characters).' });
    }
    if (!text || typeof text !== 'string' || text.trim().length < 10) {
        return res.status(400).json({ error: 'Please write at least 10 characters for the description.' });
    }
    if (text.length > 8000) {
        return res.status(400).json({ error: 'Please keep your description under 8,000 characters.' });
    }
    if (type === 'prompt') {
        if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 10) {
            return res.status(400).json({ error: 'Please write at least 10 characters for the prompt.' });
        }
        if (prompt.length > 8000) {
            return res.status(400).json({ error: 'Please keep your prompt under 8,000 characters.' });
        }
    }
    if (!categories.length) {
        return res.status(400).json({ error: 'Please pick at least one category.' });
    }
    if (categories.join(', ').length > 120) {
        return res.status(400).json({ error: 'Categories are too long combined (max 120 characters).' });
    }
    if (!author || typeof author !== 'string' || !author.trim()) {
        return res.status(400).json({ error: 'Please add your name.' });
    }
    if (!childSafe) {
        return res.status(400).json({ error: 'Please confirm your idea is child-safe.' });
    }

    const token = process.env.GH_PAT || process.env.GITHUB_TOKEN;
    if (!token) {
        console.error('submit-prompt: GH_PAT not set on Vercel project');
        return res.status(503).json({
            error: 'We could not save your idea right now. Please try again in a moment.'
        });
    }

    const submission = {
        id: `sub-${Date.now()}`,
        type,
        name: name.trim(),
        text: text.trim(),
        categories,
        category: categories.join(', '),
        author: author.trim().slice(0, 60),
        submittedAt: new Date().toISOString(),
        approved: true,
        likes: 0
    };
    if (type === 'prompt') {
        submission.prompt = prompt.trim();
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
                event_type: 'community-submission',
                client_payload: { data: JSON.stringify(submission) }
            })
        });

        if (!gh.ok) {
            const err = await gh.text();
            console.error('repository_dispatch failed:', gh.status, err);
            return res.status(503).json({
                error: 'We could not save your idea right now. Please try again in a moment.'
            });
        }

        return res.status(200).json({
            ok: true,
            submission,
            message: 'Thanks! Your idea is saved — it usually appears within a minute.'
        });
    } catch (e) {
        console.error('submit-prompt error:', e);
        return res.status(503).json({
            error: 'We could not save your idea right now. Please try again in a moment.'
        });
    }
}
