const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

function pad(value) {
  return String(value).padStart(2, '0');
}

function snapshot(input) {
  const candidate = input instanceof Date ? input : new Date(input === undefined ? Date.now() : input);
  const date = Number.isFinite(candidate.getTime()) ? candidate : new Date();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();
  const milliseconds = date.getMilliseconds();
  const preciseSeconds = seconds + milliseconds / 1000;

  return {
    timeText: `${pad(hours)}:${pad(minutes)}`,
    dateText: `${date.getMonth() + 1}月${date.getDate()}日 ${WEEKDAYS[date.getDay()]}`,
    hourAngle: (hours % 12) * 30 + minutes * 0.5 + preciseSeconds / 120,
    minuteAngle: minutes * 6 + preciseSeconds * 0.1,
    secondAngle: preciseSeconds * 6
  };
}

function millisecondsUntilNextSecond(timestamp) {
  const value = Number.isFinite(Number(timestamp)) ? Number(timestamp) : Date.now();
  const remainder = ((value % 1000) + 1000) % 1000;
  return remainder === 0 ? 1000 : 1000 - remainder;
}

module.exports = {
  snapshot,
  millisecondsUntilNextSecond
};
