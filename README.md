# Arav Tiwari — 3D Hacker Portfolio

3D, animated, "hacker terminal" style personal portfolio built with:

- **Next.js 14** (App Router) + **TypeScript**
- **React Three Fiber** + **Three.js** — used for the matrix rain / 3D touches; the profile picture itself is your real uploaded photo (`public/profile.jpg`) shown in a glowing circular frame with a live mouse/touch-based 3D tilt
- **GSAP** — floating / draggable cards, popup animations
- **Tailwind CSS** — styling, matrix-green theme, glitch effects
- Full-screen animated **matrix code rain** background (canvas, tilted in 3D with CSS perspective) that runs continuously behind everything
- Clicking **About, Skills, Education, or Contact** anywhere (navbar or in-page buttons) scrolls to that section, shows a spooky glitchy warning popup, and triggers **5 empty placeholder files** to download automatically (`system_access.log`, `root_shell.sh`, `database_dump.sql`, `password_list.txt`, `backdoor.exe.txt`) — all completely empty/harmless, just for the "prank" effect. Home is the only section that opens normally with no scare.
- **"हर हर महादेव" welcome popup** — shows immediately when the site opens, floats fast in the center, and only reveals the rest of the site after the user taps **OK**.
- **Red "roast" alert** — clicking About, Skills, Education, or Contact (navbar or in-page buttons) first shows a red warning box with a rude Hindi/English message. Only after the user taps OK does the rest of the sequence run: it scrolls to the section, shows the glitchy scare popup, and drops the 5 empty files.
- **Social links in Contact** — floating icons for Instagram, WhatsApp, Telegram, and Snapchat, all under username `the_aravtiwari`. Tapping one opens the real app/site.
- **Fake "location tracking" terminal** running continuously across the **entire browser viewport in transparent mode**, full width and full height — it stays fixed in the background even as you scroll through About/Skills/Education/Contact, so the matrix rain and content stay visible through it — colorful scrolling lines (GPS lock, IP trace, coordinates, nearby devices), purely cosmetic for the scare effect. It does **not** use the browser's real Geolocation API and sends nothing anywhere — every value is randomly generated on your own device.
- **Zero-gravity floating elements everywhere** — every card, icon, and (on Home) the 3D figure/name/tagline/buttons individually drift on their own forever, now at a slightly faster pace. Pick any of them up with your **mouse or a finger on touch screens** and fling them — they keep drifting with the throw's momentum before settling back into their float, just like objects in zero gravity.
- Fully responsive — tested for mobile, tablet, and desktop layouts

---

## 📁 What's inside

```
hacker-portfolio/
├── app/
│   ├── layout.tsx        # root layout + metadata
│   ├── page.tsx          # main page — all sections
│   └── globals.css       # matrix theme, glitch/scanline CSS
├── components/
│   ├── MatrixRain.tsx        # animated code-rain background
│   ├── ProfilePhoto3D.tsx    # profile photo with mouse/touch 3D tilt
│   ├── FloatingCard.tsx      # floating + draggable card wrapper
│   ├── ScarePopup.tsx        # the "scary" warning popup
│   ├── RudeAlert.tsx         # red roast alert shown before the scare sequence
│   ├── LocationTracker.tsx   # fake colorful "location tracking" terminal feed
│   ├── WelcomePopup.tsx      # "हर हर महादेव" entry popup
│   ├── SocialLinks.tsx       # Instagram/WhatsApp/Telegram/Snapchat floating icons
│   ├── BootScreen.tsx        # terminal boot animation on load
│   └── Navbar.tsx
├── lib/
│   └── triggerDownloads.ts   # triggers the 5 empty-file downloads
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── next.config.js
```

---

## ▶️ How to run in VS Code

1. **Unzip** this folder and open it in VS Code:
   ```
   File → Open Folder → select "hacker-portfolio"
   ```

2. **Open a terminal in VS Code** (`` Ctrl + ` `` / `` Cmd + ` ``) and install dependencies:
   ```bash
   npm install
   ```

3. **Run the dev server:**
   ```bash
   npm run dev
   ```

4. Open your browser at:
   ```
   http://localhost:3000
   ```

That's it — the site will hot-reload as you edit files.

### To build a production version
```bash
npm run build
npm start
```

### Requirements
- Node.js **18.17+** (Node 20 LTS recommended) — check with `node -v`
- npm (comes with Node)

---

## ✏️ Easy things to customize

| What | Where |
|---|---|
| Name / tagline | `app/page.tsx` → Hero section |
| Skills list | `app/page.tsx` → `const skills = [...]` |
| Education details | `app/page.tsx` → Education section |
| Email / GitHub / LinkedIn | `app/page.tsx` → Contact section |
| Colors / theme | `tailwind.config.ts` → `colors.matrix` |
| Names of the 5 downloaded files | `lib/triggerDownloads.ts` |
| Scare popup text | `components/ScarePopup.tsx` |
| Red "roast" alert text | `components/RudeAlert.tsx` |
| Fake tracking terminal text/colors | `components/LocationTracker.tsx` |
| Welcome popup text | `components/WelcomePopup.tsx` |
| Social links / usernames | `components/SocialLinks.tsx` |
| Floating speed everywhere | `components/FloatingCard.tsx` → `speed` prop (default 1.5, higher = faster) |
| Which sections trigger the scare/downloads | `app/page.tsx` → `PROTECTED_SECTIONS` array |
| Profile photo | replace `public/profile.jpg` with your own image (same filename) |
| Photo tilt strength / frame style | `components/ProfilePhoto3D.tsx` |

---

## 📝 Notes

- **WhatsApp icon:** WhatsApp only supports phone-number-based links (`wa.me/<number>`), not usernames. Open `components/SocialLinks.tsx` and replace `WHATSAPP_NUMBER` with your real number (country code + number, no `+` or spaces) so it opens a real chat. Instagram, Telegram, and Snapchat already work with the `the_aravtiwari` username as-is.

- The Home screen profile picture is your real uploaded photo (`public/profile.jpg`), shown in a glowing circular frame with a live 3D tilt that follows your mouse (or finger) — to change the photo, just replace that file with a new image of the same name.
- The 5 "downloaded" files are **completely empty** — they exist only for the fun scare effect and are 100% safe.
- The build was verified with `npm run build` before packaging — it compiles cleanly with zero TypeScript/lint errors on Next.js 14 + React 18.
- Since this is a real animated app running in the browser, an actual screenshot depends on your browser/OS — run `npm run dev` and open `localhost:3000` to see the live, animated result (a static screenshot can't capture the code-rain motion, the floating cards, or the photo's tilt following your mouse).
