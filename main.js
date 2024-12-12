const memoryManager = require('./memoryManager');
const marketManager = require('./marketManager');
const defenseManager = require('./defenseAndEmergencyManager');
const creepManager = require('./creepManager');
const roomManager = require('./roomManager');
const resourceSharing = require('./resourceSharing');
const pathfindingManager = require('./pathfindingManager');
const profiler = require('./profiler');

module.exports.loop = function () {
    profiler.start("Main Loop");

    // Step 1: Initialize and Manage Empire Memory
    profiler.start("Memory Management");
    memoryManager.clearDeadCreeps();
    memoryManager.clearOldPaths();
    memoryManager.initializeEmpireMemory();
    memoryManager.evaluateThreats();
    memoryManager.assignRoomTasks();
    profiler.end("Memory Management");

    // Step 2: Room-Specific Management
    profiler.start("Room Management");
    for (let roomName in Game.rooms) {
        const room = Game.rooms[roomName];
        if (!room.controller || !room.controller.my) continue;

        const isEmergency = defenseManager.checkEmergency(room);

        if (isEmergency) {
            defenseManager.assignEmergencyRoles(room);
        } else {
            marketManager.manageMarket(room);
            defenseManager.manageRoomDefense(room);
            roomManager.planRoomLayout(room);
        }
    }
    profiler.end("Room Management");

    // Step 3: Resource Sharing Across Rooms
    profiler.start("Resource Sharing");
    resourceSharing.shareResources();
    profiler.end("Resource Sharing");

    // Step 4: Execute Creep Roles
    profiler.start("Creep Role Execution");
    for (let name in Game.creeps) {
        const creep = Game.creeps[name];
        if (creep.memory.emergencyRole) {
            defenseManager.executeEmergencyRole(creep);
        } else {
            creepManager.executeRole(creep);
        }
    }
    profiler.end("Creep Role Execution");

    // Step 5: Advanced Pathfinding Maintenance
    if (Game.time % 100 === 0) {
        profiler.start("Pathfinding Maintenance");
        pathfindingManager.clearOutdatedPaths();
        profiler.end("Pathfinding Maintenance");
    }

    // Step 6: Log Empire State (Optional Debugging)
    if (Game.time % 50 === 0) {
        profiler.start("Empire Logging");
        memoryManager.logEmpireState();
        profiler.end("Empire Logging");
    }

    // Step 7: Monitor CPU Usage
    profiler.start("CPU Monitoring");
    console.log(`CPU used: ${Game.cpu.getUsed().toFixed(2)}/${Game.cpu.limit}`);
    profiler.end("CPU Monitoring");

    profiler.end("Main Loop");
};
