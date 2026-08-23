const { HEALTH_REMINDER_MESSAGE_COUNT } = require('../config/compliance');

function advanceSuccessfulMessageCount(currentCount, increment, reminderShown) {
  const count = (Number(currentCount) || 0) + Math.max(0, Number(increment) || 0);
  return {
    count,
    shouldRemind: !reminderShown && count >= HEALTH_REMINDER_MESSAGE_COUNT
  };
}

module.exports = { advanceSuccessfulMessageCount };
