var Disk = require("./src/disk/index.js");


var account = process.argv[2];
var password = process.argv[3];
var network = process.argv[5];
var pathToStorage = process.argv[4];
var rootDir = __dirname;
var disk = Disk({pathToAccountStorage: pathToStorage});

disk.readAccount(account, password)
.then(function(w){
        console.log("Account master passphrase is: "+w.passphrase);
}).catch(console.log);
