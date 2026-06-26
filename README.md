# 🏥 HMS External UI — Hospital Management System

> A modern, responsive external web interface for a Salesforce-powered Hospital Management System, built with vanilla HTML/CSS/JavaScript and connected to Salesforce via OAuth 2.0 + REST API.

---

## 🌐 Live Demo

> Coming soon via Netlify deployment

---

## 📸 Screenshots

| Dashboard | Patients | Doctors |
|-----------|----------|---------|
| KPI cards + overdue invoices | Patient grid with search | Doctor cards with performance |

---

## ✨ Features

- 🔐 **Salesforce OAuth 2.0 Login** — secure implicit flow authentication
- 📊 **Executive Dashboard** — live KPIs (patients, doctors, appointments, invoices)
- 👤 **Patient Management** — searchable patient grid with status badges
- 🩺 **Doctor Directory** — doctor cards with appointment performance bars
- 📅 **Appointments View** — today's appointments with status tracking
- 📝 **Book Appointment** — create appointments directly into Salesforce in real-time
- 🔄 **Live Data** — all data fetched directly from Salesforce REST API

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Authentication | Salesforce OAuth 2.0 (Implicit Flow) |
| Data | Salesforce REST API v59.0 |
| Backend | Salesforce Org (Apex, Custom Objects) |
| Hosting | GitHub Pages / Netlify |

---

## 📁 Project Structure

```
hms-ui/
├── login.html          # Salesforce OAuth login page
├── callback.html       # OAuth redirect handler
├── index.html          # Executive Dashboard (KPIs + tables)
├── patients.html       # Patient list with search & filter
├── appointments.html   # Appointments table view
├── doctors.html        # Doctor cards with performance metrics
├── booking.html        # Book new appointment form
├── api.js              # All Salesforce REST API calls
└── style.css           # Shared styles
```

---

## ⚙️ Setup & Configuration

### Prerequisites
- A Salesforce Developer Org with HMS objects deployed
- VS Code + Live Server extension

### Step 1 — Create a Salesforce Connected App
1. Setup → App Manager → New Connected App
2. Enable OAuth → add scopes: `api`, `id`
3. Callback URL: `http://localhost:8080/callback.html`
4. Save and copy the **Consumer Key**

### Step 2 — Configure api.js
```js
const SF_CONFIG = {
  clientId:    'YOUR_CONSUMER_KEY',
  redirectUri: 'http://localhost:8080/callback.html',
  loginUrl:    'https://login.salesforce.com'
};
```

### Step 3 — Add CORS in Salesforce
Setup → CORS → New → `http://localhost:8080`

### Step 4 — Run Locally
```bash
# Open folder in VS Code
# Right click login.html → Open with Live Server
# Visit http://localhost:8080/login.html
```

---

## 🔗 Related Repository

> 🔧 [hms-salesforce](https://github.com/vvcvivek/hms-salesforce) — Salesforce backend (Apex classes, LWC components, Custom Objects, Triggers)

---

## 👨‍💻 Author

**Vivek** — Salesforce Developer  
📧 [GitHub](https://github.com/vvcvivek)

---

## 📄 License

This project is for portfolio and educational purposes.
