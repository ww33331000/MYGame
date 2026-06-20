export class SaveManager {
    constructor() {
        this.saveKey = 'mount_and_blade_clone_save';
        this.maxSlots = 3;
    }

    hasSaveData() {
        const saves = this.getAllSaves();
        return saves.length > 0;
    }

    getAllSaves() {
        const saves = [];
        for (let i = 0; i < this.maxSlots; i++) {
            const data = localStorage.getItem(`${this.saveKey}_slot_${i}`);
            if (data) {
                try {
                    saves.push(JSON.parse(data));
                } catch (e) {
                    console.warn(`Invalid save data in slot ${i}`);
                }
            }
        }
        return saves;
    }

    save(saveData, slot = 0) {
        const slotKey = `${this.saveKey}_slot_${slot}`;
        try {
            localStorage.setItem(slotKey, JSON.stringify(saveData));
            return true;
        } catch (e) {
            console.error('Failed to save game:', e);
            return false;
        }
    }

    load(slot = 0) {
        const slotKey = `${this.saveKey}_slot_${slot}`;
        const data = localStorage.getItem(slotKey);
        if (data) {
            try {
                return JSON.parse(data);
            } catch (e) {
                console.error('Failed to load save:', e);
                return null;
            }
        }
        return null;
    }

    deleteSave(slot = 0) {
        const slotKey = `${this.saveKey}_slot_${slot}`;
        localStorage.removeItem(slotKey);
    }

    getSaveInfo(slot = 0) {
        const data = this.load(slot);
        if (data) {
            return {
                version: data.version,
                timestamp: data.timestamp,
                playerName: data.player?.name || 'Unknown',
                day: data.day || 1
            };
        }
        return null;
    }
}
