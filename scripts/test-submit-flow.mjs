#!/usr/bin/env node
/**
 * Smoke test for idea submission API.
 * Usage:
 *   node scripts/test-submit-flow.mjs
 *   BASE_URL=http://localhost:3000 node scripts/test-submit-flow.mjs
 *   GITHUB_TOKEN=$(gh auth token) node scripts/test-submit-flow.mjs --dispatch
 */

const BASE_URL = process.env.BASE_URL || 'https://weekendbuilds.vercel.app';
const runDispatch = process.argv.includes('--dispatch');

const sample = {
    name: 'Smoke Test Idea',
    text: 'Automated smoke test — safe to delete. A fun weekend coding prompt for families.',
    categories: ['Fun'],
    author: 'Smoke Test',
    childSafe: true
};

function fail(msg) {
    console.error(`FAIL: ${msg}`);
    process.exit(1);
}

function pass(msg) {
    console.log(`PASS: ${msg}`);
}

async function testValidation() {
    const res = await fetch(`${BASE_URL}/api/submit-prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'x', text: 'short', categories: [], author: '', childSafe: false })
    });
    if (res.status !== 400) fail(`validation should return 400, got ${res.status}`);
    pass('validation rejects incomplete payload');
}

async function testSubmitDispatch() {
    const res = await fetch(`${BASE_URL}/api/submit-prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sample)
    });
    const data = await res.json().catch(() => ({}));

    if (res.status === 503) {
        fail('submit returned 503 — add GITHUB_TOKEN to Vercel so the form can trigger the save workflow');
    }
    if (!res.ok) fail(`submit returned ${res.status}: ${data.error || 'unknown error'}`);
    if (!data.submission?.id) fail('submit response missing submission id');
    pass(`submit accepted (${data.submission.id}) — GitHub Action will commit to community-submissions.json`);
}

async function testStaticCommunityFile() {
    const res = await fetch(`${BASE_URL}/VibewithKids/community-submissions.json?t=${Date.now()}`, {
        cache: 'no-store'
    });
    if (!res.ok) fail(`community file returned ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data.submissions)) fail('community file missing submissions array');
    pass(`community file loads (${data.submissions.length} ideas)`);
}

async function testLocalDispatch() {
    if (!process.env.GITHUB_TOKEN) {
        fail('dispatch test needs GITHUB_TOKEN in env (try: gh auth token)');
    }

    const res = await fetch('https://api.github.com/repos/shazily/weekendbuilds/dispatches', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
            Accept: 'application/vnd.github+json',
            'Content-Type': 'application/json',
            'User-Agent': 'weekendbuilds-vwk-smoke-test'
        },
        body: JSON.stringify({
            event_type: 'community-submission',
            client_payload: {
                id: `sub-smoke-${Date.now()}`,
                name: sample.name,
                text: sample.text,
                categories: sample.categories,
                category: 'Fun',
                author: sample.author,
                submittedAt: new Date().toISOString(),
                approved: true
            }
        })
    });

    if (!res.ok) {
        const err = await res.text();
        fail(`repository_dispatch returned ${res.status}: ${err}`);
    }
    pass('repository_dispatch accepted — workflow will append to community-submissions.json');
}

async function main() {
    console.log(`Testing against ${BASE_URL}`);
    await testValidation();
    await testStaticCommunityFile();

    if (runDispatch) {
        await testLocalDispatch();
    } else {
        await testSubmitDispatch();
    }

    console.log('All submission smoke tests passed.');
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
