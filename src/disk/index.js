const fs = require("fs");
//const config = require("../../config/config.json");
const iocane = require("iocane").createSession;
//TODO
//the path should be in configuration

const pathToAccountStorage = __dirname+"/../../account";

function write(asset, accountData){
    return new Promise(function(resolve, reject){
        fs.writeFile(pathToAccountStorage+"/"+asset.symbol+"/"+accountData.address,
                     JSON.stringify(accountData),
                     function(){
                         resolve({message: "account saved",
                                  accountFile: pathToAccountStorage+"/"+asset.symbol+"/"+accountData.address})
                     });
    });
}

function writeAccount(refHash, accountPassword, accountInfo){
    return new Promise(function(resolve, reject){
        var data = JSON.stringify(accountInfo);
        iocane()
            .encrypt(data, accountPassword)
            .then(function(encryptedData){
                fs.writeFile(pathToAccountStorage+"/"+refHash,
                 encryptedData,
                 function(x, y){
                     resolve({message: "account saved",
                              accountFile: pathToAccountStorage+"/"+refHash});
                 });
            })
            .catch(reject);
    });
}

function readAccount(refHash, accountPassword){
    return new Promise(function(resolve, reject){
       
        fs.readFile(pathToAccountStorage+"/"+refHash,
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


function read(accountObject){
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

module.exports = {
    writeAccount: writeAccount,
    readAccount: readAccount,
    write: write,
                  read: read};
