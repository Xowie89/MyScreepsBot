module.exports = {
    shareResources: function () {
        for (let roomName in Game.rooms) {
            let room = Game.rooms[roomName];
            if (!room.controller || !room.controller.my) continue;

            // Share surplus energy
            if (this.hasSurplus(room, RESOURCE_ENERGY)) {
                const surplusAmount = this.getSurplusAmount(room, RESOURCE_ENERGY);
                const needyRoom = this.findNeedyRoom(RESOURCE_ENERGY);

                if (needyRoom) {
                    if (room.terminal && room.terminal.cooldown === 0) {
                        // Use terminal for transfer
                        this.transferViaTerminal(room, needyRoom, RESOURCE_ENERGY, surplusAmount);
                    } else {
                        // Use creeps if terminal is unavailable
                        this.transferViaCreeps(room, needyRoom, RESOURCE_ENERGY, surplusAmount);
                    }
                }
            }

            // Share surplus minerals
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
    },

    hasSurplus: function (room, resourceType) {
        const storage = room.storage;
        if (!storage) return false;

        const resourceAmount = storage.store[resourceType] || 0;
        const minimumAmount = resourceType === RESOURCE_ENERGY ? 50000 : 10000; // Thresholds
        return resourceAmount > minimumAmount;
    },

    getSurplusAmount: function (room, resourceType) {
        const storage = room.storage;
        if (!storage) return 0;

        const resourceAmount = storage.store[resourceType] || 0;
        const minimumAmount = resourceType === RESOURCE_ENERGY ? 50000 : 10000; // Thresholds
        return resourceAmount - minimumAmount;
    },

    findNeedyRoom: function (resourceType) {
        let needyRoom = null;

        for (let roomName in Game.rooms) {
            let room = Game.rooms[roomName];
            if (!room.controller || !room.controller.my || !room.storage) continue;

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

    // Logic for resource carrier creeps
    executeCarrierRole: function (creep) {
        if (!creep.memory.targetRoom || !creep.memory.resourceType) return;

        const targetRoom = Game.rooms[creep.memory.targetRoom];
        const resourceType = creep.memory.resourceType;

        if (creep.store.getFreeCapacity() > 0 && creep.memory.phase !== 'delivering') {
            // Collect resources from home room
            const storage = creep.room.storage;
            if (storage && storage.store[resourceType] > 0) {
                if (creep.withdraw(storage, resourceType) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(storage);
                }
            }
        } else {
            // Deliver resources to target room
            creep.memory.phase = 'delivering';
            if (targetRoom && targetRoom.storage) {
                if (creep.transfer(targetRoom.storage, resourceType) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(targetRoom.storage);
                }
            } else {
                // Move towards the target room
                const exit = creep.room.findExitTo(creep.memory.targetRoom);
                creep.moveTo(creep.pos.findClosestByRange(exit));
            }
        }
    },
};
