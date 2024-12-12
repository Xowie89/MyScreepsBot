const pathfindingManager = require('pathfindingManager');

module.exports = {
    executeRole: function (creep) {
        let target;

        switch (creep.memory.role) {
            case 'harvester':
                target = creep.room.find(FIND_SOURCES)[0];
                if (target) pathfindingManager.moveCreep(creep, target.pos);
                break;

            case 'upgrader':
                target = creep.room.controller;
                if (target) pathfindingManager.moveCreep(creep, target.pos);
                break;

            case 'builder':
                target = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES);
                if (target) pathfindingManager.moveCreep(creep, target.pos);
                break;

            case 'repairer':
                target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                    filter: structure => structure.hits < structure.hitsMax,
                });
                if (target) pathfindingManager.moveCreep(creep, target.pos);
                break;

            case 'carrier':
                if (creep.store.getFreeCapacity() > 0) {
                    target = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES, {
                        filter: resource => resource.resourceType === RESOURCE_ENERGY,
                    });
                    if (target) pathfindingManager.moveCreep(creep, target.pos);
                } else {
                    target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                        filter: structure =>
                            (structure.structureType === STRUCTURE_SPAWN ||
                                structure.structureType === STRUCTURE_EXTENSION ||
                                structure.structureType === STRUCTURE_STORAGE) &&
                            structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0,
                    });
                    if (target) pathfindingManager.moveCreep(creep, target.pos);
                }
                break;

            case 'scout':
                if (!creep.memory.targetRoom) {
                    const unexploredRooms = Object.keys(Game.map.describeExits(creep.room.name)).filter(
                        exit => !Memory.exploredRooms || !Memory.exploredRooms[exit]
                    );
                    if (unexploredRooms.length > 0) {
                        creep.memory.targetRoom = unexploredRooms[0];
                    }
                }
                if (creep.memory.targetRoom && creep.room.name !== creep.memory.targetRoom) {
                    const exitDir = creep.room.findExitTo(creep.memory.targetRoom);
                    const exit = creep.pos.findClosestByRange(exitDir);
                    if (exit) creep.moveTo(exit);
                } else {
                    Memory.exploredRooms = Memory.exploredRooms || {};
                    Memory.exploredRooms[creep.room.name] = true;
                }
                break;

            case 'defender':
                target = creep.pos.findClosestByPath(FIND_HOSTILE_CREEPS);
                if (target) {
                    if (creep.attack(target) === ERR_NOT_IN_RANGE) {
                        pathfindingManager.moveCreep(creep, target.pos);
                    }
                } else {
                    const spawn = creep.room.find(FIND_MY_SPAWNS)[0];
                    if (spawn) creep.moveTo(spawn);
                }
                break;

            case 'remoteMiner':
                target = Game.getObjectById(creep.memory.targetSourceId);
                if (target) {
                    if (creep.harvest(target) === ERR_NOT_IN_RANGE) {
                        pathfindingManager.moveCreep(creep, target.pos);
                    }
                }
                break;

            case 'remoteCarrier':
                if (creep.store.getFreeCapacity() > 0) {
                    target = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES);
                    if (target) pathfindingManager.moveCreep(creep, target.pos);
                } else {
                    target = creep.room.storage;
                    if (target && creep.transfer(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                        pathfindingManager.moveCreep(creep, target.pos);
                    }
                }
                break;

            case 'colonizer':
                if (creep.memory.targetRoom && creep.room.name !== creep.memory.targetRoom) {
                    const exitDir = creep.room.findExitTo(creep.memory.targetRoom);
                    const exit = creep.pos.findClosestByRange(exitDir);
                    if (exit) creep.moveTo(exit);
                } else {
                    target = creep.room.controller;
                    if (target && creep.claimController(target) === ERR_NOT_IN_RANGE) {
                        pathfindingManager.moveCreep(creep, target.pos);
                    }
                }
                break;

            // Add additional roles as needed
        }
    }
};
