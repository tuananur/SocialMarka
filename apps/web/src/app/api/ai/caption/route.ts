import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

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
    } else if (mediaUrl) {
      // 1. First attempt: try to read local file from disk directly
      if (!/^https?:\/\//i.test(mediaUrl)) {
        const cleanPath = mediaUrl.startsWith("/") ? mediaUrl.slice(1) : mediaUrl;
        const publicRoots = [
          path.join(process.cwd(), "public"),
          path.join(process.cwd(), "apps", "web", "public"),
        ];
        for (const root of publicRoots) {
          const fullPath = path.join(root, cleanPath);
          if (fs.existsSync(fullPath)) {
            try {
              const buffer = fs.readFileSync(fullPath);
              const base64 = buffer.toString("base64");
              const ext = path.extname(fullPath).toLowerCase();
              let mime = "image/jpeg";
              if (ext === ".png") mime = "image/png";
              if (ext === ".gif") mime = "image/gif";
              if (ext === ".webp") mime = "image/webp";
              part = {
                inlineData: {
                  mimeType: mime,
                  data: base64,
                },
              };
              break;
            } catch (err) {
              console.error("[AI Caption] Local file read error:", err);
            }
          }
        }
      }

      // 2. Second attempt: fetch via absolute URL (using request origin prefix if relative)
      if (!part) {
        let absoluteUrl = mediaUrl;
        if (mediaUrl.startsWith("/") && !mediaUrl.startsWith("//")) {
          const origin = req.headers.get("origin") || req.headers.get("referer") || "";
          if (origin) {
            try {
              const originUrl = new URL(origin);
              absoluteUrl = `${originUrl.origin}${mediaUrl}`;
            } catch {
              // ignore
            }
          }
        }

        if (/^https?:\/\//i.test(absoluteUrl)) {
          try {
            const fetchImg = await fetch(absoluteUrl);
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
