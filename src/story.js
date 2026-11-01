// The story of the Sol Crystal, told by Mr. Saymaz (0.69.0).
//
// Long ago the Sol Crystal lit the valley. It shattered into three shards, and without its light the three
// guardians forgot their words and began to block the paths. Each arena's English restores one guardian's words;
// winning its fight returns a shard. With all three, the Sol Crystal shines again.
//
// Scenes play once per device (save.story.seen) and can be replayed from the journal. Each line has two reading
// levels: 'easy' for Grades 5–6 (A1) and 'more' for Grades 7–8 (A2), with a Turkish translation the student can
// open. Lines are read aloud by a British male voice where the device has one (voice-preference.js).
export const STORY_GUARDIANS = ['Mossback Warden', 'Galecrest Warden', 'Stormglass Sentinel'];
const L = (pose, easy, easyTr, more, moreTr) => ({ pose, easy: { en: easy, tr: easyTr }, more: { en: more, tr: moreTr } });
export const STORY_SCENES = {
  'intro-0': {
    area: 0,
    title: 'The Sol Crystal',
    shards: 0,
    lines: [
      L('full', 'Hello, explorer! I am Mr. Saymaz. Welcome to the valley of Maxima.', 'Merhaba kâşif! Ben Mr. Saymaz. Maxima vadisine hoş geldin.',
        "Welcome, explorer! I'm Mr. Saymaz, and I've travelled across this whole valley.", 'Hoş geldin kâşif! Ben Mr. Saymaz ve bu vadinin her yerini dolaştım.'),
      L('point', 'Long ago, the Sol Crystal gave light to the valley. Then it broke into three pieces.', 'Uzun zaman önce Sol Kristali vadiye ışık veriyordu. Sonra üç parçaya bölündü.',
        'Long ago, the Sol Crystal lit up every forest and mountain here, until it shattered into three shards.', 'Uzun zaman önce Sol Kristali buradaki her ormanı ve dağı aydınlatıyordu, ta ki üç parçaya ayrılana kadar.'),
      L('think', 'Without its light, the guardians forgot their words. Now they block the paths.', 'Işığı olmadan muhafızlar kelimelerini unuttu. Şimdi yolları kapatıyorlar.',
        "Without its light, the three guardians have forgotten their words, and now they're blocking every path.", 'Işığı olmadan üç muhafız kelimelerini unuttu ve şimdi bütün yolları kapatıyorlar.'),
      L('smile', "Every English word you learn makes the crystal shine again. Let's start in Whisperwood!", 'Öğrendiğin her İngilizce kelime kristali yeniden parlatır. Hadi Whisperwood’da başlayalım!',
        'Every English word you learn brings the light back. Shall we begin in Whisperwood?', 'Öğrendiğin her İngilizce kelime ışığı geri getirir. Whisperwood’dan başlayalım mı?'),
    ],
  },
  'guardian-0': {
    area: 0,
    title: 'The Mossback Warden',
    guardian: 0,
    shards: 0,
    lines: [
      L('point', 'Look! That is the Mossback Warden. It guards the first piece of the crystal.', 'Bak! Bu Mossback Warden. Kristalin ilk parçasını koruyor.',
        'There it is: the Mossback Warden, keeper of the first crystal shard.', 'İşte orada: ilk kristal parçasının bekçisi Mossback Warden.'),
      L('think', 'It is not bad. It is sad and confused, because its words are lost.', 'O kötü değil. Kelimeleri kaybolduğu için üzgün ve kafası karışık.',
        "It isn't evil, just lost. The roots of its memory have been tangled for years.", 'O kötü değil, sadece kaybolmuş. Hafızasının kökleri yıllardır birbirine dolanmış.'),
      L('smile', 'Watch the amber marks, move away, and answer the English wards. You can do it!', 'Turuncu işaretlere dikkat et, uzaklaş ve İngilizce mühürleri cevapla. Bunu yapabilirsin!',
        'Read every warning, dodge the amber zones and break its English wards. I believe in you!', 'Her uyarıyı oku, turuncu alanlardan kaç ve İngilizce mühürlerini kır. Sana inanıyorum!'),
    ],
  },
  'win-0': {
    area: 0,
    title: 'The first shard',
    shards: 1,
    lines: [
      L('cheer', 'You did it! The Mossback Warden remembers its words!', 'Başardın! Mossback Warden kelimelerini hatırlıyor!',
        'Brilliant! The Mossback Warden remembers every word now.', 'Harika! Mossback Warden artık her kelimeyi hatırlıyor.'),
      L('smile', 'It gives you the first piece of the Sol Crystal. The forest is bright again!', 'Sana Sol Kristali’nin ilk parçasını veriyor. Orman yeniden aydınlık!',
        'It has handed you the first crystal shard, and Whisperwood is glowing again.', 'Sana ilk kristal parçasını verdi ve Whisperwood yeniden parlıyor.'),
      L('point', 'Now the wind is calling us. Next stop: Skyreach!', 'Şimdi rüzgâr bizi çağırıyor. Sıradaki durak: Skyreach!',
        'Can you feel the wind rising? Skyreach is waiting for us.', 'Rüzgârın yükseldiğini hissedebiliyor musun? Skyreach bizi bekliyor.'),
    ],
  },
  'intro-1': {
    area: 1,
    title: 'Skyreach',
    shards: 1,
    lines: [
      L('full', 'Welcome to Skyreach! The wind is very strong up here.', 'Skyreach’e hoş geldin! Burada rüzgâr çok güçlü.',
        'Welcome to Skyreach, where the wind never stops blowing.', 'Rüzgârın hiç durmadan estiği Skyreach’e hoş geldin.'),
      L('point', 'The Galecrest Warden flies above the sky bridges. It has the second piece.', 'Galecrest Warden gökyüzü köprülerinin üstünde uçuyor. İkinci parça onda.',
        'Somewhere above the sky bridges, the Galecrest Warden guards the second shard.', 'Gökyüzü köprülerinin üstünde bir yerde Galecrest Warden ikinci parçayı koruyor.'),
      L('smile', 'Learn new words, and the bridges will open for you.', 'Yeni kelimeler öğren, köprüler senin için açılacak.',
        "Every gate you open repairs a bridge. Let's climb higher!", 'Açtığın her kapı bir köprüyü onarır. Hadi daha yükseğe tırmanalım!'),
    ],
  },
  'guardian-1': {
    area: 1,
    title: 'The Galecrest Warden',
    guardian: 1,
    shards: 1,
    lines: [
      L('point', 'Here comes the Galecrest Warden! Hold on tight.', 'İşte Galecrest Warden geliyor! Sıkı tutun.',
        'Here comes the Galecrest Warden, riding the storm winds!', 'İşte fırtına rüzgârlarına binen Galecrest Warden geliyor!'),
      L('think', 'It throws stones and walls of wind. Move quickly and jump at the right time.', 'Taşlar ve rüzgâr duvarları fırlatıyor. Hızlı hareket et ve doğru zamanda zıpla.',
        'Watch for its stone volleys and gale walls: keep moving and time your jumps.', 'Taş yağmurlarına ve rüzgâr duvarlarına dikkat et: hareket etmeye devam et ve zıplamalarını iyi zamanla.'),
      L('smile', 'Answer its English wards, and it will listen to you.', 'İngilizce mühürlerini cevapla, o zaman seni dinleyecek.',
        'Break its English wards and it will finally hear you.', 'İngilizce mühürlerini kır, sonunda seni duyacak.'),
    ],
  },
  'win-1': {
    area: 1,
    title: 'The second shard',
    shards: 2,
    lines: [
      L('cheer', 'Amazing! The Galecrest Warden is calm again.', 'İnanılmaz! Galecrest Warden yeniden sakin.',
        'Amazing! The Galecrest Warden has finally calmed down.', 'İnanılmaz! Galecrest Warden sonunda sakinleşti.'),
      L('smile', 'Now you have two pieces of the Sol Crystal.', 'Artık Sol Kristali’nin iki parçası sende.',
        'Two crystal shards are safe now, and the sky bridges are shining.', 'Artık iki kristal parçası güvende ve gökyüzü köprüleri parlıyor.'),
      L('point', 'Only one guardian is left. It waits in Stormglass.', 'Sadece bir muhafız kaldı. Stormglass’ta bekliyor.',
        'Only the last guardian remains, deep in Stormglass.', 'Geriye sadece Stormglass’ın derinliklerindeki son muhafız kaldı.'),
    ],
  },
  'intro-2': {
    area: 2,
    title: 'Stormglass',
    shards: 2,
    lines: [
      L('full', 'This is Stormglass. Everything here is made of crystal.', 'Burası Stormglass. Buradaki her şey kristalden yapılmış.',
        'This is Stormglass, a land of violet mist and singing crystal.', 'Burası Stormglass; mor sisin ve şarkı söyleyen kristallerin diyarı.'),
      L('think', 'The Stormglass Sentinel is the oldest guardian. It is very strong.', 'Stormglass Sentinel en yaşlı muhafız. Çok güçlü.',
        'The Stormglass Sentinel is the oldest and wisest guardian of all.', 'Stormglass Sentinel tüm muhafızların en yaşlısı ve en bilgesi.'),
      L('smile', 'But you are strong too. You know so many words now!', 'Ama sen de güçlüsün. Artık çok fazla kelime biliyorsun!',
        "It will test everything you've learned, but you're ready for it.", 'Öğrendiğin her şeyi sınayacak ama sen buna hazırsın.'),
    ],
  },
  'guardian-2': {
    area: 2,
    title: 'The Stormglass Sentinel',
    guardian: 2,
    shards: 2,
    lines: [
      L('point', 'The Stormglass Sentinel! It guards the last piece.', 'Stormglass Sentinel! Son parçayı koruyor.',
        'The Stormglass Sentinel stands before us, guarding the final shard.', 'Stormglass Sentinel son parçayı koruyarak önümüzde duruyor.'),
      L('think', 'Its light beams bounce and its chains swing. Read every warning.', 'Işık ışınları sekiyor ve zincirleri sallanıyor. Her uyarıyı oku.',
        'Its prism beams bounce between lanes and its storm chains sweep the ground, so stay alert.', 'Prizma ışınları şeritler arasında sekiyor ve fırtına zincirleri yeri süpürüyor, o yüzden dikkatli ol.'),
      L('smile', 'Break its English wards. This is our last battle!', 'İngilizce mühürlerini kır. Bu bizim son savaşımız!',
        'Break its English wards and the Sol Crystal will be whole again.', 'İngilizce mühürlerini kır, Sol Kristali yeniden bütün olacak.'),
    ],
  },
  'win-2': {
    area: 2,
    title: 'The last shard',
    shards: 3,
    lines: [
      L('cheer', 'You did it! The Stormglass Sentinel remembers its words!', 'Başardın! Stormglass Sentinel kelimelerini hatırlıyor!',
        'Incredible! The Stormglass Sentinel remembers its words at last.', 'İnanılmaz! Stormglass Sentinel sonunda kelimelerini hatırlıyor.'),
      L('smile', 'It gives you the last piece of the Sol Crystal.', 'Sana Sol Kristali’nin son parçasını veriyor.',
        'It has given you the final shard of the Sol Crystal.', 'Sana Sol Kristali’nin son parçasını verdi.'),
    ],
  },
  finale: {
    area: 2,
    title: 'The Sol Crystal shines',
    shards: 3,
    whole: true,
    lines: [
      L('point', 'Look! The three pieces are together again.', 'Bak! Üç parça yeniden bir arada.',
        'Look! The three shards are joining together.', 'Bak! Üç parça birleşiyor.'),
      L('cheer', 'The Sol Crystal is shining over the whole valley!', 'Sol Kristali bütün vadinin üstünde parlıyor!',
        'The Sol Crystal is shining over the whole valley once more!', 'Sol Kristali bir kez daha bütün vadinin üstünde parlıyor!'),
      L('full', 'Thank you, explorer. Your English brought the light back. See you on the next adventure!', 'Teşekkürler kâşif. İngilizcen ışığı geri getirdi. Bir sonraki macerada görüşmek üzere!',
        "Thank you, explorer. Your English brought the light back. Keep exploring, and I'll see you on your next adventure!", 'Teşekkürler kâşif. İngilizcen ışığı geri getirdi. Keşfetmeye devam et, bir sonraki maceranda görüşürüz!'),
    ],
  },
};
// Short reactions (no cut-scene): out of lives on the path, knocked out in the guardian arena.
const REACTIONS = {
  out: [
    L('think', "Don't worry. Every explorer falls sometimes. Let's try again!", 'Merak etme. Her kâşif bazen düşer. Hadi tekrar deneyelim!',
      'Even the best explorers fall. Take a breath, read the warnings and try again.', 'En iyi kâşifler bile düşer. Bir nefes al, uyarıları oku ve tekrar dene.'),
  ],
  knockout: [
    L('think', 'Get up! You can do it!', 'Kalk! Bunu yapabilirsin!', 'Shake it off! Watch the amber zones this time.', 'Silkelen! Bu sefer turuncu alanlara dikkat et.'),
    L('think', 'Careful! Move away from the red zone.', 'Dikkat! Kırmızı alandan uzaklaş.', "Stay calm. Read the warning before it strikes.", 'Sakin ol. Saldırmadan önce uyarıyı oku.'),
  ],
};
// Grades 5–6 read the easier lines; Grades 7–8 the richer ones.
export const storyLevel = grade => (Number(grade) >= 7 ? 'more' : 'easy');
export function sceneLines(id, grade) {
  const scene = STORY_SCENES[id];
  if (!scene) return [];
  const level = storyLevel(grade);
  return scene.lines.map(l => ({ pose: l.pose, ...l[level] }));
}
export function reaction(kind, grade, n = 0) {
  const list = REACTIONS[kind] || [];
  const l = list[Math.abs(n) % Math.max(1, list.length)];
  return l ? { pose: l.pose, ...l[storyLevel(grade)] } : null;
}
// Which scene comes at each moment (null when there is none or it was already seen).
export const sceneSeen = (save, id) => !!save?.story?.seen?.includes(id);
export function markSeen(save, id) {
  save.story ??= { seen: [] };
  save.story.seen ??= [];
  if (!save.story.seen.includes(id)) save.story.seen.push(id);
}
export const introScene = area => `intro-${area}`;
export const guardianScene = area => `guardian-${area}`;
// Winning the last arena also plays the finale.
export const winScenes = area => (area === 2 ? ['win-2', 'finale'] : [`win-${area}`]);
export const STORY_ORDER = ['intro-0', 'guardian-0', 'win-0', 'intro-1', 'guardian-1', 'win-1', 'intro-2', 'guardian-2', 'win-2', 'finale'];
