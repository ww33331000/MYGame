export class Path {
    constructor(from, to, distance) {
        this.from = from;
        this.to = to;
        this.distance = distance;

        this.waypoints = [];
        this.dangerLevel = 0;
        this.roadType = 'dirt';
    }

    getEstimatedTime(speed) {
        return (this.distance / speed) * 3600;
    }

    getDangerDescription() {
        if (this.dangerLevel < 20) return '安全';
        if (this.dangerLevel < 40) return '较安全';
        if (this.dangerLevel < 60) return '有些危险';
        if (this.dangerLevel < 80) return '危险';
        return '非常危险';
    }

    addWaypoint(x, y) {
        this.waypoints.push({ x, y });
    }

    getWaypointCount() {
        return this.waypoints.length;
    }

    isValid() {
        return this.from && this.to && this.distance > 0;
    }

    toJSON() {
        return {
            from: this.from,
            to: this.to,
            distance: this.distance,
            waypoints: this.waypoints,
            dangerLevel: this.dangerLevel,
            roadType: this.roadType
        };
    }
}
