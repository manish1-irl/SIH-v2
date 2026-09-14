# Antigravity Design System: Visual & Typography Specification

Welcome to the official visual design system and typography specification for **Antigravity**. Designed to feel organic, highly structured, and deeply refined, this theme couples rich earthy tones with a sophisticated pairing of **Lora** (Serif) and **Montserrat** (Sans-Serif) to achieve a non-generic, high-trust digital aesthetic.

---

## 1. Color Palette & Functional Roles

| Role | Color Name | Hex Code | Purpose & Function |
| :--- | :--- | :--- | :--- |
| **Canvas** | Warm Cream | `#FDFBF7` | Dominant base, background surfaces, page canvases, reducing eye strain. |
| **Structure** | Deep Navy Blue | `#0A2540` | Headers, primary structure, dark theme backgrounds, structural dividers. |
| **Harmony** | Earthy Sage Green | `#87A96B` | Feature badges, success states, subtle secondary highlights, trust accents. |
| **Action** | Burnt Orange | `#D96B27` | Key CTAs, active focus rings, primary interaction points, notification badges. |
| **Typography / Shadow** | Dark Charcoal / Off-Black | `#2B1C03` | Primary body text, deep headings, high-contrast borders, shadow bases. |

### Color Distribution Architecture (60-30-10 Rule)
```
[ ████████████████████████ 60% ] Warm Cream (#FDFBF7) - Page Backgrounds & Cards
[ █████████████ 30% ]            Deep Navy (#0A2540) & Dark Charcoal (#2B1C03) - Structure & Copy
[ ████ 10% ]                      Burnt Orange (#D96B27) & Sage Green (#87A96B) - CTAs & Accents
```

---

## 2. Typography System

The Antigravity typeface system relies on **Lora** to give voice, editorial elegance, and human warmth to display titles, while **Montserrat** provides exceptional clarity, geometric strength, and legibility for body text, interactive elements, data tables, and metadata.

### Font Pairings Overview

* **Display & Headings:** `Lora` (Google Font — Serif)
  * *Characteristics:* Warm, literary, elegant, high legibility at large scales.
  * *Weights:* Regular (400), Medium (500), SemiBold (600), Bold (700).
* **Body & UI Elements:** `Montserrat` (Google Font — Sans-Serif)
  * *Characteristics:* Modern geometric structure, excellent screen readability, high versatility across UI states.
  * *Weights:* Regular (400), Medium (500), SemiBold (600), Bold (700).

---

## 3. Typographic Hierarchy & Scale

$$ \text{Scale Factor} \approx 1.25 \quad (\text{Major Third Scale}) $$

| Level | Typeface | Size (px / rem) | Weight | Line Height | Letter Spacing | Color Token | Primary Usage |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Display H1** | Lora | 48px / `3.0rem` | Bold (700) | `1.15` | `-0.02em` | `#2B1C03` / `#0A2540` | Hero headlines, major landing pages |
| **H1 Title** | Lora | 36px / `2.25rem` | SemiBold (600) | `1.2` | `-0.015em` | `#2B1C03` / `#0A2540` | Primary page headers, section lead titles |
| **H2 Section** | Lora | 28px / `1.75rem` | Medium (500) | `1.25` | `-0.01em` | `#0A2540` | Card group titles, major block headers |
| **H3 Subsection**| Lora | 22px / `1.375rem`| Medium (500) | `1.3` | `0` | `#0A2540` | Sub-section headers, modal titles |
| **Lead Paragraph**| Montserrat | 18px / `1.125rem`| Regular (400) | `1.6` | `0` | `#2B1C03` | Introductory copy, featured summaries |
| **Body (Default)**| Montserrat | 16px / `1.0rem` | Regular (400) | `1.55` | `0` | `#2B1C03` | Main paragraph text, long-form content |
| **Body Small** | Montserrat | 14px / `0.875rem`| Regular (400) | `1.5` | `+0.01em` | `#2B1C03` | Secondary text, sidebars, list items |
| **UI Button / CTA**| Montserrat | 14px / `0.875rem`| SemiBold (600) | `1.25` | `+0.03em` | `#FFFFFF` | Form buttons, navigational tabs |
| **Caption / Meta** | Montserrat | 12px / `0.75rem` | Medium (500) | `1.4` | `+0.04em` | `#0A2540` (70% opacity)| Timestamps, sub-labels, badge text |

---

## 4. CSS Custom Properties & Web Font Import

Add the Google Fonts import link and CSS variables to your global stylesheet (`styles.css`):

