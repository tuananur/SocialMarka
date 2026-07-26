"use client";

import React, { useState, useEffect } from "react";

type ProfileClientProps = {
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    role: string;
    workspaceName: string;
  };
};

export function ProfileClient({ user }: ProfileClientProps) {
  // Input fields
  const [name, setName] = useState(user.name || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // UI feedback states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Theme settings (persisted in localStorage)
  const [selectedTheme, setSelectedTheme] = useState("light");
  const [selectedAccent, setSelectedAccent] = useState("blue");

  // Notification settings (persisted in localStorage)
  const [notifEmailSuccess, setNotifEmailSuccess] = useState(true);
  const [notifEmailFail, setNotifEmailFail] = useState(true);
  const [notifInAppAlerts, setNotifInAppAlerts] = useState(true);
  const [notifWeeklyDigest, setNotifWeeklyDigest] = useState(false);

  // Timezone and shortener options
  const [timezone, setTimezone] = useState("Europe/Istanbul");
  const [shortener, setShortener] = useState("socialmarka.short");

  // Load preferences from localStorage on mount
  useEffect(() => {
    const localTheme = localStorage.getItem("sm_theme");
    if (localTheme) setSelectedTheme(localTheme);

    const localAccent = localStorage.getItem("sm_accent");
    if (localAccent) setSelectedAccent(localAccent);

    const localNotifSuccess = localStorage.getItem("sm_notif_success");
    if (localNotifSuccess !== null) setNotifEmailSuccess(localNotifSuccess === "true");

    const localNotifFail = localStorage.getItem("sm_notif_fail");
    if (localNotifFail !== null) setNotifEmailFail(localNotifFail === "true");

    const localNotifInApp = localStorage.getItem("sm_notif_inapp");
    if (localNotifInApp !== null) setNotifInAppAlerts(localNotifInApp === "true");

    const localNotifWeekly = localStorage.getItem("sm_notif_weekly");
    if (localNotifWeekly !== null) setNotifWeeklyDigest(localNotifWeekly === "true");

    const localTimezone = localStorage.getItem("sm_timezone");
    if (localTimezone) setTimezone(localTimezone);

    const localShortener = localStorage.getItem("sm_shortener");
    if (localShortener) setShortener(localShortener);
  }, []);

  // Save specific settings to localStorage and trigger class additions
  const saveThemeSettings = (theme: string, accent: string) => {
    setSelectedTheme(theme);
    setSelectedAccent(accent);
    localStorage.setItem("sm_theme", theme);
    localStorage.setItem("sm_accent", accent);

    // Trigger global style update via event
    window.dispatchEvent(new Event("sm-settings-changed"));

    // Dynamic visual notification
    showAutoDismissSuccess("Görünüm ayarları başarıyla güncellendi.");
  };

  const handleToggle = (key: string, value: boolean, setter: (val: boolean) => void) => {
    setter(value);
    localStorage.setItem(key, String(value));
    showAutoDismissSuccess("Bildirim ayarları kaydedildi.");
  };

  const showAutoDismissSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setErrorMsg("");
    setTimeout(() => {
      setSuccessMsg((current) => (current === msg ? "" : current));
    }, 4000);
  };

  // Submit profile details update to the database API
  const handleSubmitProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    if (newPassword && newPassword !== confirmPassword) {
      setErrorMsg("Yeni şifreleriniz birbiriyle uyuşmuyor.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          currentPassword: currentPassword || undefined,
          newPassword: newPassword || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setErrorMsg(data.error || "Güncelleme sırasında hata oluştu.");
      } else {
        setSuccessMsg(data.message || "Değişiklikler başarıyla kaydedildi.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (err) {
      setErrorMsg("Profil güncellenirken sunucu bağlantı hatası oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-12 font-sans">
      {/* Üst Başlık */}
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-ink-900">
          Profilim & Ayarlar
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          Kişisel bilgilerinizi düzenleyin, arayüz temasını seçin ve bildirim ayarlarını yapılandırın.
        </p>
      </div>

      {/* Geri Bildirim Mesajları */}
      {successMsg && (
        <div className="rounded-xl border border-green-200 bg-green-50/50 p-4 text-sm font-semibold text-green-700 animate-fade-in flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4 text-sm font-semibold text-rose-700 animate-fade-in flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
          </svg>
          {errorMsg}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Sol Sütun: Profil & Şifre Düzenleme Formu */}
        <div className="lg:col-span-7 space-y-6">
          <section className="rounded-2xl border border-ink-200/60 bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <h2 className="font-display text-lg font-bold text-ink-950 mb-6 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-accent">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
              Kişisel Bilgiler & Profil
            </h2>

            <form onSubmit={handleSubmitProfile} className="space-y-5">
              <div className="flex items-center gap-4 pb-4 border-b border-ink-50">
                <div className="h-16 w-16 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-xl font-bold text-accent uppercase">
                  {name ? name.slice(0, 2) : user.email.slice(0, 2)}
                </div>
                <div>
                  <h3 className="font-bold text-ink-900 text-base">{name || "Kullanıcı"}</h3>
                  <p className="text-xs text-ink-400 mt-0.5">{user.email} • {user.workspaceName}</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-500 uppercase tracking-wider mb-2">
                  Ad Soyad
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm text-ink-800 focus:border-accent focus:outline-none transition"
                  placeholder="Adınızı ve soyadınızı girin"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-500 uppercase tracking-wider mb-2">
                  E-Posta Adresi
                </label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full rounded-xl border border-ink-100 bg-ink-50/50 px-4 py-2.5 text-sm text-ink-400 focus:outline-none cursor-not-allowed"
                />
                <p className="text-[10px] text-ink-400 mt-1">Giriş e-posta adresi değiştirilemez.</p>
              </div>

              <div className="pt-4 border-t border-ink-50">
                <h3 className="font-bold text-ink-950 text-sm mb-4">Şifre Değiştir</h3>
                <p className="text-xs text-ink-400 mb-4">Şifrenizi değiştirmek istemiyorsanız aşağıdaki şifre alanlarını boş bırakabilirsiniz.</p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-ink-500 mb-1.5">Mevcut Şifre</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm text-ink-800 focus:border-accent focus:outline-none transition"
                      placeholder="••••••••"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-medium text-ink-500 mb-1.5">Yeni Şifre</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm text-ink-800 focus:border-accent focus:outline-none transition"
                        placeholder="••••••••"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-ink-500 mb-1.5">Yeni Şifre (Tekrar)</label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm text-ink-800 focus:border-accent focus:outline-none transition"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-accent/10 hover:bg-accent-600 disabled:bg-ink-300 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                >
                  {loading && (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  )}
                  Ayarları Kaydet
                </button>
              </div>
            </form>
          </section>
        </div>

        {/* Sağ Sütun: Arayüz Teması ve Bildirim Ayarları */}
        <div className="lg:col-span-5 space-y-6">
          {/* Arayüz Teması Seçimi */}
          <section className="rounded-2xl border border-ink-200/60 bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <h2 className="font-display text-lg font-bold text-ink-950 mb-4 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-accent">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-1.242 2.25 2.25 0 0 1 2.245-2.4 3 3 0 0 0 1.128-5.78M19.5 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 15.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM8.25 5.25a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
              Arayüz Teması (Tema)
            </h2>

            {/* Tema Seçim Seçenekleri */}
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => saveThemeSettings("light", selectedAccent)}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition cursor-pointer ${
                  selectedTheme === "light"
                    ? "border-accent bg-accent/5 font-semibold text-accent"
                    : "border-ink-200 bg-white text-ink-600 hover:bg-ink-50/55"
                }`}
              >
                <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center shadow-sm text-amber-500 mb-2">
                  ☀️
                </div>
                <span className="text-xs">Açık Tema</span>
              </button>

              <button
                type="button"
                onClick={() => saveThemeSettings("dark", selectedAccent)}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition cursor-pointer ${
                  selectedTheme === "dark"
                    ? "border-accent bg-accent/5 font-semibold text-accent"
                    : "border-ink-200 bg-white text-ink-600 hover:bg-ink-50/55"
                }`}
              >
                <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center shadow-sm text-indigo-300 mb-2">
                  🌙
                </div>
                <span className="text-xs">Koyu Tema</span>
              </button>

              <button
                type="button"
                onClick={() => saveThemeSettings("system", selectedAccent)}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition cursor-pointer ${
                  selectedTheme === "system"
                    ? "border-accent bg-accent/5 font-semibold text-accent"
                    : "border-ink-200 bg-white text-ink-600 hover:bg-ink-50/55"
                }`}
              >
                <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center shadow-sm text-emerald-600 mb-2">
                  ⚙️
                </div>
                <span className="text-xs">Sistem</span>
              </button>
            </div>

            {/* Vurgu Rengi Seçenekleri */}
            <div className="mt-6 pt-4 border-t border-ink-50">
              <label className="block text-xs font-semibold text-ink-500 uppercase tracking-wider mb-3">
                Vurgu Rengi (Accent Color)
              </label>
              <div className="flex items-center gap-3">
                {[
                  { name: "blue", hex: "bg-blue-600" },
                  { name: "purple", hex: "bg-purple-600" },
                  { name: "emerald", hex: "bg-emerald-600" },
                  { name: "orange", hex: "bg-orange-500" },
                  { name: "rose", hex: "bg-rose-500" },
                ].map((color) => (
                  <button
                    key={color.name}
                    type="button"
                    onClick={() => saveThemeSettings(selectedTheme, color.name)}
                    className={`h-7 w-7 rounded-full ${color.hex} flex items-center justify-center ring-offset-2 hover:scale-105 transition cursor-pointer ${
                      selectedAccent === color.name
                        ? "ring-2 ring-ink-900"
                        : "ring-0"
                    }`}
                  >
                    {selectedAccent === color.name && (
                      <span className="text-white text-xs font-bold">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Bildirim Ayarları */}
          <section className="rounded-2xl border border-ink-200/60 bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <h2 className="font-display text-lg font-bold text-ink-950 mb-5 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-accent">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a9.013 9.013 0 0 1-9.085-1.014 9.013 9.013 0 0 0 1.821-6.433 9.013 9.013 0 0 0-1.82-6.433 9.013 9.013 0 0 1 9.085-1.014M16.5 19.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
              Bildirim Ayarları
            </h2>

            <div className="space-y-4">
              {/* E-posta Başarı Bildirimi */}
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-ink-900">Gönderi Başarı E-Postaları</p>
                  <p className="text-xs text-ink-400 mt-0.5">Paylaşımlar yayına girdiğinde bildirim gönder.</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggle("sm_notif_success", !notifEmailSuccess, setNotifEmailSuccess)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    notifEmailSuccess ? "bg-accent" : "bg-ink-200"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      notifEmailSuccess ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* E-posta Hata Bildirimi */}
              <div className="flex items-center justify-between gap-4 pt-3 border-t border-ink-50">
                <div>
                  <p className="text-sm font-semibold text-ink-900">Gönderi Hata E-Postaları</p>
                  <p className="text-xs text-ink-400 mt-0.5">Paylaşım başarısız olduğunda e-posta ile uyar.</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggle("sm_notif_fail", !notifEmailFail, setNotifEmailFail)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    notifEmailFail ? "bg-accent" : "bg-ink-200"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      notifEmailFail ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Tarayıcı içi bildirimler */}
              <div className="flex items-center justify-between gap-4 pt-3 border-t border-ink-50">
                <div>
                  <p className="text-sm font-semibold text-ink-900">Uygulama İçi Uyarılar (Toast)</p>
                  <p className="text-xs text-ink-400 mt-0.5">Tarayıcı içi pop-up uyarı pencerelerini aktif et.</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggle("sm_notif_inapp", !notifInAppAlerts, setNotifInAppAlerts)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    notifInAppAlerts ? "bg-accent" : "bg-ink-200"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      notifInAppAlerts ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Haftalık Rapor */}
              <div className="flex items-center justify-between gap-4 pt-3 border-t border-ink-50">
                <div>
                  <p className="text-sm font-semibold text-ink-900">Haftalık Analiz Raporu</p>
                  <p className="text-xs text-ink-400 mt-0.5">Pazartesi sabahları haftalık istatistik bülteni al.</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggle("sm_notif_weekly", !notifWeeklyDigest, setNotifWeeklyDigest)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    notifWeeklyDigest ? "bg-accent" : "bg-ink-200"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      notifWeeklyDigest ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>
          </section>

          {/* Bölgesel Tercihler */}
          <section className="rounded-2xl border border-ink-200/60 bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <h2 className="font-display text-lg font-bold text-ink-950 mb-5 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-accent">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-.778.099-1.533.284-2.253" />
              </svg>
              Sistem Tercihleri
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink-500 uppercase tracking-wider mb-2">
                  Varsayılan Zaman Dilimi (Timezone)
                </label>
                <select
                  value={timezone}
                  onChange={(e) => {
                    setTimezone(e.target.value);
                    localStorage.setItem("sm_timezone", e.target.value);
                    showAutoDismissSuccess("Zaman dilimi ayarı güncellendi.");
                  }}
                  className="w-full rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm font-medium text-ink-700 focus:border-accent focus:outline-none"
                >
                  <option value="Europe/Istanbul">İstanbul (GMT+3)</option>
                  <option value="Europe/London">Londra (GMT+0)</option>
                  <option value="Europe/Paris">Paris (GMT+1)</option>
                  <option value="America/New_York">New York (GMT-5)</option>
                  <option value="Asia/Tokyo">Tokyo (GMT+9)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-500 uppercase tracking-wider mb-2">
                  Link Kısaltıcı Servisi (Shortener)
                </label>
                <select
                  value={shortener}
                  onChange={(e) => {
                    setShortener(e.target.value);
                    localStorage.setItem("sm_shortener", e.target.value);
                    showAutoDismissSuccess("Link kısaltıcı tercihi kaydedildi.");
                  }}
                  className="w-full rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm font-medium text-ink-700 focus:border-accent focus:outline-none"
                >
                  <option value="socialmarka.short">SocialMarka Kısaltıcı (Önerilen)</option>
                  <option value="bitly">Bit.ly Entegrasyonu</option>
                  <option value="none">Kısaltıcı Kullanma (Direkt Link)</option>
                </select>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
