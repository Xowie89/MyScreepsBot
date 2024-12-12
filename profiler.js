// Modular CPU Profiling
const profiler = {
    start: function (label) {
        if (!Memory.profiler) Memory.profiler = {};
        Memory.profiler[label] = Game.cpu.getUsed();
    },

    end: function (label) {
        if (Memory.profiler && Memory.profiler[label]) {
            console.log(`${label}: ${(Game.cpu.getUsed() - Memory.profiler[label]).toFixed(2)} CPU`);
            delete Memory.profiler[label];
        }
    },
};

module.exports = profiler;
