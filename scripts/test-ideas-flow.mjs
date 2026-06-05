#!/usr/bin/env node
/** End-to-end checks for ideas submit, copy prompt, and likes. */
const BASE = process.env.BASE_URL || 'https://weekendbuilds.vercel.app';
const SITE = `${BASE}/VibewithKids`;

const failures = [];

function ok(label) { console.log(`✓ ${label}`); }
function fail(label, detail) {
  console.error(`✗ ${label}${detail ? `: ${detail}` : ''}`);
  failures.push(label);
}

async function fetchJson(url, opts) {
  const r = await fetch(url, opts);
  const text = await r.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  return { r, data };
}

async function main() {
  console.log(`Testing ${SITE}\n`);

  // 1. Prompt library has copyable prompts
  {
    const { r, data } = await fetchJson(`${SITE}/ideas.json`);
    if (!r.ok) fail('Load ideas.json', r.status);
    else ok('Load ideas.json');

    const promptItem = (data.prompts || []).find(p => p.prompt);
    if (!promptItem) fail('Find prompt in library');
    else ok(`Library prompt "${promptItem.name}" has copy text (${promptItem.prompt.length} chars)`);
  }

  // 1b. Community starts empty (or loads)
  {
    const { r, data } = await fetchJson(`${SITE}/community-submissions.json`);
    if (!r.ok) fail('Load community-submissions.json', r.status);
    else ok('Load community-submissions.json');
  }

  // 2. Submit idea + prompt via API
  const testPrompt = 'Build a tiny star-collecting game where kids click glowing stars and learn counting from 1 to 10.';
  let submittedId;
  {
    const body = {
      type: 'prompt',
      name: 'Star Counter Game',
      text: 'A simple click game that teaches counting while collecting glowing stars in space.',
      prompt: testPrompt,
      categories: ['Game', 'Fun'],
      author: 'E2E Test',
      childSafe: true
    };
    const { r, data } = await fetchJson(`${BASE}/api/submit-prompt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!r.ok) fail('POST /api/submit-prompt', `${r.status} ${JSON.stringify(data)}`);
    else {
      submittedId = data.submission?.id;
      ok(`Submit prompt idea (${submittedId})`);
      if (data.submission?.type !== 'prompt' || data.submission?.prompt !== testPrompt) {
        fail('Submit response includes type and prompt fields');
      } else ok('Submit response includes type and prompt');
    }
  }

  // 3. Like API (uses submitted id when available)
  if (submittedId) {
    await new Promise(r => setTimeout(r, 15000));
    const { r, data } = await fetchJson(`${BASE}/api/like-idea?id=${encodeURIComponent(submittedId)}`, {
      method: 'POST'
    });
    if (!r.ok) fail('POST /api/like-idea', `${r.status} ${JSON.stringify(data)}`);
    else ok('POST /api/like-idea');
  }

  // 4. Ideas page HTML checks
  {
    const r = await fetch(`${SITE}/ideas`);
    const html = await r.text();
    if (!r.ok) fail('Load ideas page', r.status);
    else ok('Load ideas page');

    if (!html.includes('Idea and prompt')) fail('Ideas page has "Idea and prompt" label');
    else ok('Ideas page has updated type pill label');

    if (!html.includes('Copy this prompt')) fail('Ideas page includes copy button markup');
    else ok('Ideas page includes copy button markup');

    if (!html.includes('community-submit-cta')) fail('Ideas page has community empty-state CTA');
    else ok('Ideas page has community empty-state CTA');
  }

  console.log(failures.length ? `\n${failures.length} failed` : '\nAll checks passed');
  process.exit(failures.length ? 1 : 0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
