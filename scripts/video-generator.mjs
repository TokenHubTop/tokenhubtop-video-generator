import { readFile, writeFile, mkdir, rename, unlink } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const endpoint = 'https://tokenhubtop.com/v1/video/generations';
const show = value => console.log(JSON.stringify(value, null, 2));
const demand = (condition, message) => { if (!condition) throw new Error(message); };
const nonempty = value => typeof value === 'string' && value.trim().length > 0;
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
function fields(value, allowed) {
  demand(object(value), 'Expected a JSON object.');
  demand(Object.keys(value).every(k => allowed.includes(k)), 'Unrecognized project field; check the project format.');
}
function uri(value) {
  demand(nonempty(value), 'Missing reference URI.');
  if (/^asset:\/\/[A-Za-z0-9_-]+$/.test(value)) return value;
  const u = new URL(value);
  demand(['https:', 'http:'].includes(u.protocol) && !u.username && !u.password && !u.hash, 'Reference must be a public HTTP(S) URL or asset reference.');
  demand(!/^(localhost|127\.|0\.|10\.|192\.168\.|169\.254\.|\[)/i.test(u.hostname) && !/^172\.(1[6-9]|2\d|3[01])\./.test(u.hostname) && !/\.(local|internal)$/.test(u.hostname), 'Local reference addresses are not supported.');
  return value;
}

export function compile(project) {
  fields(project, ['title', 'model', 'shots']);
  demand(nonempty(project.title) && nonempty(project.model), 'Set the project title and an available model explicitly.');
  demand(Array.isArray(project.shots) && project.shots.length > 0, 'Add at least one shot.');
  const ids = new Set();
  return project.shots.map(shot => {
    fields(shot, ['id', 'label', 'direction', 'seconds', 'frame', 'sound', 'references']);
    demand(typeof shot.id === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9-]{0,63}$/.test(shot.id), 'Invalid shot ID.');
    demand(!ids.has(shot.id), 'Duplicate shot ID.'); ids.add(shot.id);
    demand(nonempty(shot.label) && nonempty(shot.direction), 'Each shot needs a label and direction.');
    const payload = { model: project.model, prompt: shot.direction };
    const metadata = {};
    if (shot.seconds !== undefined) {
      demand(Number.isInteger(shot.seconds) && (shot.seconds === -1 || (shot.seconds >= 4 && shot.seconds <= 15)), 'Shot duration must be 4–15 seconds or -1.');
      payload.duration = shot.seconds;
    }
    if (shot.frame !== undefined) {
      fields(shot.frame, ['aspect', 'quality']);
      if (shot.frame.aspect !== undefined) {
        demand(typeof shot.frame.aspect === 'string' && /^[1-9]\d*:[1-9]\d*$/.test(shot.frame.aspect), 'Invalid aspect ratio.');
        metadata.ratio = shot.frame.aspect;
      }
      if (shot.frame.quality !== undefined) {
        demand(['480p', '720p', '1080p', '4k'].includes(shot.frame.quality), 'Invalid quality.');
        metadata.resolution = shot.frame.quality;
      }
    }
    if (shot.sound !== undefined) { demand(typeof shot.sound === 'boolean', 'sound must be boolean.'); metadata.generate_audio = shot.sound; }
    const groups = { image: [], video: [], audio: [], start: [], end: [] };
    demand(shot.references === undefined || Array.isArray(shot.references), 'references must be an array.');
    for (const ref of shot.references ?? []) {
      fields(ref, ['role', 'uri']);
      demand(Object.hasOwn(groups, ref.role), 'Unknown reference role.');
      groups[ref.role].push(uri(ref.uri));
    }
    demand(groups.start.length <= 1 && groups.end.length <= 1, 'Use at most one start and end frame.');
    demand(!(groups.image.length && (groups.start.length || groups.end.length)), 'Use image references or explicit boundary frames, not both.');
    demand(!groups.audio.length || groups.image.length + groups.video.length + groups.start.length + groups.end.length > 0, 'Audio needs a visual reference.');
    if (groups.image.length) payload.images = groups.image;
    if (groups.start.length) payload.first_frame_url = groups.start[0];
    if (groups.end.length) payload.last_frame_url = groups.end[0];
    if (groups.video.length) metadata.video_urls = groups.video;
    if (groups.audio.length) metadata.audio_urls = groups.audio;
    if (Object.keys(metadata).length) payload.metadata = metadata;
    return { id: shot.id, label: shot.label, payload, fingerprint: createHash('sha256').update(JSON.stringify(payload)).digest('hex') };
  });
}

