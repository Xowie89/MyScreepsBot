const memoryManager = require('memoryManager');
const marketManager = require('marketManager');
const defenseManager = require('defenseManager');
const creepManager = require('creepManager');
const roomManager = require('roomManager');

module.exports.loop = function () {
    memoryManager.clearDeadCreeps();

    for (let roomName in Game.rooms) {
        let room = Game.rooms[roomName];
        marketManager.manageMarket(room);
        defenseManager.manageRoomDefense(room);
        roomManager.planRoomLayout(room);
    }

    creepManager.manageCreeps();
    creepManager.assignRoles();
};
