/**
 * RewardsEngine
 * Manages user points and unlocks badges based on reporting activity.
 */
class RewardsEngine {
    constructor(userId, currentPoints = 0, currentBadges = []) {
        this.userId = userId;
        this.points = currentPoints;
        this.badges = new Set(currentBadges);

        this.BADGES = {
            FIRST_REPORT: { id: "badge_1", name: "Queue Scout", threshold: 10 },
            QUEUE_HERO: { id: "badge_2", name: "Queue Hero", threshold: 50 },
            TIME_LORD: { id: "badge_3", name: "Time Lord", threshold: 100 }
        };
    }

    /**
     * Award points for submitting a new queue report.
     * @returns {Object} Result showing points added, total points, and any new badges.
     */
    awardReportPoints() {
        return this._addPoints(10, 'report');
    }

    /**
     * Award points for confirming someone else's queue report.
     * @returns {Object} Result showing points added, total points, and any new badges.
     */
    awardConfirmPoints() {
        return this._addPoints(5, 'confirm');
    }

    /**
     * Internal generic method to add points and evaluate badge unlocks.
     */
    _addPoints(amount, action) {
        this.points += amount;
        const newBadges = this._evaluateBadges();
        
        return {
            action: action,
            pointsAdded: amount,
            totalPoints: this.points,
            newBadgesUnlocked: newBadges
        };
    }

    /**
     * Evaluate if the user's current points cross any badge thresholds.
     * @returns {Array} List of newly unlocked badges
     */
    _evaluateBadges() {
        const unlocked = [];
        
        for (const [key, badgeDef] of Object.entries(this.BADGES)) {
            if (this.points >= badgeDef.threshold && !this.badges.has(badgeDef.id)) {
                this.badges.add(badgeDef.id);
                unlocked.push(badgeDef.name);
            }
        }
        
        return unlocked;
    }

    getState() {
        return {
            points: this.points,
            badges: Array.from(this.badges)
        };
    }
}

// Export for Node (if used in tests) or attach to Window for browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RewardsEngine;
} else if (typeof window !== 'undefined') {
    window.RewardsEngine = RewardsEngine;
}
