const pathfindingManager = require('pathfindingManager');

module.exports = {
    executeRole: function (creep) {
        let target;

        switch (creep.memory.role) {
            case 'harvester':
                // Harvester logic
                target = creep.room.find(FIND_SOURCES)[0];
                if (target) pathfindingManager.moveCreep(creep, target.pos);
                break;

            case 'upgrader':
                if (creep.store[RESOURCE_ENERGY] === 0) {
                    // Fetch energy
                    target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                        filter: s => s.structureType === STRUCTURE_STORAGE && s.store[RESOURCE_ENERGY] > 0,
                    });
                    if (!target) target = creep.pos.findClosestByPath(FIND_SOURCES);
                    if (target) {
                        if (creep.withdraw(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE || creep.harvest(target) === ERR_NOT_IN_RANGE) {
                            pathfindingManager.moveCreep(creep, target.pos);
                        }
                    }
                } else if (creep.room.controller) {
                    // Upgrade controller
                    if (creep.upgradeController(creep.room.controller) === ERR_NOT_IN_RANGE) {
                        pathfindingManager.moveCreep(creep, creep.room.controller.pos);
                    }
                } else {
                    // Idle behavior: Help build or repair
                    this.handleIdleBehavior(creep);
                }
                break;

            case 'builder':
                target = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES);
                if (target) {
                    if (creep.build(target) === ERR_NOT_IN_RANGE) {
                        pathfindingManager.moveCreep(creep, target.pos);
                    }
                } else {
                    // Idle behavior: Upgrade controller
                    this.handleIdleBehavior(creep);
                }
                break;

            case 'repairer':
                target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                    filter: structure => structure.hits < structure.hitsMax,
                });
                if (target) {
                    if (creep.repair(target) === ERR_NOT_IN_RANGE) {
                        pathfindingManager.moveCreep(creep, target.pos);
                    }
                } else {
                    // Idle behavior: Help harvest energy
                    this.handleIdleBehavior(creep);
                }
                break;

            // Additional roles like carrier, scout, etc.
        }
    },

    handleIdleBehavior: function (creep) {
        let target;

        switch (creep.memory.role) {
            case 'upgrader':
            case 'repairer':
                // Idle upgraders/repairers help with building
                target = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES);
                if (target) {
                    if (creep.build(target) === ERR_NOT_IN_RANGE) {
                        pathfindingManager.moveCreep(creep, target.pos);
                    }
                }
                break;

            case 'builder':
                // Idle builders help upgrade controller
                target = creep.room.controller;
                if (target) {
                    if (creep.upgradeController(target) === ERR_NOT_IN_RANGE) {
                        pathfindingManager.moveCreep(creep, target.pos);
                    }
                }
                break;

            case 'repairer':
                // Idle repairers harvest energy if no repairs are needed
                target = creep.pos.findClosestByPath(FIND_SOURCES);
                if (target) {
                    if (creep.harvest(target) === ERR_NOT_IN_RANGE) {
                        pathfindingManager.moveCreep(creep, target.pos);
                    }
                }
                break;

            default:
                console.log(`${creep.name} is idle with no productive task.`);
        }
    },
};
