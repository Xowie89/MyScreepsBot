// role.harvester.js
module.exports = {
    run: function (creep) {
        if (creep.store.getFreeCapacity() > 0) {
            const source = creep.pos.findClosestByPath(FIND_SOURCES);
            if (creep.harvest(source) === ERR_NOT_IN_RANGE) {
                creep.moveTo(source);
            }
        } else {
            const target = creep.room.find(FIND_STRUCTURES, {
                filter: structure => structure.structureType === STRUCTURE_SPAWN ||
                    structure.structureType === STRUCTURE_EXTENSION &&
                    structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
            });
            if (target.length && creep.transfer(target[0], RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                creep.moveTo(target[0]);
            }
        }
    }
};
