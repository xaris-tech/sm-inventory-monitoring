# QR Equipment Logging

Mobile-first web app for logging equipment borrowing via QR codes. Uses Google Sheets as the database via Google Apps Script.

## Quick Start

### 1. Deploy the Google Apps Script API

1. Create a Google Sheet with two sheets named exactly: `Equipment` and `BorrowLog`
2. In the `Equipment` sheet, add headers: `id`, `name`, `description`, `status`
3. In the `BorrowLog` sheet, add headers: `id`, `borrower`, `equipment_id`, `equipment_name`, `borrow_time`, `return_time`, `status`
4. Open **Extensions → Apps Script**
5. Paste the contents of `apps-script/Code.gs`
6. **Deploy → New deployment → Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
7. Copy the web app URL

### 2. Configure the Frontend

Edit `js/config.js`:

```js
const CONFIG = {
  API_URL: 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec',
  ADMIN_PASSWORD: 'your-password-here',
}
```

### 3. Host the Frontend

Deploy the files to any static host:

| Host | How |
|------|-----|
| GitHub Pages | Push to `gh-pages` branch or repo settings |
| Netlify | Drag-drop folder or connect git repo |
| Vercel | `vercel --prod` |
| Local test | `npx serve .` |

### 4. Generate QR Codes

1. Visit `/admin.html` and log in (default password: `admin123`)
2. Add equipment items
3. Click **Show All QR Codes** and print the sheet
4. Cut and attach QR codes to equipment

### 5. Create the Main QR

Generate a QR code pointing to your deployed URL (e.g., `https://your-site.netlify.app`). Use any free QR generator or the one built into the admin page.

## Usage

### Borrow Flow
1. User scans the main site QR → opens the borrow page
2. Enters name (time auto-captured)
3. Taps **Scan Equipment QR** → camera opens
4. Scans QR on equipment → added to list
5. Repeats for more equipment
6. Taps **Submit Borrow** → logged to Google Sheet

### Return Flow
1. User taps **Returning equipment?**
2. Enters name
3. Scans equipment QR
4. Taps **Confirm Return**

### Admin Flow
- Visit `/admin.html` to add/delete equipment
- Generate QR codes for printing
- Equipment status (available/borrowed) tracked automatically

## File Structure

```
├── index.html          → Borrow page (main user-facing)
├── admin.html          → Admin panel
├── css/style.css       → Mobile-first styles
├── js/
│   ├── config.js       → API URL & settings
│   ├── api.js          → Google Apps Script API client
│   ├── app.js          → Borrow page logic
│   └── admin.js        → Admin page logic
├── apps-script/
│   └── Code.gs         → Google Apps Script (deploy to Sheets)
└── SPEC.md             → Specification document
```

## Tech Stack

- **Frontend:** Vanilla HTML/CSS/JS (no build step)
- **QR Scan:** `html5-qrcode` (browser camera)
- **QR Generate:** `qrcodejs` (client-side)
- **Database:** Google Sheets via Apps Script API
- **Hosting:** Any static host (GitHub Pages, Netlify, Vercel)
