module.exports = {
    shareResources: function () {
        for (let roomName in Game.rooms) {
            const room = Game.rooms[roomName];

            if (!room.controller || !room.controller.my) continue; // Skip non-owned rooms

            // Check for surplus energy
            if (this.hasSurplus(room, RESOURCE_ENERGY)) {
                const surplusAmount = this.getSurplusAmount(room, RESOURCE_ENERGY);
                const needyRoom = this.findNeedyRoom(RESOURCE_ENERGY);

                if (needyRoom) {
                    if (room.terminal && room.terminal.cooldown === 0) {
                        // Use terminal for transfer
                        this.transferViaTerminal(room, needyRoom, RESOURCE_ENERGY, surplusAmount);
                    } else if (room.storage) {
                        // Use creeps if terminal is unavailable
                        this.transferViaCreeps(room, needyRoom, RESOURCE_ENERGY, surplusAmount);
                    }
                }
            }

            // Check for surplus minerals
            if (room.storage) {
                for (let resourceType in room.storage.store) {
                    if (resourceType === RESOURCE_ENERGY) continue; // Skip energy
                    if (this.hasSurplus(room, resourceType)) {
                        const surplusAmount = this.getSurplusAmount(room, resourceType);
                        const needyRoom = this.findNeedyRoom(resourceType);

                        if (needyRoom) {
                            if (room.terminal && room.terminal.cooldown === 0) {
                                // Use terminal for transfer
                                this.transferViaTerminal(room, needyRoom, resourceType, surplusAmount);
                            } else {
                                // Use creeps if terminal is unavailable
                                this.transferViaCreeps(room, needyRoom, resourceType, surplusAmount);
                            }
                        }
                    }
                }
            }
        }
    },

    hasSurplus: function (room, resourceType) {
        const storage = room.storage;
        if (!storage) return false; // Ensure storage exists

        const resourceAmount = storage.store[resourceType] || 0;
        const minimumAmount = resourceType === RESOURCE_ENERGY ? 50000 : 10000; // Thresholds
        return resourceAmount > minimumAmount;
    },

    getSurplusAmount: function (room, resourceType) {
        const storage = room.storage;
        if (!storage) return 0; // Ensure storage exists

        const resourceAmount = storage.store[resourceType] || 0;
        const minimumAmount = resourceType === RESOURCE_ENERGY ? 50000 : 10000; // Thresholds
        return resourceAmount - minimumAmount;
    },

    findNeedyRoom: function (resourceType) {
        let needyRoom = null;

        for (let roomName in Game.rooms) {
            const room = Game.rooms[roomName];
            if (!room.controller || !room.controller.my || !room.storage) continue; // Skip non-owned or rooms without storage

            const resourceAmount = room.storage.store[resourceType] || 0;
            const minimumAmount = resourceType === RESOURCE_ENERGY ? 20000 : 5000; // Thresholds

            if (resourceAmount < minimumAmount) {
                if (!needyRoom || resourceAmount < needyRoom.storage.store[resourceType]) {
                    needyRoom = room;
                }
            }
        }

        return needyRoom;
    },

    transferViaTerminal: function (fromRoom, toRoom, resourceType, amount) {
        const result = fromRoom.terminal.send(resourceType, Math.min(amount, 10000), toRoom.name);
        if (result === OK) {
            console.log(`Transferred ${amount} ${resourceType} from ${fromRoom.name} to ${toRoom.name} via terminal.`);
        } else {
            console.log(`Failed to transfer ${resourceType} from ${fromRoom.name} to ${toRoom.name}. Error: ${result}`);
        }
    },

    transferViaCreeps: function (fromRoom, toRoom, resourceType, amount) {
        const creepName = `ResourceCarrier_${Game.time}`;
        const spawn = fromRoom.find(FIND_MY_SPAWNS)[0];
        if (!spawn) return;

        const body = [CARRY, CARRY, MOVE, MOVE]; // Adjust based on available energy
        const spawnResult = spawn.spawnCreep(body, creepName, {
            memory: {
                role: 'resourceCarrier',
                resourceType: resourceType,
                targetRoom: toRoom.name,
                amount: amount,
            },
        });

        if (spawnResult === OK) {
            console.log(`Spawning resource carrier ${creepName} to transfer ${amount} ${resourceType} from ${fromRoom.name} to ${toRoom.name}.`);
        } else {
            console.log(`Failed to spawn resource carrier for ${fromRoom.name} to ${toRoom.name}. Error: ${spawnResult}`);
        }
    },
};
