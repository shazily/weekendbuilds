const REPO = 'shazily/weekendbuilds';
const BRANCH = 'main';

export async function githubGetFile(path, token) {
    const res = await fetch(
        `https://api.github.com/repos/${REPO}/contents/${path}?ref=${BRANCH}`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/vnd.github+json',
                'User-Agent': 'weekendbuilds-vwk'
            }
        }
    );
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`GitHub GET ${path}: ${res.status}`);
    const data = await res.json();
    const content = Buffer.from(data.content, 'base64').toString('utf8');
    return { content, sha: data.sha };
}

export async function githubPutFile(path, content, sha, token, message) {
    const res = await fetch(`https://api.github.com/repos/${REPO}/contents/${path}`, {
        method: 'PUT',
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github+json',
            'Content-Type': 'application/json',
            'User-Agent': 'weekendbuilds-vwk'
        },
        body: JSON.stringify({
            message,
            content: Buffer.from(content, 'utf8').toString('base64'),
            ...(sha ? { sha } : {}),
            branch: BRANCH
        })
    });
    if (!res.ok) {
        const err = await res.text();
        throw new Error(`GitHub PUT ${path}: ${res.status} ${err}`);
    }
    return res.json();
}

export async function appendCommunitySubmission(entry, token) {
    const path = 'VibewithKids/community-submissions.json';
    const existing = await githubGetFile(path, token);
    const data = existing ? JSON.parse(existing.content) : { submissions: [] };
    data.submissions = data.submissions || [];
    data.submissions.unshift(entry);
    await githubPutFile(
        path,
        JSON.stringify(data, null, 2) + '\n',
        existing?.sha,
        token,
        `Add community submission from ${entry.author}`
    );
}

export async function appendSubmissionCsv(entry, token) {
    const path = 'data/submissions.csv';
    const existing = await githubGetFile(path, token);
    const esc = (v) => `"${String(v || '').replace(/"/g, '""')}"`;
    const line = [
        entry.id,
        esc(entry.name),
        esc(entry.category),
        esc(entry.author),
        esc(entry.text),
        entry.submittedAt,
        entry.approved ? 'true' : 'false'
    ].join(',');
    const header = 'id,name,category,author,text,submittedAt,approved';
    const content = existing
        ? `${existing.content.trim()}\n${line}\n`
        : `${header}\n${line}\n`;
    await githubPutFile(path, content, existing?.sha, token, `Log submission ${entry.id}`);
}
