// main.js
const roleHarvester = require('harvester');
const roleBuilder = require('builder');
const roleUpgrader = require('upgrader');

module.exports.loop = function () {
    // Clear memory of dead creeps
    for (let name in Memory.creeps) {
        if (!Game.creeps[name]) {
            delete Memory.creeps[name];
        }
    }

    // Spawn creeps as needed
    const harvesters = _.filter(Game.creeps, creep => creep.memory.role === 'harvester');
    const builders = _.filter(Game.creeps, creep => creep.memory.role === 'builder');
    const upgraders = _.filter(Game.creeps, creep => creep.memory.role === 'upgrader');

    const spawn = Game.spawns['Spawn1'];

    if (harvesters.length < 2) {
        spawn.spawnCreep([WORK, CARRY, MOVE], `Harvester${Game.time}`, {
            memory: { role: 'harvester' }
        });
    } else if (builders.length < 2) {
        spawn.spawnCreep([WORK, CARRY, MOVE], `Builder${Game.time}`, {
            memory: { role: 'builder' }
        });
    } else if (upgraders.length < 2) {
        spawn.spawnCreep([WORK, CARRY, MOVE], `Upgrader${Game.time}`, {
            memory: { role: 'upgrader' }
        });
    }

    // Assign roles to creeps
    for (let name in Game.creeps) {
        const creep = Game.creeps[name];

        if (creep.memory.role === 'harvester') {
            roleHarvester.run(creep);
        } else if (creep.memory.role === 'builder') {
            roleBuilder.run(creep);
        } else if (creep.memory.role === 'upgrader') {
            roleUpgrader.run(creep);
        }
    }
};
