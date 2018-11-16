# Kokos.wallet

A multicoin hd wallet library.

Manage funds on multiple networks.
Uses `blockchain.api.kokos.one` as a single trusted gateway to multiple networks.

### provides
- One single master key for addresses on multiple blockchains. 
- functions to get address information
- construct and sign transactions
- push transactions to network.

Supported networks: BTC, ETH, LSK, DOGE

## How are addresses generated?
Kokos.wallet is using [BIP44]: https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki [specification]: https://github.com/satoshilabs/slips/blob/master/slip-0044.md for each supported coin.

[more on]: https://github.com/kokosone/kokos.wallet/blob/master/src/cryptography/index.js

## Use it as a library
See [wallet.js]: https://github.com/kokosone/kokos.wallet/blob/master/wallet.js

## Running http server

with forever

`forever start kokos.wallet/src/kokos.wallet.server.js`
This will start listening on port 3000 by default.

All accounts created with kokos.wallet.server are encrypted and stored to disk under ./kokos.wallet/account folder.
When the account is generated the api returns the account reference ID and a 12 word password to decrypt the master key of the account.



Available http API methods

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


Use config.j in main folder as an example for configuration needed for the wallet.
