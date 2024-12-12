// Merged Room Manager Module
module.exports = {
    planRoomLayout: function (room) {
        if (!room.controller || !room.controller.my) return;

        // Plan storage near sources and the controller
        const sources = room.find(FIND_SOURCES);
        sources.forEach(source => {
            let nearbyStorage = source.pos.findInRange(FIND_STRUCTURES, 2, {
                filter: { structureType: STRUCTURE_STORAGE }
            });
            if (nearbyStorage.length === 0) {
                room.createConstructionSite(source.pos.x + 1, source.pos.y, STRUCTURE_STORAGE);
            }
        });

        let controllerStorage = room.controller.pos.findInRange(FIND_STRUCTURES, 2, {
            filter: { structureType: STRUCTURE_STORAGE }
        });
        if (controllerStorage.length === 0) {
            room.createConstructionSite(room.controller.pos.x + 1, room.controller.pos.y, STRUCTURE_STORAGE);
        }

        // Plan extensions
        this.planExtensions(room);

        // Plan roads
        this.planRoads(room);

        // Plan defenses
        this.planDefenses(room);
    },

    planExtensions: function (room) {
        const spawns = room.find(FIND_MY_SPAWNS);
        const maxExtensions = CONTROLLER_STRUCTURES[STRUCTURE_EXTENSION][room.controller.level];
        const currentExtensions = room.find(FIND_MY_STRUCTURES, {
            filter: { structureType: STRUCTURE_EXTENSION }
        }).length;
        const extensionSites = room.find(FIND_CONSTRUCTION_SITES, {
            filter: { structureType: STRUCTURE_EXTENSION }
        }).length;

        const neededExtensions = maxExtensions - (currentExtensions + extensionSites);

        if (neededExtensions > 0 && spawns.length > 0) {
            let spawn = spawns[0];
            for (let i = 1; i <= neededExtensions; i++) {
                let x = spawn.pos.x + (i % 2 === 0 ? i : -i);
                let y = spawn.pos.y + (i % 2 === 0 ? -i : i);
                room.createConstructionSite(x, y, STRUCTURE_EXTENSION);
            }
        }
    },

    planRoads: function (room) {
        const spawns = room.find(FIND_MY_SPAWNS);
        const sources = room.find(FIND_SOURCES);
        const controller = room.controller;

        spawns.forEach(spawn => {
            sources.forEach(source => {
                let path = spawn.pos.findPathTo(source, { ignoreCreeps: true });
                path.forEach(step => room.createConstructionSite(step.x, step.y, STRUCTURE_ROAD));
            });

            if (controller) {
                let pathToController = spawn.pos.findPathTo(controller, { ignoreCreeps: true });
                pathToController.forEach(step => room.createConstructionSite(step.x, step.y, STRUCTURE_ROAD));
            }
        });
    },

    planDefenses: function (room) {
        const exits = room.find(FIND_EXIT);
        exits.forEach(exit => {
            let wallSite = room.createConstructionSite(exit.x, exit.y, STRUCTURE_WALL);
            if (wallSite === ERR_FULL) {
                console.log(`Construction sites full. Cannot place walls at ${exit.x}, ${exit.y}`);
            }
        });

        // Place ramparts over critical structures
        const criticalStructures = room.find(FIND_MY_STRUCTURES, {
            filter: structure => structure.structureType === STRUCTURE_SPAWN || structure.structureType === STRUCTURE_STORAGE || structure.structureType === STRUCTURE_TOWER
        });

        criticalStructures.forEach(structure => {
            let rampart = structure.pos.lookFor(LOOK_STRUCTURES).find(s => s.structureType === STRUCTURE_RAMPART);
            if (!rampart) {
                room.createConstructionSite(structure.pos.x, structure.pos.y, STRUCTURE_RAMPART);
            }
        });
    },

    clearObsoleteSites: function (room) {
        const constructionSites = room.find(FIND_CONSTRUCTION_SITES);
        constructionSites.forEach(site => {
            if (site.progress === 0 && !this.isValidSite(site)) {
                site.remove();
            }
        });
    },

    isValidSite: function (site) {
        const room = site.room;
    
        // Check if the site overlaps with an existing structure
        const overlappingStructures = site.pos.lookFor(LOOK_STRUCTURES);
        if (overlappingStructures.length > 0) {
            return false; // Site is invalid if it overlaps with an existing structure
        }
    
        // Check if the site is within the valid room layout
        if (site.structureType === STRUCTURE_EXTENSION) {
            // Ensure extensions are near a spawn or other planned locations
            const nearbySpawns = site.pos.findInRange(FIND_MY_SPAWNS, 5);
            if (nearbySpawns.length === 0) {
                return false; // Extensions must be placed near spawns
            }
        }
    
        if (site.structureType === STRUCTURE_ROAD) {
            // Ensure roads connect critical points like spawns, sources, and controllers
            const nearbyCriticalPoints = site.pos.findInRange(FIND_MY_STRUCTURES, 3, {
                filter: (s) => s.structureType === STRUCTURE_SPAWN || s.structureType === STRUCTURE_STORAGE || s.structureType === STRUCTURE_CONTROLLER
            }).concat(site.pos.findInRange(FIND_SOURCES, 3));
            if (nearbyCriticalPoints.length === 0) {
                return false; // Roads must connect to critical points
            }
        }
    
        if (site.structureType === STRUCTURE_RAMPART || site.structureType === STRUCTURE_WALL) {
            // Ensure ramparts/walls are on valid defensive positions
            const isExit = room.find(FIND_EXIT).some(exit => exit.x === site.pos.x && exit.y === site.pos.y);
            const isCritical = site.pos.lookFor(LOOK_STRUCTURES).some(structure => 
                structure.structureType === STRUCTURE_SPAWN || 
                structure.structureType === STRUCTURE_TOWER || 
                structure.structureType === STRUCTURE_STORAGE
            );
            if (!isExit && !isCritical) {
                return false; // Ramparts/Walls must either defend exits or critical structures
            }
        }
    
        return true; // Site is valid if all checks are passed
    }
};


