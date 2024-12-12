module.exports = {
    manageCreeps: function (roles, desiredRoleCount, determineCreepBody, isUnderAttack) {
        let roleCounts = {};

        // Initialize role counts
        roles.forEach(role => {
            roleCounts[role] = 0;
        });

        // Count creeps by role
        for (let name in Game.creeps) {
            let creep = Game.creeps[name];
            if (creep.memory.role) {
                roleCounts[creep.memory.role]++;
            }
        }

        // Adjust spawn logic based on role needs
        for (let role of roles) {
            let desiredCount = desiredRoleCount(role);

            if (role === 'gatherer') {
                // One gatherer per source
                let sources = Object.values(Game.rooms).reduce((acc, room) => acc.concat(room.find(FIND_SOURCES)), []);
                desiredCount = sources.length;
            }

            if (roleCounts[role] < desiredCount) {
                let newName = `${role}_${Game.time}`;
                let body = determineCreepBody(role);

                for (let spawnName in Game.spawns) {
                    let spawn = Game.spawns[spawnName];
                    let roomControllerLevel = spawn.room.controller ? spawn.room.controller.level : 0;

                    // Only spawn scouts if controller level is 3 or higher
                    if (role === 'scout' && roomControllerLevel < 3) {
                        continue;
                    }

                    // Spawn defenders only when under attack
                    if (role === 'defender' && !isUnderAttack(spawn.room)) {
                        continue;
                    }

                    // Spawn attackers only on console command
                    if (role === 'attacker' && !Memory.attackTarget) {
                        continue;
                    }

                    // Spawn colonizers if an expansion target is set
                    if (role === 'colonizer' && !Memory.expansionTarget) {
                        continue;
                    }

                    if (spawn.spawnCreep(body, newName, { memory: { role } }) === OK) {
                        console.log(`Spawning new ${role}: ${newName}`);
                        break;
                    }
                }
            }
        }
    },

    assignRoles: function () {
        for (let name in Game.creeps) {
            let creep = Game.creeps[name];

            switch (creep.memory.role) {
                case 'colonizer':
                    let targetRoom = Memory.expansionTarget;
                    if (targetRoom && creep.room.name !== targetRoom) {
                        let exit = creep.room.findExitTo(targetRoom);
                        creep.moveTo(creep.pos.findClosestByRange(exit));
                    } else {
                        if (!creep.room.controller.my) {
                            if (creep.claimController(creep.room.controller) === ERR_NOT_IN_RANGE) {
                                creep.moveTo(creep.room.controller);
                            }
                        }
                    }
                    break;

                case 'remoteMiner':
                    let target = Game.getObjectById(creep.memory.targetSourceId);
                    if (!target) {
                        let remoteSources = Memory.remoteMiningTargets || [];
                        let availableSource = remoteSources.find(source => !Memory.assignedSources[source]);
                        if (availableSource) {
                            Memory.assignedSources[availableSource] = creep.name;
                            creep.memory.targetSourceId = availableSource;
                        }
                    }
                    if (target) {
                        if (creep.harvest(target) === ERR_NOT_IN_RANGE) {
                            creep.moveTo(target);
                        }
                    }
                    break;

                case 'remoteCarrier':
                    let drop = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES);
                    if (drop) {
                        if (creep.pickup(drop) === ERR_NOT_IN_RANGE) {
                            creep.moveTo(drop);
                        }
                    } else {
                        let storage = creep.room.storage;
                        if (storage && creep.transfer(storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                            creep.moveTo(storage);
                        }
                    }
                    break;

                case 'builder':
                    let constructionSite = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES);
                    if (constructionSite) {
                        if (creep.store[RESOURCE_ENERGY] === 0) {
                            let source = creep.pos.findClosestByPath(FIND_SOURCES);
                            if (source && creep.harvest(source) === ERR_NOT_IN_RANGE) {
                                creep.moveTo(source);
                            }
                        } else {
                            if (creep.build(constructionSite) === ERR_NOT_IN_RANGE) {
                                creep.moveTo(constructionSite);
                            }
                        }
                    }
                    break;

                case 'repairer':
                    let damagedStructure = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                        filter: (structure) => structure.hits < structure.hitsMax
                    });
                    if (damagedStructure) {
                        if (creep.store[RESOURCE_ENERGY] === 0) {
                            let source = creep.pos.findClosestByPath(FIND_SOURCES);
                            if (source && creep.harvest(source) === ERR_NOT_IN_RANGE) {
                                creep.moveTo(source);
                            }
                        } else {
                            if (creep.repair(damagedStructure) === ERR_NOT_IN_RANGE) {
                                creep.moveTo(damagedStructure);
                            }
                        }
                    }
                    break;

                case 'carrier':
                    let droppedEnergy = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES, {
                        filter: (resource) => resource.resourceType === RESOURCE_ENERGY
                    });
                    if (droppedEnergy && creep.store.getFreeCapacity() > 0) {
                        if (creep.pickup(droppedEnergy) === ERR_NOT_IN_RANGE) {
                            creep.moveTo(droppedEnergy);
                        }
                    } else {
                        let energyTarget = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                            filter: (s) => (s.structureType === STRUCTURE_STORAGE || s.structureType === STRUCTURE_SPAWN || s.structureType === STRUCTURE_EXTENSION) &&
                                          s.store.getFreeCapacity(RESOURCE_ENERGY) > 0,
                        });
                        if (energyTarget && creep.store[RESOURCE_ENERGY] > 0) {
                            if (creep.transfer(energyTarget, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                                creep.moveTo(energyTarget);
                            }
                        }
                    }
                    break;

                case 'upgrader':
                    let controller = creep.room.controller;
                    if (controller) {
                        if (creep.store[RESOURCE_ENERGY] === 0) {
                            let source = creep.pos.findClosestByPath(FIND_SOURCES);
                            let storage = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                                filter: (s) => s.structureType === STRUCTURE_STORAGE && s.store[RESOURCE_ENERGY] > 0
                            });
                            let target = storage || source;
                            if (target) {
                                if (creep.withdraw(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE || creep.harvest(target) === ERR_NOT_IN_RANGE) {
                                    creep.moveTo(target);
                                }
                            }
                        } else {
                            if (creep.upgradeController(controller) === ERR_NOT_IN_RANGE) {
                                creep.moveTo(controller);
                            }
                        }
                    }
                    break;

                default:
                    console.log(`Unrecognized role: ${creep.memory.role}`);
            }
        }
    }
};