async function atomic(path, record) {
  const temp = `${path}.${randomUUID()}.tmp`;
  try { await writeFile(temp, JSON.stringify(record, null, 2), { flag: 'wx', mode: 0o600 }); await rename(temp, path); }
  finally { await unlink(temp).catch(() => {}); }
}
async function remote(method, id, body) {
  const key = process.env.TOKENHUBTOP_API_KEY?.trim();
  demand(key, 'Configure TOKENHUBTOP_API_KEY in the execution environment.');
  const response = await fetch(id ? `${endpoint}/${encodeURIComponent(id)}` : endpoint, {
    method, redirect: 'error', signal: AbortSignal.timeout(30000),
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
  demand(response.ok, `Platform returned HTTP ${response.status}; no automatic retry.`);
  demand(response.headers.get('content-type')?.includes('json'), 'Unexpected response format.');
  const text = await response.text();
  const result = JSON.parse(text.split(key).join('[REDACTED]'));
  demand(object(result), 'Expected a task response object.');
  return result;
}
async function media(url, path) {
  const u = new URL(uri(url));
  demand(u.protocol === 'https:', 'Automatic collection requires HTTPS.');
  const response = await fetch(u, { redirect: 'error', signal: AbortSignal.timeout(120000) });
  demand(response.ok && /^(video\/|application\/octet-stream)/i.test(response.headers.get('content-type') ?? ''), 'Video download did not return media.');
  const { open } = await import('node:fs/promises');
  const partial = `${path}.part`;
  const file = await open(partial, 'wx', 0o600);
  let length = 0;
  try {
    for await (const bytes of response.body) {
      length += bytes.length;
      demand(length <= 512 * 1024 * 1024, 'Video exceeds 512 MiB limit.');
      await file.writeFile(bytes);
    }
    const expected = response.headers.get('content-length');
    demand(length > 0 && (!expected || length === Number(expected)), 'Incomplete video download.');
    await file.close(); await rename(partial, path);
  } finally { await file.close().catch(() => {}); await unlink(partial).catch(() => {}); }
}

export async function run(argv, transport = remote, download = media) {
  const [command, projectPath, selected, output] = argv;
  demand(['init', 'plan', 'render', 'sync', 'collect'].includes(command) && projectPath, 'Usage: init|plan PROJECT, or render|sync|collect PROJECT SHOT OUTPUT');
  if (command === 'init') {
    await writeFile(projectPath, JSON.stringify({ title: '新视频项目', model: '', shots: [{ id: 'shot-01', label: '第一个镜头', direction: '' }] }, null, 2), { flag: 'wx' });
    show({ project: resolve(projectPath), next: 'Fill model and shot direction, then run plan.' }); return;
  }
  const compiled = compile(JSON.parse((await readFile(projectPath, 'utf8')).replace(/^\uFEFF/, '')));
  if (command === 'plan') { show({ submitted: false, shots: compiled }); return; }
  demand(selected && output, 'Select one shot and an output directory.');
  const shot = compiled.find(item => item.id === selected);
  demand(shot, 'Shot ID not found.');
  await mkdir(output, { recursive: true });
  const path = resolve(output, `${shot.id}.json`);
  let record;
  if (command === 'render') {
    record = { shot: shot.id, label: shot.label, fingerprint: shot.fingerprint, phase: 'submission_uncertain', at: new Date().toISOString() };
    await writeFile(path, JSON.stringify(record, null, 2), { flag: 'wx', mode: 0o600 });
    try {
      const result = await transport('POST', null, shot.payload);
      demand(nonempty(result.id), 'No task ID returned.');
      record = { ...record, phase: 'submitted', task: result.id, result };
      show(record); // Preserve the task ID even if saving fails.
      await atomic(path, record);
    } catch { throw new Error('Submission outcome is uncertain or could not be recorded. Inspect platform history and any printed task ID before another submission.'); }
    return;
  }
  record = JSON.parse(await readFile(path, 'utf8'));
  demand(record.fingerprint === shot.fingerprint, 'Project changed since submission; use the original project to inspect this task.');
  demand(nonempty(record.task), 'No confirmed task ID. Check platform history; do not resubmit automatically.');
  record.result = await transport('GET', record.task);
  await atomic(path, record); show(record);
  if (command === 'sync') return;
  demand(record.result.status === 'completed', 'Shot is not completed; current status was preserved.');
  const url = record.result.output?.video_url ?? record.result.content?.video_url;
  demand(nonempty(url), 'Completed response has no video URL.');
  const video = join(resolve(output), `${shot.id}-${randomUUID()}.mp4`);
  await download(url, video);
  record.files = [...(record.files ?? []), video]; await atomic(path, record);
  show({ shot: shot.id, task: record.task, saved: video });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  run(process.argv.slice(2)).catch(err => {
    const message = err.code === 'EEXIST' ? 'Record or project already exists; no submission was repeated.' : err instanceof SyntaxError ? 'Invalid project or response JSON.' : err.message;
    console.error(JSON.stringify({ error: message })); process.exitCode = 1;
  });
}
