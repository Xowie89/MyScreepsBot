const memoryManager = require('memoryManager');
const marketManager = require('marketManager');
const defenseManager = require('defenseManager');
const creepManager = require('creepManager');
const roomManager = require('roomManager');
const resourceSharing = require('resourceSharing');
const creepRoles = require('creepRoles');
const pathfindingManager = require('pathfindingManager');

module.exports.loop = function () {
    // Step 1: Initialize Empire Memory
    memoryManager.initializeEmpireMemory();

    // Step 2: Evaluate Threat Levels
    memoryManager.evaluateThreats();

    // Step 3: Assign Tasks to Rooms
    memoryManager.assignRoomTasks();

    // Step 4: Room Management
    for (let roomName in Game.rooms) {
        let room = Game.rooms[roomName];

        // Process only owned rooms
        if (!room.controller || !room.controller.my) continue;

        const roomTask = memoryManager.getRoomTask(roomName);

        // Use roomTask to adjust room-specific logic
        marketManager.manageMarket(room);
        defenseManager.manageRoomDefense(room);
        roomManager.planRoomLayout(room);

        // Adjust creep management for this room based on tasks
        creepManager.manageCreeps(
            Object.keys(roomTask), // Roles needed for the room
            creepManager.calculateDynamicCreepBody,
            defenseManager.isUnderAttack
        );
    }

    // Step 5: Resource Sharing Across Rooms
    resourceSharing.shareResources();

    // Step 6: Execute Creep Roles
    for (let name in Game.creeps) {
        const creep = Game.creeps[name];
        if (creep.memory.role === 'resourceCarrier') {
            resourceSharing.executeCarrierRole(creep);
        } else {
            creepRoles.executeRole(creep);
        }
    }

    // Step 7: Advanced Pathfinding (Optional Maintenance)
    if (Game.time % 100 === 0) {
        pathfindingManager.clearOutdatedPaths();
    }

    // Step 8: Log Empire State (Optional Debugging)
    if (Game.time % 50 === 0) {
        memoryManager.logEmpireState();
    }

    // Step 9: Monitor CPU Usage
    if (Game.time % 10 === 0) {
        console.log(`CPU used: ${Game.cpu.getUsed().toFixed(2)}/${Game.cpu.limit}`);
    }
};
