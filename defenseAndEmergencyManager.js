module.exports = {
    manageRoomDefense: function (room) {
        const repairThreshold = 0.9; // Only repair walls/ramparts below this fraction of max hits
        const wallsAndRamparts = room.find(FIND_STRUCTURES, {
            filter: (structure) =>
                (structure.structureType === STRUCTURE_WALL || structure.structureType === STRUCTURE_RAMPART) &&
                structure.hits / structure.hitsMax < repairThreshold,
        });

        const towers = room.find(FIND_MY_STRUCTURES, {
            filter: { structureType: STRUCTURE_TOWER },
        });

        towers.forEach((tower) => {
            const closestHostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
            if (closestHostile) {
                tower.attack(closestHostile);
            } else {
                const closestDamagedStructure = tower.pos.findClosestByRange(wallsAndRamparts);
                if (closestDamagedStructure) {
                    tower.repair(closestDamagedStructure);
                }
            }
        });
    },

    checkEmergency: function (room) {
        if (!room.controller || !room.controller.my) return false;

        const spawns = room.find(FIND_MY_SPAWNS);
        const storage = room.storage;

        const criticalSpawn = spawns.some((spawn) => spawn.hits < spawn.hitsMax * 0.2);
        const criticalStorage = storage && storage.hits < storage.hitsMax * 0.2;

        if (criticalSpawn || criticalStorage) {
            if (!Memory.empire.roomTasks[room.name]) {
                Memory.empire.roomTasks[room.name] = {};
            }
            Memory.empire.roomTasks[room.name].emergency = true;
            console.log(`Emergency triggered in room ${room.name}`);
            return true;
        }

        if (Memory.empire.roomTasks[room.name] && Memory.empire.roomTasks[room.name].emergency) {
            delete Memory.empire.roomTasks[room.name].emergency;
            console.log(`Emergency resolved in room ${room.name}`);
        }

        return false;
    },

    assignEmergencyRoles: function (room) {
        const creeps = room.find(FIND_MY_CREEPS);

        creeps.forEach((creep) => {
            if (creep.memory.role === 'repairer' || creep.memory.role === 'builder') {
                creep.memory.emergencyRole = 'emergencyRepairer';
            } else if (creep.memory.role === 'harvester' || creep.memory.role === 'carrier') {
                creep.memory.emergencyRole = 'emergencyHarvester';
            } else if (creep.memory.role === 'defender') {
                creep.memory.emergencyRole = 'emergencyDefender';
            }
        });
    },

    executeEmergencyRole: function (creep) {
        switch (creep.memory.emergencyRole) {
            case 'emergencyRepairer':
                const vitalStructure = creep.room.find(FIND_STRUCTURES, {
                    filter: (structure) =>
                        (structure.structureType === STRUCTURE_SPAWN ||
                            structure.structureType === STRUCTURE_STORAGE) &&
                        structure.hits < structure.hitsMax,
                })[0];

                if (vitalStructure) {
                    if (creep.repair(vitalStructure) === ERR_NOT_IN_RANGE) {
                        creep.moveTo(vitalStructure);
                    }
                }
                break;

            case 'emergencyHarvester':
                if (creep.store.getFreeCapacity() > 0) {
                    const source = creep.pos.findClosestByPath(FIND_SOURCES);
                    if (source && creep.harvest(source) === ERR_NOT_IN_RANGE) {
                        creep.moveTo(source);
                    }
                } else {
                    const spawn = creep.pos.findClosestByPath(FIND_MY_SPAWNS, {
                        filter: (spawn) => spawn.hits < spawn.hitsMax,
                    });
                    if (spawn && creep.transfer(spawn, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                        creep.moveTo(spawn);
                    }
                }
                break;

            case 'emergencyDefender':
                const hostile = creep.pos.findClosestByPath(FIND_HOSTILE_CREEPS);
                if (hostile) {
                    if (creep.attack(hostile) === ERR_NOT_IN_RANGE) {
                        creep.moveTo(hostile);
                    }
                } else {
                    const spawn = creep.room.find(FIND_MY_SPAWNS)[0];
                    if (spawn) creep.moveTo(spawn); // Idle near spawn for protection
                }
                break;

            default:
                console.log(`${creep.name} has no valid emergency role.`);
        }
    },
};
