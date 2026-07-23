export type ResourceSlug =
  | "baslangic"
  | "workspace"
  | "accounts"
  | "ilk-gonderi"
  | "calendar"
  | "inbox"
  | "sss";

export type ResourceCategory = "baslarken" | "kullanim" | "yardim";

export type ResourceGuide = {
  slug: ResourceSlug;
  category: ResourceCategory;
  title: string;
  shortTitle: string;
  menuDesc: string;
  headline: string;
  intro: string;
  sections: { title: string; body: string }[];
  steps: { title: string; desc: string; details?: string[] }[];
  tips: string[];
  related: { title: string; href: string }[];
};

export const RESOURCE_CATEGORIES: {
  id: ResourceCategory;
  label: string;
  desc: string;
}[] = [
  {
    id: "baslarken",
    label: "Başlarken",
    desc: "SocialMarka’yı tanımak ve ilk adımları atmak.",
  },
  {
    id: "kullanim",
    label: "Günlük kullanım",
    desc: "Yayın, takvim ve gelen kutusu.",
  },
  {
    id: "yardim",
    label: "Yardım",
    desc: "Sık sorulanlar ve destek.",
  },
];

export const RESOURCES: ResourceGuide[] = [
  {
    slug: "baslangic",
    category: "baslarken",
    shortTitle: "SocialMarka nedir?",
    title: "SocialMarka’ya giriş",
    menuDesc: "Ürünü 2 dakikada tanıyın.",
    headline: "Sosyal medyanızı tek yerden yönetin",
    intro:
      "Bu site bir tanıtım ve yol gösterici alandır. SocialMarka; TikTok, Instagram, X, LinkedIn, YouTube ve Pinterest hesaplarınızı tek panelde planlamanıza, yayınlamanıza ve yanıtlamanıza yardımcı olur.",
    sections: [
      {
        title: "Kime uygun?",
        body: "Marka ekipleri, ajanslar ve tek kişilik içerik üreticileri. Birden fazla hesap veya müşteri yönetiyorsanız özellikle işinize yarar: içerik, takvim, gelen kutusu ve temel analitik aynı yerde.",
      },
      {
        title: "Ne yapabilirsiniz?",
        body: "İçerik yazıp önizleme almak, ileriye tarihlemek veya hemen paylaşmak, takvimde görmek, yorum/mesajları (desteklenen mecralarda) tek gelen kutusundan yanıtlamak ve performans özetlerine bakmak.",
      },
      {
        title: "Nasıl ilerlemelisiniz?",
        body: "Önce ücretsiz kayıt olun → çalışma alanınız açılır → sosyal hesaplarınızı bağlayın → ilk gönderiyi yayınlayın. Aşağıdaki adımlar ve diğer rehberler sizi sırayla götürür.",
      },
    ],
    steps: [
      {
        title: "Kayıt olun",
        desc: "Ücretsiz Dene’ye tıklayın; ad, e-posta ve en az 6 karakter şifre girin. Kayıt bitince oturum açılır ve panel (Gönderiler) otomatik gelir — ekstra giriş gerekmez.",
        details: [
          "Google girişi yapılandırılmamışsa e-posta/şifre yeterlidir.",
          "Kayıt sonrası karşılama bildirimi görürsünüz.",
        ],
      },
      {
        title: "Hesap bağlayın",
        desc: "Sol menüden Hesaplar’a gidin. En az bir mecra seçip platformun izin ekranını tamamlayın. Hesap listede görünmeden yayın hedefi seçemezsiniz.",
        details: [
          "İlk gün tek hesap yeterli; sonra genişletin.",
          "Detay için Hesap bağlama rehberine bakın.",
        ],
      },
      {
        title: "İlk gönderiyi paylaşın",
        desc: "Gönderiler’den yeni içerik açın, hesabı seçin, kısa bir test metni yazın. Hemen Paylaş ile sonucu hemen görün veya ileri bir saate planlayın.",
        details: [
          "İlk testte tek mecra seçmek hataları ayıklamayı kolaylaştırır.",
          "Adım adım için İlk gönderi rehberini açın.",
        ],
      },
      {
        title: "Takvim ve gelen kutusunu kullanın",
        desc: "Planlı içerikleri Takvim’de izleyin; yorum/mesajları Gelen Kutusu’ndan yanıtlayın. Takıldığınızda SSS veya İletişim’e gidin.",
        details: [
          "Haftalık ritmi sabitlemek büyümenin anahtarıdır.",
          "Özellik detayları Platform / Özellikler menüsünde.",
        ],
      },
    ],
    tips: [
      "İlk gün tek platform + tek gönderi yeterli; sonra genişletin.",
      "Ajanssanız müşteri hesaplarını marka gruplarında toplayın.",
      "Takıldığınızda İletişim formundan yazın veya SSS rehberine bakın.",
    ],
    related: [
      { title: "İlk çalışma alanı", href: "/resources/workspace" },
      { title: "İlk gönderi", href: "/resources/ilk-gonderi" },
      { title: "Ücretsiz dene", href: "/register" },
    ],
  },
  {
    slug: "workspace",
    category: "baslarken",
    shortTitle: "İlk çalışma alanı",
    title: "İlk çalışma alanınızı oluşturma",
    menuDesc: "Kayıt sonrası alanınız nasıl açılır?",
    headline: "Çalışma alanınız sizin için hazır",
    intro:
      "Kayıt olduğunuzda SocialMarka sizin için bir çalışma alanı açar. Ekip arkadaşlarını davet etmek, rolleri ayarlamak ve paneli kullanmaya başlamak buradan ilerler.",
    sections: [
      {
        title: "Kayıt sonrası ne görürsünüz?",
        body: "Oturum açılır ve Gönderiler ekranına düşersiniz. Arka planda çalışma alanınız ve sizin yönetici üyeliğiniz oluşmuştur — ekstra kurulum şart değil.",
      },
      {
        title: "Alan adı ve ekip",
        body: "Varsayılan ad “Adınız Çalışma Alanı”dır; markanıza göre değiştirebilirsiniz. Ekip arkadaşlarını Admin, Editör veya İzleyici olarak ekleyebilirsiniz.",
      },
      {
        title: "Roller kısaca",
        body: "Admin: hesap bağlama ve ekip. Editör: içerik yazma ve planlama. İzleyici: yalnızca görme. İlk günde Admin + bir Editör çoğu ekip için yeterlidir.",
      },
    ],
    steps: [
      {
        title: "Kayıt olun",
        desc: "Ücretsiz Dene ile ad, e-posta ve şifre girin. Sistem sizin için bir çalışma alanı ve Admin üyeliği oluşturur; panele düşersiniz.",
        details: [
          "Varsayılan alan adı genelde “Adınız Çalışma Alanı” şeklindedir.",
          "Ekstra kurulum sihirbazı gerekmez.",
        ],
      },
      {
        title: "Panele bakın",
        desc: "Sol menüde Gönderiler, Takvim, Hesaplar, Gelen Kutusu ve Analitik’i görün. İlk gün bu menülerle gezinerek haritayı öğrenin.",
        details: [
          "Gönderiler = içerik üretimi.",
          "Hesaplar = sosyal bağlantılar; Takvim = plan görünümü.",
        ],
      },
      {
        title: "Alanı adlandırın",
        desc: "Çalışma alanı adını marka veya ajansınıza çevirin. Ajanssanız alan adını ajansınızla tutun; müşteriler için sonra marka grupları kullanın.",
        details: [
          "Net isim, ekip davetinde karışıklığı azaltır.",
          "Bir kullanıcı birden fazla alana üye olabilir.",
        ],
      },
      {
        title: "İlk kişiyi davet edin",
        desc: "Gerekirse bir Editör ekleyin. Yalnız çalışıyorsanız bu adımı atlayın. Roller: Admin (hesap/ekip), Editör (içerik), İzleyici (salt okuma).",
        details: [
          "İlk günde Admin + bir Editör çoğu ekip için yeterlidir.",
          "Herkese Admin vermeyin; RBAC rehberine bakın.",
        ],
      },
    ],
    tips: [
      "Ajans iseniz alan adını ajansınızla tutun; müşteriler için marka grupları kullanın.",
      "Şifrenizi güvenli tutun; Google girişi açık değilse e-posta/şifre yeterlidir.",
      "Bir sonraki adım: sosyal hesap bağlama rehberi.",
    ],
    related: [
      { title: "Hesap bağlama", href: "/resources/accounts" },
      { title: "SocialMarka nedir?", href: "/resources/baslangic" },
      { title: "Kayıt Ol", href: "/register" },
    ],
  },
  {
    slug: "accounts",
    category: "baslarken",
    shortTitle: "Hesap bağlama",
    title: "Sosyal hesapları bağlama",
    menuDesc: "Hesapları panele nasıl eklersiniz?",
    headline: "Hesaplarınızı güvenle bağlayın",
    intro:
      "Yayın ve gelen kutusu için sosyal hesaplarınızı panele bağlamanız gerekir. Desteklenen mecralar: TikTok, Instagram, X, LinkedIn, YouTube ve Pinterest.",
    sections: [
      {
        title: "Nasıl bağlanır?",
        body: "Panelde Hesaplar sayfasından mecrayı seçersiniz. Platformun kendi giriş ekranı açılır; izin verdikten sonra hesap SocialMarka’ya bağlanır. Bağlantı koparsa aynı yerden yeniden yetkilendirirsiniz.",
      },
      {
        title: "Marka grupları",
        body: "Birden fazla hesap veya müşteri varsa hesapları gruplarda toplayın. Yayın sırasında grubu seçmek, yanlış hesaba paylaşımı azaltır.",
      },
      {
        title: "Güvenlik",
        body: "Şifrenizi SocialMarka’ya yazmazsınız; bağlantı platformun resmi izin ekranı üzerinden yapılır. İstediğiniz zaman hesabı kaldırabilirsiniz.",
      },
    ],
    steps: [
      {
        title: "Hesaplar’ı açın",
        desc: "Panel sol menüsünden Hesaplar sayfasına gidin. Burada bağlı hesapları, durumlarını (aktif / yeniden yetkilendirme gerekli) ve marka gruplarını yönetirsiniz.",
        details: [
          "Admin rolü olmadan hesap bağlayamayabilirsiniz.",
          "Liste boşsa henüz hiç mecra eklenmemiş demektir.",
        ],
      },
      {
        title: "Mecrayı seçip izin verin",
        desc: "TikTok, Instagram, X, LinkedIn, YouTube veya Pinterest’ten birini seçin. Platformun kendi giriş/izin ekranı açılır; onaylayınca hesap SocialMarka’ya bağlanır. Şifrenizi bize yazmazsınız.",
        details: [
          "Pencereyi yarıda kapatırsanız bağlantı tamamlanmaz; tekrar deneyin.",
          "Kopuk hesapları aynı yerden yeniden yetkilendirin.",
        ],
      },
      {
        title: "Grup oluşturun (isteğe bağlı)",
        desc: "Birden fazla marka veya müşteri varsa marka / müşteri adıyla grup açıp ilgili hesapları içine alın. Yayın sırasında grubu seçmek yanlış hesaba paylaşımı azaltır.",
        details: [
          "Aynı hesabı iki gruba eklemeyin.",
          "Marka Grupları özelliği bu konuyu derinlemesine anlatır.",
        ],
      },
      {
        title: "Kısa bir test paylaşımı yapın",
        desc: "Gönderiler’den bağlı hesapla mini bir metin paylaşın (Hemen Paylaş). Başarılıysa bağlantı tamamdır; hata varsa mesajı okuyup hesabı yenileyin.",
        details: [
          "Önce test hesabı, sonra müşteri hesapları.",
          "Sonraki adım: İlk gönderi rehberi.",
        ],
      },
    ],
    tips: [
      "Önce kendi test hesabınızla deneyin, sonra müşteri hesaplarını ekleyin.",
      "Aynı hesabı iki gruba eklemeyin; karışıklık yaratır.",
      "Her mecranın sınırlarını Platform sayfalarından okuyabilirsiniz.",
    ],
    related: [
      { title: "İlk gönderi", href: "/resources/ilk-gonderi" },
      { title: "Platformlar", href: "/platforms" },
      { title: "Marka grupları", href: "/features/brand-groups" },
    ],
  },
  {
    slug: "ilk-gonderi",
    category: "kullanim",
    shortTitle: "İlk gönderi",
    title: "İlk gönderinizi yayınlama",
    menuDesc: "Yazın, önizleyin, paylaşın.",
    headline: "İlk içeriğinizi birkaç dakikada yayınlayın",
    intro:
      "Hesabınız bağlıysa Gönderiler ekranından metin yazıp hemen paylaşabilir veya ileri bir saate planlayabilirsiniz. Bu rehber yalnızca ilk yayın deneyiminize odaklanır.",
    sections: [
      {
        title: "Editörde ne yaparsınız?",
        body: "Metninizi yazın, paylaşılacak hesabı veya marka grubunu seçin, mecraya göre kısa önizleme alın. Karakter ve format farkları platforma göre değişebilir.",
      },
      {
        title: "Hemen Paylaş mı, zamanlama mı?",
        body: "Hemen Paylaş: içerik kuyruğa düşer ve kısa sürede yayınlanır. Zamanlama: tarih ve saat seçersiniz; o anda otomatik gider. İlk denemede Hemen Paylaş ile sonucu hemen görmek kolaydır.",
      },
      {
        title: "Sonuç nasıl görünür?",
        body: "Durum taslak → zamanlandı / yayınlanıyor → yayınlandı (veya hata) şeklinde ilerler. Hata olursa mesajı okuyup düzeltip yeniden deneyebilirsiniz.",
      },
    ],
    steps: [
      {
        title: "Gönderiler’i açın",
        desc: "Panelde Gönderiler’e gidin ve yeni gönderi oluşturun. Hesap bağlı değilse önce Hesap bağlama rehberini tamamlayın; aksi halde hedef seçemezsiniz.",
        details: [
          "Boş taslak açılır; metin, medya ve hedef alanları görünür.",
          "İlk denemede tek platform seçin.",
        ],
      },
      {
        title: "Hesap veya marka grubunu seçin",
        desc: "Paylaşılacak bağlı hesabı işaretleyin. Ajanssanız marka grubunu seçerek o müşterinin mecralarını toplu işaretleyebilirsiniz; yanlış grubu seçmediğinizi kontrol edin.",
        details: [
          "Birden fazla mecra seçmek ilk testte karışıklık yaratabilir.",
          "Grup mantığı için Marka Grupları sayfasına bakın.",
        ],
      },
      {
        title: "Kısa bir test metni yazın",
        desc: "Hashtag ve uzun metin şart değil — amaç bağlantının çalıştığını görmek. İsterseniz basit bir görsel ekleyip önizlemeyi açın; karakter limitini aşmayın.",
        details: [
          "Platforma özel metin için Editör özelliğine bakın.",
          "X’te kısa, LinkedIn’de daha uzun tutmak ileride işinize yarar.",
        ],
      },
      {
        title: "Hemen Paylaş veya tarih seçin",
        desc: "Hemen Paylaş: kuyruğa düşer, kısa sürede yayınlanır. Zamanlama: gün/saat seçersiniz; takvimde slot görünür. Durumu (yayınlandı / hata) izleyin; hata varsa mesajı okuyup düzeltin.",
        details: [
          "İlk testte Hemen Paylaş daha öğreticidir.",
          "Planlı yayınları Takvim rehberinden yönetirsiniz.",
        ],
      },
    ],
    tips: [
      "İlk gönderide hashtag ve uzun metin şart değil; bağlantının çalıştığını doğrulayın.",
      "Aynı anda çok mecra seçmeyin; önce bir mecrada başarıyı görün.",
      "Planlı yayınları Takvim rehberinden izleyebilirsiniz.",
    ],
    related: [
      { title: "Takvim", href: "/resources/calendar" },
      { title: "Editör özelliği", href: "/features/editor" },
      { title: "Zamanlama", href: "/features/scheduling" },
    ],
  },
  {
    slug: "calendar",
    category: "kullanim",
    shortTitle: "Takvim",
    title: "Takvimle içerik planlama",
    menuDesc: "Haftalık planı tek bakışta görün.",
    headline: "İçerik planınızı takvimde yönetin",
    intro:
      "Takvim; neyin ne zaman gideceğini görmenizi sağlar. Liste, gün, hafta ve ay görünümleriyle doluluğu ve durumları takip edersiniz.",
    sections: [
      {
        title: "Görünümler",
        body: "Hafta görünümü ajans ve marka ekipleri için pratiktir. Ay görünümü kampanya yoğunluğunu gösterir. Liste görünümü durumlara göre filtrelemek için uygundur.",
      },
      {
        title: "Durumlar",
        body: "Taslak, zamanlanmış, onay bekleyen, yayınlandı veya hata gibi durumlar ikon/renk ile ayrılır. Böylece “hangi içerik nerede?” sorusuna hızlı cevap alırsınız.",
      },
      {
        title: "Planlama alışkanlığı",
        body: "Gönderiler’den içerik oluşturup tarih seçerek takvime düşürürsünüz. Haftalık sabit gün/saat şablonu (ör. Salı 10:00 LinkedIn) ritmi kolaylaştırır.",
      },
    ],
    steps: [
      {
        title: "Takvim’i açın",
        desc: "Sol menüden Takvim’e gidin. Burada planlı, yayınlanan ve hatalı gönderileri zaman çizelgesinde görürsünüz — “ne zaman ne gidiyor?” sorusunun cevabı buradadır.",
        details: [
          "İçerik oluşturma yine Gönderiler’den yapılır; takvim görünüm ve takiptir.",
          "Boş takvim = henüz zamanlanmış içerik yok demektir.",
        ],
      },
      {
        title: "Görünüm seçin",
        desc: "Liste: durum bazlı tarama. Gün: yoğun gün detayı. Hafta: ajanslar için en pratik. Ay: kampanya doluluğu. Hafta ile başlayıp ritminizi görün.",
        details: [
          "Onay bekleyen içerikler için Liste + filtre kullanın.",
          "Ay görünümünde boş günleri önceden doldurun.",
        ],
      },
      {
        title: "Gönderiler’den içerik zamanlayın",
        desc: "Yeni gönderi oluşturup tarih/saat seçin. Kayıttan sonra ilgili slot takvimde görünür. Sabit şablon (ör. Salı 10:00 LinkedIn) tutarlılık sağlar.",
        details: [
          "Aynı saate çok mecra yığmayın; 15–30 dk aralayın.",
          "Zamanlama özelliği kuyruk ve retry’yi anlatır.",
        ],
      },
      {
        title: "Durum ikonlarını izleyin",
        desc: "Taslak, zamanlandı, onay bekleyen, yayınlandı, hata renk/ikon ile ayrılır. Yayın sonrası ikonun güncellendiğini kontrol edin; hata varsa açıp yeniden deneyin.",
        details: [
          "Kısmi hatada yalnızca başarısız hedefleri retry edin.",
          "Haftalık Pazartesi 10 dk takvim turu alışkanlık yapın.",
        ],
      },
    ],
    tips: [
      "Aynı saate çok fazla mecra yığmayın; aralıklı planlayın.",
      "Onay süreci varsa “onay bekleyen”leri ayrı takip edin.",
      "Boş günleri önceden doldurmak son dakika stresini azaltır.",
    ],
    related: [
      { title: "İlk gönderi", href: "/resources/ilk-gonderi" },
      { title: "Zamanlama özelliği", href: "/features/scheduling" },
      { title: "Hesap bağlama", href: "/resources/accounts" },
    ],
  },
  {
    slug: "inbox",
    category: "kullanim",
    shortTitle: "Gelen kutusu",
    title: "Gelen kutusu ile yanıtlamak",
    menuDesc: "Yorum ve mesajları tek yerden yönetin.",
    headline: "Etkileşimleri kaçırmayın",
    intro:
      "Desteklenen platformlarda yorum ve mesajlar tek gelen kutusunda toplanır. Filtreleyip yanıtlayarak topluluğunuzu takip edebilirsiniz.",
    sections: [
      {
        title: "Tek liste",
        body: "Bağlı hesaplardan gelen etkileşimler bir arada görünür. Platform filtresi ve okunmamış görünümü ile öncelik verirsiniz.",
      },
      {
        title: "Yanıtlama",
        body: "Konuşmayı açıp yanıt yazarsınız; yanıt ilgili sosyal hesap üzerinden gider. Başarısız olursa nedeni görüp tekrar deneyebilirsiniz.",
      },
      {
        title: "Ekip kullanımı",
        body: "Editörler yanıtlasın, İzleyiciler yalnızca görsün diye rollerle ayırabilirsiniz. Yoğun hesaplarda günde iki kez “okunmamış” taraması yeterlidir.",
      },
    ],
    steps: [
      {
        title: "Gelen Kutusu’nu açın",
        desc: "Sol menüden Gelen Kutusu’na gidin. Desteklenen mecralardaki yorum ve mesajlar burada toplanır. Liste boşsa hesap bağlantısını ve platform desteğini kontrol edin.",
        details: [
          "Yeni bağlı hesaplarda olaylar biraz gecikmeli gelebilir.",
          "Özellik özeti için Sosyal Gelen Kutusu sayfasına bakın.",
        ],
      },
      {
        title: "Önceliği filtrelerle netleştirin",
        desc: "Okunmamış, platform veya hesap filtresiyle daraltın. Ajanslarda önce müşteri hesabına göre süzmek iş yükünü böler. Günde iki kez “okunmamış” taraması çoğu ekip için yeterlidir.",
        details: [
          "Kritik şikayetleri ayrı not alın.",
          "İzleyici rolü yanıtlayamaz; yalnızca görür.",
        ],
      },
      {
        title: "Konuşmayı açıp yanıtlayın",
        desc: "Satıra tıklayın, geçmişi okuyun, yanıtı yazıp gönderin. Yanıt ilgili sosyal hesap üzerinden platforma gider. Başarısız olursa nedeni görüp hesabı yenileyin veya tekrar deneyin.",
        details: [
          "Nazik ve marka tonunda yanıtlayın; panik cevap yazmayın.",
          "Token süresi dolmuşsa Hesaplar’dan yeniden bağlayın.",
        ],
      },
      {
        title: "Okundu yapıp listeyi temiz tutun",
        desc: "İşiniz bitince okundu işaretleyin. Spam’i yanıtlamadan okundu yaparak gürültüyü azaltın; ekip arkadaşınız aynı konuşmayı tekrar öncelikli sanmasın.",
        details: [
          "Hedef: gün sonunda okunmamış = yönetilebilir sayı.",
          "SSS’de yayın/gelen kutusu sorunlarına da bakın.",
        ],
      },
    ],
    tips: [
      "Önce hesap bağlantısının aktif olduğundan emin olun; yoksa olaylar gelmez.",
      "Ajanslarda müşteri bazlı hesap filtreleri iş yükünü böler.",
      "Detaylı özellik anlatımı için Sosyal Gelen Kutusu sayfasına bakın.",
    ],
    related: [
      { title: "Sosyal Gelen Kutusu", href: "/features/social-inbox" },
      { title: "Hesap bağlama", href: "/resources/accounts" },
      { title: "SSS", href: "/resources/sss" },
    ],
  },
  {
    slug: "sss",
    category: "yardim",
    shortTitle: "Sık sorulanlar",
    title: "Sık sorulan sorular",
    menuDesc: "Kayıt, giriş, yayın ve destek.",
    headline: "Merak edilenler, kısa cevaplar",
    intro:
      "Tanıtım sitesini gezerken veya panele ilk girdiğinizde en çok sorulan konular. Bulamadığınız soru için İletişim formunu kullanın.",
    sections: [
      {
        title: "Ücretsiz deneyebilir miyim?",
        body: "Evet. Ücretsiz Dene ile kayıt olun; çalışma alanınız otomatik açılır ve panele düşersiniz. Google girişi yapılandırılmamışsa e-posta ve şifre yeterlidir — kredi kartı istemeyiz.",
      },
      {
        title: "Hangi platformlar destekleniyor?",
        body: "TikTok, Instagram, X, LinkedIn, YouTube ve Pinterest. Her mecranın iş akışı ve ipuçları Platform menüsünde ve /platforms sayfasında ayrıntılı anlatılır.",
      },
      {
        title: "Şifremi unuttum / giriş yapamıyorum",
        body: "Giriş sayfasından e-posta ve şifrenizi deneyin. Hesabınız yoksa önce kayıt olun. Aynı e-posta ile daha önce kayıt olduysanız tekrar kayıt olamazsınız — Giriş Yap’ı kullanın. Devam ederse İletişim formundan yazın.",
      },
      {
        title: "Yayın gitmiyor, ne yapmalıyım?",
        body: "Önce hesabın hâlâ bağlı olduğunu Hesaplar’dan kontrol edin. Hata mesajını okuyun; metni kısaltıp tek mecrada yeniden deneyin. Gerekirse hesabı yeniden yetkilendirin. İlk test için Hemen Paylaş en hızlı doğrulamadır.",
      },
      {
        title: "Ajans / çoklu müşteri için uygun mu?",
        body: "Evet. Marka gruplarıyla müşteri hesaplarını ayırır, rollerle (Admin / Editör / İzleyici) yetki verirsiniz. Yanlış hesaba yayın riskini azaltmak için grup + rol kombinasyonunu öneririz.",
      },
      {
        title: "Demo veya destek isterim",
        body: "İletişim sayfasından konuyu seçip mesaj bırakın (canlı demo, ajans kurulumu, kurulum desteği). Ürün yetenekleri Platform / Özellikler’de; adım adım kullanım Kaynaklar’da.",
      },
    ],
    steps: [
      {
        title: "Önce rehber sırasını izleyin",
        desc: "SocialMarka nedir? → Çalışma alanı → Hesap bağlama → İlk gönderi. Bu sıra kayıt öncesi veya sonrası en hızlı öğrenme yoludur; çoğu soru burada biter.",
        details: [
          "Takvim ve gelen kutusu günlük kullanım rehberlerindedir.",
          "Menüden Kaynaklar ile tüm listeye dönün.",
        ],
      },
      {
        title: "Özellik ve platform sayfalarına bakın",
        desc: "“Editör nasıl kullanılır?” gibi sorular için Özellikler detayındaki Nasıl kullanılır bölümünü okuyun. Mecraya özel akış için Platform detay sayfalarına gidin.",
        details: [
          "Her özellik sayfasında adım + madde listesi vardır.",
          "Ürün listesi ile rehberleri karıştırmayın: Platform = ne var, Kaynaklar = nasıl yapılır.",
        ],
      },
      {
        title: "Küçük bir testle deneyin",
        desc: "Kayıt olun, bir hesap bağlayın, tek mecrada Hemen Paylaş yapın. Hata alırsanız mesajı okuyun; sık çözümler yukarıdaki “Yayın gitmiyor” cevabında.",
        details: [
          "Test hesabı ile başlamak müşteri riskini sıfırlar.",
          "Başarıdan sonra takvim ritmine geçin.",
        ],
      },
      {
        title: "Hâlâ takılıyorsanız yazın",
        desc: "İletişim formundan ad, e-posta ve sorununuzu gönderin. Demo veya onboarding isteğinizi de aynı formdan iletebilirsiniz.",
        details: [
          "Hangi adımda kaldığınızı yazarsanız daha hızlı yardımcı oluruz.",
          "hello@socialmarka.com adresleri de iletişim sayfasındadır.",
        ],
      },
    ],
    tips: [
      "Önce rehber, sonra iletişim — çoğu soru 2–3 adımda çözülür.",
      "Ajans senaryoları için marka grupları ve roller rehberlerini birlikte okuyun.",
      "Teknik detay değil, kullanım odaklı ilerleyin; bu site yol göstericidir.",
    ],
    related: [
      { title: "Başlangıç", href: "/resources/baslangic" },
      { title: "İletişim", href: "/contact" },
      { title: "Özellikler", href: "/features" },
    ],
  },
];

export function getResource(slug: string): ResourceGuide | undefined {
  return RESOURCES.find((r) => r.slug === slug);
}

export function resourcesByCategory(category: ResourceCategory) {
  return RESOURCES.filter((r) => r.category === category);
}
