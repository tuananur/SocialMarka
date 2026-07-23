export type FeatureSlug =
  | "editor"
  | "brand-groups"
  | "scheduling"
  | "social-inbox"
  | "analytics"
  | "rbac";

export type FeatureStep = {
  title: string;
  desc: string;
  details?: string[];
};

export type FeatureGuide = {
  slug: FeatureSlug;
  title: string;
  tag: string;
  menuDesc: string;
  headline: string;
  intro: string;
  howToIntro: string;
  sections: { title: string; body: string }[];
  steps: FeatureStep[];
  related: { title: string; href: string }[];
};

export const FEATURES: FeatureGuide[] = [
  {
    slug: "editor",
    title: "Çoklu Mecra Editörü",
    tag: "Editör",
    menuDesc: "Platforma özel metin ve önizleme.",
    headline: "Bir taslak, her platforma özel çıktı",
    intro:
      "Editörde tek bir ana metin yazarsınız; Instagram, LinkedIn, YouTube, X ve diğer mecralar için metni ayrı ayarlayıp yayın öncesi önizlersiniz.",
    howToIntro:
      "İlk gönderinizi sıfırdan oluştururken ekranda ne göreceğinizi ve hangi sırayla ilerleyeceğinizi adım adım anlatıyoruz.",
    sections: [
      {
        title: "Orijinal taslak",
        body: "Tek bir ana metin yazarsınız. Sonra her platform için karakter limiti, ton ve medya ihtiyacına göre metni özelleştirebilirsiniz.",
      },
      {
        title: "Canlı önizleme",
        body: "Feed, dikey Reels/Shorts veya LinkedIn kartı gibi platforma uygun görünümle yayın öncesi kontrol yaparsınız.",
      },
      {
        title: "Medya",
        body: "Görsel ve video eklenir; dikey format gerektiren mecralar için uygun varyant hazırlanır.",
      },
    ],
    steps: [
      {
        title: "Gönderiler ekranından yeni içerik açın",
        desc: "Panele giriş yaptıktan sonra sol menüden Gönderiler’e gidin ve yeni gönderi oluşturun. Henüz hesap bağlamadıysanız önce Hesaplar’dan en az bir mecra eklemeniz gerekir — yoksa yayın hedefi seçemezsiniz.",
        details: [
          "Boş bir taslak açılır; üstte veya yan panelde paylaşılacak hesap / marka grubu seçimi görünür.",
          "İlk denemede tek bir hesap seçmek, sonucu takip etmeyi kolaylaştırır.",
        ],
      },
      {
        title: "Ana metni (orijinal taslağı) yazın",
        desc: "Önce tüm mecralar için ortak fikri yazın. Bu metin varsayılan olarak seçtiğiniz platformlara gider; sonra platforma özel değişiklik yapabilirsiniz.",
        details: [
          "Kısa ve net başlayın; Instagram açıklaması ile LinkedIn yazısı aynı olmak zorunda değil.",
          "Hashtag veya mention ekleyecekseniz bunu platform override adımında ayrı tutmak daha güvenlidir.",
        ],
      },
      {
        title: "Platformlara özel metin ayarlayın",
        desc: "Her mecra için karakter limiti ve ton farklıdır. Örneğin X’te kısa tutun, LinkedIn’de bağlamı uzatın, Instagram’da görsel altı açıklamayı güçlendirin.",
        details: [
          "Override açık olan platformda ana metin yerine o platformun metni kullanılır.",
          "Karakter sayacı limiti aşarsa yayın öncesi uyarıyı görün; kısaltmadan devam etmeyin.",
        ],
      },
      {
        title: "Medya ekleyip önizleyin",
        desc: "Görsel veya video yükleyin. Dikey mecralarda (Reels, Shorts, TikTok) oran doğru görünüyor mu diye önizlemeyi mutlaka açın.",
        details: [
          "Yanlış oran yayın hatasına veya kırpılmaya yol açabilir.",
          "Önizleme, müşteriye veya ekibe göstermeden önce son kontrolünüzdür.",
        ],
      },
      {
        title: "Zamanlayın veya hemen paylaşın",
        desc: "İçerik hazırsa tarih/saat seçerek takvime alın ya da Hemen Paylaş ile kuyruğa gönderin. Durum taslak → zamanlandı / yayınlanıyor → yayınlandı şeklinde ilerler.",
        details: [
          "İlk testte Hemen Paylaş ile bağlantının çalıştığını doğrulayın.",
          "Hata alırsanız mesajı okuyun; çoğu zaman hesap yeniden bağlama veya metin kısaltma yeterlidir.",
        ],
      },
    ],
    related: [
      { title: "Zamanlama", href: "/features/scheduling" },
      { title: "Takvim rehberi", href: "/resources/calendar" },
      { title: "İlk gönderi", href: "/resources/ilk-gonderi" },
    ],
  },
  {
    slug: "brand-groups",
    title: "Marka Grupları",
    tag: "Ajans",
    menuDesc: "Müşteri hesaplarını gruplayın.",
    headline: "Ajans müşterilerini net ayırın",
    intro:
      "Marka grupları, bağlı sosyal hesapları müşteri veya marka bazında paketler. Yanlış hesaba yayın riskini azaltır.",
    howToIntro:
      "Ajans veya çok markalı ekipler için grup kurulumunu, hesap atamasını ve yayın sırasında nasıl seçeceğinizi anlatıyoruz.",
    sections: [
      {
        title: "Neden grup?",
        body: "Yanlış müşteri hesabına yayın riskini azaltır. Tek tıkla grubun tüm mecralarını seçersiniz.",
      },
      {
        title: "Yapı",
        body: "Her grup bir çalışma alanı içinde yaşar. Aynı hesabı iki gruba eklememek raporlama ve onay için daha sağlıklıdır.",
      },
      {
        title: "Yayın akışı",
        body: "Gönderi oluştururken önce grup, sonra gerekirse tekil hesap seçimi yapılır.",
      },
    ],
    steps: [
      {
        title: "Hesaplarınızın bağlı olduğundan emin olun",
        desc: "Gruplar boş paket değildir; içine sosyal hesap koyarsınız. Önce Hesaplar sayfasından müşteri veya marka hesaplarını bağlayın.",
        details: [
          "Bağlantı kopuksa gruba ekleseniz bile yayın başarısız olur.",
          "Ajanssanız her müşteri hesabını net isimlerle etiketleyin.",
        ],
      },
      {
        title: "Yeni marka grubu oluşturun",
        desc: "Panelde marka / müşteri adıyla yeni grup açın. İsim olarak müşteri markasını kullanın (ör. “Acme Kozmetik”), ajans adını değil.",
        details: [
          "Bir çalışma alanında birden fazla grup olabilir.",
          "İleride aramada kolay bulmak için tutarlı isimlendirme kullanın.",
        ],
      },
      {
        title: "Hesapları gruba atayın",
        desc: "Bağlı Instagram, LinkedIn, TikTok vb. hesapları ilgili gruba ekleyin. Bir hesabı iki farklı müşteri grubuna koymayın.",
        details: [
          "Yanlış atama, yanlış hesaba içerik riski demektir.",
          "Test hesabını ayrı bir “Sandbox” grubunda tutabilirsiniz.",
        ],
      },
      {
        title: "Yayında grubu seçin",
        desc: "Gönderi oluştururken hedef olarak grubu seçin; grubun tüm mecraları işaretlenir. İsterseniz içinden tek hesabı çıkarabilirsiniz.",
        details: [
          "Böylece her seferinde hesapları tek tek aramak zorunda kalmazsınız.",
          "Onay sürecinde müşteri yalnızca kendi grubunun içeriğini görür / onaylar.",
        ],
      },
    ],
    related: [
      { title: "Hesap bağlama", href: "/resources/accounts" },
      { title: "Editör", href: "/features/editor" },
      { title: "Platformlar", href: "/platforms" },
    ],
  },
  {
    slug: "scheduling",
    title: "Zamanlama & Hemen Paylaş",
    tag: "Yayın",
    menuDesc: "Kuyruk, planlı ve anında yayın.",
    headline: "Planlı veya anında güvenle yayınlayın",
    intro:
      "İçeriği hemen paylaşabilir veya ileri bir saate planlayabilirsiniz. Durumu takip eder, hata olursa yeniden denersiniz.",
    howToIntro:
      "Hemen Paylaş ile zamanlama arasındaki farkı, takvimde ne göreceğinizi ve bir şey ters giderse ne yapacağınızı adım adım açıklıyoruz.",
    sections: [
      {
        title: "Hemen Paylaş",
        body: "İçerik anında yayın kuyruğuna alınır ve kısa sürede hedef hesaplara gider.",
      },
      {
        title: "Zamanlama",
        body: "Seçtiğiniz tarih ve saatte otomatik yayınlanır. Başarısız olursa hata mesajı ve yeniden deneme vardır.",
      },
      {
        title: "Kısmi başarı",
        body: "Birden fazla hesaptan biri başarısız olursa durum kısmi hata olabilir; başarısız hedefleri ayrı yeniden deneyebilirsiniz.",
      },
    ],
    steps: [
      {
        title: "İçeriği editörde bitirin",
        desc: "Metin, medya ve hedef hesaplar hazır olmadan zamanlamaya geçmeyin. Eksik medya veya boş hesap seçimi yayın hatasına yol açar.",
        details: [
          "Önizlemeyi bir kez açıp “bu hesapta böyle görünecek” diyebildiğinizden emin olun.",
          "Birden fazla platform seçtiyseniz her birinin metin limitini kontrol edin.",
        ],
      },
      {
        title: "Hemen Paylaş veya tarih seçin",
        desc: "Hemen Paylaş: içerik kuyruğa düşer, birkaç saniye–dakika içinde yayınlanır. Zamanlama: takvimden gün ve saat seçersiniz; o anda otomatik gider.",
        details: [
          "İlk bağlantı testinde Hemen Paylaş kullanın.",
          "Kampanya planında haftalık sabit saatler (ör. Salı 10:00) tutarlılık sağlar.",
          "Aynı dakikaya çok fazla mecra yığmayın; aralıklı planlayın.",
        ],
      },
      {
        title: "Durumu takip edin",
        desc: "Gönderiler veya Takvim’de durum ikonlarını izleyin: taslak, zamanlandı, yayınlanıyor, yayınlandı, hata. Takvim rehberi görünümleri ayrıntılı anlatır.",
        details: [
          "Yayınlandı = hedef platformda içerik oluştu.",
          "Hata = mesajı açın; sık nedenler: kopuk hesap, limit, medya formatı.",
        ],
      },
      {
        title: "Hata varsa düzeltip yeniden deneyin",
        desc: "Başarısız veya kısmi başarılı gönderide hata metnini okuyun. Hesabı yeniden bağlayın, metni kısaltın veya medyayı düzeltin; ardından yeniden dene.",
        details: [
          "Başarılı olan hesapları tekrar göndermeniz gerekmez; yalnızca başarısız hedefleri retry edin.",
          "Aynı hata tekrarlanıyorsa Hesap bağlama rehberine dönün.",
        ],
      },
    ],
    related: [
      { title: "Takvim rehberi", href: "/resources/calendar" },
      { title: "Editör", href: "/features/editor" },
      { title: "Analitik", href: "/features/analytics" },
    ],
  },
  {
    slug: "social-inbox",
    title: "Sosyal Gelen Kutusu",
    tag: "Etkileşim",
    menuDesc: "Yorum ve DM yönetimi.",
    headline: "Etkileşimleri tek ekranda toplayın",
    intro:
      "Desteklenen mecralardaki yorum ve mesajlar tek listede toplanır. Filtreleyip yanıtlar, okundu işaretlersiniz.",
    howToIntro:
      "Gelen kutusunu günlük iş akışınızda nasıl kullanacağınızı — açılıştan yanıta, filtrelemeden ekip kullanımına — anlatıyoruz.",
    sections: [
      {
        title: "Tek liste",
        body: "Desteklenen mecralardaki yorum ve mesajlar birleşik listelenir.",
      },
      {
        title: "Filtreler",
        body: "Platform, okunmamış ve hesap bazlı filtrelerle önceliklendirin.",
      },
      {
        title: "Yanıt",
        body: "Doğrudan panelden yanıtlayın; sonuç ilgili sosyal hesaba yazılır.",
      },
    ],
    steps: [
      {
        title: "Gelen Kutusu’nu açın",
        desc: "Sol menüden Gelen Kutusu’na gidin. Hesaplar bağlı ve desteklenen etkileşimler geliyorsa liste dolmaya başlar. Boşsa önce hesap bağlantısını ve platform desteğini kontrol edin.",
        details: [
          "Yeni bağlı hesaplarda olayların görünmesi biraz sürebilir.",
          "Detaylı sorun giderme için Kaynaklar → Gelen kutusu rehberine bakın.",
        ],
      },
      {
        title: "Önceliği filtrelerle netleştirin",
        desc: "Okunmamış, platform veya hesap filtresiyle yoğunluğu yönetin. Ajanslarda önce müşteri hesabına göre daraltmak iş yükünü böler.",
        details: [
          "Günde iki kez “okunmamış” taraması çoğu ekip için yeterlidir.",
          "Spam’i yanıtlamadan okundu yaparak listeyi temiz tutun.",
        ],
      },
      {
        title: "Konuşmayı açıp yanıtlayın",
        desc: "Bir satıra tıklayın, geçmişi okuyun, yanıtınızı yazıp gönderin. Yanıt ilgili hesabın bağlantısı üzerinden platforma iletilir.",
        details: [
          "Yanıt başarısız olursa nedeni görün; token süresi dolmuş olabilir.",
          "Editör rolü yanıtlayabilir; İzleyici yalnızca görür (RBAC).",
        ],
      },
      {
        title: "Okundu işaretleyip kapatın",
        desc: "İşiniz bitince okundu yapın. Böylece ekip arkadaşınız aynı konuşmayı tekrar öncelikli sanmaz.",
        details: [
          "Yoğun günlerde filtrelenmiş “okunmamış = 0” hedefi koyun.",
          "Kritik şikayetleri not alıp ilgili müşteriye iletin.",
        ],
      },
    ],
    related: [
      { title: "Gelen kutusu rehberi", href: "/resources/inbox" },
      { title: "Hesap bağlama", href: "/resources/accounts" },
      { title: "RBAC", href: "/features/rbac" },
    ],
  },
  {
    slug: "analytics",
    title: "Analitik",
    tag: "Rapor",
    menuDesc: "Erişim, etkileşim ve özetler.",
    headline: "Performansı grafiklerle okuyun",
    intro:
      "Takipçi, erişim, beğeni ve zaman dağılımını görün; bir sonraki içerik planını verilere göre güncelleyin.",
    howToIntro:
      "Analitik ekranını açtıktan sonra hangi filtreleri kullanacağınızı, grafiklere nasıl bakacağınızı ve planı nasıl güncelleyeceğinizi anlatıyoruz.",
    sections: [
      {
        title: "Hesap metrikleri",
        body: "Bağlı hesaplar için özetler: takipçi, erişim, etkileşim.",
      },
      {
        title: "Zaman dağılımı",
        body: "Saatlik / haftalık yoğunluk ile bir sonraki planlama penceresini seçersiniz.",
      },
      {
        title: "Müşteri sunumu",
        body: "Ajanslar haftalık özeti müşteriye aktarmak için kullanır.",
      },
    ],
    steps: [
      {
        title: "Analitik sayfasını açın",
        desc: "Panelde Analitik’e gidin. Veri görmek için en az bir hesap bağlı olmalı ve bir süre yayın geçmişi bulunmalıdır; sıfırdan hesapta grafik boş görünebilir.",
        details: [
          "Yeni hesabı bağladıktan sonra metriklerin dolması zaman alabilir.",
          "Önce tek hesap seçerek okumayı öğrenin, sonra karşılaştırın.",
        ],
      },
      {
        title: "Hesap ve dönem seçin",
        desc: "Hangi markayı / hesabı ve hangi tarih aralığını inceleyeceğinizi seçin. Haftalık bakış ajans raporları için, aylık bakış trend için uygundur.",
        details: [
          "Kampanya haftasını izole ederek “önce / sonra” kıyaslayın.",
          "Marka grubu kullanıyorsanız müşteri bazlı bakış için ilgili hesapları seçin.",
        ],
      },
      {
        title: "Grafikleri yorumlayın",
        desc: "Erişim yükselip etkileşim düşüyorsa içerik türünü veya saati değiştirin. Yoğun saat grafiği, bir sonraki zamanlama slotlarını seçmenize yardım eder.",
        details: [
          "Tek bir viral gün tüm ortalamayı bozabilir; medyan / tipik güne bakın.",
          "Müşteri sunumunda 3 net bulgu + 1 aksiyon yeterlidir.",
        ],
      },
      {
        title: "Planı güncelleyin",
        desc: "Öğrendiklerinizi Takvim ve Editör’e taşıyın: daha iyi saatlere taşıyın, zayıf mecrayı azaltın, işe yarayan formatı çoğaltın.",
        details: [
          "Analitik tek başına yayın yapmaz; Zamanlama ile birleştirin.",
          "Haftalık ritüel: Pazartesi 15 dk analitik → takvim güncellemesi.",
        ],
      },
    ],
    related: [
      { title: "Zamanlama", href: "/features/scheduling" },
      { title: "Takvim", href: "/resources/calendar" },
      { title: "Platformlar", href: "/platforms" },
    ],
  },
  {
    slug: "rbac",
    title: "RBAC Yönetimi",
    tag: "Güvenlik",
    menuDesc: "Roller ve yetkiler.",
    headline: "Kim ne yapabilir — net roller",
    intro:
      "Admin, Editör ve İzleyici rolleriyle ekip yetkilerini ayırırsınız. Yanlışlıkla yayın veya hesap bağlama riskini azaltırsınız.",
    howToIntro:
      "Üye davetinden rol atamaya, yetkiyi test etmeye kadar ekibinizi güvenli kurmanın adımlarını anlatıyoruz.",
    sections: [
      {
        title: "Admin",
        body: "Hesap bağlama, gruplar, ekip daveti ve yayın ayarları.",
      },
      {
        title: "Editör",
        body: "İçerik oluşturma, planlama, gelen kutusu yanıtı (yetkiye göre).",
      },
      {
        title: "İzleyici",
        body: "Takvim ve raporları görür; yayın veya bağlama yapamaz.",
      },
    ],
    steps: [
      {
        title: "Çalışma alanınızı hazırlayın",
        desc: "Kayıt sonrası sizin Admin olduğunuz alan açılır. Ekip eklemeden önce alan adını marka/ajansınıza göre netleştirin.",
        details: [
          "İlk günde tek Admin yeterlidir; fazla Admin karmaşa yaratabilir.",
          "Çalışma alanı rehberi kurulumun geri kalanını anlatır.",
        ],
      },
      {
        title: "Üye davet edin",
        desc: "Ekip arkadaşının e-postasını girerek davet gönderin. Davet kabul edilince kişi çalışma alanına üye olur.",
        details: [
          "Müşteri temsilcisine İzleyici veya sınırlı Editör vermeyi düşünün.",
          "Ajans içi içerik üreticilerine Editör verin.",
        ],
      },
      {
        title: "Doğru rolü atayın",
        desc: "Admin: hesap ve ekip. Editör: içerik ve planlama. İzleyici: sadece görme. “Herkese Admin” vermeyin.",
        details: [
          "Hesap bağlama yetkisi olan kişi sayısı az olsun.",
          "Rol değişince kişinin bir sonraki oturumunda menü farkını kontrol edin.",
        ],
      },
      {
        title: "Yetkiyi küçük bir testle doğrulayın",
        desc: "Editör hesabıyla giriş yapıp yalnızca içerik oluşturabildiğini, İzleyici’nin yayın butonunu görmediğini kontrol edin.",
        details: [
          "Test geçmeden müşteri hesabı bağlamayın.",
          "Şüpheli işlemlerde denetim / aktivite kaydına bakın.",
        ],
      },
    ],
    related: [
      { title: "Çalışma alanı", href: "/resources/workspace" },
      { title: "Marka grupları", href: "/features/brand-groups" },
      { title: "İletişim", href: "/contact" },
    ],
  },
];

export function getFeature(slug: string): FeatureGuide | undefined {
  return FEATURES.find((f) => f.slug === slug);
}
