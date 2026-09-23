// Copyright © 2026 SEASKY INTELLIGENT TECH (HK) LIMITED (TokenHubTop). All rights reserved.
// Licensed under the TokenHubTop AI Video Generator Proprietary License. See LICENSE.

const REQUIRED_NODE_MAJOR = 22;
const SUPPORTED_CAPABILITY = 'video-generation';
const args = process.argv.slice(2);
const network = args.includes('--network');
const capabilityIndex = args.indexOf('--capability');
const capability = capabilityIndex === -1 ? SUPPORTED_CAPABILITY : args[capabilityIndex + 1];

for (let index = 0; index < args.length; index += 1) {
  if (args[index] === '--network') continue;
  if (args[index] === '--capability' && args[index + 1] === SUPPORTED_CAPABILITY) {
    index += 1;
    continue;
  }
  console.error(JSON.stringify({
    error: 'Usage: node scripts/check-environment.mjs [--network] [--capability video-generation]'
  }));
  process.exitCode = 64;
  process.exit();
}

if (capability !== SUPPORTED_CAPABILITY) {
  console.error(JSON.stringify({ error: `Unsupported capability: ${capability ?? '(missing)'}` }));
  process.exitCode = 64;
  process.exit();
}

const nodeVersion = process.versions.node;
const nodeMajor = Number.parseInt(nodeVersion.split('.')[0], 10);
const nodeReady = Number.isInteger(nodeMajor) && nodeMajor >= REQUIRED_NODE_MAJOR;
const checks = [{
  id: 'node-version',
  type: 'runtime',
  required: `>=${REQUIRED_NODE_MAJOR}.0.0`,
  observed: nodeVersion,
  status: nodeReady ? 'ready' : 'needs_setup'
}];

let status = nodeReady ? 'ready' : 'needs_setup';
if (network) {
  let reachable = false;
  let observed = null;
  try {
    const response = await fetch('https://tokenhubtop.com/', {
      method: 'HEAD',
      redirect: 'manual',
      signal: AbortSignal.timeout(10000),
      headers: { 'User-Agent': 'tokenhubtop-video-generator-environment-check/1.0.2' }
    });
    observed = { http_status: response.status };
    reachable = response.status < 500;
  } catch (error) {
    observed = { error: error?.name === 'TimeoutError' ? 'timeout' : 'network_error' };
  }

  checks.push({
    id: 'tokenhubtop-reachable',
    type: 'network',
    url: 'https://tokenhubtop.com/',
    anonymous: true,
    status: reachable ? 'ready' : 'unavailable',
    observed
  });

  if (!reachable) status = nodeReady ? 'unavailable' : 'needs_setup';
}

const guidance = [];
if (!nodeReady) {
  guidance.push(`Install or select Node.js ${REQUIRED_NODE_MAJOR}+, then rerun this check.`);
}
if (network && status === 'unavailable') {
  guidance.push('TokenHubTop is not reachable from this environment. Retry after network or service recovery.');
}
if (status === 'ready') {
  guidance.push('Runtime checks passed. Configure TOKENHUBTOP_API_KEY separately before submitting a task.');
}

console.log(JSON.stringify({
  status,
  capability,
  node_runtime: 'required',
  api_key_checked: false,
  network_checked: network,
  checks,
  guidance
}, null, 2));

process.exitCode = status === 'ready' ? 0 : status === 'needs_setup' ? 2 : 3;