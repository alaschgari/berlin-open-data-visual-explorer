# 🏙️ Berlin Open Data – Visual Explorer

> **🇩🇪 Deutsch** | [🇬🇧 English](#-berlin-open-data--visual-explorer-english)

---

## 🇩🇪 Berlin Open Data – Visual Explorer (Deutsch)

Ein interaktives Dashboard zur Visualisierung öffentlicher Berliner Daten. Die Anwendung aggregiert offizielle Datensätze des Landes Berlin und stellt sie übersichtlich, filterbar und zweisprachig (Deutsch/Englisch) dar.

### ✨ Funktionen

| Modul | Beschreibung |
|---|---|
| 🏦 **Haushalt** | **Planung 2026/27** sowie historische Daten (>140.000 Datensätze) mit parallelem Datenabruf |
| 💰 **Subventionen** | Vollständige Datenbank aller **54.771 Förderbescheide** inklusive Empfänger-Insights |
| 👥 **Demografie** | Bevölkerungskarte und Altersstruktur nach LOR-Planungsräumen |
| 🚗 **Verkehr** | Aktuelle Verkehrs­belastung und historische Verläufe via Telraam API |
| 🏪 **Gewerbedaten** | Hochpräzise Karte mit bis zu **10.000 Unternehmen** gleichzeitig |
| 💵 **Steuereinnahmen** | Live-Daten aus dem Haushalt inkl. **Planungswerten** für 2026/2027 |
| 🚰 **Abwasser** | Abwasser­kennzahlen und Gesundheitstrends im Zeitverlauf |
| 🚲 **Fahrraddiebstahl** | Interaktive Karte der Fahrraddiebstähle nach Bezirk |
| 🛒 **Wochenmärkte** | Karte aller Wochenmärkte in Berlin |
| 🏊 **Badestellen** | Wasserqualität an Berliner Badestellen mit Live-Daten |

### 🗂️ Projektstruktur

```
src/
├── app/            # Next.js App Router (Seiten & API-Routen)
├── components/     # React-Komponenten (Views, Karten, Charts)
├── hooks/          # Custom React Hooks
└── lib/            # Datenabruf, Parsing, Hilfsfunktionen

data/
└── processed/      # Vorverarbeitete JSON-Datensätze (lokal, nicht in Git)

scripts/            # Datenpipeline-Skripte (Sync, Verarbeitung)
public/             # Statische Assets und GeoJSON-Dateien
```

### 🚀 Lokale Entwicklung

**Voraussetzungen:** Node.js ≥ 18, npm

```bash
# Repository klonen
git clone https://github.com/alaschgari/berlin-open-data-visual-explorer.git
cd berlin-open-data-visual-explorer

# Abhängigkeiten installieren
npm install

# Entwicklungsserver starten
npm run dev
```

Die App ist dann unter [http://localhost:3000](http://localhost:3000) erreichbar.

### ⚙️ Verfügbare Scripts

| Befehl | Beschreibung |
|---|---|
| `npm run dev` | Entwicklungsserver starten |
| `npm run build` | Produktions­build erstellen |
| `npm run start` | Produktions­server starten |
| `npm run lint` | Code-Analyse mit ESLint |
| `npm run sync` | Berliner Open-Data-Quellen synchronisieren |
| `npm run update-theft` | Fahrraddiebstahl-Daten aktualisieren |

### 🌐 Deployment

Das Projekt ist für **Vercel** optimiert. Einfach das Repository verbinden und Vercel erkennt Next.js automatisch.

```bash
# Oder via Vercel CLI:
npx vercel
```

> ⚠️ **Umgebungsvariablen:** Alle Einträge aus `.env.local` müssen im Vercel-Dashboard unter *Settings → Environment Variables* hinterlegt werden.

### 🛠️ Tech Stack

- **Framework:** [Next.js 15](https://nextjs.org) (App Router, SSR)
- **Datenbank:** [Supabase](https://supabase.com) (PostgreSQL) für High-Scale Datenverarbeitung
- **Sprache:** TypeScript
- **Styling:** Tailwind CSS v4
- **Karten:** Leaflet / React-Leaflet
- **Charts:** Recharts, D3.js
- **Daten:** Berliner Open-Data-Portal, Live-APIs

---

---

## 🇬🇧 Berlin Open Data – Visual Explorer (English)

An interactive dashboard for visualising Berlin's public open data. The application aggregates official datasets from the Federal State of Berlin and presents them in a clear, filterable, and bilingual (German/English) interface.

### ✨ Features

| Module | Description |
|---|---|
| 🏦 **Budget** | **Plan 2026/27** and historical data (>140k records) using parallel chunked fetching |
| 💰 **Subsidies** | Complete database of all **54,771 grant resolutions** with recipient insights |
| 👥 **Demographics** | Population map and age structure by LOR planning areas |
| 🚗 **Traffic** | Current traffic load and historical trends via Telraam API |
| 🏪 **Business** | High-precision map with support for up to **10,000 businesses** |
| 💵 **Tax Revenue** | Live budget data including **planned figures** for 2026/2027 |
| 🚰 **Wastewater** | Wastewater statistics and health trends over time |
| 🚲 **Bicycle Theft** | Interactive map of bicycle thefts by district |
| 🛒 **Markets** | Map of all weekly markets in Berlin |
| 🏊 **Bathing Spots** | Water quality at Berlin bathing spots with live data |

### 🗂️ Project Structure

```
src/
├── app/            # Next.js App Router (pages & API routes)
├── components/     # React components (views, maps, charts)
├── hooks/          # Custom React hooks
└── lib/            # Data fetching, parsing, utilities

data/
└── processed/      # Pre-processed JSON datasets (local, not in Git)

scripts/            # Data pipeline scripts (sync, processing)
public/             # Static assets and GeoJSON files
```

### 🚀 Local Development

**Requirements:** Node.js ≥ 18, npm

```bash
# Clone the repository
git clone https://github.com/alaschgari/berlin-open-data-visual-explorer.git
cd berlin-open-data-visual-explorer

# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

### ⚙️ Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm run start` | Start the production server |
| `npm run lint` | Lint code with ESLint |
| `npm run sync` | Sync Berlin open data sources |
| `npm run update-theft` | Update bicycle theft data |

### 🌐 Deployment

The project is optimised for **Vercel**. Simply connect the repository and Vercel will automatically detect Next.js.

```bash
# Or via Vercel CLI:
npx vercel
```

> ⚠️ **Environment Variables:** All entries from `.env.local` must be added in the Vercel dashboard under *Settings → Environment Variables*.

### 🛠️ Tech Stack

- **Framework:** [Next.js 15](https://nextjs.org) (App Router, SSR)
- **Database:** [Supabase](https://supabase.com) (PostgreSQL) for large-scale data handling
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **Maps:** Leaflet / React-Leaflet
- **Charts:** Recharts, D3.js
- **Data:** Berlin Open Data Portal, live APIs

### 📄 License

This project uses publicly available data from the [Berlin Open Data Portal](https://daten.berlin.de). The source code is provided as-is for educational and civic purposes.
