const Binance = require('./node-binance-api');
const {
  loadPairs,
  listenForPairChange,
  getHottestPair,
}             = require('./utilityMethods');
const { orderEmitter, listenForOrder } = require('./orderData');
const db = require('./dataStore');

const APIKEY = process.env.APIKEY;
const APISECRET = process.env.APISECRET;
const APIKEY1 = process.env.APIKEY1;
const APISECRET1 = process.env.APISECRET1;

const binance = new Binance().options({
  APIKEY,
  APISECRET
});

const binance1 = new Binance().options({
  APIKEY1,
  APISECRET1
});


let pairs = [];
let opts = {
  tradeMargin: 2,
  leverage: 50
}
let balances = {
  account1: 0,
  account2: 0,
  get Account1Bal () {
    return this.account1;
  },
  get Account2Bal () {
    return this.account2;
  },
  updateBalance: async function () {
    let account1Balances = binance.futuresBalance;
    let account2Balances = binance1.futuresBalance;
    try {
      let [ret1, ret2] = await Promise.all([account1Balances(), account2Balances()]);
      console.log(ret1, ret2)
      this.account1 = Number(ret1.find(e => e.asset == 'USDT').balance)
      this.account2 = Number(ret2.find(e => e.asset == 'USDT').balance)
    } catch(err) {
      console.log(err);
    }
    
  }
}
let vars = {
  tradeIntervalHandle: null,
  isRunning: false
};

function setPairs (newPairs) {
  pairs = newPairs;
}

function getPairs () {
  return [...pairs];
}



function trade () {
  // set fiveMinsVol to 0 after 5 minutes;
  let tradeInterval = 1000*60*5;
  vars.tradeIntervalHandle = setInterval(async () => {
  // let tradeInterval = 1000*5;
  // vars.tradeIntervalHandle = setTimeout(async () => {
    let savedPairs = getPairs();
    let hottestPair = getHottestPair(savedPairs);
    let symbol = hottestPair.symbol;
    let price = Number.parseFloat(hottestPair.price);
    let leverageReq;
    try {
      leverageReq = await Promise.all([binance.futuresLeverage( symbol, opts.leverage ),
         binance1.futuresLeverage( symbol, opts.leverage )]);
      let leverage = leverageReq[0].leverage;
      let quantity = (opts.tradeMargin / price) * leverage;
      console.log('Balances: ', balances.Account1Bal, balances.Account2Bal);
      let stopPrice = (0.9 * price) / leverage;
      console.log(symbol, quantity, stopPrice, price)
      quantity = Math.round(quantity);
      let orders = await createOrder(symbol, quantity, stopPrice, price);
      // console.log(orders);
      orderEmitter.on('order', callback);
      async function callback(data) {
        if(data.o.X === 'FILLED') {
          const stopIds = [orders.longOrder.stopId, orders.shortOrder.stopId]
          const finalIds = [];
          let index = stopIds.indexOf(data.o.i);
          let finalIndex = finalIds.indexOf(data.o.i);
          if(index > -1) {
            let binanceHandler = index == 0 ? binance1.futuresMarketBuy : binance.futuresMarketSell;
            const finalStopChange = (0.85 * price) / leverage;
            const takeProfitChange = (1.05 * price) / leverage;
            let finalStop = index == 0 ? String(Number.parseFloat(price - finalStopChange).toPrecision(4)) 
            : String(Number.parseFloat(price + finalStopChange).toPrecision(4)) ;

            let takeProfit = index == 0 ? String(Number.parseFloat(price - takeProfitChange).toPrecision(4)) 
            : String(Number.parseFloat(price + takeProfitChange).toPrecision(4)) ;
            const final = await Promise.all([
              binanceHandler(symbol, quantity, {type: 'STOP_MARKET', stopPrice: finalStop}),
              binanceHandler(symbol, quantity, {type: 'TAKE_PROFIT_MARKET', stopPrice: takeProfit})
            ]);
            finalIds.push(final[0].orderId);
            finalIds.push(final[1].orderId);
          }


          if(finalIndex > -1) {
            let outcome;

            // Out of trade
            let allPairs = getPairs();
            allPairs.forEach(e => {
              if(e.symbol == symbol) e.inTrade = true;
            });
            setPairs(allPairs);

            orderEmitter.removeListener('order', callback);
            if(finalIndex == 0) {
              console.log(symbol, 'Loss')
              outcome = 'loss';
            }
            if(finalIndex == 1) {
              console.log(symbol, 'Profit');
              outcome = 'profit'
            }

            // Terminate all socket listeners
            if(vars.isRunning == false) {
              let subs = binance.futuresSubscriptions();
              Object.keys(subs).forEach(sub => {
                binance.futuresTerminate(sub);
              });              
            }

            let tradeData = {
              margin: opts.tradeMargin,
              outcome,
              date: Date.now()
            }

            db.trades.insert(tradeData, (err, document) => {
              if(err) {
                console.log(err);
              }
              console.log(document);
            });
            // Might need to cancel all open orders here

            // await binance.futuresCancelAll( symbol )
          }
        }        
      }
    } catch (err) {
      console.log(err);
    }

    savedPairs.forEach(pair => {      
      pair.fiveMinsVol = 0;   
    });
    setPairs(savedPairs);
  }, tradeInterval)
}


