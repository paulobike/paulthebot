const EventEmitter = require("events");

let priceEmitter = new EventEmitter();

async function loadPairs (binance, setPairs) {
    try {
      let levs = await binance.futuresLeverageBracket();
      let pairs = [];
      levs.forEach(e => {
        if(e.brackets[0].initialLeverage >= 50) {
          pairs.push({symbol: e.symbol, price: '', volume: '', fiveMinsVol: 0, inTrade: false});
        }      
      });
      setPairs(pairs);
    } catch (err) {
      console.log(err)
    }
    
  }
  
  async function updatePairs (data, pairs, setPairs) {
    let savedPairs = [...pairs];
    savedPairs.forEach(pair => {
      let current = data.find(e => e.symbol == pair.symbol); 
      if(current) {
        pair.price = current.close;
        if(pair.volume) pair.fiveMinsVol = Number(current.volume) + Number(pair.volume);
        pair.volume = current.volume;
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
  
  function getHottestPair (pairsParams) {
    let eligiblePairs = pairsParams.filter(e => !e.inTrade && e.price > 0);
    let maxVol = Math.max.apply(null, eligiblePairs.map(o => o.fiveMinsVol))
    let hotestPair = eligiblePairs.find(e => e.fiveMinsVol == maxVol);
    return hotestPair;
  }

  module.exports = {
      loadPairs,
      listenForPairChange,
      getHottestPair,
      priceEmitter
  };