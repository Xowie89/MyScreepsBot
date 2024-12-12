const memoryManager = require('memoryManager');
const marketManager = require('marketManager');
const defenseManager = require('defenseManager');
const creepManager = require('creepManager');
const roomManager = require('roomManager');
const resourceSharing = require('resourceSharing');

module.exports.loop = function () {
    // Step 1: Clear memory of dead creeps
    memoryManager.clearDeadCreeps();

    // Step 2: Iterate over all rooms
    for (let roomName in Game.rooms) {
        let room = Game.rooms[roomName];

        // Only process rooms owned by the player
        if (!room.controller || !room.controller.my) continue;

        // Market management
        marketManager.manageMarket(room);

        // Defense management (towers, ramparts, walls)
        defenseManager.manageRoomDefense(room);

        // Room layout planning (extensions, roads, etc.)
        roomManager.planRoomLayout(room);
    }

    // Step 3: Resource sharing across rooms
    resourceSharing.shareResources();

    // Step 4: Manage creeps (spawning, role assignments)
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
        creepManager.determineCreepBody, // Ensure this function is implemented in creepManager.js
        defenseManager.isUnderAttack // Ensure this function is implemented in defenseManager.js
    );

    // Step 5: Assign roles to all creeps
    creepManager.assignRoles();
};

// Add additional task scheduling logic to optimize CPU usage
const taskScheduler = {
    tasks: [],
    addTask(task) {
        this.tasks.push(task);
    },
    runTasks() {
        while (this.tasks.length > 0 && Game.cpu.bucket > 500) {
            const task = this.tasks.shift();
            task();
        }
    }
};

// Add tasks for long-running processes
taskScheduler.addTask(() => memoryManager.clearDeadCreeps());
taskScheduler.addTask(() => resourceSharing.shareResources());
taskScheduler.addTask(() => {
    for (let roomName in Game.rooms) {
        let room = Game.rooms[roomName];
        if (room.controller && room.controller.my) {
            roomManager.planRoomLayout(room);
        }
    }
});

// Execute scheduled tasks
taskScheduler.runTasks();