/**
 *  Creating an order
 */
async function createOrder (symbol, quantity, stopPrice, price) {
  console.log(symbol, quantity, stopPrice, price);
  let longOpts =     
    {
      type: "STOP_MARKET",
      stopPrice: String(Number.parseFloat(price - stopPrice).toPrecision(4))
    }
  let shortOpts = [
    {
      type: "STOP_MARKET",
      stopPrice: String(Number.parseFloat(price + stopPrice).toPrecision(4))
    }
  ];
  console.log(longOpts,shortOpts)
  const buy1 = binance.futuresMarketBuy;
  const buy2 = binance1.futuresMarketBuy;
  const sell1 = binance.futuresMarketSell;
  const sell2 = binance1.futuresMarketSell;
  console.log(quantity)
  const orders = await Promise.all([buy1(symbol, quantity), /**buy2(symbol, quantity)*/]);
  const stopOrders = await Promise.all([sell1(symbol, quantity, longOpts), /**sell2(symbol, quantity, shortOpts)*/])
  
  // In trade
  let allPairs = getPairs();
  allPairs.forEach(e => {
    if(e.symbol == symbol) e.inTrade = true;
  });
  setPairs(allPairs);

  console.log(orders, stopOrders)
  return {
    longOrder: {
      id: orders[0].orderId,
      stopId: stopOrders[0].orderId,
    },
    shortOrder: {
      id: orders[1].orderId,
      stopId: stopOrders[1].orderId,
    }
  }
}

// async function test() {
//   binance.futuresMarkPriceStream('BTCUSDT', data => {
//     console.log(data)
//   } );
//   setTimeout(() => {console.log( binance.futuresTerminate('btcusdt@markPrice@1s') ) }, 5000)
// }
// test();

const init = async () => {
  return new Promise((resolve, reject) => {
    try {
      db.options.findOne({name: 'margin'}, async (err, document) => {
        if(document && document.value) {
          console.log(document)
          opts.tradeMargin = document.value;
        }
        await balances.updateBalance();
        await loadPairs(binance, setPairs);
        await listenForPairChange(binance, getPairs, setPairs);
        await listenForOrder(binance);
        trade();
        vars.isRunning = true;
        resolve();
      })    
    } catch(err) {
      console.log(err);
      resolve();
    }
  })
    
  
}

const sleep = async () => {
  clearTimeout(vars.tradeIntervalHandle);
  // clearInterval(vars.tradeIntervalHandle);
  vars.isRunning = false;
}

const getIsRunning = () => vars.isRunning;

module.exports = { init, sleep, getIsRunning };