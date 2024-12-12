// Import all modules
const memoryManager = require('memoryManager');
const marketManager = require('marketManager');
const defenseManager = require('defenseManager');
const creepManager = require('creepManager');
const roomManager = require('roomManager');
const resourceSharing = require('resourceSharing');
const creepRoles = require('creepRoles');
const pathfindingManager = require('pathfindingManager');

module.exports.loop = function () {
    // Step 1: Memory management
    memoryManager.clearDeadCreeps();

    // Step 2: Room management
    for (let roomName in Game.rooms) {
        let room = Game.rooms[roomName];

        if (!room.controller || !room.controller.my) continue;

        marketManager.manageMarket(room);
        defenseManager.manageRoomDefense(room);
        roomManager.planRoomLayout(room);
    }

    // Step 3: Resource sharing
    resourceSharing.shareResources();

    // Step 4: Creep management
    const roles = [
        'gatherer',
        'carrier',
        'builder',
        'repairer',
        'upgrader',
        'defender',
        'attacker',
        'scout',
        'colonizer',
        'remoteMiner',
        'remoteCarrier',
    ];

    creepManager.manageCreeps(
        roles,
        creepManager.calculateDynamicCreepBody,
        defenseManager.isUnderAttack
    );

    creepManager.assignRoles();

    // Step 5: Execute creep roles
    for (let name in Game.creeps) {
        const creep = Game.creeps[name];
        creepRoles.executeRole(creep);
    }

    // Step 6: Clean outdated paths periodically
    if (Game.time % 100 === 0) {
        pathfindingManager.clearOutdatedPaths();
    }

    // Step 7: Monitor stats
    if (Game.time % 10 === 0) {
        console.log(`CPU used: ${Game.cpu.getUsed().toFixed(2)}/${Game.cpu.limit}`);
    }
};
