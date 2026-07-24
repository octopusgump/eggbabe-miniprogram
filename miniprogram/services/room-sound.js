// 120 ms、低音量的本地杯碰提示音。它只用于用户主动点击咖啡机后的即时反馈，
// 不携带业务数据，也不依赖网络资源。
const COFFEE_CHIME_BASE64 = 'UklGRuQDAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YcADAACAwti3fFJLXXN/i56ysY1VLjlzttS9hllMW3B9iJmtsZVhNjdoqc7BkGFPWW58hZSosJtsPjZencfDmWlSWGt6g5CjrqB2SDhWkcDEoHFWV2l4gYyeq6N/UTtQhbfDp3laV2d3gImZqKWHWz9Me67BrIFfWGV1f4eVpKaNZEVJcqS+sIllWWNzfYWRoKWTbEtIapq5so9rXGJxfIONnKSXdVJIY5GztJZxXmFve4KLmKKafFlKXoittJt4YmFueoGIlaCbgmBNWoCmsp9+ZWFseH+GkZ2ciGdRV3mfsKOEaWJrd3+EjpqcjG5VVnKYraWJbmNqdX6Di5eckHRaVWyRqaeOc2VpdH2CiZSbknpgVmiKpaeTd2hpc3yBh5GZlH9lWGSDoKeWfGppcXuAhY6XlYRqW2J9mqaZgW1pcHp/hIyVlohwXmB4laSchXFqb3h/g4qTlYt1YWBzj6GdiXRrb3d+goiQlY15ZWBvip6ejHhtbnZ9gYaOlI9+aWFshZqekHtubnV8gIWMkpCBbmNqgJadkn9xbnV8gISKkZCEcmVofJKclIJzb3R7f4OIj5CHdmdoeI6aloV2cHN6f4KHjZCJeWpndYqYloh4cXN5foGFjI+LfW1ocoaVl4t7cnJ4fYCEio6MgHBpcIKSlo1+c3J4fYCDiI2MgnRqb36Plo+AdXN3fICCh4yNhHdsbnuMlZCDd3N2fH+ChouMhnpubXmJk5GFeXR2e3+BhImMiHxxbXaGkZGHe3V2en6BhIiLiX9zbnWDj5GJfXZ2en6Ag4eLiYF1b3OAjZGKf3d2eX2AgoaKiYN4cHJ+ipCMgXh2eX2AgYWJiYR6cnJ7iI+Mg3p3eXx/gYSIiYV8c3J5hY6NhXx3eHx/gYOHiYZ+dXJ4g4yNhn14eHx/gIKGiIeAd3N3gYuNh395eHt+gIKFiIeBeXR2f4mNiIB6eHt+gIGEh4eDe3V1fYeMiYJ7eXp+gIGDhoeEfHZ1fIWLioN8eXp9f4GDhYeEfnd1eoOKioR9enp9f4CChYeFf3h2eYKJioV+enp8f4CChIaFgHp2eYCHioaAe3p8f4CBg4aFgXt3eH+GiYeBfHp8foCBg4WFgn14eH2FiYeCfXt8foCBgoSFg355eHyDiIeDfXt8fn+AgoSFhH96eHuCh4iEfnt8fX+AgYOFhIB7eHuBhoeEf3x8fX+AgYOEhIF8eXp/hYeFgHx8fX+AgYKEhIF9eXp+hIeFgX18fX+AgYKEhIJ+enp+g4aGgn58fX6AgIGDhIM=';

let audio = null;
let filePath = '';
let writing = false;
let generation = 0;

function destroyAudio() {
  if (!audio) return;
  audio.stop();
  audio.destroy();
  audio = null;
}

function play(file) {
  destroyAudio();
  audio = wx.createInnerAudioContext();
  audio.obeyMuteSwitch = true;
  audio.volume = .18;
  audio.src = file;
  audio.onEnded(destroyAudio);
  audio.onError(destroyAudio);
  audio.play();
}

function playCoffeeChime() {
  if (wx.vibrateShort) wx.vibrateShort({ type: 'light' });
  if (!wx.createInnerAudioContext || !wx.getFileSystemManager || !wx.env || !wx.env.USER_DATA_PATH) return;
  if (filePath) {
    play(filePath);
    return;
  }
  if (writing) return;
  writing = true;
  const activeGeneration = generation;
  const target = `${wx.env.USER_DATA_PATH}/eggbabe-coffee-chime.wav`;
  wx.getFileSystemManager().writeFile({
    filePath: target,
    data: COFFEE_CHIME_BASE64,
    encoding: 'base64',
    success: () => {
      if (generation !== activeGeneration) return;
      filePath = target;
      play(target);
    },
    complete: () => { writing = false; }
  });
}

function stop() {
  generation += 1;
  destroyAudio();
}

module.exports = { playCoffeeChime, stop };
