const Binance = require('./node-binance-api');
const {
  loadPairs,
  listenForPairChange,
  getNextPair,
}             = require('./utilityMethods');
const { orderEmitter, listenForOrder } = require('./orderData');
const db = require('./dataStore');

const APIKEY = process.env.APIKEY;
const APISECRET = process.env.APISECRET;
const APIKEY1 = process.env.APIKEY1;
const APISECRET1 = process.env.APISECRET1;

const logger = require('./logger');

const binance = new Binance().options({
  APIKEY: APIKEY,
  APISECRET: APISECRET
});

const binance1 = new Binance().options({
  APIKEY: APIKEY1,
  APISECRET: APISECRET1
});

/**
 * IN MEMORY REPRESENTATION OF PAIRS
 * GETS LOADED FROM DATABASE ON INIT
 */
let pairs = [];
function setPairs (newPairs) {
  pairs = newPairs;
}

function getPairs () {
  return [...pairs];
}

/**
 * IN MEMORY REPRESENTATION OF OPTIONS
 * GETS LOADED FROM DATABASE ON INIT
 * TAKES DEFAULT VALUES IF NONE IN DATABASE
 */
let opts = {
  tradeMargin: 2,
}

/**
 * BOT VARIABLES
 */
let vars = {
  tradeIntervalHandle: null,
  isRunning: false,
  lastTradeSymbol: null
};

/**
 * ACCOUNT BALANCES OBJECT
 */
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
    let ret1, ret2;
    try {
      [ret1, ret2] = await Promise.all([account1Balances(), account2Balances()]);
      this.account1 = Number(ret1.find(e => e.asset == 'USDT').balance)
      this.account2 = Number(ret2.find(e => e.asset == 'USDT').balance)
    } catch(err) {
      console.log(err);
      if((ret1 || ret2) && (ret1.code < 0 || ret2.code < 0))
        throw new Error(ret1.msg || ret2.msg);
      else
        throw err;
    }    
  }
}


