const fs = require("fs");
//const config = require("../../config/config.json");
const iocane = require("iocane").createSession;
//TODO
//the path should be in configuration
const _ = require("lodash");
const pathToAccountStorage = __dirname+"/../../account";

function write(config, asset, accountData){
    return new Promise(function(resolve, reject){
        fs.writeFile(config.pathToAccountStorage+"/"+asset.symbol+"/"+accountData.address,
                     JSON.stringify(accountData),
                     function(){
                         resolve({message: "account saved",
                                  accountFile: config.pathToAccountStorage+"/"+asset.symbol+"/"+accountData.address})
                     });
    });
}

function writeAccount(config, refHash, accountPassword, accountInfo){
    return new Promise(function(resolve, reject){
        var data = JSON.stringify(accountInfo);
        iocane()
            .encrypt(data, accountPassword)
            .then(function(encryptedData){
                fs.writeFile(config.pathToAccountStorage+"/"+refHash,
                 encryptedData,
                 function(x, y){
                     resolve({message: "account saved",
                              accountFile: config.pathToAccountStorage+"/"+refHash});
                 });
            })
            .catch(reject);
    });
}

function readAccount(config, refHash, accountPassword){
    return new Promise(function(resolve, reject){
       
        fs.readFile(config.pathToAccountStorage+"/"+refHash,
                    function(err, accountEncryptedData){
                        
                        if(err){ return reject(err); }
                        try{
                            iocane()
                                .decrypt(accountEncryptedData
                                         .toString(),
                                         accountPassword)
                                .then(function(accountData){
                                    try{
                                        var k = JSON.parse(accountData);
                                    }catch(e){ return reject({error: "JSON Format"}); }
                                    resolve(k);
                                    
                                })
                                .catch(function(){
                                    reject({error: "error decrypting"});
                                });
                        }catch(e){
                            reject({error: "error!"});
                        }
                    });
    });
}


function read(config, accountObject){
    return new Promise(function(resolve, reject){
        fs.readFile(account.accountFile,
                    function(err, accountData){
                        if(err){
                            reject(err);
                            return;
                        }
                        var k = JSON.parse(accountData);
                        resolve(k);
                    });
    });
}

function define(config){
    return {
        writeAccount: _.partial(writeAccount, config),
        readAccount: _.partial(readAccount, config),
        write: _.partial(write, config),
        read: _.partial(read, config)};
}

module.exports = define;
