module.exports = {
    manageRoomDefense: function (room) {
        const repairThreshold = 0.9; // Only repair walls/ramparts below this fraction of max hits
        const wallsAndRamparts = room.find(FIND_STRUCTURES, {
            filter: (structure) => (structure.structureType === STRUCTURE_WALL || structure.structureType === STRUCTURE_RAMPART) && structure.hits / structure.hitsMax < repairThreshold
        });

        const towers = room.find(FIND_MY_STRUCTURES, {
            filter: { structureType: STRUCTURE_TOWER }
        });

        towers.forEach(tower => {
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
    }
};
