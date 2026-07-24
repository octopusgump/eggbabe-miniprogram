const VALID_ENV_VERSIONS = new Set(['develop', 'trial', 'release']);

function normalizeEnvVersion(value) {
  const envVersion = String(value || '').toLowerCase();
  return VALID_ENV_VERSIONS.has(envVersion) ? envVersion : 'release';
}

function detectEnvVersion() {
  try {
    if (typeof wx === 'undefined' || !wx.getAccountInfoSync) return 'release';
    const account = wx.getAccountInfoSync();
    return normalizeEnvVersion(account && account.miniProgram && account.miniProgram.envVersion);
  } catch (error) {
    return 'release';
  }
}

function resolvePolicy(envVersion) {
  const normalized = normalizeEnvVersion(envVersion);
  const localDemoEnabled = normalized === 'develop';
  return {
    envVersion: normalized,
    localDemoEnabled,
    mode: localDemoEnabled ? 'demo' : 'live',
    buildTarget: localDemoEnabled ? 'ordinary-demo' : 'ordinary-live'
  };
}

function currentPolicy() {
  return resolvePolicy(detectEnvVersion());
}

module.exports = { normalizeEnvVersion, detectEnvVersion, resolvePolicy, currentPolicy };
