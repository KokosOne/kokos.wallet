# Wallet
## a multi currency hd wallet library
A multicoin hd wallet library.

npm install --save @kokosapiens/wallet

Manage funds on multiple networks.
Uses `blockchain.api.kokos.one` as a single trusted gateway to multiple networks. Requests limited to 5 per second per IP.

### provides
- One single master key for addresses on multiple blockchains. 
- functions to get address information
- construct and sign transactions
- push transactions to network.

Supported networks: BTC, ETH, LSK, DOGE

## How are addresses generated?
Kokos.wallet is using [BIP44]: https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki [specification]: https://github.com/satoshilabs/slips/blob/master/slip-0044.md for each supported coin.

[more on]: https://github.com/kokosone/wallet/blob/master/src/cryptography/index.js

## Use it as a library
See [wallet.js]: https://github.com/kokosone/wallet/blob/master/wallet.js

npm i --save @kokosapiens/wallet

```javascript
var Wallet = require("@kokosapiens/wallet");

Wallet.startHttpServer(3123);

var account = Wallet.createAccount(null, 0, 0);
console.log("account created");
console.log(account.passphrase);

var wallet = Wallet.start(account, "mainnet");

console.log("Addresses on position 0 for supported assets");
console.log("btc",wallet.address("btc",0).address);
console.log("doge ",wallet.address("doge",0).address);
console.log("eth ",wallet.address("eth",0).address);
console.log("lsk ",wallet.address("lsk",0).address);

/* btc balance of address on position 0 */
wallet.positionBalance("btc",0).then(console.log).catch(console.log);
        
```
------

```
wallet.address(asset,position);

wallet.listAddress(asset, fromPosition, toPosition);

wallet.positionBalance(asset, position) // returns a Promise

wallet.sendFromPosition(asset, position, amount, toAddress, subtractFee, processingFee, changeAddress); // returns a promise

```


## Running http server


var Wallet = require("@kokosapiens/wallet");

Wallet.startHttpServer(3123);
This will start listening on port 3123 ( port 3000 is used as default).

All accounts created with kokos.wallet.server are encrypted and stored to disk under ./kokos.wallet/account folder.
When the account is generated the api returns the account reference ID and a 12 word password to decrypt the master key of the account.



Available http API methods
```
GET /api/generate
responds with an accountHash reference string and a 12 words password.

POST /:accountHash/address/:network/:asset/:position
     request body {password: "account password from /api/generate"}

POST /:accountHash/balance/:network/:asset/:position
     request body {password: "account password from /api/generate"}

POST /:accountHash/send/:network/:asset/:position
     request body {password: "account password from /api/generate",
                  amount: "float.amount",
                  to: "address where to send funds",
                  subtractfee: "0"}
subtractfee: 0 - it will send the amount specified in `amount`
subtractfee: 1 - it will subtract network transfer fees from the given `amount`
```
# LICENSE

This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with this program. If not, see http://www.gnu.org/licenses/.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
