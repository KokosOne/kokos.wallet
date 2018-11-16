const request = require("./request.js");

const apiCommandsByAsset = {getAddressBalance: {eth: true,
                                                lsk: true,
                                                btc: true,
                                                doge: true},
                            getUnspentTx: {btc: true,
                                           doge: true},
                            getNextNonce: {eth: true},
                            getGasPrice: {eth: true},
                            getEstimateGas: {eth: true},
                            getEstimateFees: {eth: true,
                                             lsk: true,
                                             btc: true,
                                             doge: true},
                            pushTx: {eth :true,
                                     lsk: true,
                                     btc: true,
                                     doge: true}};

function define(configs){
    var base = "https://blockchain.api.kokos.one";
    var asset = "btc";
    var network = "mainnet";
    if(typeof(configs) != "undefined"){
        
        if(typeof(configs.asset) != "undefined"){
            asset = configs.asset;
        }
        if(typeof(configs.network) != "undefined"){
            network = configs.network;
        }
        if(typeof(configs.base) != "undefined"){
            base = configs.base;
        }
    }
    function buildUrl(url){
        return base + "/" + asset + "/" + network + url;
    }

    function acceptedApiCall(myName){
        
        return typeof(apiCommandsByAsset[myName]) != "undefined"
            && apiCommandsByAsset[myName][asset];

    }
    
    function getAddressBalance(address){
        return new Promise(function(resolve, reject){
            if(! acceptedApiCall("getAddressBalance")){
                return reject({error: "unsupported asset function."});
            }
            var url = buildUrl("/balance/"+address);
            request("GET", url, {}, null)
                .then(function(r){
                    resolve(r);
                }).catch(reject);
        });
    }
    function getUnspentTx(address){
        return new Promise(function(resolve, reject){
            if(! acceptedApiCall("getUnspentTx")){
                return reject({error: "unsupported asset function."});
            }
            var url = buildUrl("/unspenttx/"+address)
            request("GET",url, {}, null).then(resolve).catch(reject);
        });
    }
    function getNextNonce(address){
        return new Promise(function(resolve, reject){
            if(! acceptedApiCall("getNextNonce")){
                return reject({error: "unsupported asset function."});
            }
            var url = buildUrl("/nonce/"+address);
            request("GET", url, {}, null).then(resolve).catch(reject);
        });
    }
    function getGasPrice(){
        return new Promise(function(resolve, reject){
            if(! acceptedApiCall("getGasPrice")){
                return reject({error: "unsupported asset function."});
            }
            var url = buildUrl("/gasprice");
            request("GET", url, {}, null).then(resolve).catch(reject);
        });
    }
    function getEstimateGas(tx){
        return new Promise(function(resolve, reject){
            if(! acceptedApiCall("getEstimateGas")){
                return reject({error: "unsupported asset function."});
            }
            var url = buildUrl("/estimategas");
            request("POST",url, {tx: tx}, null, true).then(resolve).catch(reject);
        });
    }
    function estimateFees(tx){
        return new Promise(function(resolve, reject){
            if(! acceptedApiCall("getEstimateFees")){
                return reject({error: "unsupported asset function."});
            }
            var url = buildUrl("/estimatefee");
            request("POST", url, {tx: tx}, null, true).then(resolve).catch(reject);
        });
    }
    function pushTx(tx){
        return new Promise(function(resolve, reject){
            if(! acceptedApiCall("pushTx")){
                return reject({error: "unsupported asset function."});
            }
            var url = buildUrl("/pushtx");
            request("POST", url, {tx: tx}, null, true).then(function(r){
                if(typeof(r) == "string"){
                    resolve(r);
                }else if(r.id){
                    resolve(r.id);
                }else if(r.r){
                    resolve(r.r);
                }else if(r.receipt){
                    resolve(r.receipt.hash);
                }else if(! r.error){
                 
                    resolve(r);
                }else{
                    reject(r);
                }
            }).catch(reject);
        });
    }

    return {getAddressBalance: getAddressBalance,
            getUnspentTx: getUnspentTx,
            getNextNonce: getNextNonce,
            getGasPrice: getGasPrice,
            getEstimateGas: getEstimateGas,
            getEstimateFees: estimateFees,
            pushTx: pushTx}
}

module.exports = define;
