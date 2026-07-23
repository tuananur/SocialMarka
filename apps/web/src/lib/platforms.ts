export type PlatformSlug =
  | "tiktok"
  | "instagram"
  | "x"
  | "linkedin"
  | "youtube"
  | "pinterest";

export type PlatformPage = {
  slug: PlatformSlug;
  name: string;
  shortName: string;
  color: string;
  headline: string;
  description: string;
  longDescription: string;
  benefits: { title: string; desc: string }[];
  features: string[];
  workflow: { step: string; title: string; desc: string }[];
  useCases: { title: string; desc: string }[];
  tips: string[];
};

export const PLATFORMS: PlatformPage[] = [
  {
    slug: "tiktok",
    name: "TikTok",
    shortName: "TT",
    color: "#010101",
    headline: "TikTok kısa videolarını takvime alın",
    description:
      "Kısa video yayınlarını diğer mecralarla aynı takvimde planlayın; dikey önizleme ve medya işleme ile tutarlı kalın.",
    longDescription:
      "TikTok’ta tutarlılık erişim demektir. SocialMarka ile dikey videoları yükleyin, yayın saatini planlayın, hesap gruplarıyla birden fazla markayı yönetin ve yayın durumunu tek ekrandan izleyin. Medya worker dikey formatı kontrol eder; takvim diğer mecralarla hizalı kalır.",
    benefits: [
      {
        title: "Dikey video hazırlığı",
        desc: "9:16 önizleme ve medya işleme ile Shorts/Reels benzeri formatı TikTok’a hazır hale getirin.",
      },
      {
        title: "Yoğun saat planı",
        desc: "Takvimde en iyi yayın pencerelerini işaretleyip haftalık ritmi sabitleyin.",
      },
      {
        title: "Ajans ölçeği",
        desc: "Müşteri hesaplarını marka gruplarında toplayın; yanlış hesaba yayın riskini azaltın.",
      },
    ],
    features: [
      "Video yükleme ve kuyruk",
      "Takvim görünümü",
      "Hesap / marka grupları",
      "Yayın durumu ve retry",
      "Diğer mecralarla çapraz plan",
      "Medya varyant kontrolü",
    ],
    workflow: [
      {
        step: "01",
        title: "TikTok hesabını bağlayın",
        desc: "Panelde Hesaplar’a gidin, TikTok’u seçin ve izin ekranını tamamlayın. Bağlantı başarılıysa hesap listede görünür. Ajanssanız hesabı ilgili marka grubuna ekleyin.",
        details: [
          "Bağlantı kopuksa yayın gitmez; Hesaplar’dan yeniden yetkilendirin.",
          "İlk denemede kendi test hesabınızı kullanın, müşteri hesabını sonra ekleyin.",
        ],
      },
      {
        step: "02",
        title: "Dikey videoyu ve açıklamayı hazırlayın",
        desc: "Gönderiler’den yeni içerik açın, TikTok hesabını seçin, 9:16 dikey videoyu yükleyin. Açıklamayı TikTok’a özel yazın; diğer mecralardan kopyalamayın. Önizlemede kapak ve ilk saniyeleri kontrol edin.",
        details: [
          "Yanlış oran kırpılma veya yükleme hatasına yol açabilir.",
          "Açıklamada ana mesajı ilk satıra koyun.",
        ],
      },
      {
        step: "03",
        title: "Zamanlayın veya hemen paylaşın",
        desc: "Hazırsanız tarih/saat seçerek takvime alın ya da Hemen Paylaş ile kuyruğa gönderin. Haftalık ritmi sabitlemek için sabit gün/saat (ör. Çarşamba 19:00) kullanın.",
        details: [
          "Aynı dakikaya çok fazla mecra yığmayın.",
          "Kampanya haftasında peş peşe slotları önceden doldurun.",
        ],
      },
      {
        step: "04",
        title: "Sonucu izleyin ve etkileşime geçin",
        desc: "Durum yayınlandı mı, hata mı kontrol edin. Hata varsa mesajı okuyup düzeltin ve yeniden deneyin. Yayın sonrası Gelen Kutusu’ndan yorumları yanıtlayın.",
        details: [
          "Başarısız yayınlarda önce hesap bağlantısını kontrol edin.",
          "Analitikte erişimi izleyip bir sonraki saat dilimini ayarlayın.",
        ],
      },
    ],
    useCases: [
      {
        title: "Ajans içerik takvimleri",
        desc: "Birden fazla müşterinin TikTok slotlarını aynı haftalık görünümde yönetin.",
      },
      {
        title: "Kampanya dalgaları",
        desc: "Lansman haftasında peş peşe kısa videoları önceden planlayın.",
      },
    ],
    tips: [
      "Açıklamayı platforma özel tutun; diğer mecralardan kopyalamayın.",
      "Kapak karesi ve ilk 3 saniyeyi önizlemede kontrol edin.",
      "Yayın sonrası gelen kutusundan yorumları takip edin.",
    ],
  },
  {
    slug: "instagram",
    name: "Instagram",
    shortName: "IG",
    color: "#E4405F",
    headline: "Instagram Feed ve Reels’i profesyonelce planlayın",
    description:
      "Görsel odaklı içerikleri önizleyin, Reels için dikey format kontrolü yapın ve marka gruplarıyla çoklu hesap yönetin.",
    longDescription:
      "Instagram’da görsel tutarlılık marka algısını belirler. SocialMarka Feed kartı ve Reels dikey önizlemesiyle yayın öncesi kontrol sunar; hashtag ve açıklama alanlarını platforma özel tutabilir, yorumları birleşik gelen kutusunda yanıtlayabilirsiniz.",
    benefits: [
      {
        title: "Görsel önizleme",
        desc: "Feed ve 9:16 Reels mockup’ı ile yayın öncesi görünümü netleştirin.",
      },
      {
        title: "Platforma özel metin",
        desc: "Açıklama ve hashtag’leri Instagram için ayrı tutun.",
      },
      {
        title: "Çoklu hesap",
        desc: "Müşteri Instagram’larını gruplayıp tek tıkla seçin.",
      },
    ],
    features: [
      "Feed gönderileri",
      "Reels planlama",
      "Yorum inbox",
      "Medya varyantları",
      "Takvim & durum",
      "Marka grupları",
    ],
    workflow: [
      {
        step: "01",
        title: "Hesabı bağlayıp medyayı seçin",
        desc: "Instagram hesabınızı bağladıktan sonra Gönderiler’de yeni içerik açın. Feed için kare/yatay görsel, Reels için dikey video seçin. Hedef hesabı veya marka grubunu işaretleyin.",
        details: [
          "Reels ve Feed’i aynı gönderide karıştırmadan, formatı net seçin.",
          "Müşteri hesabı kullanıyorsanız doğru grubu seçtiğinizi doğrulayın.",
        ],
      },
      {
        step: "02",
        title: "Metni yazıp önizleyin",
        desc: "Açıklama ve hashtag’leri Instagram’a özel tutun. Önizlemede Feed kartı veya 9:16 Reels görünümünde kırpma, metin taşması ve görsel kalitesini kontrol edin.",
        details: [
          "Hashtag setlerini içerik tipine göre ayırın.",
          "Müşteri onayı varsa önizleme ekran görüntüsünü paylaşabilirsiniz.",
        ],
      },
      {
        step: "03",
        title: "Takvime alın veya hemen paylaşın",
        desc: "Feed tutarlılığı için haftalık slotları önceden doldurun. Acil duyurularda Hemen Paylaş kullanın. Takvimde diğer mecralarla çakışmayı görün.",
        details: [
          "Aynı güne çok fazla Reels yığmak erişimi bölebilir.",
          "Zamanlanan içerik durumunu yayın günü kontrol edin.",
        ],
      },
      {
        step: "04",
        title: "Yorumları gelen kutusundan yanıtlayın",
        desc: "Yayın sonrası Gelen Kutusu’nda Instagram etkileşimlerini filtreleyin. Okunmamışları yanıtlayıp okundu işaretleyin; spam’i ayıklayın.",
        details: [
          "Ajanslarda yanıt yetkisini Editör rolüne verin.",
          "Şikayet içeren yorumları müşteriye iletmeden önce not alın.",
        ],
      },
    ],
    useCases: [
      {
        title: "Marka feed tutarlılığı",
        desc: "Haftalık görsel ritmi önceden planlayarak feed’i düzenli tutun.",
      },
      {
        title: "Reels kampanyaları",
        desc: "Dikey videoları peş peşe yayınlayıp momentum yaratın.",
      },
    ],
    tips: [
      "Hashtag setlerini içerik tipine göre ayırın.",
      "Reels için dikey oranı zorunlu tutun.",
      "Onay akışını ajans müşterileriyle paylaşın.",
    ],
  },
  {
    slug: "x",
    name: "X",
    shortName: "X",
    color: "#0F1419",
    headline: "X gönderilerini karakter limitiyle planlayın",
    description:
      "280 karakter sayacı, gönderi önizlemesi ve zamanlama ile X hesabınızı diğer platformlarla birlikte yönetin.",
    longDescription:
      "X’te hız ve netlik kritiktir. SocialMarka canlı karakter sayacı, medya ekleme ve retry ile kısa güncellemeleri diğer mecralarla aynı iş akışında tutar. Hemen Paylaş kuyruğu gecikmeleri azaltır; hata durumunda sebebi görürsünüz.",
    benefits: [
      {
        title: "Karakter sayacı",
        desc: "Canlı önizlemede 280 limit kontrolü.",
      },
      {
        title: "Hızlı paylaşım",
        desc: "Hemen Paylaş ile kuyruğa anında alın.",
      },
      {
        title: "Hata takibi",
        desc: "Başarısız yayınlarda sebep ve yeniden dene.",
      },
    ],
    features: [
      "Gönderi planlama",
      "Medya ekleme",
      "Önizleme",
      "Retry",
      "Takvim entegrasyonu",
      "Durum ikonları",
    ],
    workflow: [
      {
        step: "01",
        title: "Kısa metni karakter limitiyle yazın",
        desc: "X hesabını seçip gönderiyi açın. Canlı karakter sayacını izleyerek metni 280 içinde tutun. Ana mesajı ilk cümlede verin; link varsa sonda bırakın.",
        details: [
          "Uzun LinkedIn metnini olduğu gibi yapıştırmayın; X’e özel kısaltın.",
          "Limit aşımında yayın öncesi uyarıyı ciddiye alın.",
        ],
      },
      {
        step: "02",
        title: "Medya ekleyip önizleyin",
        desc: "Görsel veya kısa video ekleyin. Önizlemede kırpma ve link kartının doğru göründüğünü kontrol edin.",
        details: [
          "Ağır videolar yükleme süresini uzatabilir; önce küçük bir test yapın.",
          "Medyasız kısa duyurular da Hemen Paylaş ile hızlı gider.",
        ],
      },
      {
        step: "03",
        title: "Yoğun saate göre zamanlayın",
        desc: "Takvimde kitlenizin aktif olduğu saatlere yerleştirin veya anlık duyuru için Hemen Paylaş’ı kullanın. Lansman gününde peş peşe kısa güncellemeler planlayabilirsiniz.",
        details: [
          "Aynı dakikaya çoklu gönderi yığmayın.",
          "Analitikteki saat dağılımına göre slot seçin.",
        ],
      },
      {
        step: "04",
        title: "Durumu izleyip hata varsa yeniden deneyin",
        desc: "Yayınlandı / hata ikonunu kontrol edin. Başarısızsa sebebi okuyun (kopuk hesap, limit, medya). Düzeltip yeniden deneyin.",
        details: [
          "Aynı gün içinde retry etmek görünürlüğü korur.",
          "Tekrarlayan hatalarda Hesaplar’dan X bağlantısını yenileyin.",
        ],
      },
    ],
    useCases: [
      {
        title: "Duyuru dalgaları",
        desc: "Ürün lansmanı gününde peş peşe kısa güncellemeler.",
      },
      {
        title: "Destek & topluluk",
        desc: "Hızlı yanıt gerektiren içerikleri planlı yayınlayın.",
      },
    ],
    tips: [
      "Thread mantığını metin override ile ayrı tutun.",
      "Link önizlemesini yayın öncesi kontrol edin.",
      "Başarısız gönderileri aynı gün içinde retry edin.",
    ],
  },
  {
    slug: "linkedin",
    name: "LinkedIn",
    shortName: "LI",
    color: "#0A66C2",
    headline: "LinkedIn şirket sayfası ve profesyonel içerik",
    description:
      "B2B odaklı metin ve medya kartı önizlemesiyle LinkedIn yayınlarınızı ajans standartlarında yönetin.",
    longDescription:
      "LinkedIn’de ton ve güven önemli. SocialMarka şirket sayfası ve profesyonel içerik için kart önizlemesi, platforma özel metin ve onay akışı sunar. Analitik ile erişim ve etkileşimi takip ederek B2B içerik ritmini güçlendirirsiniz.",
    benefits: [
      {
        title: "Profesyonel ton",
        desc: "Platforma özel metin override ile B2B dili koruyun.",
      },
      {
        title: "Kart önizleme",
        desc: "LinkedIn tarzı medya + metin mockup.",
      },
      {
        title: "Ekip onayları",
        desc: "Onay bekleyen gönderi akışı ile riski azaltın.",
      },
    ],
    features: [
      "Şirket sayfası",
      "Kişisel profil",
      "Analitik",
      "Takvim",
      "Onay akışı",
      "Marka grupları",
    ],
    workflow: [
      {
        step: "01",
        title: "Şirket sayfası veya profili bağlayın",
        desc: "Hesaplar’dan LinkedIn’i seçip doğru sayfa/profili yetkilendirin. B2B markalarda şirket sayfasını, kişisel thought leadership için profili kullanın. Ajanssanız marka grubuna ekleyin.",
        details: [
          "Yanlış sayfaya yayın riskine karşı isimleri net tutun.",
          "Yetki süresi dolunca yeniden bağlayın.",
        ],
      },
      {
        step: "02",
        title: "Uzun form içeriği LinkedIn tonunda yazın",
        desc: "Editörde LinkedIn override ile daha uzun, bağlamsal metin yazın. CTA’yı ilk paragrafta netleştirin. Medya kartı önizlemesinde başlık ve görsel uyumunu kontrol edin.",
        details: [
          "Instagram açıklamasını olduğu gibi taşımayın.",
          "Hashtag’i az ve ilgili tutun.",
        ],
      },
      {
        step: "03",
        title: "Gerekirse onay sürecinden geçirin",
        desc: "Müşteri veya hukuk onayı gerekiyorsa içeriği onay bekleyen durumda bırakın. Onay gelince zamanlamayı kilitleyin.",
        details: [
          "İzleyici rolü yalnızca görebilir; yayınlayamaz.",
          "Onay gecikmelerini takvimde boş slot bırakarak yönetin.",
        ],
      },
      {
        step: "04",
        title: "Yayınlayıp sonucu ve erişimi izleyin",
        desc: "Planlanan saatte yayınlanır. Durumu kontrol edin; ardından Analitik’te erişim ve etkileşimi inceleyip bir sonraki B2B içeriğini buna göre planlayın.",
        details: [
          "Haftalık uzman içerik ritmi LinkedIn’de tutarlılık sağlar.",
          "Müşteri sunumuna 3 net bulgu aktarın.",
        ],
      },
    ],
    useCases: [
      {
        title: "Thought leadership",
        desc: "Haftalık uzman içeriklerini düzenli yayınlayın.",
      },
      {
        title: "İşe alım & kültür",
        desc: "Şirket sayfasında kültür ve iş ilanı içeriklerini planlayın.",
      },
    ],
    tips: [
      "LinkedIn metnini diğer mecralardan daha uzun ve bağlamlı tutun.",
      "CTA’yı ilk paragrafta netleştirin.",
      "Raporları müşteri sunumuna aktarın.",
    ],
  },
  {
    slug: "youtube",
    name: "YouTube",
    shortName: "YT",
    color: "#FF0000",
    headline: "YouTube ve Shorts yayınlarını tek yerden planlayın",
    description:
      "Shorts dikey önizlemesi, kanal bilgisi mockup’ı ve zamanlanmış yükleme ile video stratejinizi yönetin.",
    longDescription:
      "YouTube’da düzenli Shorts ve video yayınları kanal büyümesini besler. SocialMarka dikey önizleme, meta alanları ve medya worker ile videoları hazırlar; takvimde diğer sosyal planlarla hizalar. Durum ikonlarıyla yükleme sonucunu takip edersiniz.",
    benefits: [
      {
        title: "Shorts önizleme",
        desc: "Kanal bilgisi ile dikey mockup.",
      },
      {
        title: "Medya işleme",
        desc: "FFmpeg worker ile varyant üretimi.",
      },
      {
        title: "Takvim hizası",
        desc: "Video yayınlarını IG/TikTok ile birlikte planlayın.",
      },
    ],
    features: [
      "Shorts planlama",
      "Video meta",
      "Zamanlama",
      "Durum ikonları",
      "Medya varyantları",
      "Çapraz mecra takvim",
    ],
    workflow: [
      {
        step: "01",
        title: "Kanalı bağlayıp videoyu yükleyin",
        desc: "YouTube kanalınızı Hesaplar’dan bağlayın. Gönderiler’de yeni içerik açıp video dosyasını yükleyin. Shorts için dikey, uzun form için uygun oranı seçin.",
        details: [
          "Büyük dosyalarda yükleme bitmeden zamanlamaya geçmeyin.",
          "Doğru kanalı seçtiğinizi (marka / müşteri) doğrulayın.",
        ],
      },
      {
        step: "02",
        title: "Başlık, açıklama ve formatı doldurun",
        desc: "Arama niyetine uygun başlık yazın, açıklamayı tamamlayın, Shorts ise formatı dikey tuttuğunuzu önizlemede teyit edin. Kapak / ilk kare okunaklı olsun.",
        details: [
          "Başlığı yalnızca tıklama tuzağı yapmayın; içerikle uyumlu olsun.",
          "Açıklamada zaman damgaları veya CTA ekleyebilirsiniz.",
        ],
      },
      {
        step: "03",
        title: "Takvimde yayın penceresini seçin",
        desc: "Shorts serilerini haftalık dilimlere yayın. TikTok/Instagram Reels ile aynı gün çakışmayı takvimden görün ve saatleri kaydırın.",
        details: [
          "Lansman teaser’larını peş peşe ama aralıklı planlayın.",
          "Hemen Paylaş’ı yalnızca acil yüklemelerde kullanın.",
        ],
      },
      {
        step: "04",
        title: "Yükleme sonucunu doğrulayın",
        desc: "Durum ikonlarıyla yüklemenin tamamlandığını kontrol edin. Hata varsa format, süre veya bağlantıyı düzeltip yeniden deneyin. Sonra Analitik’te erişimi izleyin.",
        details: [
          "Kısmi hatalarda yalnızca başarısız adımı retry edin.",
          "Shorts ritmini veriyle güçlendirin: işe yarayan saati sabitleyin.",
        ],
      },
    ],
    useCases: [
      {
        title: "Shorts serileri",
        desc: "Aynı temalı kısa videoları haftalık dilimlere yayın.",
      },
      {
        title: "Kampanya teaser’ları",
        desc: "Lansman öncesi teaser Shorts dalgası planlayın.",
      },
    ],
    tips: [
      "Shorts için dikey oranı zorunlu tutun.",
      "Başlığı arama niyetine göre yazın.",
      "Yayın sonrası analitikte erişimi izleyin.",
    ],
  },
  {
    slug: "pinterest",
    name: "Pinterest",
    shortName: "PIN",
    color: "#E60023",
    headline: "Pinterest pin’lerini planlayın ve yönetin",
    description:
      "Görsel keşif odaklı pin içeriklerini SocialMarka takviminde diğer platformlarla birlikte yürütün.",
    longDescription:
      "Pinterest keşif ve evergeen trafik için güçlüdür. SocialMarka pin kartı önizlemesi, toplu planlama ve marka gruplarıyla görsel içerikleri diğer mecralarla aynı takvimde yönetmenizi sağlar. Board bağlantısı ve medya tutarlılığı ajans işlerini kolaylaştırır.",
    benefits: [
      {
        title: "Görsel odak",
        desc: "Pin kartı tarzı önizleme.",
      },
      {
        title: "Toplu plan",
        desc: "Çoklu pin zamanlama.",
      },
      {
        title: "Marka grupları",
        desc: "Müşteri hesaplarını ayırın.",
      },
    ],
    features: [
      "Pin planlama",
      "Board bağlantısı",
      "Medya",
      "Raporlama",
      "Takvim",
      "Toplu zamanlama",
    ],
    workflow: [
      {
        step: "01",
        title: "Pin oranına uygun görseli seçin",
        desc: "Pinterest hesabını bağlayın, yeni içerik açın. Dikey / pin oranına uygun görsel kullanın; üzerindeki metin okunaklı olsun. Marka grubu varsa doğru müşteriyi seçin.",
        details: [
          "Bulanık veya aşırı yazı dolu görseller keşifte zayıf kalır.",
          "Evergreen ürün görsellerini ayrı bir klasörde toplayın.",
        ],
      },
      {
        step: "02",
        title: "Arama odaklı başlık ve açıklama yazın",
        desc: "Kullanıcının arayacağı kelimelerle başlık yazın (SEO). Açıklamada ürün faydasını ve net CTA’yı belirtin. Önizlemede pin kartını kontrol edin.",
        details: [
          "Sadece marka adıyla yetinmeyin; niyet kelimeleri ekleyin.",
          "Aynı görseli farklı başlıklarla A/B mantığında çeşitlendirebilirsiniz.",
        ],
      },
      {
        step: "03",
        title: "Board seçip zamanlayın",
        desc: "Hedef board’u seçin. Katalog pin’lerini aylık dilimlere, sezonluk kampanyaları ilgili haftalara yayın. Toplu planlamada çakışmaları takvimden görün.",
        details: [
          "Aynı board’a aynı gün aşırı pin yığmayın.",
          "Sezonluk içerikleri erken planlayıp unutmayın.",
        ],
      },
      {
        step: "04",
        title: "Etkileşimi raporlardan izleyin",
        desc: "Yayın sonrası Analitik / raporlarda pin performansına bakın. İşe yarayan görsel-başlık kombinasyonunu çoğaltın; zayıf olanları durdurun veya yenileyin.",
        details: [
          "Evergreen pin’ler uzun süre trafik getirebilir; sabırlı bakın.",
          "Kazananları diğer board’lara uyarlayarak genişletin.",
        ],
      },
    ],
    useCases: [
      {
        title: "Evergreen katalog",
        desc: "Ürün pin’lerini aylık dilimlere yayın.",
      },
      {
        title: "Sezonluk kampanyalar",
        desc: "Tatil dönemleri için pin dalgaları planlayın.",
      },
    ],
    tips: [
      "Pin görsellerinde metin alanını okunaklı tutun.",
      "Aynı görseli farklı board’lara çeşitlendirerek yayınlayın.",
      "SEO odaklı başlık kullanın.",
    ],
  },
];

export function getPlatform(slug: string): PlatformPage | undefined {
  return PLATFORMS.find((p) => p.slug === slug);
}
