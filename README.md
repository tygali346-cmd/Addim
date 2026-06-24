<div align="center">

# 🇦🇿 ADDIM — Əlçatanlıq Platforması

### **Bir addım, hər kəs üçün.**

Azərbaycanda əlilliyi olan şəxslər üçün rəqəmsal əlçatımlılıq, könüllülük və məşğulluq platforması.

[**Demo**](#-demo) · [**Qurulum**](#-qurulum) · [**Arxitektura**](#-arxitektura) · [**Yeni Nə Var**](#-yeni-nə-var) · [**Töhfə**](#-töhfə-vermək) · [**Lisenziya**](#-lisenziya)

---

![Status](https://img.shields.io/badge/status-active-success)
![License](https://img.shields.io/badge/license-MIT-blue)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript)
![Firebase](https://img.shields.io/badge/Firebase-12-FFCA28?logo=firebase)
![Gemini](https://img.shields.io/badge/Gemini-AI-8E75B6?logo=google)

</div>

---

## 📋 Haqqında

**ADDIM** — fiziki məhdudiyyətli vətəndaşların Bakı şəhər mühitində müstəqil hərəkət etməsini təmin edən inteqrasiya olunmuş platformadır. Layihə **3 əsas problemi** həll edir:

| Problem | Həll |
|---------|------|
| 🚧 Məkanların əlçatımlılıq məlumatı yoxdur | İstifadəçi-təsdiqli xəritə (50+ Bakı məkanı) + Reviews |
| 🤝 Yardım axtaran və könüllü arasında əlaqə yoxdur | Real-zamanlı könüllülük + XP/badge sistemi |
| 💼 Əlilliyi olan şəxslər üçün vakansiya azdır | İnklüziv iş bazarı modulu |
| 🗣️ Səsli yardım çatışmır | Gemini TTS ilə səsləndirmə |

Platforma **4 əsas modul** ətrafında qurulub:

- 🗺️ **Xəritə** — Leaflet ilə Bakının əlçatanlıq xəritəsi (rampa, lift, WC, parking filterləri)
- 📋 **Bələdçi** — Dövlət və özəl qurumların əlçatımlılıq bələdçiləri
- 🤝 **Könüllülük** — XP və badge sistemi ilə motivasiyalı könüllülər
- 💼 **İş İmkanları** — İnklüziv vakansiyalar və əmək bazarı

---

## 🆕 Yeni Nə Var

### `v0.4.0` — Reviews + Tone-Aware AI + TTS

| Xüsusiyyət | Təsvir |
|-----------|--------|
| ⭐ **Məkan Rəyləri** | Hər xəritə məkanı üçün 1-5 ulduzlu qiymətləndirmə + şərh (500 simvol) |
| 💬 **App Feedback** | İstifadəçilərdən positive/negative feedback toplama sistemi |
| 🎭 **Dinamik AI Ton** | İstifadəçi əhvalına görə 3 personaj: rəsmi / dostyana / dəstəkləyici |
| 🎙️ **TTS Səsləndirmə** | Gemini TTS ilə Kore səsi, PCM→WAV konversiya |
| 🔄 **Resilient Fallback** | 4 model + hər model üçün 2 cəhd, 300ms retry delay |
| 🎨 **TypeScript Types** | Sərt type safety — magic strings aradan qaldırıldı |

> Ətraflı dəyişikliklər: bax [`CHANGELOG.md`](./CHANGELOG.md) _(gələcəkdə)_

---

## ✨ Xüsusiyyətlər

### 🧠 AI Köməkçi (Gemini 2.5/3.x Fallback + Tone Detection)
Server-side Gemini inteqrasiyası **4 mərhələli fallback chain** ilə:
```
gemini-3.5-flash → gemini-3.1-flash-lite → gemini-2.5-flash → gemini-flash-latest
```
- Hər model üçün **2 cəhd** (rate limit halında 300ms gözləmə)
- 429/503/resource_exhausted xətalarında avtomatik növbəti modelə keçir
- AI köməkçi platformanın **bütün səhifələri** üçün kontekst-şüurlu cavab verir

**Tone Detection — 3 Personaj:**
- 🎩 **rəsmi** — ciddi, məsuliyyətli suallar üçün
- 🤝 **dostyana** — qeyri-formal, enerjili cavablar üçün
- 💙 **dəstəkləyici** — çətin vəziyyətdə olanlar üçün empatik

Hər cavab `tone` + `mood` metadata-sı ilə gəlir, istifadəçinin **mood history**-si saxlanılır.

### 🎙️ TTS Səsləndirmə
- `gemini-3.1-flash-tts-preview` modeli ilə **Kore** səsi (24kHz)
- PCM → WAV formatına çevrilir
- Mətn sanitizasiyası (markdown, xüsusi simvollar təmizlənir)
- 250 simvol məhdudiyyəti (performans üçün)

### ⭐ Məkan Rəyləri Sistemi
- Hər xəritə məkanı üçün 1-5 ulduzlu qiymətləndirmə
- Şərh yazma (max 500 simvol, Firestore qaydasında məhdudlaşdırılıb)
- Real-zamanlı rəy siyahısı (Firestore `orderBy('createdAt', 'desc')`)
- Giriş etməmiş istifadəçilər `Daxil Ol` CTA ilə yönləndirilir
- **Orta reytinq avtomatik hesablanır** və məkan pinində göstərilir

### 🗺️ İnteraktiv Xəritə
- **Leaflet** + **react-leaflet-cluster** (50+ pin səmərəli göstərilir)
- **leaflet-routing-machine** ilə marşrut qurma
- Filter: rampa 🚶, lift 🛗, WC 🚻, parking 🅿️
- 50 real Bakı məkanı (Metro stansiyaları, muzeylər, xəstəxanalar, parklar)
- **Offline rejim** — `navigator.onLine` ilə işləyir

### ♿ Əlçatanlıq (Layihənin Missiyası)
- **Font size** — 100% / 125% / 150%
- **High contrast** — tam ağ/qaradən rəng paleti
- **Color blindness filter** — 4 növ (protanopia, deuteranopia, tritanopia, grayscale) SVG feColorMatrix ilə
- **TTS səsləndirmə** — görmə məhdudiyyətli istifadəçilər üçün
- **Keyboard navigation** tam dəstəklənir
- **Screen reader** optimallaşdırılıb

### 🎮 Gamification
- **XP sistemi** — hər təsdiq üçün +30 XP
- **3 badge** — İlk Bələdçi 🔍, Müdafiəçi 🛡️, Ustad Könüllü 👑
- **Toast bildirişləri** — 4 növ (success, mission, badge, info)
- **Mood history** — istifadəçinin AI ilə qarşılıqlı əhval tarixçəsi

### 🔐 Autentifikasiya & Təhlükəsizlik
- **Firebase Auth** — Email/Password + Google Sign-In
- **2FA dəstəyi** — istifadəçi səviyyəsində aktivləşdirilə bilər
- **Firestore Security Rules** — role-based access control, schema validation
- **API key server-side** — Gemini açarı heç vaxt client-ə sızmır

---

## 🛠️ Texnologiya Stackı

### Frontend
- **React 19** + **TypeScript 5.8**
- **Vite 6** (dev server + build)
- **Tailwind CSS v4** (utility-first styling)
- **Framer Motion 12** (animasiyalar)
- **Lucide React** (ikonlar)

### Xəritə & Coğrafiya
- **Leaflet 1.9** + **react-leaflet 5.0**
- **react-leaflet-cluster** (pin qruplaşdırma)
- **leaflet-routing-machine** (marşrut)

### Backend & AI
- **Express 4** (dev server)
- **@google/genai** (Gemini SDK — text + TTS)
- **tsx** (TypeScript runtime)

### Baza və Autentifikasiya
- **Firebase 12** (Auth + Firestore)
- **firestore.rules** (server-side təhlükəsizlik + schema validation)

### Vizuallaşdırma
- **Recharts** (qrafiklər)
- **Custom SVG** (logo, color blindness filterlər)

---

## 📂 Layihə Strukturu

```
addim/
├── api/                          # Vercel serverless function
│   └── index.ts                  # Production Gemini endpoint
├── server.ts                     # Development server (Express + TTS)
├── src/
│   ├── App.tsx                   # Əsas komponent (5 panel)
│   ├── main.tsx                  # React entry point
│   ├── index.css                 # Tailwind + custom styles
│   ├── geminiService.ts          # AI client wrapper (typed response)
│   ├── constants/
│   │   └── data.ts               # MAP_LOCATIONS + SAMPLE data (50 Bakı məkanı)
│   ├── types/
│   │   └── index.ts              # TypeScript tip tərifləri
│   ├── components/
│   │   ├── AuthModal.tsx         # Giriş/Qeydiyyat (Google + Email + 2FA)
│   │   ├── AccessibilityModal.tsx # A11y ayarları (font/contrast/color)
│   │   ├── OverviewPanel.tsx     # Dashboard
│   │   └── ProfilePanel.tsx      # İstifadəçi profili + reviews/feedback
│   ├── context/
│   │   └── AuthContext.tsx       # Firebase auth state
│   └── lib/
│       ├── firebase.ts           # Firebase init
│       └── toast.ts              # Bildiriş sistemi
├── firestore.rules               # Database təhlükəsizlik qaydaları
├── firebase-applet-config.json   # Firebase konfiqurasiyası
├── metadata.json                 # AI Studio metadata (mic permission)
├── vercel.json                   # Vercel routing konfiqurasiyası
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 🚀 Qurulum

### Tələblər
- **Node.js 20+** ([yüklə](https://nodejs.org))
- **npm** və ya **yarn** və ya **pnpm**
- **Firebase hesabı** (pulsuz Spark plan kifayətdir)
- **Google Gemini API açarı** — [AI Studio](https://aistudio.google.com) və ya [Google Cloud Console](https://console.cloud.google.com)

### Addım 1: Klon et
```bash
git clone https://github.com/tygali346-cmd/Addim.git
cd Addim
```

### Addım 2: Asılılıqları quraşdır
```bash
npm install
```

### Addım 3: Environment dəyişənləri
`.env.local` faylı yarat (kök qovluqda):
```bash
# Gemini API açarı (mütləqdir — həm text, həm TTS üçün)
GEMINI_API_KEY=your_gemini_api_key_here
```

> ⚠️ **Qeyd:** Firebase konfiqurasiyası `firebase-applet-config.json`-da artıq var. Yeni Firebase layihəsi yaratsan, bu faylı yenilə.

### Addım 4: Development serveri işə sal
```bash
npm run dev
```

Server `http://localhost:3000` ünvanında açılacaq.

### Mövcud Skriptlər
| Əmr | Nə edir |
|-----|---------|
| `npm run dev` | Development serveri başladır (port 3000) |
| `npm run build` | Production build (frontend + backend) |
| `npm start` | Production build-i işə sal |
| `npm run lint` | TypeScript tip yoxlaması |
| `npm run clean` | `dist` qovluğunu sil |

---

## ☁️ Deployment (Vercel)

Layihə **Vercel**-ə deploy üçün hazırdır (`vercel.json` mövcuddur).

### Addım-addım
1. [Vercel](https://vercel.com)-də hesab aç
2. **"New Project"** → GitHub repo-nu import et
3. **Environment Variables** bölməsində `GEMINI_API_KEY` əlavə et
4. **Deploy** düyməsinə bas

Vercel avtomatik olaraq:
- `api/index.ts`-i serverless function kimi qurur
- `vercel.json` SPA rewrite qaydalarını tətbiq edir
- Production build-i `dist/` qovluğundan yayımlayır

---

## 🔒 Təhlükəsizlik Qeydləri

> ⚠️ **Production-ə çıxarmazdan əvvəl bunları ET:**

1. **Firebase App Check** aktivləşdir — bot trafiki və API sui-istifadəsini blokla
2. **Firestore qaydalarını sərtləşdir** — `users/{userId}` read yalnız owner üçün olmalıdır
3. **Rate limiting** əlavə et — `/api/gemini` və `/api/tts` üçün
4. **CSP header** əlavə et — `Content-Security-Policy` meta təyini
5. **CORS** məhdudlaşdır — yalnız sənin domeninə
6. **TTS content sanitization** — base64 audio response ölçüsünü logla, abuse izlə
7. **location_reviews** read qaydasını `isSignedIn()`-dən `if true`-yə dəyiş (ictimai rəylər üçün)

---

## 🧪 Test

```bash
# Tip yoxlaması (TypeScript)
npm run lint

# Production build test
npm run build
```

> ℹ️ Unit və E2E testlər hələ əlavə edilməyib — töhfə vermək istəyirsən? [CONTRIBUTING bölməsinə](#-töhfə-vermək) bax.

---

## 🤝 Töhfə Vermək

Töhfələr **xoş gəlmisiniz**! Xüsusilə bu sahələrdə kömək lazımdır:

- 🧪 **Testlər** — Vitest ilə unit test
- 🌐 **i18n** — Azərbaycan, İngilis, Rus dilləri üçün tərcümə
- ♿ **A11y yoxlaması** — ekran oxuyucu ilə sınaq
- 📊 **Yeni məkanlar** — xəritə üçün Bakının digər əraziləri
- 🐛 **Bug fix-lər** — [Issues](https://github.com/tygali346-cmd/Addim/issues) bölməsinə bax
- 🧩 **App.tsx parçalanma** — `panels/` qovluğuna köçürmə

### PR Göndərmə Prosesi
1. **Fork** et
2. Feature branch yarat:
   ```bash
   git checkout -b feat/nov-bolme
   ```
3. Dəyişiklikləri commit et:
   ```bash
   git commit -m "feat: yeni könüllülük dashboard əlavə et"
   ```
4. Branch-i push et:
   ```bash
   git push origin feat/nov-bolme
   ```
5. **Pull Request** aç — təsvir və screenshot əlavə et

### Commit Mesaj Konvensiyası
[Conventional Commits](https://www.conventionalcommits.org/) standartına əməl edin:
- `feat:` — yeni xüsusiyyət
- `fix:` — bug düzəlişi
- `docs:` — yalnız dokumentasiya
- `style:` — kod formatı
- `refactor:` — refaktorinq
- `test:` — test əlavəsi
- `chore:` — build/dəpency dəyişiklikləri

---

## 🐛 Tapılmış Bilinen Məhdudiyyətlər

- [ ] Heç bir unit/integration test yoxdur
- [ ] ESLint və Prettier konfiqurasiyası yoxdur
- [ ] CI/CD pipeline yoxdur (GitHub Actions tövsiyə olunur)
- [ ] `App.tsx` hələ də 3,200+ sətir monolitdir — `panels/` qovluğuna parçalanmalıdır
- [ ] `package.json` adı hələ `react-example` olaraq qalıb
- [ ] Public Google Translate TTS scraping fallback-i mövcuddur (resmi API-ya keçid tövsiyə olunur)
- [ ] Mikrofon permission var amma voice input UI hələ yoxdur
- [ ] `location_reviews` read qaydası login tələb edir (ictimai olmalıdır)

---

## 📜 Lisenziya

Bu layihə [MIT Lisenziyası](./LICENSE) ilə lisenziyalaşdırılıb.

```
MIT License - Copyright (c) 2026 ADDIM Contributors

Müəllif hüququ qeydini saxlamaq şərtilə, pulsuz istifadə edə, dəyişdirə
və paylaya bilərsiniz.
```

---

## 📬 Əlaqə

- 🌐 **Veb:** [addim.az](https://addim.az) _(tezliklə)_
- 📷 **Instagram:** [@addim_platformasi](https://www.instagram.com/addim_platformasi)
- 💻 **GitHub:** [tygali346-cmd/Addim](https://github.com/tygali346-cmd/Addim)
- ✉️ **Email:** info@addim.az

---

## 🙏 Təşəkkürlər

- **Google Gemini** — AI köməkçi və TTS üçün
- **Firebase** — backend infrastrukturu
- **Leaflet** — açıq mənbə xəritə
- **Vercel** — hosting platforması
- **React komandası** — əla framework
- Bütün **kontrributorlara** və **test istifadəçilərinə**

---

## 💙 Missiya

> _"Əlçatanlıq lütf deyil, hüquqdur."_

Bu layihə Azərbaycanda yaşayan bütün əlilliyi olan şəxslərə həsr olunub. Siz **görünürsünüz**, sizin **səsiniz var**, və biz **sizinlə birlikdə** daha əlçatan bir cəmiyyət qururuq.

---

<div align="center">

**🇦🇿 Made with ❤️ in Azerbaijan — for everyone.**

[⬆ Başa qayıt](#-addim--əlçatanlıq-platforması)

</div>

