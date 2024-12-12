module.exports = {
    shareResources: function () {
        for (let roomName in Game.rooms) {
            let room = Game.rooms[roomName];
            if (!room.controller || !room.controller.my || !room.terminal) continue;

            // Identify rooms with surplus energy
            if (this.hasSurplus(room, RESOURCE_ENERGY)) {
                let surplusAmount = this.getSurplusAmount(room, RESOURCE_ENERGY);
                let needyRoom = this.findNeedyRoom(RESOURCE_ENERGY);

                if (needyRoom && room.terminal.cooldown === 0) {
                    let transferAmount = Math.min(surplusAmount, 10000); // Transfer a maximum of 10,000 energy per transaction
                    let result = room.terminal.send(RESOURCE_ENERGY, transferAmount, needyRoom.name);
                    if (result === OK) {
                        console.log(`Transferred ${transferAmount} energy from ${room.name} to ${needyRoom.name}`);
                    }
                }
            }

            // Similar logic can be applied for minerals and other resources
        }
    },

    hasSurplus: function (room, resourceType) {
        let storage = room.storage;
        if (!storage) return false;

        let resourceAmount = storage.store[resourceType] || 0;
        let minimumAmount = resourceType === RESOURCE_ENERGY ? 50000 : 10000; // Set thresholds
        return resourceAmount > minimumAmount;
    },

    getSurplusAmount: function (room, resourceType) {
        let storage = room.storage;
        if (!storage) return 0;

        let resourceAmount = storage.store[resourceType] || 0;
        let minimumAmount = resourceType === RESOURCE_ENERGY ? 50000 : 10000; // Set thresholds
        return resourceAmount - minimumAmount;
    },

    findNeedyRoom: function (resourceType) {
        let needyRoom = null;

        for (let roomName in Game.rooms) {
            let room = Game.rooms[roomName];
            if (!room.controller || !room.controller.my || !room.terminal || !room.storage) continue;

            let resourceAmount = room.storage.store[resourceType] || 0;
            let minimumAmount = resourceType === RESOURCE_ENERGY ? 20000 : 5000; // Set thresholds

            if (resourceAmount < minimumAmount) {
                if (!needyRoom || resourceAmount < needyRoom.storage.store[resourceType]) {
                    needyRoom = room;
                }
            }
        }

        return needyRoom;
    }
};
