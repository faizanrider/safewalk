<div align="center">

# 🛡️ SafeWalk

### Smart Personal Safety Navigation System

**Real-time location tracking · Instant SOS alerts · Safety map visualization · Safe route navigation**

[![Python](https://img.shields.io/badge/Python-3.9+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![Flask](https://img.shields.io/badge/Flask-3.1-000000?style=for-the-badge&logo=flask&logoColor=white)](https://flask.palletsprojects.com)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![Google Maps](https://img.shields.io/badge/Google_Maps-API-4285F4?style=for-the-badge&logo=googlemaps&logoColor=white)](https://developers.google.com/maps)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

</div>

---

## 📋 Problem Statement

Many people face safety concerns when walking alone — especially at night, in unfamiliar areas, or in regions with high crime rates. There is a lack of accessible, real-time safety tools that can:

- Alert trusted contacts in emergencies
- Visualize safe vs. unsafe areas
- Suggest the safest walking routes
- Work across all devices through a web browser

**SafeWalk** addresses these challenges by providing a comprehensive personal safety platform accessible from any device.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🚨 **SOS Emergency Alerts** | One-tap SOS button sends your live GPS location to all emergency contacts via SMS and email |
| 📍 **Live Location Tracking** | Continuous GPS tracking using Browser Geolocation API with real-time map updates |
| 🗺️ **Safety Map Visualization** | Color-coded zones: 🟢 Safe · 🔵 Normal · 🔴 Unsafe |
| 🧭 **Safe Route Navigation** | Route recommendations with safety scores — green (safest), blue (normal), red (risky) |
| 👥 **Emergency Contacts** | Manage trusted contacts who are instantly notified during SOS events |
| 🔐 **Secure Authentication** | User registration and login via Supabase Auth with session management |
| ⚠️ **Report Unsafe Areas** | Community-driven safety reporting with severity levels |
| 📱 **Fully Responsive** | Works on smartphones, tablets, laptops, and desktops |

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT (Browser)                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐ │
│  │  HTML5    │ │  CSS3    │ │  JS ES6+ │ │Google Maps │ │
│  │ Templates │ │ Modern   │ │  Modules │ │    API     │ │
│  └────┬─────┘ └──────────┘ └────┬─────┘ └────────────┘ │
│       │          REST API        │                       │
└───────┼──────────────────────────┼───────────────────────┘
        │                          │
┌───────▼──────────────────────────▼───────────────────────┐
│                  FLASK BACKEND (Python)                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐ │
│  │ Auth API │ │  SOS API │ │Location  │ │ Safety API │ │
│  │          │ │          │ │  API     │ │            │ │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬───────┘ │
│       │             │            │             │         │
│  ┌────▼─────────────▼────────────▼─────────────▼───────┐ │
│  │              SERVICE LAYER                          │ │
│  │  Supabase Client · SMS (Twilio) · Email (SMTP)     │ │
│  └─────────────────────┬───────────────────────────────┘ │
└─────────────────────────┼────────────────────────────────┘
                          │
┌─────────────────────────▼────────────────────────────────┐
│               SUPABASE (Cloud)                           │
│  ┌────────────┐ ┌──────────────┐ ┌────────────────────┐ │
│  │ PostgreSQL │ │    Auth      │ │  Row Level Security│ │
│  │  Database  │ │   Service    │ │      Policies      │ │
│  └────────────┘ └──────────────┘ └────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | HTML5, CSS3, JavaScript (ES6+) |
| **Backend** | Python 3.9+, Flask 3.1 |
| **Database** | Supabase (PostgreSQL) |
| **Authentication** | Supabase Auth |
| **Maps** | Google Maps JavaScript API |
| **Location** | Browser Geolocation API |
| **SMS Alerts** | Twilio API |
| **Email Alerts** | SMTP (Gmail) |
| **Version Control** | Git + GitHub |

---

## 📁 Project Structure

```
safewalk/
├── backend/
│   ├── app.py                 # Flask application entry point
│   ├── config.py              # Environment configuration
│   ├── routes/
│   │   ├── auth.py            # Authentication endpoints
│   │   ├── contacts.py        # Emergency contacts CRUD
│   │   ├── sos.py             # SOS alert system
│   │   ├── location.py        # Location tracking
│   │   └── safety.py          # Safety zones & reports
│   └── services/
│       ├── supabase_client.py # Supabase DB client
│       ├── sms_service.py     # Twilio SMS service
│       ├── email_service.py   # SMTP email service
│       └── location_service.py# Location utilities
├── frontend/
│   ├── templates/
│   │   ├── index.html         # Landing page
│   │   ├── login.html         # Login page
│   │   ├── signup.html        # Registration page
│   │   ├── dashboard.html     # User dashboard
│   │   └── map.html           # Safety map page
│   └── static/
│       ├── css/
│       │   └── style.css      # Complete design system
│       └── js/
│           ├── app.js         # Core app logic & utilities
│           ├── map.js         # Google Maps integration
│           ├── sos.js         # SOS emergency logic
│           ├── contacts.js    # Contacts management
│           └── location.js    # Live location tracking
├── database/
│   └── schema.sql             # Supabase database schema
├── .env.example               # Environment variables template
├── .gitignore
├── requirements.txt           # Python dependencies
└── README.md
```

---

## 🚀 Setup Instructions

### Prerequisites

- **Python 3.9+** — [Download](https://www.python.org/downloads/)
- **Git** — [Download](https://git-scm.com/downloads)
- **VS Code** — [Download](https://code.visualstudio.com/)
- **Supabase Account** — [Sign Up (Free)](https://supabase.com/)
- **Google Maps API Key** — [Get Key](https://developers.google.com/maps/documentation/javascript/get-api-key)
- **Twilio Account** (for SMS) — [Sign Up](https://www.twilio.com/try-twilio)
- **Gmail App Password** (for email) — [Generate](https://myaccount.google.com/apppasswords)

### Step 1: Clone & Enter Project

```bash
git clone https://github.com/yourusername/safewalk.git
cd safewalk
```

### Step 2: Create Virtual Environment

```bash
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate
```

### Step 3: Install Dependencies

```bash
pip install -r requirements.txt
```

### Step 4: Configure Environment Variables

```bash
# Copy the template
copy .env.example .env    # Windows
cp .env.example .env      # macOS / Linux
```

Edit `.env` and fill in your credentials:

| Variable | How to Get |
|---|---|
| `SUPABASE_URL` | Supabase Dashboard → Settings → API → Project URL |
| `SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API → `anon` `public` key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API → `service_role` key |
| `GOOGLE_MAPS_API_KEY` | Google Cloud Console → APIs → Maps JavaScript API |
| `TWILIO_ACCOUNT_SID` | Twilio Console → Account SID |
| `TWILIO_AUTH_TOKEN` | Twilio Console → Auth Token |
| `TWILIO_PHONE_NUMBER` | Twilio Console → Phone Numbers |
| `SMTP_EMAIL` | Your Gmail address |
| `SMTP_PASSWORD` | Gmail → App Passwords → Generate |

### Step 5: Set Up Database

1. Go to your Supabase project → **SQL Editor**
2. Open `database/schema.sql`
3. Copy the entire contents and run it in the SQL Editor
4. This creates all tables with Row Level Security policies

### Step 6: Run the Application

```bash
python backend/app.py
```

Open your browser and navigate to: **http://localhost:5000**

---

## 🗂️ API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/signup` | Register new user |
| `POST` | `/api/auth/login` | Login user |
| `POST` | `/api/auth/logout` | Logout user |
| `GET` | `/api/auth/me` | Get current user profile |
| `GET` | `/api/contacts` | List emergency contacts |
| `POST` | `/api/contacts` | Add emergency contact |
| `PUT` | `/api/contacts/:id` | Update contact |
| `DELETE` | `/api/contacts/:id` | Delete contact |
| `POST` | `/api/sos/trigger` | Trigger SOS alert |
| `GET` | `/api/sos/history` | Get SOS event history |
| `PUT` | `/api/sos/resolve/:id` | Resolve SOS event |
| `POST` | `/api/location/update` | Update user location |
| `GET` | `/api/location/history` | Get location history |
| `GET` | `/api/location/latest` | Get latest location |
| `GET` | `/api/safety/zones` | Get safety zones |
| `GET` | `/api/safety/reports` | Get safety reports |
| `POST` | `/api/safety/report` | Report unsafe area |
| `GET` | `/api/health` | Health check |

---

## 📱 Device Compatibility

SafeWalk uses a **mobile-first responsive design** that adapts to all screen sizes:

| Device | Experience |
|---|---|
| **Smartphones** | Full-screen map, large SOS button at thumb reach, swipeable panels |
| **Tablets** | Side-by-side dashboard layout, expanded map view |
| **Laptops** | Multi-column dashboard, toolbar-based map controls |
| **Desktops** | Full feature layout with hover effects and expanded panels |

The CSS uses responsive breakpoints at `768px` and `480px` with fluid typography (`clamp()`) to ensure readability across all devices.

---

## 📤 GitHub Push Guide

### Initialize & Push

```bash
# Initialize Git repository
cd safewalk
git init

# Add all files
git add .

# First commit
git commit -m "Initial commit: SafeWalk personal safety platform"

# Create repo on GitHub, then:
git remote add origin https://github.com/faizanrider/safewalk.git
git branch -M main
git push -u origin main
```

---

## ☁️ Deployment (Render)

### Step 1: Push to GitHub
If you haven't pushed yet:
```bash
git init
git add .
git commit -m "Initial commit: SafeWalk"
git remote add origin https://github.com/faizanrider/safewalk.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy to Render
1.  Go to [Render.com](https://render.com) and sign in.
2.  Click **New +** and select **Blueprint**.
3.  Connect your GitHub repository: `faizanrider/safewalk`.
4.  Render will automatically detect the `render.yaml` file.
5.  **Enter Environment Variables:** You will be prompted to enter the keys from your `.env` (Supabase, Google Maps, Twilio, etc.).
6.  Click **Deploy**.

> [!NOTE]
> **GitHub Pages** is not suitable for this project because it only supports static files (HTML/JS). SafeWalk requires a Python/Flask background to handle SOS alerts and database security. Render is the recommended free-tier option for Flask apps.

### Ongoing Updates

```bash
# Check status
git status

# Stage changes
git add .

# Commit with message
git commit -m "feat: add new safety feature"

# Push to GitHub
git push
```

### Version Tags

```bash
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```

---

## 📄 License

This project is licensed under the MIT License.

---

<div align="center">

**Built with ❤️ for personal safety**

🛡️ SafeWalk – Walk safe, anywhere, anytime.

</div>
