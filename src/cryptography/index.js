const bip39 = require("bip39");
const nacl = require("tweetnacl");
const ed25519 = require('ed25519-hd-key');
const getPublicKey = ed25519.getPublicKey;
const derivePath = ed25519.derivePath;
const crypto = require("crypto");
//const hdkey = require("hdkey");
const LINIAR_DEPTH=100000000000000;
function mnemonic(){
  var x = bip39.generateMnemonic();
  return x;
}


function seed(aMnemonic){

  return bip39.mnemonicToSeed(aMnemonic);
}
function hashSeed(s){
  const hash = crypto.createHash('sha256');
    hash.update(s);
    var x = hash.digest();

    return x;
}

function createRootFromSeed(s){
  var hs = hashSeed(s);
   const kp = nacl.sign.keyPair.fromSeed(hs);


	return Object.assign({
		privateKey: kp.secretKey,
		publicKey: kp.publicKey,
            seed: hs,
            clearSeed: s
	}, kp);
}

function root(s, isMnemonic){
  if(typeof(isMnemonic) == "undefined"
  || isMnemonic == null || !isMnemonic){
      return createRootFromSeed(s);
  }else{
    return root(seed(s), true);
  }

}

function masterPrivateKey(aMnemonic){
  return root(seed(aMnemonic)).privateKey.toString('hex');
}

function pathToChain_0044(symbolCode, account, chain){
  if(typeof(chain) === "undefined"){
    chain = 0;
  }
  if(typeof(account) == "undefined"){
    account = 0;
  }

}

function pathToIndex_0044(symbolCode, account, chain, index){
  if(typeof(index) == "undefined"){
    index = 0;
  }
  return "m/44'/" + symbolCode + "'/" + account + "'/" + index+"'" ;
}

function pathToIndexOffset_0044(symbolCode, account, index, offset){
  if(typeof(offset) == "undefined"){
    offset = 0;
  }
  var x = pathToIndex_0044(symbolCode, account, index) + "/" + offset+"'";

  return x;
}



function nextPosition(index, offset, depth){
  if(typeof(depth) == "undefined"){
    depth = LINIAR_DEPTH;
  }
  if(offset > depth){
    index = index + 1;
    offset = 0;
  }
  return [index, offset];
}

function position(nth, depth){
  if(typeof(depth) == "undefined"){
    depth = LINIAR_DEPTH;
  }
  var index = Math.floor(nth / depth);
  var offset = nth % depth;



  return [index, offset];
}

function nextPath_0044(symbolCode, account, index, offset, depth){

  [index, offset] = nextPosition(index, offset, depth);
  return pathToIndexOffset_0044(symbolCode, account, index, offset, depth);

}

function identity(x){
  return x;
}

function address(node, privateToPublic, publicToAddress, outputTransform, network){
  if(typeof(outputTransform) == "undefined"){
    outputTransform =  identity;
  }

  const pubKey = privateToPublic(node.key, network);
  const addr = publicToAddress(pubKey, network).toString('hex');
  const address = outputTransform(addr, network);

  return {prvKey: node.key.toString("hex"),
          node: node,
          pubKey: pubKey.toString("hex"),
          address: address}
}

function node(root, symbolCode, account, index, offset){

    var path = pathToIndexOffset_0044(symbolCode, account, index, offset);

    var x = derivePath(path, root.seed);
    x.privateKey = x.key;
    x.publicKey = getPublicKey(x.privateKey);
    return x;

}

function nextNode(root, symbolCode, account, index, offset, depth){
  [index, offset] = nextPosition(index, offset, depth);
  return node(root, symbolCode, account, index, offset, depth);
}

function sign(address, transaction,
            builder, transactionHasher,
            signWithPrivateKey,
            subtractFee, processingFee,
            changeAddress){
  return new Promise(function(resolve, reject){
    builder(address, transaction,
      subtractFee, processingFee,
      changeAddress).then(function(tx){
        var hash = transactionHasher(tx);
        var signed = signWithPrivateKey(hash, address)
        .then(resolve).catch(reject);
    }).catch(reject);
  });


}
function send(address, transaction,
            builder, transactionHasher,
            signWithPrivateKey, sender,
            subtractFee, processingFee,
            changeAddress){

  return new Promise(function(resolve, reject){
    sign(address, transaction,
         builder, transactionHasher,
         signWithPrivateKey,
         subtractFee, processingFee,
         changeAddress).then(function(signed){
      sender(address, signed).then(resolve).catch(reject);
    }).catch(reject);
  });


}

module.exports = {mnemonic: mnemonic,
                  seed: seed,
                  root: root,
                  masterPrivateKey: masterPrivateKey,
                  path0044: pathToIndexOffset_0044,
                  nextPosition: nextPosition,
                  address: address,
                  node: node,
                  nextNode: nextNode,
                  position: position,
                  sign: sign,
                  send: send
              };
