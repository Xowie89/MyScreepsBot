module.exports = {
    // Store pre-calculated paths in memory
    calculatePath: function (start, end, options = {}) {
        const defaultOptions = {
            plainCost: 2,
            swampCost: 10,
            roomCallback: (roomName) => {
                let room = Game.rooms[roomName];
                if (!room) return;

                let costs = new PathFinder.CostMatrix();

                // Avoid swamp tiles and other obstacles
                room.find(FIND_STRUCTURES).forEach(structure => {
                    if (structure.structureType === STRUCTURE_ROAD) {
                        // Favor roads
                        costs.set(structure.pos.x, structure.pos.y, 1);
                    } else if (
                        structure.structureType !== STRUCTURE_CONTAINER &&
                        (structure.structureType !== STRUCTURE_RAMPART || !structure.my)
                    ) {
                        // Block other structures
                        costs.set(structure.pos.x, structure.pos.y, 0xff);
                    }
                });

                // Avoid creeps
                room.find(FIND_CREEPS).forEach(creep => {
                    costs.set(creep.pos.x, creep.pos.y, 0xff);
                });

                return costs;
            },
        };

        // Merge options with defaultOptions
        const pathOptions = { ...defaultOptions, ...options };

        // Use PathFinder to calculate the path
        const result = PathFinder.search(start, { pos: end, range: 1 }, pathOptions);

        // Optionally store the path for reuse
        if (!Memory.paths) Memory.paths = {};
        Memory.paths[`${start.roomName}-${end.roomName}`] = result.path;

        return result;
    },

    getPrecalculatedPath: function (start, end) {
        if (Memory.paths && Memory.paths[`${start.roomName}-${end.roomName}`]) {
            return Memory.paths[`${start.roomName}-${end.roomName}`];
        } else {
            // If no pre-calculated path exists, calculate and store it
            return this.calculatePath(start, end).path;
        }
    },

    // Move a creep along a calculated path
    moveCreep: function (creep, destination) {
        const path = this.getPrecalculatedPath(creep.pos, destination);
        if (path && path.length > 0) {
            creep.moveByPath(path);
        } else {
            // Fallback to moveTo if no path is found
            creep.moveTo(destination);
        }
    },

    // Clear outdated paths from memory
    clearOutdatedPaths: function () {
        for (let key in Memory.paths) {
            // Optionally add logic to clear only paths older than a specific time
            delete Memory.paths[key];
        }
    },
};
