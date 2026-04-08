/**
 * QueueSmart Prediction Engine
 * Calculates estimated wait times based on queue parameters.
 */

class PredictionEngine {
    /**
     * Calculate the estimated waiting time for a new user joining the queue.
     * 
     * @param {number} queueLength - Number of people currently in the queue for the service.
     * @param {number} avgProcessTimeMinutes - Historical average time taken to process one individual (in minutes).
     * @param {number} openCounters - Number of counters currently processing this service.
     * @returns {number} Estimated wait time in minutes.
     */
    static calculateEstimatedWaitTime(queueLength, avgProcessTimeMinutes, openCounters) {
        if (openCounters <= 0) {
            console.warn("No available counters. Wait time is technically infinite.");
            return -1; // Indicate error or infinite wait
        }

        if (queueLength <= 0) {
            return 0; // Next in line
        }

        // Throughput per minute (total capacity of all open counters)
        const throughputPerMinute = openCounters / avgProcessTimeMinutes;

        // Estimated wait time = total people / total throughput per minute
        const estimatedWaitTimeMinutes = queueLength / throughputPerMinute;

        return Math.round(estimatedWaitTimeMinutes);
    }

    /**
     * Provide a human-readable format of the wait time.
     * @param {number} waitTimeMinutes 
     * @returns {string} Formatted string (e.g., "1 hr 15 mins")
     */
    static formatWaitTime(waitTimeMinutes) {
        if (waitTimeMinutes < 0) return "Counters closed";
        if (waitTimeMinutes === 0) return "Proceed to counter immediately";

        const hours = Math.floor(waitTimeMinutes / 60);
        const mins = waitTimeMinutes % 60;

        if (hours > 0) {
           return `${hours} hr ${mins} mins`;
        }
        return `${mins} mins`;
    }

    /**
     * Determine the current queue trend (increasing, decreasing, or stable)
     * based on recent hourly demand data.
     * 
     * @param {number[]} recentHourlyDemand - Array of recent demand counts, ordered from oldest to newest.
     * @returns {string} The computed trend: "Increasing", "Decreasing", or "Stable".
     */
    static calculateTrend(recentHourlyDemand) {
        if (!recentHourlyDemand || recentHourlyDemand.length < 2) {
            return "Stable"; // Not enough data
        }

        const newest = recentHourlyDemand[recentHourlyDemand.length - 1];
        const previous = recentHourlyDemand[recentHourlyDemand.length - 2];
        const diff = newest - previous;

        // Threshold for change
        const threshold = previous * 0.1; // 10% change threshold

        if (diff > threshold) {
            return "Increasing";
        } else if (diff < -threshold) {
            return "Decreasing";
        } else {
            return "Stable";
        }
    }
}

module.exports = PredictionEngine;
