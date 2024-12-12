module.exports = {
    manageMarket: function (room) {
        if (!room.terminal) return;

        const resources = room.terminal.store;
        const energyThreshold = 10000; // Minimum energy to keep in the terminal

        for (let resourceType in resources) {
            if (resourceType === RESOURCE_ENERGY && resources[RESOURCE_ENERGY] < energyThreshold) {
                let orders = Game.market.getAllOrders({ type: ORDER_SELL, resourceType: RESOURCE_ENERGY });
                orders.sort((a, b) => a.price - b.price);
                if (orders.length) {
                    let amountToBuy = Math.min(orders[0].amount, energyThreshold - resources[RESOURCE_ENERGY]);
                    Game.market.deal(orders[0].id, amountToBuy, room.name);
                    console.log(`Bought ${amountToBuy} energy for ${orders[0].price * amountToBuy} credits.`);
                }
            } else if (resources[resourceType] > 1000 && resourceType !== RESOURCE_ENERGY) {
                let orders = Game.market.getAllOrders({ type: ORDER_BUY, resourceType });
                orders.sort((a, b) => b.price - a.price);
                if (orders.length) {
                    let amountToSell = Math.min(orders[0].amount, resources[resourceType] - 1000);
                    Game.market.deal(orders[0].id, amountToSell, room.name);
                    console.log(`Sold ${amountToSell} ${resourceType} for ${orders[0].price * amountToSell} credits.`);
                }
            }
        }
    }
};
