const EventEmitter = require("events");
const db = require("./dataStore");
const logger = require('./logger');

let priceEmitter = new EventEmitter();

async function loadPairs (binance, setPairs) {
      return new Promise((resolve, reject) => {
      try {
        db.pairs.find({},  async (err, documents) => {
          if(err) {
            throw err;
          }
          let [levs, info] = await Promise.all([binance.futuresLeverageBracket(), binance.futuresExchangeInfo()]);
          let pairs = [];
          documents.forEach(document => {
            let pair = levs.find(e => e.symbol === document.symbol);
            if(pair) {
              let pairInfo = info.symbols.find(e => e.symbol == pair.symbol)
              pairs.push({
                symbol: pair.symbol, price: 0, 
                leverage: pair.brackets.find(e => e.bracket == 1).initialLeverage,
                pricePrecision: pairInfo.pricePrecision,
                quantityPrecision: pairInfo.quantityPrecision 
              });
            } 
          });
          console.log('LOADED PAIRS:', pairs);
          logger.log('LOADED PAIRS ' + pairs.reduce((p,c,i) => p + c.symbol + ', ', ''));
          setPairs(pairs);
          resolve();
        })
        } catch (err) {
          console.log(err)
          reject(err)
        }
      })
      
    
  }
  
  async function updatePairs (data, pairs, setPairs) {
    let savedPairs = [...pairs];
    savedPairs.forEach(pair => {
      let current = data.find(e => e.symbol == pair.symbol); 
      if(current) {
        // UPDATE THE PRICE OF EACH PAIR
        pair.price = Number(current.close);
        // if(pair.volume) pair.fiveMinsVol = Number(current.volume) + Number(pair.volume);
        // pair.volume = current.volume;
      }    
    });
    setPairs(savedPairs);
  }
  
  async function listenForPairChange (binance, getPairs, setPairs) {
    try {
      binance.futuresMiniTickerStream( miniTicker => {
        priceEmitter.emit('price', miniTicker);
        updatePairs(miniTicker, getPairs(), setPairs);
      });
    } catch (err) {
      console.log(err)
    }
  }
  
  function getNextPair (lastTradeSymbol, getPairs) {
    return new Promise((resolve, reject) => {
      try {
        db.pairs.find({inTrade: false}).sort({ symbol: -1 }).exec(async (err, eligiblePairs) => {
          if(err) {
            throw err;
          }

          if(lastTradeSymbol) {
            let lastTradeIndex = eligiblePairs.findIndex(e => e.symbol == lastTradeSymbol);
            let nextTradePair = eligiblePairs[lastTradeIndex + 1];
            if(!nextTradePair) nextTradePair = eligiblePairs[0];
            let savedEquivalent = getPairs().find(e => e.symbol == nextTradePair.symbol);
            nextTradePair.price = savedEquivalent.price;
            nextTradePair.leverage = savedEquivalent.leverage;
            nextTradePair.pricePrecision = savedEquivalent.pricePrecision;
            nextTradePair.quantityPrecision = savedEquivalent.quantityPrecision;
            resolve(nextTradePair);
          } else {
            let nextTradePair = eligiblePairs[0];
            let savedEquivalent = getPairs().find(e => e.symbol == nextTradePair.symbol);
            nextTradePair.price = savedEquivalent.price;
            nextTradePair.leverage = savedEquivalent.leverage;
            nextTradePair.pricePrecision = savedEquivalent.pricePrecision;
            nextTradePair.quantityPrecision = savedEquivalent.quantityPrecision;
            resolve(nextTradePair);
          }
        });
      } catch(err) {
        resolve(null);
      }
    });
  }

  module.exports = {
      loadPairs,
      listenForPairChange,
      getNextPair,
      priceEmitter
  };