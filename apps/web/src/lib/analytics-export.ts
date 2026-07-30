export type AnalyticsExportRow = {
  date: string;
  accountName: string;
  provider: string;
  followers: number;
  following: number;
  impressions: number;
  reach: number;
  likes: number;
  comments: number;
};

export function exportAnalyticsToCSV(rows: AnalyticsExportRow[], filename = "socialmarka-analitik-raporu.csv") {
  if (!rows || rows.length === 0) {
    alert("Dışa aktarılacak veri bulunamadı.");
    return;
  }

  const headers = ["Tarih", "Hesap Adı", "Platform", "Takipçi", "Takip Edilen", "Gösterim", "Erişim", "Beğeni", "Yorum"];
  const csvLines: string[] = [headers.join(",")];

  for (const row of rows) {
    const formattedDate = new Date(row.date).toLocaleString("tr-TR").replace(/,/g, "");
    const safeAccountName = `"${(row.accountName || "").replace(/"/g, '""')}"`;
    const line = [
      formattedDate,
      safeAccountName,
      row.provider,
      row.followers,
      row.following,
      row.impressions,
      row.reach,
      row.likes,
      row.comments,
    ].join(",");
    csvLines.push(line);
  }

  const csvContent = "\uFEFF" + csvLines.join("\n"); // UTF-8 BOM for Excel Turkish character support
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
