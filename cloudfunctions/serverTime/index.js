const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async () => ({ ok: true, serverTs: Date.now(), timezone: 'Asia/Shanghai' });