// Room Progression Logic
module.exports = {
    planRoomProgression: function (room) {
        if (!room.controller || !room.controller.my) return;

        const controllerLevel = room.controller.level;

        // Plan structures dynamically based on controller level
        this.planExtensions(room, controllerLevel);
        this.planStorage(room, controllerLevel);
        this.planTowers(room, controllerLevel);
        this.planLabs(room, controllerLevel);
        this.planFactory(room, controllerLevel);
        this.planTerminal(room, controllerLevel);
        this.planLinks(room, controllerLevel);
        this.planRoads(room);
    },

    planExtensions: function (room, controllerLevel) {
        const maxExtensions = CONTROLLER_STRUCTURES[STRUCTURE_EXTENSION][controllerLevel];
        const currentExtensions = room.find(FIND_MY_STRUCTURES, {
            filter: { structureType: STRUCTURE_EXTENSION },
        }).length;
        const constructionSites = room.find(FIND_CONSTRUCTION_SITES, {
            filter: { structureType: STRUCTURE_EXTENSION },
        }).length;

        const neededExtensions = maxExtensions - (currentExtensions + constructionSites);

        if (neededExtensions > 0) {
            const spawn = room.find(FIND_MY_SPAWNS)[0];
            if (!spawn) return;

            for (let i = 0; i < neededExtensions; i++) {
                const position = this.findNextExtensionPosition(room, spawn.pos, i);
                if (position) {
                    room.createConstructionSite(position.x, position.y, STRUCTURE_EXTENSION);
                }
            }
        }
    },

    findNextExtensionPosition: function (room, center, index) {
        const radius = Math.floor(index / 8) + 1;
        const angle = (index % 8) * (Math.PI / 4); // 8 positions in a circle
        const x = center.x + Math.round(Math.cos(angle) * radius);
        const y = center.y + Math.round(Math.sin(angle) * radius);

        const position = new RoomPosition(x, y, room.name);
        if (this.isValidPosition(position)) {
            return position;
        }
        return null;
    },

    isValidPosition: function (pos) {
        // Ensure the position is buildable and doesn't block other structures
        const terrain = Game.map.getRoomTerrain(pos.roomName);
        if (terrain.get(pos.x, pos.y) === TERRAIN_MASK_WALL) return false;

        const structures = pos.lookFor(LOOK_STRUCTURES);
        if (structures.length > 0) return false;

        const constructionSites = pos.lookFor(LOOK_CONSTRUCTION_SITES);
        if (constructionSites.length > 0) return false;

        return true;
    },

    planStorage: function (room, controllerLevel) {
        if (controllerLevel >= 4 && !room.storage) {
            const spawn = room.find(FIND_MY_SPAWNS)[0];
            if (!spawn) return;

            const position = this.findNearbyPosition(spawn.pos, 3); // Place storage 3 tiles from spawn
            if (position) {
                room.createConstructionSite(position.x, position.y, STRUCTURE_STORAGE);
            }
        }
    },

    planTowers: function (room, controllerLevel) {
        const maxTowers = CONTROLLER_STRUCTURES[STRUCTURE_TOWER][controllerLevel];
        const currentTowers = room.find(FIND_MY_STRUCTURES, {
            filter: { structureType: STRUCTURE_TOWER },
        }).length;

        if (currentTowers < maxTowers) {
            const position = this.findDefensivePosition(room);
            if (position) {
                room.createConstructionSite(position.x, position.y, STRUCTURE_TOWER);
            }
        }
    },

    planLabs: function (room, controllerLevel) {
        if (controllerLevel >= 6) {
            const maxLabs = CONTROLLER_STRUCTURES[STRUCTURE_LAB][controllerLevel];
            const currentLabs = room.find(FIND_MY_STRUCTURES, {
                filter: { structureType: STRUCTURE_LAB },
            }).length;

            const neededLabs = maxLabs - currentLabs;

            for (let i = 0; i < neededLabs; i++) {
                const position = this.findLabClusterPosition(room, i);
                if (position) {
                    room.createConstructionSite(position.x, position.y, STRUCTURE_LAB);
                }
            }
        }
    },

    findLabClusterPosition: function (room, index) {
        // Place labs in a compact cluster for reaction efficiency
        const center = room.storage ? room.storage.pos : room.controller.pos;
        const dx = [-1, 1, 0, 0, -1, 1];
        const dy = [0, 0, -1, 1, -1, 1];

        const x = center.x + dx[index % 6];
        const y = center.y + dy[index % 6];

        const position = new RoomPosition(x, y, room.name);
        if (this.isValidPosition(position)) {
            return position;
        }
        return null;
    },

    planFactory: function (room, controllerLevel) {
        if (controllerLevel >= 7 && !room.find(FIND_MY_STRUCTURES, { filter: { structureType: STRUCTURE_FACTORY } }).length) {
            const position = this.findNearbyPosition(room.controller.pos, 4);
            if (position) {
                room.createConstructionSite(position.x, position.y, STRUCTURE_FACTORY);
            }
        }
    },

    planTerminal: function (room, controllerLevel) {
        if (controllerLevel >= 6 && !room.terminal) {
            const position = this.findNearbyPosition(room.controller.pos, 4);
            if (position) {
                room.createConstructionSite(position.x, position.y, STRUCTURE_TERMINAL);
            }
        }
    },

    planLinks: function (room, controllerLevel) {
        if (controllerLevel >= 5) {
            const sources = room.find(FIND_SOURCES);
            sources.forEach(source => {
                const nearbyLink = source.pos.findInRange(FIND_MY_STRUCTURES, 2, {
                    filter: { structureType: STRUCTURE_LINK },
                });

                if (!nearbyLink.length) {
                    const position = this.findNearbyPosition(source.pos, 2);
                    if (position) {
                        room.createConstructionSite(position.x, position.y, STRUCTURE_LINK);
                    }
                }
            });
        }
    },

    planRoads: function (room) {
        const spawns = room.find(FIND_MY_SPAWNS);
        const sources = room.find(FIND_SOURCES);
        const controller = room.controller;

        spawns.forEach(spawn => {
            sources.forEach(source => {
                this.planRoadBetween(room, spawn.pos, source.pos);
            });

            if (controller) {
                this.planRoadBetween(room, spawn.pos, controller.pos);
            }
        });
    },

    planRoadBetween: function (room, from, to) {
        const path = from.findPathTo(to, { ignoreCreeps: true, swampCost: 2 });
        path.forEach(step => {
            room.createConstructionSite(step.x, step.y, STRUCTURE_ROAD);
        });
    },

    findNearbyPosition: function (center, radius) {
        for (let dx = -radius; dx <= radius; dx++) {
            for (let dy = -radius; dy <= radius; dy++) {
                const pos = new RoomPosition(center.x + dx, center.y + dy, center.roomName);
                if (this.isValidPosition(pos)) {
                    return pos;
                }
            }
        }
        return null;
    },
};
