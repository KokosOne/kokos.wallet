const ethUtil = require("ethereumjs-util");
const interaction = require("../../transport/blockchainapi.js");
const ethereumjsTx = require("ethereumjs-tx");
const BigNumber = require("bignumber.js");
const _ = require("lodash");
var addresses = {};
function generateNonceOffset(){
    return function(address, dec, reset){
        if(reset){
            addresses = {};
            console.log("nonce offset resetted for all addresses");
            return;
        }
             if(typeof(addresses[address]) == "undefined"){
                 addresses[address] = -1;
             }
	   console.log(addresses);
        if(dec){
            
            addresses[address] = addresses[address] - 1;
            console.log("decreasing nonce offset", address,addresses[address]);
        }else{
            
            addresses[address] = addresses[address] + 1;
            console.log("increasing nonce offset", address, addresses[address]);
        }
        if(addresses[address] < -1){
            addresses[address] = -1;
        }
        addresses = _.clone(addresses);
        return addresses[address];
    }
}
function define(options){
    var symbol = "eth";
    if(typeof(options) != "undefined" &&
       typeof(options.symbol) != "undefined"){
        symbol = options.symbol;
    }
    var symbolCode = "60";
    if(typeof(options) != "undefined" &&
       typeof(options.symbolCode) != "undefined"){
        symbolCode = options.symbolCode;
    }
    var networks = {mainnet: {chain: 0},
                    testnet: {chain: 3}};
    if(typeof(options) != "undefined" &&
       typeof(options.networks) != "undefined"){
        networks = options.networks;
    }
    var depth = 8;
    if(typeof(options) != "undefined" &&
       typeof(options.depth) != "undefined"){
        depth = options.depth;
    }
    var noncer = {mainnet: generateNonceOffset(),
                  testnet: generateNonceOffset()};
    //  var net = interaction(networks);
    var interact = {mainnet: interaction({asset: symbol, network: "mainnet"}),
                    testnet: interaction({asset: symbol, network: "testnet"})};
    function buildEthTransaction(from, info, subtractFee, processingFee){
        return new Promise(function(resolve, reject){
            
            var txData = {};
            txData.to = info.to;
            txData.value = info.value;
            
            var gasPriceP = interact[from.network].getGasPrice();
            var gasP = interact[from.network].getEstimateGas(txData);
            var codeP = "0x"; //net.getCode(txData.to, from.network);
            Promise.all([gasPriceP, codeP, gasP])
                .then(function(results){
              	console.log("subtracting fees 4? ", subtractFee); 
                    var [gasPrice, code, gas] = results;
                    gasPrice = new BigNumber(gasPrice.gasprice);
                    gasPrice = gasPrice.multipliedBy(1.5);
                    gas = new BigNumber(gas.gas);
                    var estimatedFees = gasPrice.multipliedBy(gas);
                    txData.gasPrice = parseInt(gasPrice.integerValue().toString());
                    txData.gasLimit = parseInt(gas.integerValue().toString());
                    var amount = new BigNumber(info.value);
                    if(subtractFee){
                        amount = amount.minus(estimatedFees);
                        if(processingFee){
                            amount = amount.minus(processingFee);
                        }
                    }
                    if(amount.isLessThanOrEqualTo(0)){
                        return reject({error: "amount can't be negative."});
                    }

                    
                    txData.value = parseInt(amount.integerValue().toString());
                    
                    txData.data = "0x0";
                  
                    interact[from.network].getNextNonce(from.address)
                        .then(function(r){
                            var nonce = r.nonce;
                            txData.nonce = parseInt(nonce) + noncer[from.network](from.address, false);
                            resolve(txData);
                        }).catch(reject);
                    
                })
                .catch(reject);
            
        });
        
    }
  function transactionHasher(tx){
    return tx;
  }
  function signer(data, from){
    return new Promise(function(resolve, reject){
        var tx = new ethereumjsTx(null, networks[from.network].chain);
        tx.to = data.to;
        tx.nonce = data.nonce;
        tx.gasPrice = parseInt(data.gasPrice);
        tx.gasLimit = parseInt(data.gasLimit);
        tx.value = parseInt(data.value);
        tx.data = "";

        tx.sign(ethUtil.toBuffer("0x"+from.prvKey));
        resolve(tx);
    });
  }
  function sender(from, tx){
    return new Promise(function(resolve, reject){
      var hash = "0x"+tx.serialize().toString("hex");

        interact[from.network].pushTx(hash)
            .then(function(response){
                setTimeout(_.partial(
                    noncer[from.network],from.address, true),5000);
                resolve(response);
            }).
            catch(function(){
                noncer[from.network](from.address, true);
                console.log("error sending", from, tx,  arguments);
                resolve({err: "possible",
                         info: arguments});
            });
    });
}
  return {publicKeyFromPrivateKey: ethUtil.privateToPublic,
           addressFromPublicKey: ethUtil.publicToAddress,
           toAddress: ethUtil.toChecksumAddress,
           builder: buildEthTransaction,
           transactionHasher: transactionHasher,
           signWithPrivateKey: signer,
          send: sender,
          interact: interact,
           symbolCode: symbolCode,
           networks: networks,
           depth: depth}
}
module.exports = {define: define,
                  interaction: interaction};
