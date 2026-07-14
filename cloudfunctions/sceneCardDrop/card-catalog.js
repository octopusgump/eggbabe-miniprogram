const SET = {
  setCode: 'YT-S01',
  setName: '玉兔初见·水彩日常',
  character: '玉兔',
  cards: [
    ['yt-s01-001', 1, '001/010', '花间初见', 'YT__watercolor__hi', '/assets/cards/YT-S01/yt-s01-001.webp', '花', ['grass']],
    ['yt-s01-002', 2, '002/010', '竹林问候', 'YT__watercolor__salute', '/assets/cards/YT-S01/yt-s01-002.webp', '竹', ['grass', 'roof']],
    ['yt-s01-003', 3, '003/010', '轻盈起舞', 'YT__watercolor__dance', '/assets/cards/YT-S01/yt-s01-003.webp', '舞', ['grass']],
    ['yt-s01-004', 4, '004/010', '纸箱躲猫猫', 'YT__watercolor__box', '/assets/cards/YT-S01/yt-s01-004.webp', '箱', ['room']],
    ['yt-s01-005', 5, '005/010', '古镇骑行', 'YT__watercolor__cycle', '/assets/cards/YT-S01/yt-s01-005.webp', '骑', ['seaside', 'roof']],
    ['yt-s01-006', 6, '006/010', '晨间读报', 'YT__watercolor__newspaper', '/assets/cards/YT-S01/yt-s01-006.webp', '报', ['room', 'desk']],
    ['yt-s01-007', 7, '007/010', '月下冥想', 'YT__watercolor__meditate', '/assets/cards/YT-S01/yt-s01-007.webp', '月', ['snow', 'roof']],
    ['yt-s01-008', 8, '008/010', '初次滑板', 'YT__watercolor__skateboard', '/assets/cards/YT-S01/yt-s01-008.webp', '滑', ['seaside', 'roof']],
    ['yt-s01-009', 9, '009/010', '月宫实验', 'YT__watercolor__chemistry', '/assets/cards/YT-S01/yt-s01-009.webp', '试', ['desk']],
    ['yt-s01-010', 10, '010/010', '月夜泡泡浴', 'YT__watercolor__bath', '/assets/cards/YT-S01/yt-s01-010.webp', '浴', ['room', 'snow']]
  ].map(card => ({
    card_key: card[0],
    card_definition_id: card[0],
    collector_number: card[1],
    checklist_number: card[1],
    checklist_total: 10,
    collector_label: card[2],
    name: card[3],
    hero_asset_id: card[4],
    image: card[5],
    mark: card[6],
    scene_keys: card[7],
    set_code: 'YT-S01',
    set_name: '玉兔初见·水彩日常',
    treatment: 'BASE',
    tint: '#F6F2E8'
  }))
};

function getCardPool(character, sceneId) {
  if (character !== SET.character) return [];
  return SET.cards.filter(card => card.scene_keys.includes(sceneId));
}

module.exports = { SET, getCardPool };