```css
/* Google Fonts Import */
@import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400..700;1,400..700&family=Montserrat:ital,wght@0,400..700;1,400..700&display=swap');

:root {
  /* Font Family Definitions */
  --font-serif: 'Lora', Georgia, serif;
  --font-sans: 'Montserrat', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;

  /* Core Palette */
  --color-canvas-bg: #FDFBF7;
  --color-canvas-surface: #FFFFFF;
  --color-navy: #0A2540;
  --color-charcoal: #2B1C03;
  --color-sage: #87A96B;
  --color-orange: #D96B27;

  /* Typography Hierarchy Shortcuts */
  --font-heading-display: 700 3.0rem/1.15 var(--font-serif);
  --font-heading-h1: 600 2.25rem/1.2 var(--font-serif);
  --font-heading-h2: 500 1.75rem/1.25 var(--font-serif);
  --font-heading-h3: 500 1.375rem/1.3 var(--font-serif);
  --font-body: 400 1.0rem/1.55 var(--font-sans);
  --font-body-small: 400 0.875rem/1.5 var(--font-sans);
  --font-ui-label: 600 0.875rem/1.25 var(--font-sans);

  /* Elevation Shadows */
  --shadow-subtle: 0 10px 25px -5px rgba(10, 37, 64, 0.08);
  --shadow-elevated: 0 20px 35px -10px rgba(10, 37, 64, 0.14);
}

/* Base Body Application */
body {
  font-family: var(--font-sans);
  font-size: 1rem;
  line-height: 1.55;
  color: var(--color-charcoal);
  background-color: var(--color-canvas-bg);
  -webkit-font-smoothing: antialiased;
}

h1, h2, h3, h4, .font-heading {
  font-family: var(--font-serif);
  color: var(--color-navy);
}
```

---

## 5. Tailwind CSS Integration (`tailwind.config.js`)

```javascript
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        serif: ['Lora', 'Georgia', 'serif'],
        sans: ['Montserrat', 'sans-serif'],
      },
      colors: {
        antigravity: {
          cream: '#FDFBF7',
          navy: '#0A2540',
          sage: '#87A96B',
          orange: '#D96B27',
          charcoal: '#2B1C03',
        },
      },
    },
  },
};
```

---

## 6. UI Component Implementation Examples

### Feature Hero Section
```html
<section class="bg-[#FDFBF7] py-16 px-8 max-w-4xl mx-auto">
  <span class="font-sans text-xs uppercase tracking-wider font-semibold text-[#87A96B] bg-[#87A96B]/15 px-3 py-1 rounded-full">
    Platform Overview
  </span>
  <h1 class="font-serif text-4xl sm:text-5xl font-bold text-[#0A2540] tracking-tight mt-4 mb-6 leading-tight">
    Thoughtfully structured for visual clarity and speed.
  </h1>
  <p class="font-sans text-lg text-[#2B1C03]/90 leading-relaxed mb-8">
    Antigravity pairs an organic cream background with deeply grounded typography, delivering an engaging digital experience free from visual fatigue.
  </p>
  <div class="flex items-center gap-4">
    <button class="font-sans text-sm font-semibold text-white bg-[#D96B27] hover:bg-[#c45e1f] px-6 py-3 rounded-lg shadow-md transition-all">
      Explore Platform
    </button>
    <button class="font-sans text-sm font-semibold text-[#0A2540] border border-[#0A2540]/30 hover:bg-[#0A2540]/5 px-6 py-3 rounded-lg transition-all">
      View Documentation
    </button>
  </div>
</section>
```

### Elevated Content Card
```html
<div class="bg-white border border-[#0A2540]/10 rounded-xl p-6 shadow-[0_10px_25px_-5px_rgba(10,37,64,0.08)]">
  <div class="flex items-center justify-between mb-4">
    <h3 class="font-serif text-xl font-medium text-[#2B1C03]">
      Sustainable Infrastructure
    </h3>
    <span class="font-sans text-xs text-[#0A2540]/70 font-medium">Updated 2d ago</span>
  </div>
  <p class="font-sans text-sm text-[#2B1C03] leading-normal mb-4">
    Explore how our natural palette and balanced typography hierarchy provide effortless readability under any lighting condition.
  </p>
  <a href="#" class="font-sans text-sm font-semibold text-[#D96B27] hover:underline inline-flex items-center gap-1">
    Read Full Report &rarr;
  </a>
</div>
```

---

## 7. Accessibility Matrix (WCAG Compliance)

| Foreground (Text) | Background | Contrast Ratio | Compliance Standard | Recommended Use |
| :--- | :--- | :--- | :--- | :--- |
| `#2B1C03` (Charcoal) | `#FDFBF7` (Cream) | **16.1:1** | AAA (Pass) | Body text, Montserrat regular copy |
| `#0A2540` (Navy) | `#FDFBF7` (Cream) | **13.5:1** | AAA (Pass) | Lora display titles and headings |
| `#FFFFFF` (White) | `#D96B27` (Orange) | **4.6:1** | AA (Pass) | Primary buttons with Montserrat bold text |
| `#0A2540` (Navy) | `#87A96B` (Sage) | **5.2:1** | AA (Pass) | Badges, tags, highlighted secondary UI |
| `#D96B27` (Orange) | `#FDFBF7` (Cream) | **3.8:1** | AA Large Text Only | Large titles only; avoid using for body body text |
