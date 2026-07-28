import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { mediaUrl, mediaMime } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY?.trim();

    if (!apiKey) {
      const fallbacks = [
        "Harika bir gün, harika bir kare! ✨ Bu özel anı sizinle paylaşmaktan mutluluk duyuyorum. Siz bu konuda ne düşünüyorsunuz? Yorumlarda buluşalım! 👇 #kesfet #socialmarka #pazartesi #gününkaresi",
        "Yeni ufuklara doğru! 🚀 Her adımda daha iyisini hedefliyoruz. Bizi takip etmeye devam edin! #basari #motivasyon #girisimcilik #socialmarka",
        "Detaylardaki güzellik... 💡 Bazen en küçük şeyler en büyük mutlulukları getirir. Herkese keyifli bir hafta dileriz! #mutluluk #huzur #detaylar #socialmarka",
      ];
      const pick = fallbacks[Math.floor(Math.random() * fallbacks.length)];
      return NextResponse.json({
        caption: `[Sanal Yapay Zeka] (Gerçek yapay zeka analizi için lütfen .env dosyanıza GEMINI_API_KEY ekleyin)\n\n${pick}`,
      });
    }

    let part: any = null;
    if (mediaUrl && mediaUrl.startsWith("data:")) {
      const match = mediaUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        part = {
          inlineData: {
            mimeType: match[1],
            data: match[2],
          },
        };
      }
    } else if (mediaUrl && /^https?:\/\//i.test(mediaUrl)) {
      try {
        const fetchImg = await fetch(mediaUrl);
        if (fetchImg.ok) {
          const buffer = await fetchImg.arrayBuffer();
          const base64 = Buffer.from(buffer).toString("base64");
          const mime = fetchImg.headers.get("content-type") || mediaMime || "image/jpeg";
          part = {
            inlineData: {
              mimeType: mime,
              data: base64,
            },
          };
        }
      } catch (err) {
        console.error("[AI Caption] Fetch remote image error:", err);
      }
    }

    const promptText = "Bu görsel için sosyal medyada paylaşılabilecek Türkçe, ilgi çekici, uygun hashtag'leri de içeren profesyonel bir gönderi açıklaması (caption) yaz. Sadece açıklamayı döndür.";

    const contents = [
      {
        parts: [
          { text: promptText },
          ...(part ? [part] : []),
        ],
      },
    ];

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const res = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini API error: ${res.status} - ${errText}`);
    }

    const data = await res.json();
    const captionText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "İçerik üretilemedi.";

    return NextResponse.json({ caption: captionText.trim() });
  } catch (err: any) {
    console.error("[AI Caption API Error]:", err);
    return NextResponse.json(
      { error: err?.message || "Yapay zeka açıklaması oluşturulamadı." },
      { status: 500 }
    );
  }
}
