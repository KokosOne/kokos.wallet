const assets = require("./assets");
const cryptography = require("./cryptography");
const BigNumber = require("bignumber.js");
const ServerFn = require("./server/http.js");

const Wallet = {};

Wallet.createAccount = function(o,c,i){
  var mnemonic = o;
  if((typeof(o) === "undefined"
    || o === null)){
      mnemonic = cryptography.mnemonic();

  }
  if( typeof(c) == "undefined"
    || c == null){
      if(typeof(o) != "undefined"
        && typeof(o.chain) != "undefined"){
          c = o.chain;
        }else{
          c = 0;
        }
  }
  if(typeof(i) == "undefined"
    || i == null){
      if(typeof(o) != "undefined"
        && typeof(o.index) != "undefined"){
          i = o.index;
      }else{
          i = 0;
      }
  }

  return {privateKey: cryptography.masterPrivateKey(mnemonic),
          index: i,
          chain: c,
          passphrase: mnemonic};
}

Wallet.start = function(account, network, config){
    if(typeof(config) == "undefined"){
        config = {lsk: {networks: {mainnet: {chain: 0},
                                   testnet: {chain: 0}},
                        symbolCode: 134},
                  eth: {networks: {mainnet: {chain: 0},
                                   testnet: {chain: 3}},
                        symbolCode: 60},
                  btc: {networks: {mainnet: {chain: 0},
                                   testnet: {chain: 1}},
                        symbolCode: 0},
                  doge: {networks: {mainnet: {chain: 0},
                                    testnet: {chain: 1}},
                         symbolCode: 3}};

    }
    if(typeof(account) == "string"){
        account = Wallet.createAccount(account);
    }
    if(typeof(network) == "undefined"){
        network = "mainnet";
    }
    var walletNetwork = network;
    var seed = cryptography.seed(account.passphrase);
    var root = cryptography.root(account.passphrase);
    
    const accountIndex = account.index ? account.index : 0;
    
    const getAccount = function(){
        return account;
    }

    const assetnet = {};
  
    for(var a in assets){
        assetnet[a] = assets[a].define({symbol: a,
                                        network: walletNetwork});
    }
    
    const getAddress = function(assetSymbol,nth){
      var [index, offset] = cryptography.position(nth);
      var asset = assets[assetSymbol].define(config[assetSymbol]);
      const chainIndex = asset.networks[walletNetwork].chain;
      const node = cryptography.node(root,
                                     asset.symbolCode,
                                     chainIndex,
                                     index, offset
                                    );
      
      return Object.assign({},
                           cryptography.address(node,
                                                asset.publicKeyFromPrivateKey,
                                                asset.addressFromPublicKey,
                                                asset.toAddress,
                                                walletNetwork),
                           {symbol: assetSymbol,
                            network: walletNetwork,
                            position: nth,
                            nth: nth});
  }
    
    const getInterface = function(assetSymbol, network)
    {
        if(typeof(network) == "undefined"){
            network = walletNetwork;
        }
        var assetTool = assets[assetSymbol];
        return assetnet[assetSymbol].interact[network];
        
    }
    
    const getAddressBalance = function(address){
        return new Promise(function(resolve, reject){
            getInterface(address.symbol, address.network)
                .getAddressBalance(address.address)
                .then(function(b){
                    if(b.unconfirmed){
                        var balance = new BigNumber(b.balance);
                        var unconfirmed = new BigNumber(b.unconfirmed);
                        if(balance.isGreaterThan(unconfirmed)){
                            balance = unconfirmed;
                           
                        }
                        b.balance = balance.integerValue().toString();
                    }
                    var x = new BigNumber(b.balance);
                           var r = {};
                    r.total = x;
                    r.address = address;
                    r[address.address] = x.toString();
                    
                    resolve(r);
                }).catch(reject);
        })
    }
    
    const getPositionBalance = function(assetSymbol, nth){
        var address = getAddress(assetSymbol, nth);
        return getAddressBalance(address);
    }
    
    const getBlockBalance = function(assetSymbol, startFrom, countTo){
        return new Promise(function(resolve, reject){
            var balances = [];
            for(var i = startFrom; i < countTo; i++){
                balances.push(getPositionBalance(assetSymbol, i));
            }
            Promise.all(balances).
                then(function(results){
                    var total = results.reduce(function(acc, cur){
                        acc.total = acc.total.plus(cur.total);
                        
                        acc[cur.address.nth+":"+cur.address.address] = cur.total;
                        return acc;
                    }, {total: new BigNumber(0)});
                    resolve( total );
                })
                .catch(reject);
        });
    }
  const sendFromPosition = function(assetSymbol, nth,
                                    amount, toAddress,
                                    subtractFee, processingFee,
                                    changeAddress){
      var address = getAddress(assetSymbol, nth);
      var asset = assets[assetSymbol].define(config[assetSymbol]);
 
      return cryptography.send(address, {value: amount,
                                         to: toAddress},
                               asset.builder,
                               asset.transactionHasher,
                               asset.signWithPrivateKey,
                               asset.send,
                               subtractFee, processingFee,
                               changeAddress
                              );
  }
    
    
    const listAddresses = function(assetSymbol, startFrom, numberOf){
        
        if(typeof(numberOf) == "undefined"){
            numberOf = 10;
        }
        if(typeof(startFrom) == "undefined"){
            startFrom = 0;
            
        }
        var countTo = numberOf + startFrom;
        var addresses = [];
        for(var i = startFrom; i < countTo; i++){
            addresses.push(getAddress(assetSymbol, i));
        }
        return addresses;
    }
    
    const changeNetwork = function(nNetwork){
        walletNetwork = nNetwork;
    }
    const getNetwork = function(){
        return walletNetwork;
    }

    
   

    
    return {account: {get: getAccount},
            address: getAddress,
            listAddresses: listAddresses,
            switchNetwork: changeNetwork,
            getNetwork: getNetwork,
            positionBalance: getPositionBalance,
            addressBalance: getAddressBalance,
            blockBalance: getBlockBalance,
            sendFromPosition: sendFromPosition};
}

 var server = null;
const startHttpServer = function(port, options){
    var viewsPath = __dirname + "/../template/";
    var staticPath = __dirname + "/../static/";
    var routesPath = __dirname + "/./public/routes";
    var rootPath = __dirname + "/./..";
    if(typeof(options) != "undefined"
       && typeof(options.paths) != "undefined"
       && typeof(options.paths.views) != "undefined"){
        viewsPath = options.paths.views;
    }
    if(typeof(options) != "undefined"
       && typeof(options.paths) != "undefined"
       && typeof(options.paths.root) != "undefined"){
        rootPath = options.paths.root;
    }
    if(typeof(options) != "undefined"
       && typeof(options.paths) != "undefined"
       && typeof(options.paths.static) != "undefined"){
        staticPath = options.paths.static;
        }
    if(typeof(options) != "undefined"
       && typeof(options.paths) != "undefined"
       && typeof(options.paths.routes) != "undefined"){
        routesPath = options.paths.routes;
    }
    if(typeof(port) == "undefined"){
        port = 3000;
    }
    var afterServerStart = function(){
        console.log("afterServerStart");
    }
    if(typeof(options) != "undefined"
       && typeof(options.afterServerStart) != "undefined"){
        afterServerStart = options.afterServerStart;
    }
    server = ServerFn({path: {views: viewsPath,
                              static: staticPath},
                       start: true,
                       port: port,
                       routes: require(routesPath)(rootPath),
                       afterServerStart: afterServerStart});
    return server;
}

Wallet.startHttpServer = startHttpServer;


module.exports = Wallet;
