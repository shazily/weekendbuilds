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

    const { name, text, category, author, childSafe } = req.body || {};

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
        return res.status(400).json({ error: 'Please add an idea name.' });
    }
    if (name.length > 80) {
        return res.status(400).json({ error: 'Idea name is too long (max 80 characters).' });
    }
    if (!text || typeof text !== 'string' || text.trim().length < 10) {
        return res.status(400).json({ error: 'Please write at least 10 characters for the prompt and description.' });
    }
    if (text.length > 8000) {
        return res.status(400).json({ error: 'Please keep your description under 8,000 characters.' });
    }
    if (!category || typeof category !== 'string' || !category.trim()) {
        return res.status(400).json({ error: 'Please add a category.' });
    }
    if (category.length > 40) {
        return res.status(400).json({ error: 'Category is too long (max 40 characters).' });
    }
    if (!author || typeof author !== 'string' || !author.trim()) {
        return res.status(400).json({ error: 'Please add your name.' });
    }
    if (!childSafe) {
        return res.status(400).json({ error: 'Please confirm your idea is child-safe.' });
    }

    const submission = {
        id: `sub-${Date.now()}`,
        name: name.trim(),
        text: text.trim(),
        category: category.trim(),
        author: author.trim().slice(0, 60),
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
                message: 'Thanks! Your idea is live — see it under Ideas from the Community.'
            });
        } catch (e) {
            console.error('Store submission failed:', e);
        }
    }

    return res.status(503).json({
        error: 'We could not save your idea right now. Please try again in a moment.'
    });
}
