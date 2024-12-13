// builder.js
module.exports = {
    run: function (creep) {
        if (creep.store[RESOURCE_ENERGY] === 0) {
            const source = creep.pos.findClosestByPath(FIND_SOURCES);
            if (creep.harvest(source) === ERR_NOT_IN_RANGE) {
                creep.moveTo(source);
            }
        } else {
            const target = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES);
            if (target && creep.build(target) === ERR_NOT_IN_RANGE) {
                creep.moveTo(target);
            }
        }
    }
};
