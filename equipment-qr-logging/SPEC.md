# Spec: QR Equipment Logging

## Objective

A mobile-focused web application for logging equipment borrowing via QR codes. Users scan a QR code to open the site, fill in their name (time auto-captured), scan equipment QR codes to build a borrow list, and submit the log to Google Sheets. The same flow works for returns.

**Users:** Borrowers (anyone with a phone camera) and Admins (equipment managers)

**Success:** A borrower can complete a full borrow cycle in under 30 seconds with just their phone camera.

## Tech Stack

- **Frontend:** Vanilla HTML, CSS, JavaScript (no framework, no build step)
- **QR Scanning:** `html5-qrcode` library (browser-based camera scanner)
- **QR Generation:** `qrcodejs` library (client-side, unlimited, no API calls)
- **Backend:** Google Apps Script web app (REST API → Google Sheets)
- **Hosting:** GitHub Pages / Netlify / Vercel (static site)

## Commands

```
Dev:     npx serve .                  (local static server)
Build:   None needed (vanilla HTML/CSS/JS)
Lint:    None configured
Deploy:  Push to GitHub Pages / Netlify / Vercel
```

## Project Structure

```
equipment-qr-logging/
├── index.html            → Borrow page (main user-facing page)
├── admin.html            → Admin page (manage equipment, view logs)
├── css/
│   └── style.css         → All styles (mobile-first, dark/light)
├── js/
│   ├── app.js            → Borrow page logic (form, scanner, submit)
│   ├── admin.js          → Admin page logic (CRUD equipment, generate QRs)
│   └── api.js            → Google Apps Script API client (fetch wrapper)
├── SPEC.md               → This specification
└── .gitignore
```

## Code Style

- **Formatting:** 2-space indentation, single quotes, semicolons
- **Naming:** `camelCase` for JS variables/functions, `kebab-case` for CSS classes/IDs, `UPPER_SNAKE` for constants
- **CSS:** Mobile-first, no preprocessor, CSS custom properties for theming
- **HTML:** Semantic elements (`<main>`, `<section>`, `<form>`), no div soup

```js
// Example style
const API_BASE = 'https://script.google.com/.../exec'

async function submitBorrow(borrowerName, equipmentIds, timestamp) {
  const payload = { name: borrowerName, items: equipmentIds, time: timestamp }
  const res = await fetch(API_BASE, {
    method: 'POST',
    body: JSON.stringify(payload)
  })
  return res.json()
}
```

## Data Flow

### Google Sheets Structure

**Sheet 1 — Equipment:**
| id | name | description | status |
|----|------|-------------|--------|
| EQ-001 | Drill | Heavy-duty drill | available |
| EQ-002 | Ladder | 6ft extension ladder | borrowed |

**Sheet 2 — BorrowLog:**
| id | borrower | equipment_id | equipment_name | borrow_time | return_time | status |
|----|----------|-------------|----------------|-------------|-------------|--------|
| 1 | Alice | EQ-001 | Drill | 2026-05-16T10:00 | 2026-05-16T16:00 | returned |

### Google Apps Script API

```
GET    ?action=getEquipment     → [{id, name, description, status}]
POST   ?action=borrow           → { success: true }
POST   ?action=return           → { success: true }
POST   ?action=addEquipment     → { success: true }  (admin)
POST   ?action=deleteEquipment  → { success: true }  (admin)
```

### User Flows

**Borrow (main flow):**
1. User scans main QR (or visits URL) → `index.html` loads
2. User enters name (time auto-captured from `new Date()`)
3. User taps "Scan Equipment" → camera opens via `html5-qrcode`
4. User scans equipment QR → equipment ID decoded → added to list
5. Repeat step 3-4 for more equipment
6. User taps "Submit Borrow" → `POST ?action=borrow` to Google Sheets
7. Confirmation screen shown

**Return:**
1. User visits site → taps "Return Equipment"
2. User enters name (time auto-captured)
3. User scans equipment QR (either via camera button or directly scanning the equipment QR URL)
4. Equipment marked as returned via `POST ?action=return`
5. Confirmation screen shown

### QR Code Encoding

- **Main site QR:** Encodes the full website URL (e.g., `https://user.github.io/equipment-qr-logging/`)
- **Equipment QR:** Encodes the equipment ID only (e.g., `EQ-001`) — simple text string, readable by the on-page scanner

## Boundaries

- **Always do:** Capture time from browser (not user input), validate form before submit, show loading state during API calls, handle camera errors gracefully, mobile-first responsive design
- **Ask first:** Changing the Google Sheets structure, adding new API endpoints, adding external dependencies, changing the QR encoding scheme
- **Never do:** Store secrets in client-side code, modify the Google Sheet outside the API, commit without testing

## Open Questions

1. **Google Apps Script setup** — Do you need help setting up the Google Sheet + Apps Script deployment, or will you handle that separately?
2. **Equipment QR print format** — Should the admin page generate printable QR code sheets (e.g., 8.5x11 PDF with multiple QRs per page)?
3. **Authentication** — Does the admin page need a password, or is it acceptable to just have it at a separate URL?
4. **Borrow time limit** — Is there a max borrow duration or do items stay borrowed until returned?
