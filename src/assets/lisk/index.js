const { derivePath, getMasterKeyFromSeed, getPublicKey } = require('ed25519-hd-key');
const lisk = require("lisk-elements");
const liskTx = require("./transaction.js");
const bip39 = require("bip39");
const interaction = require("../../transport/blockchainapi.js");
const BigNumber = require("bignumber.js");
function define(options){
    var symbol = "lsk";
    if(typeof(options) != "undefined" &&
       typeof(options.symbol) != "undefined"){
        symbol = options.symbol;
    }
    var symbolCode = "134";
    if(typeof(options) != "undefined" &&
       typeof(options.symbolCode) != "undefined"){
        symbolCode = options.symbolCode;
    }
    var networks = {mainnet: {chain: 0},
                    testnet: {chain: 0}};
    if(typeof(options) != "undefined" &&
       typeof(options.networks) != "undefined"){
        networks = options.networks;
    }
    var depth = 8;
    if(typeof(options) != "undefined" &&
       typeof(options.depth) != "undefined"){
        depth = options.depth;
    }


    var interact = { mainnet: interaction({asset: symbol, network: "mainnet"}),
                     testnet: interaction({asset: symbol, network: "testnet"})};
    function buildLiskTransaction(from, info, subtractFee, processingFee){
        return new Promise(function(resolve, reject){


            interact[from.network].getEstimateFees({})
                .then(function(fees){
                  var txData = {timestamp: lisk.transaction.utils.getTimeWithOffset(0),
                                type: 0,
                                senderPublicKey: getPublicKey(from.node.privateKey, false).toString("hex"),
                                amount: info.value + "",
                                recipientId: info.to,
                                asset: {},
                                fee: lisk.transaction.constants.TRANSFER_FEE + ""};;
                    var amount = new BigNumber(info.value);
                    if(subtractFee){
                        amount = amount.minus(fees.fee);
                        if(processingFee){
                            amount = amount.minus(processingFee);
                        }
                    }

                    if(amount.isLessThanOrEqualTo(0)){
                        return reject({error: "amount sent can't be negative."});
                    }

                    txData.fee = (new BigNumber(fees.fee)).integerValue().toString();
                    txData.amount = amount.integerValue().toString();

                    resolve(txData);
                }).catch(reject);

        });

    }
    function transactionHasher(x){
        return x;
    }

    function signWithPrivateKey(data, from){
        //lisk.cryptography.signDataWithPrivateKey
        return new Promise(function(resolve, reject){
            var unsigned = Object.assign({},data);
            var hash = liskTx.getHash(unsigned);
            var pk =  Buffer.concat([from.node.privateKey,
                                     getPublicKey(from.node.privateKey,false)
                                    ]);
            var signature1 = lisk.cryptography.signDataWithPrivateKey(hash,
                                                                      pk);

            var signedData = Object.assign({}, unsigned,
                                           {signature: signature1});
            var signedWithId = Object.assign({}, signedData,
                                             {id: liskTx.getId(signedData)});
            var fullySigned = Object.assign({}, signedWithId, {});
            if(lisk.cryptography.verifyData(hash, signature1, getPublicKey(from.node.privateKey, false).toString("hex"))){
                resolve(fullySigned);
            }else{
                console.log("WRONG SIGNATURE");
                reject({error: "wrong signature"});
            }
        });
    }
    function sender(from, signedTx){
        signedTx.timestamp = parseInt(signedTx.timestamp);
        signedTx.type = parseInt(signedTx.type);
        return interact[from.network].pushTx(signedTx);
    }
    return {
        publicKeyFromPrivateKey: function(x){
            return getPublicKey(x, false);
        },
        addressFromPublicKey: lisk.cryptography.getAddressFromPublicKey,
        toAddress: function(x){ return x; },
        builder: buildLiskTransaction,
        transactionHasher: transactionHasher,
        signWithPrivateKey: signWithPrivateKey,
        send: sender,
        symbolCode: symbolCode,
        networks: networks,
        depth: depth,
        interact: interact};
}
module.exports = {define: define,
                  interaction: interaction};
