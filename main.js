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
    // Step 1: Memory Management
    memoryManager.clearDeadCreeps();

    // Step 2: Room Management
    for (let roomName in Game.rooms) {
        let room = Game.rooms[roomName];

        // Process only owned rooms
        if (!room.controller || !room.controller.my) continue;

        // Manage market operations
        marketManager.manageMarket(room);

        // Manage room defenses
        defenseManager.manageRoomDefense(room);

        // Plan and execute room layout updates
        roomManager.planRoomLayout(room);
    }

    // Step 3: Resource Sharing Across Rooms
    resourceSharing.shareResources();

    // Step 4: Creep Management
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
        'resourceCarrier', // Added for manual resource transfers
    ];

    creepManager.manageCreeps(
        roles,
        creepManager.calculateDynamicCreepBody, // Dynamic creep body generation
        defenseManager.isUnderAttack // Room under attack detection
    );

    creepManager.assignRoles();

    // Step 5: Execute Creep Roles
    for (let name in Game.creeps) {
        const creep = Game.creeps[name];

        // Handle specific roles
        if (creep.memory.role === 'resourceCarrier') {
            // Handle resource carrier manually
            resourceSharing.executeCarrierRole(creep);
        } else {
            // Delegate other roles to the creepRoles module
            creepRoles.executeRole(creep);
        }
    }

    // Step 6: Advanced Pathfinding (Optional Maintenance)
    if (Game.time % 100 === 0) {
        pathfindingManager.clearOutdatedPaths();
    }

    // Step 7: Optional - Monitor and Log Stats
    if (Game.time % 10 === 0) {
        console.log(`CPU used: ${Game.cpu.getUsed().toFixed(2)}/${Game.cpu.limit}`);
    }
};
