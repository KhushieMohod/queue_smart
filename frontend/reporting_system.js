/**
 * ReportingSystem
 * Handles user queue check-ins and temporarily updating local state.
 */
class ReportingSystem {
    /**
     * @param {Array} currentOffices - The global state of offices from mock_data
     * @param {RewardsEngine} rewardsEngine - Instance of the Rewards Engine for the current user
     */
    constructor(currentOffices, rewardsEngine) {
        this.offices = currentOffices; // Stores a reference to the active state in memory
        this.rewardsEngine = rewardsEngine;
    }

    /**
     * Submit a new check-in report to adjust the queue length.
     * 
     * @param {string} officeId 
     * @param {string} serviceId 
     * @param {number} reportedLength 
     * @returns {Object} The updated service object and reward stats
     */
    submitReport(officeId, serviceId, reportedLength) {
        const service = this._findService(officeId, serviceId);
        
        if (!service) {
            throw new Error(`Service ${serviceId} not found in Office ${officeId}`);
        }

        // Apply temporary local state update
        // In a real system, this would be an API call to blend multiple user reports.
        // For the shell, we simply override the current queue length.
        service.current_queue_length = reportedLength;
        
        // Push the reported length to hourly demand for trend calculation
        if (!service.recent_hourly_demand) {
            service.recent_hourly_demand = [];
        }
        service.recent_hourly_demand.push(reportedLength);
        
        // Award points to user
        const reward = this.rewardsEngine.awardReportPoints();

        return {
            success: true,
            updatedService: service,
            reward: reward
        };
    }

    /**
     * Confirm a report submitted by someone else.
     * 
     * @param {string} officeId 
     * @param {string} serviceId 
     * @returns {Object} Reward stats
     */
    confirmReport(officeId, serviceId) {
        const service = this._findService(officeId, serviceId);
        
        if (!service) {
            throw new Error(`Service ${serviceId} not found in Office ${officeId}`);
        }

        // Award smaller points for confirmation
        const reward = this.rewardsEngine.awardConfirmPoints();
        
        return {
            success: true,
            reward: reward
        };
    }

    _findService(officeId, serviceId) {
        const office = this.offices.find(o => o.id === officeId);
        if (!office) return null;
        
        return office.services.find(s => s.id === serviceId);
    }
}

// Export for Node (if used in tests) or attach to Window for browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ReportingSystem;
} else if (typeof window !== 'undefined') {
    window.ReportingSystem = ReportingSystem;
}