function trade () {
  let tradeInterval = 1000*60*2;
  vars.tradeIntervalHandle = setInterval(async () => {
  // let tradeInterval = 1000*5;
  // vars.tradeIntervalHandle = setTimeout(async () => {
    // GET THE NEXT PAIR TO TRADE
    let nextPair = await getNextPair(vars.lastTradeSymbol, getPairs);
    console.log(`PREPARING TO TRADE ${nextPair.symbol} AT $${nextPair.price}=> LEVERAGE: ${nextPair.leverage}`);
    logger.log(`PREPARING TO TRADE ${nextPair.symbol} AT $${nextPair.price}=> LEVERAGE: ${nextPair.leverage}`);

    if(!nextPair) return;

    let symbol = vars.lastTradeSymbol = nextPair.symbol;
    let price = Number.parseFloat(nextPair.price);
    let leverageReq;
    let leverage = nextPair.leverage;
    leverage = 20;

    if(!price || !leverage) {
      console.log('SKIPPING TRADE DUE TO NO PRICE OR LEVERAGE LOADED FOR PAIR');
      logger.log('SKIPPING TRADE DUE TO NO PRICE OR LEVERAGE LOADED FOR PAIR');
      return;
    }

    try {
      // CHANGE LEVERAGE TO CORRESPONDING
      leverageReq = await Promise.all([
        binance.futuresLeverage( symbol, leverage ),
        binance1.futuresLeverage( symbol, leverage ),
      ]);
      let erroredLeverage = leverageReq.find(e => e.code && e.code < 0);
      if(erroredLeverage) {
        throw new Error(`LEVERAGE ERROR DETECTED, "${erroredLeverage.msg}"`);
      }

      await balances.updateBalance()
      console.log('BALANCES: ', balances.Account1Bal, balances.Account2Bal);
      logger.log('BALANCES: ', balances.Account1Bal, balances.Account2Bal);
      if(opts.tradeMargin > balances.Account1Bal || opts.tradeMargin > balances.Account2Bal) {
        console.log('SLEEPING DUE TO INSUFFICIENT BALANCE');
        logger.log('SLEEPING DUE TO INSUFFICIENT BALANCE');
        return sleep();
      }
      let quantity = (opts.tradeMargin / price) * leverage;
      let stopPrice = (0.8 * price) / leverage;
      quantity = Number(quantity.toFixed(2));
      console.log(`TRADING ${symbol} AT $${price}=> QUANTITY: ${quantity}, S/L: ± $${stopPrice}, LEVERAGE: ${leverage}`)
      logger.log(`TRADING ${symbol} AT $${price}=> QUANTITY: ${quantity}, S/L: ± $${stopPrice}, LEVERAGE: ${leverage}`)
      let orders = await createOrder(symbol, quantity, stopPrice, price);
      if(!orders.longOrder.id || !orders.shortOrder.id ||
        !orders.longOrder.stopId || !orders.shortOrder.stopId) {
        binance.futuresCancelAll( symbol );
        throw new Error('ERROR OCCURED IN CREATING INITIAL ORDER');
      }
      db.pairs.update({ symbol }, { $set: { inTrade: true } }, (err) => {
        if(err) {
          console.log(symbol + ' IS STILL SEEN AS NOT BEING IN TRADE EVEN AFTER TRADE HAS STARTED');
          logger.log(symbol + ' IS STILL SEEN AS NOT BEING IN TRADE EVEN AFTER TRADE HAS STARTED');
        }
      })
      console.log(`INITIAL ORDERS IDS: ${orders.longOrder.id}, ${orders.shortOrder.id}`);
      logger.log(`INITIAL ORDERS IDS: ${orders.longOrder.id}, ${orders.shortOrder.id}`);
      console.log(`STOP LOSSES IDS: ${orders.longOrder.stopId}, ${orders.shortOrder.stopId}`);
      logger.log(`STOP LOSSES IDS: ${orders.longOrder.stopId}, ${orders.shortOrder.stopId}`);


      const finalIds = [];
      orderEmitter.on('order', callback);


      async function callback(data) {
        console.log('ORDER UPDATE, ID: ', data.o.c, 'STATUS: ', data.o.X);
        logger.log('ORDER UPDATE, ID: ', data.o.c, 'STATUS: ', data.o.X);
        if(data.o.X === 'FILLED') {
          const stopIds = [orders.longOrder.stopId, orders.shortOrder.stopId]
          let index = stopIds.indexOf(data.o.c);
          let finalIndex = finalIds.indexOf(data.o.c);
          if(index > -1) {
            let binanceHandler = index == 0 ? binance1.futuresMarketBuy : binance.futuresMarketSell;
            let cancel = index == 0 ? await binance1.futuresCancel(symbol, {origClientOrderId: stopIds[1]}):
            await binance.futuresCancel(symbol, {origClientOrderId: stopIds[0]});
            console.log(cancel);
            const finalStopChange = (0.7 * price) / leverage;
            const takeProfitChange = (1 * price) / leverage;
            let finalStop = index == 0 ? String((price - finalStopChange).toFixed(2)) 
            : String((price + finalStopChange).toFixed(2));

            let takeProfit = index == 0 ? String((price - takeProfitChange).toFixed(2)) 
            : String((price + takeProfitChange).toFixed(2)) ;
            console.log('FINAL STAGE STOP LOSS & TAKE PROFIT: ', finalStop, takeProfit)
            logger.log('FINAL STAGE STOP LOSS & TAKE PROFIT: ', finalStop, takeProfit)
            const final = await Promise.all([
              binanceHandler(symbol, null, {type: 'STOP_MARKET', stopPrice: finalStop, closePosition: "true"}),
              binanceHandler(symbol, null, {type: 'TAKE_PROFIT_MARKET', stopPrice: takeProfit, closePosition: "true"})
            ]);
            console.log(final)
            let erroredFinalOrder = final.find(e => e.code && e.code < 0);
            if(erroredFinalOrder) {
              console.log(`ERROR OCCURED ON SETTING LAST STAGE S/L OR T/P, "${erroredFinalOrder.msg}"`);
              logger.log(`ERROR OCCURED ON SETTING LAST STAGE S/L OR T/P, "${erroredFinalOrder.msg}"`);
            }
            finalIds.push(final[0].clientOrderId);
            finalIds.push(final[1].clientOrderId);
          }


          if(finalIndex > -1) {
            let outcome;

            // Out of trade
            db.pairs.update({ symbol }, { $set: { inTrade: false } }, (err) => {
              if(err) {
                console.log(symbol + ' IS STILL SEEN AS BEING IN TRADE EVEN AFTER TRADE IS ENDED');
                logger.log(symbol + ' IS STILL SEEN AS BEING IN TRADE EVEN AFTER TRADE IS ENDED');
              }
            })

            orderEmitter.removeListener('order', callback);
            if(finalIndex == 0) {
              console.log(symbol + ' TRADE ENDED WITH LOSS');
              logger.log(symbol + ' TRADE ENDED WITH LOSS');
              outcome = 'loss';
            }
            if(finalIndex == 1) {
              console.log(symbol + ' TRADE ENDED WITH PROFIT');
              logger.log(symbol + ' TRADE ENDED WITH PROFIT');
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
            binance.futuresCancelAll( symbol )
          }
        }        
      }
    } catch (err) {
      console.log('SKIPPING BECAUSE: ', err.message);
      logger.log('SKIPPING BECAUSE: ', err.message);
    }

    // savedPairs.forEach(pair => {      
    //   pair.fiveMinsVol = 0;   
    // });
    // setPairs(savedPairs);
  }, tradeInterval)
}


/**
 *  Creating an order
 */
async function createOrder (symbol, quantity, stopPrice, price) {
  console.log(symbol, quantity, stopPrice, price);
  let longOpts = {
    type: "STOP_MARKET",
    closePosition: "true",
    stopPrice: String((price - stopPrice).toFixed(2))
  }
  let shortOpts = {
    type: "STOP_MARKET",
    closePosition: "true",
    stopPrice: String((price + stopPrice).toFixed(2))
  };
  const buy1 = binance.futuresMarketBuy;
  const buy2 = binance1.futuresMarketBuy;
  const sell1 = binance.futuresMarketSell;
  const sell2 = binance1.futuresMarketSell;
  const orders = await Promise.all([buy1(symbol, String(quantity)), sell2(symbol, String(quantity))]);
  const stopOrders = await Promise.all([sell1(symbol, null, longOpts), buy2(symbol, null, shortOpts) ])
  
  // In trade
  let allPairs = getPairs();
  allPairs.forEach(e => {
    if(e.symbol == symbol) e.inTrade = true;
  });
  setPairs(allPairs);

  return {
    longOrder: {
      id: orders[0].clientOrderId,
      stopId: stopOrders[0].clientOrderId,
    },
    shortOrder: {
      id: orders[1].clientOrderId,
      stopId: stopOrders[1].clientOrderId,
    }
  }
}

// async function test() {
//   let cancel = await binance.futuresCancelAll('LINAUSDT')
//     console.log('cancel: ', cancel)
//     console.log('cancel: ', cancel)
// }
// test();

const init = async () => {
  return new Promise((resolve, reject) => {
    db.options.findOne({name: 'margin'}, async (err, document) => {
      if(document && document.value) {
        // LOADING MARGIN TO MEMORY
        opts.tradeMargin = Number(document.value);
      }
      try {
        await loadPairs(binance, setPairs);
        await listenForPairChange(binance1, getPairs, setPairs);
        await balances.updateBalance();
        await listenForOrder(binance, binance1);
        trade();
        vars.isRunning = true;
        resolve();
      } catch(err) {
        console.log(err);

        reject(err);
      }      
    });
  })
    
  
}

const sleep = async () => {
  console.log('ZZZ...');
  logger.log('ZZZ...');
  clearInterval(vars.tradeIntervalHandle);
  vars.isRunning = false;
}

const getIsRunning = () => vars.isRunning;

module.exports = { init, sleep, getIsRunning };