const STAGES = Object.freeze([[90,18],[60,17],[45,16],[30,15],[21,14],[14,13],[7,12],[3,11],[1,10]]);
function dailyStars(days) { const count = Math.max(0, Math.floor(Number(days) || 0)); return count ? STAGES.find(([start]) => count >= start)[1] : 0; }
function shanghaiDate(now) { return new Date((now === undefined ? Date.now() : Number(now)) + 8 * 3600000).toISOString().slice(0,10); }
module.exports = { STAGES, dailyStars, shanghaiDate };
