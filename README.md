# 💎 Dev Tools Dashboard

A premium, high-density single-page **Tool Discovery Dashboard** styled with a modern developer-tool aesthetic (Linear, Vercel, Supabase) and warm rose accents. Designed to browse, search, sort, and discover essential web tools and resources efficiently.

Built with **pure Vanilla HTML, CSS, and JavaScript** — zero frameworks, zero external bundlers, and zero CSS libraries. Fully optimized for instant loading, high-performance rendering (5000+ items), and seamless GitHub Pages hosting.

---

## ✨ Features

### 🎨 Visual Design & Aesthetics
*   **Luxury Dark Mode:** Implemented a deep black canvas (`#070708`) with a massive, highly blurred rose-cream ambient glow emerging from the bottom center.
*   **Translucent Glassmorphism:** Outer panel cards and dropdown menus are styled with `backdrop-filter: blur(24px)`, semi-transparent surfaces, and thin micro-borders (`rgba(255, 255, 255, 0.04)`).
*   **Top Glow Reflection:** The main table card features an elegant, horizontal rose gradient border-top line to create depth and premium lighting.
*   **Typography:** Powered by Google Fonts' **Plus Jakarta Sans** for a crisp, high-end SaaS appearance.

### ⚙️ UX & Functionality
*   **Locked Viewport Scrolling:** The page fits the browser window height on desktop (`height: 100vh; overflow: hidden;`), containing table list scrolling inside the card wrapper. Normal vertical page scrolling is automatically released on mobile screens.
*   **Category Filter Dropdown:** A custom dropdown popover menu replacing generic chips. Features a funnel filter icon, active indicator labels, dynamically injected category checkmarks, and auto-dismisses when clicking outside.
*   **Real-Time Search:** Instant filtering on tool name or URL as you type, complete with an inline search icon and active focus transitions.
*   **Bidirectional URL Sync:** Toggles and search queries automatically synchronize to URL parameters (`?q=query&category=name`) without reloading, allowing deep-linking and bookmark sharing.
*   **Persistent Filter State:** Caches your active category inside `localStorage` to preserve selection across page refreshes.
*   **Sort Selector Dropdown:** Sort results instantly by **Name (A-Z / Z-A)** or **Category (A-Z / Z-A)** while maintaining search criteria.
*   **Link Copying with Feedback:** Copies the target URL to the clipboard using the Clipboard API, and transforms the button to a green `"✓ Copied"` state for 2 seconds.
*   **Dedicated Empty State:** Centered card overlay indicating zero results with a friendly warning graphic and a `"Clear Filters"` action button.
*   **Clear All Button:** A single secondary reset button to wipe out search text, active categories, sorting options, URL query strings, and `localStorage` states.

### ⚡ Performance & Scalability
*   **Document Fragments:** Dynamic table rows are assembled in-memory using `DocumentFragment` before injection to minimize browser layout reflows.
*   **Event Delegation:** List clicks (Copy actions, redirects) are captured by a single event listener on the `<tbody>` container, drastically reducing memory footprint and ensuring smooth performance for datasets containing 5000+ tools.
*   **Stable Palettes:** Pre-calculates name-based stable hash indexes to assign tool icons one of five gradient background colors, ensuring visual consistency across filter operations.

---

## 🛠️ Tech Stack

*   **HTML5:** Pure semantic markup (header, section, main, table, footer, SVG graphics).
*   **Vanilla CSS:** Custom HSL variables, fluid typography, flexbox/grid alignments, responsive media query breakpoints, and hardware-accelerated animations.
*   **Vanilla JavaScript (ES6+):** Async/Fetch APIs, State Management, History API parameter sync, Clipboard API, and Event Delegation.

---

## 📂 Project Structure

```text
├── datas/
│   └── tools.json       # JSON database of tools, descriptions, and categories
├── scripts/
│   └── app.js           # Modular state, filters, copy link, and rendering logic
├── styles/
│   └── styles.css       # Core design system, glassmorphism overlays, animations
├── README.md            # GitHub documentation
└── index.html           # Main semantic markup container
```

---

## 🚀 Local Setup & Deployment

Since the dashboard fetches its data dynamically via the browser's Fetch API, running it requires a local web server (to avoid browser CORS blocks caused by opening via `file://`). Additionally, the dashboard features a **Local Admin System** that is activated only in local environments when running the Node.js backend.

### 1. Run the Local Admin Backend (Node.js)
To enable the capability to add or delete tools directly from the dashboard:
1. Open the project folder in your terminal.
2. Install the backend dependencies:
   ```bash
   npm install
   ```
3. Start the local server on `http://localhost:3000`:
   ```bash
   npm start
   ```
   *(Alternatively, run `npm run dev` for auto-restarts via `--watch` mode during development).*

### 2. Run the Dashboard Frontend
You can run the frontend client using any local web server. The backend is configured with CORS to allow cross-origin requests from local dev ports.

#### Option A: Run via VS Code Live Server (Recommended)
1. Install the **Live Server** extension in Visual Studio Code.
2. Open the project folder in VS Code.
3. Click **"Go Live"** in the bottom status bar.
4. Your browser will open the app on `http://127.0.0.1:5500/index.html`.

#### Option B: Run via HTTP-Server
Run a static server from a separate terminal:
```bash
npx http-server -p 8000
```
Open `http://localhost:8000` in your web browser.

---

## 🔒 Environment Rules & Security

*   **Local Development:**
    When the dashboard is opened on `localhost` or `127.0.0.1`, and the local backend server on port 3000 is active, the **Local Admin Mode** is automatically enabled. An admin toolbar and checkbox selections will appear, allowing you to add new tools (with duplicate checking) or delete selected ones. The changes are saved directly into `datas/tools.json`.
*   **Offline/Fallback Mode:**
    If you are running the dashboard locally but the Node.js server is stopped, the dashboard will fall back gracefully to reader-only mode, and the admin toolbar remains hidden.
*   **Production Deployment (GitHub Pages):**
    When deployed to a public server (like GitHub Pages), all admin actions, checkbox columns, buttons, and modals are **completely hidden and disabled**. Public visitors will only see the read-only dashboard.

### Deploying to GitHub Pages
The project is static and pre-configured for instant deployment to **GitHub Pages**:
1. Push this repository to GitHub.
2. Go to your repository's **Settings** > **Pages**.
3. Under **Build and deployment**, set the source to **Deploy from a branch** and select your main/master branch.
4. Click **Save**. Your site will be live at `https://<username>.github.io/<repository-name>/`.

