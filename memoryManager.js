const config = {
    memoryCleanupInterval: 100, // Interval for memory cleanup
};

module.exports = {
    clearDeadCreeps: function () {
        if (Game.time % config.memoryCleanupInterval !== 0) return;
        for (let name in Memory.creeps) {
            if (!Game.creeps[name]) {
                delete Memory.creeps[name];
            }
        }
    },

    clearOldPaths: function () {
        if (!Memory.paths) return;
        for (let key in Memory.paths) {
            if (Memory.paths[key].expiry < Game.time) {
                delete Memory.paths[key];
            }
        }
    },

    initializeEmpireMemory: function () {
        if (!Memory.empire) {
            Memory.empire = {
                globalGoals: {
                    defense: {
                        minimumDefenders: 2,
                        threatLevel: 0, // 0 = Peaceful, 1 = Low Threat, 2 = High Threat
                    },
                    expansion: {
                        targetRoom: null,
                        inProgress: false,
                    },
                },
                roomTasks: {}, // Stores specific tasks for each room
            };
        }
    },

    evaluateThreats: function () {
        let overallThreatLevel = 0;

        for (let roomName in Game.rooms) {
            let room = Game.rooms[roomName];
            if (!room.controller || !room.controller.my) continue;

            const hostiles = room.find(FIND_HOSTILE_CREEPS);
            if (hostiles.length > 0) {
                const threatLevel = hostiles.reduce((level, creep) => {
                    if (creep.getActiveBodyparts(ATTACK) > 0 || creep.getActiveBodyparts(RANGED_ATTACK) > 0) {
                        return Math.max(level, 2); // High Threat
                    }
                    return Math.max(level, 1); // Low Threat
                }, 0);

                Memory.empire.globalGoals.defense.threatLevel = Math.max(
                    Memory.empire.globalGoals.defense.threatLevel,
                    threatLevel
                );
                overallThreatLevel = Math.max(overallThreatLevel, threatLevel);
            }
        }

        if (overallThreatLevel === 0) {
            console.log("Empire is at peace.");
        } else {
            console.log(`Empire threat level: ${overallThreatLevel}`);
        }
    },

    assignRoomTasks: function () {
        for (let roomName in Game.rooms) {
            let room = Game.rooms[roomName];
            if (!room.controller || !room.controller.my) continue;

            const roomTask = {
                defenders: Memory.empire.globalGoals.defense.threatLevel > 0 ? 2 : 0,
                upgraders: room.controller.level < 8 ? 3 : 1,
                builders: room.find(FIND_CONSTRUCTION_SITES).length > 0 ? 2 : 0,
                repairers: room.find(FIND_STRUCTURES, {
                    filter: structure => structure.hits < structure.hitsMax,
                }).length > 0 ? 1 : 0,
            };

            Memory.empire.roomTasks[roomName] = roomTask;
        }
    },

    setExpansionTarget: function (roomName) {
        if (!Memory.empire.globalGoals.expansion.targetRoom) {
            Memory.empire.globalGoals.expansion.targetRoom = roomName;
            Memory.empire.globalGoals.expansion.inProgress = true;
            console.log(`Set expansion target to ${roomName}`);
        }
    },

    clearExpansionTarget: function () {
        Memory.empire.globalGoals.expansion.targetRoom = null;
        Memory.empire.globalGoals.expansion.inProgress = false;
        console.log("Cleared expansion target.");
    },

    getRoomTask: function (roomName) {
        return Memory.empire.roomTasks[roomName] || {};
    },

    logEmpireState: function () {
        console.log("Empire Global Goals:", JSON.stringify(Memory.empire.globalGoals, null, 2));
        console.log("Room Tasks:", JSON.stringify(Memory.empire.roomTasks, null, 2));
    },
};
