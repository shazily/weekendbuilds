import {
    appendCommunitySubmission,
    appendSubmissionCsv
} from './github-store.js';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { text, author, childSafe } = req.body || {};
    if (!text || typeof text !== 'string' || text.trim().length < 10) {
        return res.status(400).json({ error: 'Please write at least 10 characters.' });
    }
    if (text.length > 500) {
        return res.status(400).json({ error: 'Please keep your idea under 500 characters.' });
    }
    if (!childSafe) {
        return res.status(400).json({ error: 'Please confirm your idea is child-safe.' });
    }

    const submission = {
        id: `sub-${Date.now()}`,
        text: text.trim(),
        author: (author || 'Anonymous').trim().slice(0, 60),
        submittedAt: new Date().toISOString(),
        approved: true
    };

    const token = process.env.GITHUB_TOKEN;
    if (token) {
        try {
            await appendSubmissionCsv(submission, token);
            await appendCommunitySubmission(submission, token);
            return res.status(200).json({
                ok: true,
                submission,
                message: 'Thanks! Your idea is live in the community list.'
            });
        } catch (e) {
            console.error('Store submission failed:', e);
        }
    }

    return res.status(503).json({
        error: 'We could not save your idea right now. Please try again in a moment.'
    });
}
