/**
 * Wait Time Prediction Logic 
 * (Mirrored from backend/prediction_engine.js for frontend display since we don't have a live node API yet)
 */
class PredictionEngine {
    static calculateEstimatedWaitTime(queueLength, avgProcessTimeMinutes, openCounters) {
        if (openCounters <= 0) return -1;
        if (queueLength <= 0) return 0;
        const throughputPerMinute = openCounters / avgProcessTimeMinutes;
        return Math.round(queueLength / throughputPerMinute);
    }

    static formatWaitTime(waitTimeMinutes, lang = 'en') {
        const t = window.translations[lang] || window.translations['en'];
        if (waitTimeMinutes < 0) return t.time_closed;
        if (waitTimeMinutes === 0) return t.time_immediate;
        const hours = Math.floor(waitTimeMinutes / 60);
        const mins = waitTimeMinutes % 60;
        return hours > 0 ? `${hours} ${t.time_hr} ${mins} ${t.time_mins}` : `${mins} ${t.time_mins}`;
    }

    static calculateTrend(recentHourlyDemand, lang = 'en') {
        const t = window.translations[lang] || window.translations['en'];
        if (!recentHourlyDemand || recentHourlyDemand.length < 2) return t.trend_stable;
        const newest = recentHourlyDemand[recentHourlyDemand.length - 1];
        const previous = recentHourlyDemand[recentHourlyDemand.length - 2];
        const diff = newest - previous;
        const threshold = previous * 0.1;
        
        if (diff > threshold) return t.trend_increasing;
        if (diff < -threshold) return t.trend_decreasing;
        return t.trend_stable;
    }
}

/**
 * Frontend Application Logic
 */
