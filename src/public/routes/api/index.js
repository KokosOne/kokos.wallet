var express = require("express");
var Wallet = require("../../../index.js");
var crypto = require('crypto');
var Disk = require("../../../disk/index.js");
var BigNumber = require("bignumber.js");
function define(rootDir){

    var router = express.Router();

    var memory = {};

    var assetsDecs = {eth: 1e18,
                      lsk: 1e8,
                      doge: 1e8,
                      btc: 1e8};
    var disk = Disk({pathToAccountStorage: rootDir+"/account"});
    function numberToOut(asset, n){
        var x = new BigNumber(n);
        x = x.dividedBy(assetsDecs[asset]);
        return x.toFixed(8).toString();
    }
    function numberToIn(asset, n){
        var x = new BigNumber(n);
        x = x.multipliedBy(assetsDecs[asset]);
        return x.integerValue().toString();
    }

    function hash256(x){
        return crypto.createHash('sha256').update(x).digest('hex');
    }
    
    function getWallet(accountHash, accountPassword, network){
        return new Promise(function(resolve, reject){
            if(typeof(memory[accountHash]) == "undefined" ||
               typeof(memory[accountHash][network]) == "undefined"
              ){
                disk.readAccount(accountHash, accountPassword)
                    .then(function(account){
                        var theWallet = Wallet.start(account, network);
                        if(typeof(memory[accountHash]) == "undefined"){
                            memory[accountHash] = {};
                        }
                        var accountX = Wallet.createAccount(account.passphrase, 0, 0);
                        
                        memory[accountHash][network] = Wallet.start(accountX, network);
                        memory[accountHash].password = hash256(accountPassword);
                        resolve(memory[accountHash][network]);
                    }).catch(function(){
                        
                        
                        reject({error: "account not found"});

                    });
            }else{
                var hp = hash256(accountPassword);
                if(memory[accountHash].password == hp){
                    resolve(memory[accountHash][network]);
                }else{
                    reject({error: "account not found!"});
                }
            }
        });
    }
    
    router.get("/generate", function(request, response, next){
        
        
        var account = Wallet.createAccount(null, 0, 0);
        var accountPassword =   Wallet.createAccount(null, 1, 1).passphrase;//request.body.password;
        var passphrase = account.passphrase;
        var hash = hash256(passphrase);
        disk.writeAccount(hash, accountPassword, account).then(function(){
            response.json({account: hash,
                           password: accountPassword});
        }).catch(function(e){
            console.log(e);
            response.json({error: "Error in generating account"});
        });
    });

    router.post("/:hash/address/:network/:asset/:position",
               function(request, response, next){
                   var accountHash = request.params.hash;
                   var network = request.params.network;
                   var asset = request.params.asset;
                   var position = parseInt(request.params.position);
                   var accountPassword = request.body.password;
                   getWallet(accountHash, accountPassword, network)
                       .then(function(wallet){
                           var address = wallet.address(asset, position).address;
                           response.json({address: address,
                                          account: accountHash,
                                          network: network,
                                          position: position});
                       })
                       .catch(function(e){
                           response.json(e);
                       })
               });

    router.post("/:hash/balance/:network/:asset/:position",
               function(request, response, next){
                   var accountHash = request.params.hash;
                   var network = request.params.network;
                   var asset = request.params.asset;
                   var position = parseInt(request.params.position);
                   var accountPassword = request.body.password;

                   
                   getWallet(accountHash, accountPassword, network)
                       .then(function(wallet){
                           var address = wallet.address(asset, position);
                           wallet.positionBalance(asset, position)
                               .then(function(balance){

                                   response.json({balance: numberToOut(asset, balance.total),
                                                  timestamp: (new Date()).getTime(),
                                                  address: address.address,
                                                  position: position,
                                                  asset: asset,
                                                  account: accountHash,
                                                  network: network});
                                   
                               })
                               .catch(function(e){
                                   response.json({error: e});
                               });
                       })
                       .catch(function(e){
                           response.json({error: e});
                       });
               });

    router.post("/:hash/send/:network/:asset/:position",
                function(request, response, next){
                    var accountHash = request.params.hash;
                    var network = request.params.network;
                    var asset = request.params.asset;
                    var position = (request.params.position);
                    var amount = request.body.amount;
                    var toAddress = request.body.to;
                    var accountPassword = request.body.password;
                    var subtractFee = true;
                    if(typeof(request.body.subtractfee) != "undefined"
                       && request.body.subtractfee != null){
                    	subtractFee = parseInt(request.body.subtractfee) == 0 ? false : true;
			    console.log("subtracting fee? "+subtractFee);
                    }
                    var otherFee = 0.0;
                    if(typeof(request.body.extrafee) != "undefined"
                       && request.body.extrafee != null){
                        otherFee = parseFloat(request.body.extrafee);
                    }
                    getWallet(accountHash, accountPassword, network)
                        .then(function(wallet){
                            var fromAddress = wallet.address(asset, position);
                            wallet.sendFromPosition(asset, position,
                                                    numberToIn(asset, amount),
                                                    toAddress,
                                                    subtractFee, 0.0,
                                                    fromAddress.address)
                                .then(function(r){
                                    if(typeof(r.error) != "undefined"){
                                        return response.json(r);
                                    }else{
                                        return response.json({hash: r,
                                                              account: accountHash,
                                                              network: network,
                                                              asset: asset,
                                                              position: position,
                                                              fromAddress: fromAddress.address,
                                                              toAddress: toAddress,
                                                              amount: amount,
                                                              subtractFee: subtractFee,
                                                              otherFee: otherFee});
                                    }
                                })
                                .catch(function(e){
					console.log(e);
					response.json({error: "unable to send."})
                                });
                        })
                        .catch(function(e){
				console.log(e);
                            response.json({error: e});
                        });
                });
    
    return router;
}

module.exports = define;

