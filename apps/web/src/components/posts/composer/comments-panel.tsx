"use client";

export function CommentsPanel({
  canEdit,
  selectedProviders,
  firstComments,
  setFirstComments,
}: {
  canEdit: boolean;
  selectedProviders: string[];
  firstComments: Record<string, string>;
  setFirstComments: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}) {
  const commentProviders = ["FACEBOOK", "INSTAGRAM", "LINKEDIN"].filter(
    (p) => selectedProviders.includes(p) || selectedProviders.length === 0,
  );

  const labels: Record<string, string> = {
    FACEBOOK: "Facebook",
    INSTAGRAM: "Instagram",
    LINKEDIN: "LinkedIn",
  };

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium text-ink-700">
        Ana gönderi yayınlandıktan sonra otomatik ilk yorum olarak paylaşılır.
      </p>
      {commentProviders.map((provider) => (
        <div key={provider} className="rounded-xl border border-ink-200 bg-ink-50/80 p-3.5 shadow-sm">
          <p className="mb-2 text-sm font-bold text-ink-900">
            {labels[provider]} İlk Yorum
          </p>
          <textarea
            value={firstComments[provider] || ""}
            onChange={(e) =>
              setFirstComments((prev) => ({ ...prev, [provider]: e.target.value }))
            }
            disabled={!canEdit}
            placeholder={`${labels[provider]} ilk yorumunu yazın…`}
            className="min-h-[72px] w-full resize-none rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 font-medium placeholder:text-ink-400 outline-none focus:border-accent"
          />
        </div>
      ))}
    </div>
  );
}

