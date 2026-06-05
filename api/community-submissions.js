import { githubGetFile } from './github-store.js';

const RAW_URL =
    'https://raw.githubusercontent.com/shazily/weekendbuilds/main/VibewithKids/community-submissions.json';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Cache-Control', 'no-store');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    try {
        let data = null;

        const token = process.env.GITHUB_TOKEN;
        if (token) {
            try {
                const file = await githubGetFile('VibewithKids/community-submissions.json', token);
                if (file) data = JSON.parse(file.content);
            } catch (e) {
                console.error('GitHub read failed:', e);
            }
        }

        if (!data) {
            const r = await fetch(`${RAW_URL}?t=${Date.now()}`);
            if (r.ok) data = await r.json();
        }

        const submissions = (data?.submissions || []).filter(s => s.approved !== false);

        return res.status(200).json({ submissions });
    } catch (e) {
        console.error('community-submissions error:', e);
        return res.status(502).json({ error: 'Could not load submissions' });
    }
}
