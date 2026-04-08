# 🏛️ QueueSmart – Government Office Queue Prediction Platform

![QueueSmart Banner](https://img.shields.io/badge/Civic--Tech-Project-0A2540?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Beta-2ECC71?style=for-the-badge)
![Node.js](https://img.shields.io/badge/Node.js-Express-success?style=for-the-badge&logo=nodedotjs)
![Vanilla JS](https://img.shields.io/badge/JavaScript-Vanilla-F1C40F?style=for-the-badge&logo=javascript)

**QueueSmart** is a community-driven civic-technology web application designed to predict, track, and manage wait times at government offices (like RTOs, Passport Kendras, and Municipal Corporations). By combining predictive analytics with crowdsourced data, QueueSmart empowers citizens to reclaim their time and avoid unpredictable crowds.

---

## ✨ Key Features

* **📊 Real-Time Queue Predictions:** Calculates active queue length, estimated waiting time (in minutes), and live trend (Increasing ↗ / Decreasing ↘).
* **💡 Smart Visit Planner:** Analyzes historical crowd curves to recommend the absolute "Best Time to Visit" on any given day.
* **🤝 Community Crowd Reporting:** "Waze for Queues." Users can check-in and report the current line length to dynamically update the system for everyone else.
* **🏆 Gamification & Leaderboard:** Users earn points and badges (e.g., *Queue Scout*, *Queue Hero*, *Time Lord*) for contributing accurate reports.
* **🔔 Smart Alerts & Appointment Booking:** Generates optimized appointment tokens with "Green Windows" (lowest-demand time slots) to minimize waiting.
* **📈 Visual Data:** Integrates Chart.js to display interactive expected-crowd charts showing historical queue volume patterns.
* **♿ Accessible Design:** Fully responsive UI with multi-language support (English, Hindi, Marathi) and high-contrast mode for visually impaired users.
* **🗺️ Live Queue Map:** Interactive Leaflet map with color-coded pins (Green = Low, Yellow = Moderate, Red = Heavy) showing real-time queue status across all offices.
* **🔍 Smart Search & Filter:** Find offices by name or type (e.g., RTO, Passport, Municipal) with instant results.
* **📍 Trend Analysis:** Monitors queue trends over time and recommends the best times to visit based on historical patterns.

---

## 🛠️ Tech Stack

**Frontend:**
* HTML5 & CSS3 (Custom CSS Variables, CSS Grid/Flexbox)
* Vanilla JavaScript (ES6+ async/await, Fetch API)
* [Chart.js](https://www.chartjs.org/) (for data visualization)
* [Leaflet.js](https://leafletjs.com/) (for interactive maps)

**Backend:**
* [Node.js](https://nodejs.org/) runtime
* [Express.js](https://expressjs.com/) (REST API framework)
* CORS (Cross-Origin Resource Sharing)

**Database:**
* Currently using an in-memory JSON data structure (ready to be swapped with Firebase Firestore or PostgreSQL).

---

## 📂 Project Structure

```text
QueueSmart/
│
├── frontend/
│   ├── index.html              # Main application layout and UI
│   ├── styles.css              # Theme, responsive design, and accessibility
│   ├── app.js                  # Frontend logic, API calls, and chart rendering
│   ├── reporting_system.js     # Community reporting engine for queue updates
│   ├── rewards_engine.js       # Points and badge system for user engagement
│   ├── translations.js         # Multi-language support (EN, HI, MR)
│
├── backend/
│   ├── appointments.js         # Smart appointment booking with "Green Window" algorithm
│   ├── prediction_engine.js    # Wait time prediction and trend analysis algorithms
│   ├── mock_data.json          # Mock database with office and service data
│
├── goal_contract.yaml          # Project goals and requirements
├── task_dag.yaml               # Task dependency graph
├── implementation_log.md        # Development progress and milestones
├── system_architecture.md       # Detailed system architecture documentation
└── README.md                    # Project documentation
```

---

## 🚀 Key Features in Detail

### 1. **Predictive Queue Analytics**
- Real-time wait time calculation based on queue length, open counters, and historical service times
- Trend detection (increasing, decreasing, or stable) based on hourly demand patterns
- "Best Time to Visit" recommendations using historical crowd data analysis

### 2. **Smart Appointment System**
- **Green Window Algorithm:** Analyzes demand across three time blocks (Morning, Mid-Day, Afternoon)
- **Service-Based Adjustments:** Dynamic scaling for different service types (applications take longer than renewals)
- **Token Generation:** Provides optimized arrival time and estimated finish time to minimize wait

### 3. **Community Reporting**
- Users can report current queue lengths with one click
- Reports update the system in real-time for all other users
- **Report Points:** 10 points per new report, 5 points for confirming others' reports

### 4. **Gamification System**
Unlock badges based on contribution points:
- **🔍 Queue Scout:** 10 points → First steps in reporting
- **🦸 Queue Hero:** 50 points → Regular contributor
- **⏰ Time Lord:** 100 points → Expert user with extensive data contributions

### 5. **Interactive Visualizations**
- **Live Queue Map:** Color-coded office pins showing queue density
  - 🟢 Green: Low queues (< 20 people)
  - 🟡 Yellow: Moderate (20-50 people)
  - 🔴 Red: Heavy (> 50 people)
- **Historical Charts:** Line charts displaying demand patterns across time blocks
- **Real-time Updates:** Charts refresh instantly as users report data

### 6. **Multi-Language Support**
- English (EN)
- Hindi (HI)
- Marathi (MR)
- Complete UI localization with dynamic language switching

### 7. **Accessibility Features**
- Responsive design works on mobile, tablet, and desktop
- High-contrast color scheme for readability
- Language selector in navigation bar
- Semantic HTML structure

---

## 💻 How to Run Locally

### Prerequisites
- Node.js (v14+)
- Any modern browser

### Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/QueueSmart.git
   cd QueueSmart
   ```

2. **Install dependencies (if backend server is needed):**
   ```bash
   cd backend
   npm install
   ```

3. **Start the frontend:**
   - Open `frontend/index.html` in your browser, or
   - Use a local server: `python -m http.server 8000` (then visit `http://localhost:8000`)

4. **Start the backend (optional for full integration):**
   ```bash
   cd backend
   node server.js
   ```

---

## 🔄 Data Flow

```
User Action (Search/Check In)
        ↓
Frontend (app.js) fetches data from mock_data.json
        ↓
Prediction Engine calculates wait times & trends
        ↓
Rewards Engine tracks user contributions
        ↓
Reporting System updates queue states
        ↓
UI renders results + updates map & charts
```

---

## 📊 API Endpoints (Ready for Backend Integration)

- `GET /offices` - Fetch all offices and their service data
- `GET /offices/:id` - Get specific office details
- `POST /report` - Submit crowd report (user check-in)
- `POST /confirm` - Confirm existing report
- `POST /token` - Generate smart appointment token

---

## 🎯 Future Roadmap

- [ ] Firebase Firestore integration for persistent cloud storage
- [ ] User authentication and personal dashboard
- [ ] Push notifications for queue threshold alerts
- [ ] Advanced analytics dashboard for civic administrators
- [ ] Integration with SMS/WhatsApp for token delivery
- [ ] Historical data export and trend reports
- [ ] Dark mode support

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/YourFeature`)
3. Commit your changes (`git commit -m 'Add YourFeature'`)
4. Push to the branch (`git push origin feature/YourFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License – see the LICENSE file for details.

---

## 📞 Contact & Support

- **Project Lead:** [Khush Patel](https://github.com/your-username)
- **Issues & Feedback:** Open an issue on GitHub
- **Email:** your-email@example.com

---

**Built with ❤️ to make government services faster and smarter.**