document.addEventListener("DOMContentLoaded", () => {
    // UI Elements
    const searchInput = document.getElementById("office-search");
    const searchBtn = document.getElementById("btn-search");
    const resultsContainer = document.getElementById("results-container");
    const pointsEl = document.getElementById("user-points");
    const badgesEl = document.getElementById("user-badges");

    // Modal Elements
    const bookingModal = document.getElementById("booking-modal");
    const closeModalBtn = document.getElementById("close-modal");
    const prefTimeSelect = document.getElementById("pref-time");
    const generateTokenBtn = document.getElementById("btn-generate-token");
    const bookingResult = document.getElementById("booking-result");
    const bookingForm = document.getElementById("booking-form");
    
    // System State
    let allOffices = [];
    let rewardsEngine = null;
    let reportingSystem = null;

    // State for Booking
    let activeBookingServiceId = null;
    let activeBookingOfficeId = null;
    
    // Map State
    let queueMap = null;
    let mapMarkers = [];

    // Language State
    let currentLang = 'en';
    const langSelect = document.getElementById("lang-select");
    
    if (langSelect) {
        langSelect.addEventListener("change", (e) => {
            switchLanguage(e.target.value);
        });
    }

    function switchLanguage(lang) {
        currentLang = lang;
        const t = window.translations[lang] || window.translations['en'];
        
        // Update Static HTML Elements
        document.querySelectorAll("[data-i18n]").forEach(el => {
            const key = el.getAttribute("data-i18n");
            if (t[key]) el.textContent = t[key];
        });
        
        document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
            const key = el.getAttribute("data-i18n-placeholder");
            if (t[key]) el.placeholder = t[key];
        });
        
        // Re-render dynamic elements
        if (allOffices.length > 0) {
            handleSearch(); // Triggers re-render of offices and map
        }
    }

    // Fetch mock data from backend
    fetch("../backend/mock_data.json")
        .then(response => response.json())
        .then(data => {
            allOffices = data.offices;
            
            // Initialize Systems
            rewardsEngine = new RewardsEngine("user_123");
            reportingSystem = new ReportingSystem(allOffices, rewardsEngine);

            updateUserStatsUI();
            initMap(allOffices);
            renderOffices(allOffices);
            
            // Initial setup for search
            searchBtn.addEventListener("click", handleSearch);
        })
        .catch(error => {
            console.error("Error fetching mock data:", error);
            resultsContainer.innerHTML = `<div class="empty-state"><p>Error loading data. Please try again later.</p></div>`;
        });

    // Handle Search click
    searchBtn.addEventListener("click", () => handleSearch());
    
    // Handle Enter key in search box
    searchInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") handleSearch();
    });

    function handleSearch() {
        const query = searchInput.value.toLowerCase().trim();
        if (!query) {
            renderOffices(allOffices);
            return;
        }

        const filtered = allOffices.filter(office => {
            return office.name.toLowerCase().includes(query) || 
                   office.type.toLowerCase().includes(query);
        });

        renderOffices(filtered);
    }
    
    /**
     * Finds the 'Best Time to Visit' by locating the lowest historical demand.
     */
    function getBestTimeToVisit(recentDemandArray) {
        const t = window.translations[currentLang] || window.translations['en'];
        if (!recentDemandArray || recentDemandArray.length === 0) return t.best_anytime;
        
        let minDemand = recentDemandArray[0];
        let minIndex = 0;
        
        for (let i = 1; i < recentDemandArray.length; i++) {
            if (recentDemandArray[i] < minDemand) {
                minDemand = recentDemandArray[i];
                minIndex = i;
            }
        }
        
        const timeMap = [t.best_morning, t.best_mid_day, t.best_afternoon];
        return timeMap[minIndex] || t.best_anytime;
    }
    
    function getPinColor(queueLength) {
        if (queueLength > 50) return '#D32F2F'; // Red (Heavy)
        else if (queueLength >= 20) return '#FFC107'; // Yellow (Moderate)
        else return '#4CAF50'; // Green (Low)
    }

    /**
     * Initialize Leaflet Map
     */
    function initMap(offices) {
        let centerLat = 19.04;
        let centerLng = 72.86;
        if (offices && offices.length > 0 && offices[0].lat) {
            centerLat = offices[0].lat;
            centerLng = offices[0].lng;
        }
        
        // Initialize map with a default center
        queueMap = L.map('map').setView([centerLat, centerLng], 11);
        
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 20
        }).addTo(queueMap);
    }

    /**
     * Update map markers based on current office state
     */
    function updateMapMarkers(offices) {
        if (!queueMap) return;
        
        // Clear existing markers
        mapMarkers.forEach(m => queueMap.removeLayer(m));
        mapMarkers = [];
        const mapPoints = [];
        
        offices.forEach(office => {
            if (!office.lat || !office.lng) return;
            
            // Calculate max queue length for the office to determine pin color
            let maxQueue = 0;
            let popupContent = `<strong>${office.name}</strong><br><hr style="margin:5px 0;">`;
            
            office.services.forEach(svc => {
                if (svc.current_queue_length > maxQueue) maxQueue = svc.current_queue_length;
                const waitTimeRaw = PredictionEngine.calculateEstimatedWaitTime(svc.current_queue_length, svc.historical_avg_process_time_minutes, svc.open_counters);
                popupContent += `<span style="font-size: 0.85rem;">${svc.name}: <strong>${PredictionEngine.formatWaitTime(waitTimeRaw, currentLang)}</strong></span><br>`;
            });
            
            // Determine Marker Color
            let pinColor = getPinColor(maxQueue);
            
            const markerHtmlStyles = `
                background-color: ${pinColor};
                width: 2rem;
                height: 2rem;
                display: block;
                left: -1rem;
                top: -1rem;
                position: relative;
                border-radius: 3rem 3rem 0;
                transform: rotate(45deg);
                border: 2px solid #003366;
                box-shadow: 2px 4px 10px rgba(0,0,0,0.6);`;
                
            const customIcon = L.divIcon({
                className: "custom-pin",
                iconAnchor: [0, 24],
                labelAnchor: [-6, 0],
                popupAnchor: [0, -36],
                html: `<span style="${markerHtmlStyles}"></span>`
            });

            const marker = L.marker([office.lat, office.lng], { icon: customIcon }).addTo(queueMap);
            marker.bindPopup(popupContent);
            mapMarkers.push(marker);
            mapPoints.push([office.lat, office.lng]);
        });
        
        if (mapPoints.length > 0) {
            queueMap.fitBounds(mapPoints, { padding: [50, 50] });
        }
    }

    function renderOffices(offices) {
        const t = window.translations[currentLang] || window.translations['en'];
        resultsContainer.innerHTML = "";

        if (offices.length === 0) {
            resultsContainer.innerHTML = `<div class="empty-state"><p>${t.no_offices}</p></div>`;
            return;
        }

        offices.forEach(office => {
            const card = document.createElement('div');
            card.className = 'office-card';
            
            let servicesHtml = '';
            office.services.forEach(service => {
                const waitTimeRaw = PredictionEngine.calculateEstimatedWaitTime(
                    service.current_queue_length,
                    service.historical_avg_process_time_minutes,
                    service.open_counters
                );
                
                const waitTimeFormatted = PredictionEngine.formatWaitTime(waitTimeRaw, currentLang);
                const trend = PredictionEngine.calculateTrend(service.recent_hourly_demand, currentLang);
                const bestTime = getBestTimeToVisit(service.recent_hourly_demand);
                
                let timeClass = waitTimeRaw > 60 ? 'time-high' : waitTimeRaw > 30 ? 'time-medium' : 'time-low';
                if (waitTimeRaw < 0) timeClass = 'time-closed';

                servicesHtml += `
                    <div class="service-row" style="flex-wrap: wrap;">
                        <div class="service-info" style="flex: 1; min-width: 250px;">
                            <h4>${service.name}</h4>
                            <span class="queue-status" id="q-status-${office.id}-${service.id}">${t.in_queue} ${service.current_queue_length} | ${t.counters} ${service.open_counters}</span>
                            <div style="font-size: 0.85rem; color: #003366; margin-top: 5px; font-weight: 600;">${t.best_time} ${bestTime}</div>
                        </div>
                        <div class="wait-time-info ${timeClass}" style="flex: 1; min-width: 150px; text-align: right;" id="w-info-${office.id}-${service.id}">
                            <div class="time">${waitTimeFormatted}</div>
                            <div class="trend">${trend}</div>
                        </div>
                        <div style="margin-left: 1rem; margin-top: 10px;">
                            <button class="btn btn-secondary btn-confirm" data-office="${office.id}" data-service="${service.id}" style="font-size: 0.8rem; padding: 0.4rem 0.8rem; color: #003366; border-color: #003366;">${t.btn_confirm}</button>
                            <button class="btn btn-primary btn-report" data-office="${office.id}" data-service="${service.id}" style="font-size: 0.8rem; padding: 0.4rem 0.8rem;">${t.btn_update}</button>
                        </div>
                        <div style="width: 100%; margin-top: 15px;">
                            <canvas id="chart-${office.id}-${service.id}" width="400" height="100"></canvas>
                        </div>
                    </div>
                `;
            });

            card.innerHTML = `
                <div class="card-header">
                    <h3>${office.name}</h3>
                    <span class="office-type">${office.type}</span>
                </div>
                <div class="card-body">
                    ${servicesHtml}
                </div>
                <div class="card-actions">
                    <button class="btn btn-primary btn-book" data-office="${office.id}" style="width: 100%; margin-top: 1rem;">${t.btn_book}</button>
                </div>
            `;
            
            resultsContainer.appendChild(card);
        });

        attachActionListeners();
        renderCharts(offices);
        updateMapMarkers(offices);
    }
    
    function renderCharts(offices) {
        offices.forEach(office => {
            office.services.forEach(service => {
                const canvasId = `chart-${office.id}-${service.id}`;
                const canvasEl = document.getElementById(canvasId);
                
                if (canvasEl && service.recent_hourly_demand) {
                    // Destroy old chart instance if it exists to prevent overlap bugs
                    if (window[`myChart_${canvasId}`]) {
                         window[`myChart_${canvasId}`].destroy();
                    }

                    const ctx = canvasEl.getContext('2d');
                    
                    // Simple labels matching our time array slots
                    let labels = ["Morning", "Mid-Day", "Afternoon"];
                    if (service.recent_hourly_demand.length > 3) {
                       labels = service.recent_hourly_demand.map((_, i) => `T - ${service.recent_hourly_demand.length - i}`);
                    }
                    
                    window[`myChart_${canvasId}`] = new Chart(ctx, {
                        type: 'line',
                        data: {
                            labels: labels,
                            datasets: [{
                                label: 'Historical Queue Volume',
                                data: service.recent_hourly_demand,
                                borderColor: '#4A90E2',
                                backgroundColor: 'rgba(74, 144, 226, 0.1)',
                                borderWidth: 2,
                                fill: true,
                                tension: 0.3
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: { display: false }
                            },
                            scales: {
                                y: { beginAtZero: true }
                            }
                        }
                    });
                }
            });
        });
    }

    function attachActionListeners() {
        const t = window.translations[currentLang] || window.translations['en'];
        document.querySelectorAll('.btn-report').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const officeId = e.target.getAttribute('data-office');
                const serviceId = e.target.getAttribute('data-service');
                
                const newLength = prompt(t.prompt_queue);
                if (newLength && !isNaN(newLength)) {
                    handleReporting(officeId, serviceId, parseInt(newLength));
                }
            });
        });

        document.querySelectorAll('.btn-confirm').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const officeId = e.target.getAttribute('data-office');
                const serviceId = e.target.getAttribute('data-service');
                handleConfirming(officeId, serviceId);
            });
        });

        document.querySelectorAll('.btn-book').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const officeId = e.target.getAttribute('data-office');
                openBookingModal(officeId);
            });
        });
    }

    // Modal Handlers
    closeModalBtn.addEventListener('click', () => {
        bookingModal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === bookingModal) {
            bookingModal.style.display = 'none';
        }
    });

    function openBookingModal(officeId) {
        // Find first service for demo purposes
        const office = allOffices.find(o => o.id === officeId);
        if (office && office.services.length > 0) {
            activeBookingOfficeId = officeId;
            activeBookingServiceId = office.services[0].id; // Defaulting to first service for prototype
            
            bookingForm.style.display = 'block';
            bookingResult.style.display = 'none';
            bookingModal.style.display = 'block';
        }
    }

    generateTokenBtn.addEventListener('click', () => {
        if (!activeBookingOfficeId || !activeBookingServiceId) return;

        const office = allOffices.find(o => o.id === activeBookingOfficeId);
        const service = office.services.find(s => s.id === activeBookingServiceId);
        const prefTime = prefTimeSelect.options[prefTimeSelect.selectedIndex].text; // Using text might not map exactly to backend if not standard EN, but mock uses exact string mappings
        const basePrefValue = prefTimeSelect.value;
        
        // Use backend SmartAppointments Engine
        const tokenData = SmartAppointments.getSmartToken(service, basePrefValue);
        const t = window.translations[currentLang] || window.translations['en'];

        // Render Token Data
        bookingResult.innerHTML = `
            <h3 style="color: var(--primary-navy); margin-bottom: 0.5rem;">${t.token} <strong>${tokenData.tokenId}</strong></h3>
            <p><strong>${t.service}</strong> ${tokenData.serviceName}</p>
            <p><strong>${t.arrive_at}</strong> <span style="color: #2E7D32; font-weight: bold;">${tokenData.recommendedArrivalStart}</span></p>
            <p><strong>${t.est_finish}</strong> <span style="color: #D32F2F; font-weight: bold;">${tokenData.estimatedFinishTime}</span></p>
            <p><strong>${t.queue_ahead}</strong> ${tokenData.estimatedQueueAhead}</p>
            <p style="margin-top: 1rem; font-size: 0.9rem; font-style: italic;">${tokenData.recommendationReason}</p>
        `;

        bookingForm.style.display = 'none';
        bookingResult.style.display = 'block';
    });

    function handleReporting(officeId, serviceId, newLength) {
        const t = window.translations[currentLang] || window.translations['en'];
        try {
            const result = reportingSystem.submitReport(officeId, serviceId, newLength);
            alert(`${t.alert_report} ${result.reward.pointsAdded} ${t.alert_points}`);
            updateUserStatsUI(result.reward);
            renderOffices(allOffices); // Re-render to show updated wait times
        } catch (e) {
            console.error(e);
            alert(t.alert_error);
        }
    }

    function handleConfirming(officeId, serviceId) {
        const t = window.translations[currentLang] || window.translations['en'];
        try {
            const result = reportingSystem.confirmReport(officeId, serviceId);
            alert(`${t.alert_confirm} ${result.reward.pointsAdded} ${t.alert_points}`);
            updateUserStatsUI(result.reward);
        } catch (e) {
            console.error(e);
            alert(t.alert_error);
        }
    }

    function updateUserStatsUI(rewardResult = null) {
        const t = window.translations[currentLang] || window.translations['en'];
        if (!rewardsEngine) return;
        const state = rewardsEngine.getState();
        pointsEl.textContent = state.points;
        
        if (state.badges.length > 0) {
            badgesEl.style.display = "inline-block";
            badgesEl.textContent = state.badges.join(", ");
        }

        if (rewardResult && rewardResult.newBadgesUnlocked && rewardResult.newBadgesUnlocked.length > 0) {
            alert(`${t.alert_badge} ${rewardResult.newBadgesUnlocked.join(', ')}`);
        }
    }
});
