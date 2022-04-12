const EventEmitter = require("events");

let orderEmitter = new EventEmitter();


const KeyManager = function(binance) {
    this.keyInterval = null;
    this.closeStream = async function() {
        await binance.futuresCloseDataStream();
        clearInterval(this.keyInterval);
    }
    this.manageListenkey = async function() {
        this.closeStream();
        const response = await binance.futuresGetDataStream();
    
        this.keyInterval = setInterval(binance.futuresKeepDataStream, 1000 * 60 * 30);
    
        return response;
    }
}


function listenForOrder (binance, binance1) {
    console.log('SETTING UP ORDER LISTENER');
    const keyManager1 = new KeyManager(binance);
    const keyManager2 = new KeyManager(binance1);
    const listen1 = async () => {
        const listenKeyResp = await keyManager1.manageListenkey();
        const listenKey = listenKeyResp.listenKey;
        try {
            binance.futuresSubscribe(listenKey, data => {
                if(data.e == 'ORDER_TRADE_UPDATE') {
                    orderEmitter.emit('order', data);
                }
                if(data.e == 'listenKeyExpired') {
                    listen1();
                }
            });
        } catch (err) {
            console.log(err)
        }
    }
    const listen2 = async () => {
        const listenKeyResp = await keyManager2.manageListenkey();
        const listenKey = listenKeyResp.listenKey;
        try {
            binance.futuresSubscribe(listenKey, data => {
                if(data.e == 'ORDER_TRADE_UPDATE') {
                    orderEmitter.emit('order', data);
                }
                if(data.e == 'listenKeyExpired') {
                    listen2();
                }
            });
        } catch (err) {
            console.log(err)
        }
    }
    listen1();
    listen2();
}

module.exports = {
    listenForOrder,
    orderEmitter
}