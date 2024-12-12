// Import all modules
const memoryManager = require('memoryManager');
const marketManager = require('marketManager');
const defenseManager = require('defenseManager');
const creepManager = require('creepManager');
const roomManager = require('roomManager');
const resourceSharing = require('resourceSharing');
const creepRoles = require('creepRoles');
const pathfindingManager = require('pathfindingManager');
const roomProgressionManager = require('roomProgressionManager');

module.exports.loop = function () {
    // Step 1: Initialize and Manage Empire Memory
    memoryManager.initializeEmpireMemory();
    memoryManager.evaluateThreats();
    memoryManager.assignRoomTasks();

    // Step 2: Room-Specific Management
    for (let roomName in Game.rooms) {
        const room = Game.rooms[roomName];

        // Only process owned rooms
        if (!room.controller || !room.controller.my) continue;

        // Get the room's assigned tasks from Empire Memory
        const roomTasks = memoryManager.getRoomTask(roomName);

        // Manage market operations
        marketManager.manageMarket(room);

        // Manage room defenses
        defenseManager.manageRoomDefense(room);

        // Plan room layouts and structures (e.g., extensions, roads, factories)
        roomManager.planRoomLayout(room);

        // Execute room progression plans based on controller level
        roomProgressionManager.planRoomProgression(room);

        // Manage creeps based on room tasks
        creepManager.manageCreeps(
            Object.keys(roomTasks), // Roles needed for the room
            creepManager.calculateDynamicCreepBody,
            defenseManager.isUnderAttack
        );
    }

    // Step 3: Resource Sharing Across Rooms
    resourceSharing.shareResources();

    // Step 4: Execute Creep Roles
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

    // Step 5: Advanced Pathfinding Maintenance
    if (Game.time % 100 === 0) {
        pathfindingManager.clearOutdatedPaths();
    }

    // Step 6: Log Empire State (Optional Debugging)
    if (Game.time % 50 === 0) {
        memoryManager.logEmpireState();
    }

    // Step 7: Monitor CPU Usage
    if (Game.time % 10 === 0) {
        console.log(`CPU used: ${Game.cpu.getUsed().toFixed(2)}/${Game.cpu.limit}`);
    }
};
