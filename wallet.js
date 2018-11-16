const Wallet = require("./src/index.js");
const BigNumber = require("bignumber.js");
var account = Wallet.createAccount("apology museum lens use plate tennis analyst label error they height jar",0, 0);
var wallet = Wallet.start(account,"testnet"); // switch to "mainnet" if you want to use read coins

console.log(wallet.getNetwork());
/* address on position 0 of derived keys for specific coin */

console.log("btc",wallet.address("btc",0).address); 
console.log("doge ",wallet.address("doge",0).address);
console.log("eth ",wallet.address("eth",0).address);
console.log("lsk ",wallet.address("lsk",0).address);

function randInt(n){
  return Math.floor(Math.random()*n);
}

var touched = [];

function distributeHighestInBlock(asset, length){
    wallet.blockBalance(asset, 0, length).then(function(b){
        var x = {};
        var max = new BigNumber(0);
        var maxA = "";
        for(var i in b){
            if(max.isLessThanOrEqualTo(b[i]) && i != "total"){
                maxA = i;
                max = b[i];
            }
            x[i] = b[i].toString();
        }
        if(maxA == ""){
            return;
        }
        var sendToPosition = randInt(length);
        var changePosition = parseInt(maxA.split(":")[0]);
        try{
            var sendTo = wallet.address(asset, sendToPosition);
            var changeTo = wallet.address(asset, changePosition);
            var value = Math.floor(parseInt(max.toString()) / 2);
            if(touched.indexOf(changeTo.address) == -1){
		touched.push(changeTo.address);
                wallet.sendFromPosition(asset,
                                        changePosition,
                                        value,
                                        sendTo.address,
                                        true,
                                        0.0,
                                        changeTo.address)
                    .then(function(tx){
                        /*A transaction has been signed offline and pushed to the network through 
                          blockchain.api.kokos.one*/
                        console.log(asset+" TX: ",JSON.stringify(tx));
                    })
		
                    .catch(function(e){
                        console.log(asset,"error",JSON.stringify(e));
                    });
	    }
	    if(touched.length > 50){
		touched.splice(0,4);
	    }
        }catch(e){
            console.log(asset, JSON.stringify(e));
        }
        
    }).catch(console.log);
}

function get100BlockBalance(){
    distributeHighestInBlock("btc",100);
    distributeHighestInBlock("doge",100)
    distributeHighestInBlock("lsk",100);
    distributeHighestInBlock("eth",100);
    setTimeout(get100BlockBalance,5000);
    
}

get100BlockBalance();
