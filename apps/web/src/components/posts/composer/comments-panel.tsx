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
      <p className="text-sm text-ink-500">
        Ana gönderi yayınlandıktan sonra otomatik ilk yorum olarak paylaşılır.
      </p>
      {commentProviders.map((provider) => (
        <div key={provider} className="rounded-xl border border-ink-200 bg-[#f7f8fa] dark:bg-ink-50 dark:border-ink-800 p-3">
          <p className="mb-2 text-sm font-semibold text-ink-800 dark:text-white">
            {labels[provider]} İlk Yorum
          </p>
          <textarea
            value={firstComments[provider] || ""}
            onChange={(e) =>
              setFirstComments((prev) => ({ ...prev, [provider]: e.target.value }))
            }
            disabled={!canEdit}
            placeholder={`${labels[provider]} ilk yorumunu yazın`}
            className="min-h-[72px] w-full resize-none rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm outline-none dark:bg-ink-100 dark:border-ink-800 dark:text-white"
          />
        </div>
      ))}
    </div>
  );
}
