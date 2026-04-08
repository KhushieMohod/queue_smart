/**
 * Appointments Engine
 * Recommends the "Green" window for fastest processing within a user's preferred time range.
 */

class SmartAppointments {

    /**
     * Finds the lowest demand slot (Green Window) within the user's preferred 
     * time window and generates a Smart Token.
     * 
     * @param {Object} service - The target service from mock_data
     * @param {string} userPreferredRange - e.g., "Morning", "Mid-Day", "Afternoon"
     * @returns {Object} Smart Token data
     */
    static getSmartToken(service, userPreferredRange) {
        // Map user ranges to the indices in the recent_hourly_demand array
        const timeMap = {
            "Morning": 0,
            "Mid-Day": 1,
            "Afternoon": 2
        };

        const preferredIndex = timeMap[userPreferredRange] !== undefined ? timeMap[userPreferredRange] : 0;
        const demandData = service.recent_hourly_demand;

        // If no data, fallback to arbitrary green window
        if (!demandData || demandData.length === 0) {
            return this._generateToken(service, "Anytime within " + userPreferredRange);
        }

        // Search +/- 1 hour (index) around preference to find the absolute minimum
        let bestIndex = preferredIndex;
        let lowestDemand = demandData[preferredIndex];

        if (preferredIndex > 0 && demandData[preferredIndex - 1] < lowestDemand) {
            bestIndex = preferredIndex - 1;
            lowestDemand = demandData[bestIndex];
        }

        if (preferredIndex < demandData.length - 1 && demandData[preferredIndex + 1] < lowestDemand) {
            bestIndex = preferredIndex + 1;
            lowestDemand = demandData[bestIndex];
        }

        // Apply service-specific logic scaling (e.g. tests take longer to get through than renewals)
        let demandMultiplier = 1;
        if (service.name.toLowerCase().includes("test") || service.name.toLowerCase().includes("application")) {
            demandMultiplier = 1.5; // Heavier perceived demand
        } else if (service.name.toLowerCase().includes("renewal") || service.name.toLowerCase().includes("payment")) {
            demandMultiplier = 0.8; // Faster clearing
        }
        
        const adjustedDemand = Math.round(lowestDemand * demandMultiplier);

        // Reverse map the best index back to hours
        const hourMappings = {
            0: "9:30 AM",
            1: "1:00 PM",
            2: "3:30 PM"
        };
        
        let arrivalTimeStr = hourMappings[bestIndex] || `${bestIndex + 9}:00 AM`;
        
        // Calculate estimated finish time
        // E.g., arrival + (adjustedDemand * avgProcessTime)
        const avgMins = service.historical_avg_process_time_minutes || 10;
        const estTotalWaitMins = Math.round((adjustedDemand / (service.open_counters || 1)) * avgMins);

        let msg = (bestIndex === preferredIndex) ? 
            "Optimal slot available." : 
            "Adjusted nearby for faster service (Green Window).";

        return this._generateToken(service, arrivalTimeStr, estTotalWaitMins, msg, adjustedDemand);
    }

    static _generateToken(service, arrivalTime, processDurationMins, recommendationMsg, expectedLine) {
        // Dummy logic to add minutes to arrival string for "finish time"
        const [timeMatch, hoursStr, minsStr, ampm] = arrivalTime.match(/(\d+):(\d+)\s*(AM|PM)/) || [null, '9', '30', 'AM'];
        
        let finishStr = "Unknown";
        if (timeMatch) {
            let h = parseInt(hoursStr);
            let m = parseInt(minsStr) + processDurationMins;
            let finalAmpm = ampm;

            while (m >= 60) {
                h += 1;
                m -= 60;
            }
            if (h >= 12) {
                if (h > 12) h -= 12;
                finalAmpm = ampm === 'AM' ? 'PM' : 'AM';
            }
            
            finishStr = `${h}:${m.toString().padStart(2, '0')} ${finalAmpm}`;
        }

        return {
            tokenId: `QT-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
            serviceName: service.name,
            recommendedArrivalStart: arrivalTime,
            estimatedFinishTime: finishStr,
            recommendationReason: recommendationMsg,
            estimatedQueueAhead: expectedLine
        };
    }
}

// Export for Node or Browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SmartAppointments;
} else if (typeof window !== 'undefined') {
    window.SmartAppointments = SmartAppointments;
}
