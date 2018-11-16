const BigNumber = require("bignumber.js");
var bitcoin = require('bitcoinjs-lib');
var coininfo = require('coininfo');
const interaction = require("../../transport/blockchainapi.js");
var bitcoin = require('bitcoinjs-lib');

function define(options){
    var symbol = "doge";
    if(typeof(options) != "undefined" &&
       typeof(options.symbol) != "undefined"){
        symbol = options.symbol;
    }
    var symbolCode = "3";
    if(typeof(options) != "undefined" &&
       typeof(options.symbolCode) != "undefined"){
        symbolCode = options.symbolCode;
    }
    var networks = {mainnet: {chain: 0},
                    testnet: {chain: 1}};
    if(typeof(options) != "undefined" &&
       typeof(options.networks) != "undefined"){
        networks = options.networks;
    }
    var depth = 100000000000;
    if(typeof(options) != "undefined" &&
       typeof(options.depth) != "undefined"){
        depth = options.depth;
    }
    //var net = interaction(networks);
    var interact = {mainnet: interaction({asset: symbol,
                                          network: "mainnet"}),
                    testnet: interaction({asset: symbol,
                                          network: "testnet"})};
    var bitcoin_network = {};
    bitcoin_network.testnet = coininfo.dogecoin.test;
    bitcoin_network.testnet.versions = Object.assign(
        {bip32: {public: 0x0432a9a8,
                 private: 0x0432a243}},
        bitcoin_network.testnet.versions
    );
    bitcoin_network.mainnet = coininfo.dogecoin.main;
    var bn = {};
    bn.testnet = Object.assign(bitcoin_network.testnet,
                               {messagePrefix: '\x18Dogecoin Signed Message:\n'});
    bn.mainnet = Object.assign(bitcoin_network.mainnet,
                               {messagePrefix: '\x18Dogecoin Signed Message:\n'});
  
	var bnjs = {testnet: bn.testnet.toBitcoinJS(),
                mainnet: bn.mainnet.toBitcoinJS()};
    
    function getNetworkConf(network){
        return bnjs[network];
    }
    function getKeyPair(privateKey, network){
        return bitcoin.ECPair.fromPrivateKey(privateKey, getNetworkConf(network));
    }
    function publicKeyFromPrivateKey(privateKey, network){
        var pair = getKeyPair(privateKey, network);
        return pair.publicKey;
    }
    function addressFromPublicKey(publicKey, network){
        
        var x = bitcoin.payments.p2pkh({ pubkey: publicKey,
                                         network: getNetworkConf(network) })
        return x.address;
    }
    function toAddress(x){
        return x;
    }
    
    function transactionHasher(x){
        return x;
    }
    
    function buildTx(from, info,
                     subtractFee, processingFee,
                     changeAddress){
        
        return new Promise(function(resolve, reject){
            if(typeof(changeAddress) == "undefined"){
                return reject({error: "change address is required"});
            }
            interact[from.network].getUnspentTx(from.address)
                .then(function(txs){
                    var useTxs = [];
                    var amountFilled = new BigNumber(0);
                    var filled = false;
                    var idx = 0;
                    var amountLeftToFill = new BigNumber(info.value);
                    var txIns = [];
                    var txOuts = [];
                    while(!filled && idx < txs.length){
                        var lookAtTx = txs[idx];
                        var inputMax = new BigNumber(lookAtTx.value);
                        if(amountLeftToFill.minus(inputMax).isLessThanOrEqualTo(0)){
                            amountFilled = amountFilled.plus(amountLeftToFill);
                            var changeAmount = (new BigNumber(inputMax)).minus(amountLeftToFill);
                            amountLeftToFill = amountLeftToFill.minus(amountLeftToFill);
                            txIns.push([lookAtTx.txid,
                                        lookAtTx.vout,
                                        changeAmount.integerValue().toString()]);
                        }else{
                            amountLeftToFill = amountLeftToFill.minus(inputMax);
                            amountFilled = amountFilled.plus(inputMax);
                            txIns.push([lookAtTx.txid,
                                        lookAtTx.vout,
                                        0]);
                        }
                        if(amountFilled.isGreaterThanOrEqualTo(info.value)){
                            filled = true;
                        }
                        idx++;
                    }
                    if(amountLeftToFill.isGreaterThan(0)){
                        return reject({error: "not enough balance available."});
                    }
                    var totalChange = txIns.reduce(function(r,x){
                        var [txid, o, change] = x;
                        return r.plus(change);
                    },new BigNumber(0));
                    interact[from.network].getEstimateFees({ins: txIns, outs: [1, 2, 3]})
                        .then(function(fees){
                            var neededFee =   fees.fee;
                          
                            totalChange = totalChange.minus(neededFee);
                            var amount = new BigNumber(info.value);
                            if(subtractFee){
                                amount = amount.minus(neededFee).minus(processingFee);
                                totalChange = totalChange.plus(neededFee).plus(processingFee);
                            }
                            if(amount.isLessThanOrEqualTo(0)){
                                return reject({error: "fees are greater than amount"});
                            }else{
                                txOuts.push([info.to, amount.integerValue().toString()]);
                            }
                            if(totalChange.isLessThanOrEqualTo(0)){
                                
                            }else{
                                txOuts.push([changeAddress, totalChange.integerValue().toString()]);
                            }
                            var n = getNetworkConf(from.network);
                          
                   
                            var tx = new bitcoin.TransactionBuilder(n);
              		    tx.setVersion(1);
			    for(var i in txIns){
                                let input = txIns[i];
                              
                                tx.addInput(input[0], parseInt(input[1]));
                              
                            }
                            for(var i in txOuts){
                                let output = txOuts[i];
                              
                                const SATOSHI_MAX = 21 * 1e14;
                              
                                tx.addOutput(output[0], parseInt(output[1]));
                              
                            }
                            resolve(tx);
                        }).catch(function(e){
                       
                            reject(e);
                        });
                    
                }).catch(reject);
        });
    }
    
    function signWithPrivateKey(tx, from){
        return new Promise(function(resolve, reject){
            
            var kp = getKeyPair(from.node.privateKey, from.network);
            kp.network = getNetworkConf(from.network);
            for(var i = 0; i < tx.__tx.ins.length; i++){
                tx.sign(i, kp);
            }
            var txhash = tx.build().toHex();
            resolve(txhash);
        });
    }
    function sender(from, tx){
        return new Promise(function(resolve, reject){
         
            interact[from.network].pushTx(tx).then(resolve).catch(reject);
            
        });
    }
    
    return {publicKeyFromPrivateKey: publicKeyFromPrivateKey,
            toAddress: toAddress,
            addressFromPublicKey: addressFromPublicKey,
            builder: buildTx,
            transactionHasher: transactionHasher,
            signWithPrivateKey: signWithPrivateKey,
            send: sender,
            symbolCode: symbolCode,
            interact: interact,
            networks: networks,
            depth: depth};
    
}

module.exports = {define: define,
                  interaction: interaction};
