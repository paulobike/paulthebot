const EventEmitter = require("events");

let orderEmitter = new EventEmitter();


async function manageListenkey (binance) {
    let keyInterval;
    closeStream();
    const listenKey = await binance.futuresGetDataStream(); //futuresGetDataStream futuresKeepDataStream futuresCloseDataStream

    keyInterval = setInterval(binance.futuresKeepDataStream, 1000 * 60 * 30);

    const closeStream = () => {
        binance.futuresCloseDataStream();
        clearInterval(keyInterval);
    }
    return listenKey;
}

function listenForOrder (binance) {

    const listen = async () => {
        const listenkey = await manageListenkey();
        try {
            binance.futuresSubscribe(listenKey, data => {
                console.log(data.e);
                if(data.e == 'ORDER_TRADE_UPDATE') {
                    orderEmitter.emit('order', data);
                }
                if(data.e == 'listenKeyExpired') {
                    listen();
                }
            });
        } catch (err) {
            console.log(err)
        }
    }
}

module.exports = {
    listenForOrder,
    orderEmitter
}