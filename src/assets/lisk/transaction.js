const ByteBuffer = require('bytebuffer');
const BigNumber = require("../../helper/bignumber.js");
const crypto = require("crypto");

function hashSeed(s){
  const hash = crypto.createHash('sha256');
    hash.update(s);
    var x = hash.digest();

    return x;
}

function getDataBytes(transaction){
  return transaction.asset && transaction.asset.data
			? Buffer.from(transaction.asset.data, 'utf8')
			: null;
}

function getBytes(transaction, skipSignature, skipSecondSignature){

  let byteBuffer;
  const assetBytes = getDataBytes(transaction);
  const assetSize = assetBytes ? assetBytes.length : 0;

	byteBuffer = new ByteBuffer(
			1 + 4 + 32 + 32 + 8 + 8 + 64 + 64 + assetSize,
			true
		);
		byteBuffer.writeByte(transaction.type);
		byteBuffer.writeInt(transaction.timestamp);
    const senderPublicKeyBuffer = Buffer.from(
				transaction.senderPublicKey,
				'hex'
			);
			for (let i = 0; i < senderPublicKeyBuffer.length; i++) {
				byteBuffer.writeByte(senderPublicKeyBuffer[i]);
			}

			if (transaction.requesterPublicKey) {
				const requesterPublicKey = Buffer.from(
					transaction.requesterPublicKey,
					'hex'
				);
				for (let i = 0; i < requesterPublicKey.length; i++) {
					byteBuffer.writeByte(requesterPublicKey[i]);
				}
			}

			if (transaction.recipientId) {
				let recipient = transaction.recipientId.slice(0, -1);
				recipient = (new BigNumber(recipient)).toBuffer({ size: 8 });

				for (let i = 0; i < 8; i++) {
					byteBuffer.writeByte(recipient[i] || 0);
				}
			} else {
				for (let i = 0; i < 8; i++) {
					byteBuffer.writeByte(0);
				}
			}

			byteBuffer.writeLong(transaction.amount);

			if (assetSize > 0) {
				for (let i = 0; i < assetSize; i++) {
					byteBuffer.writeByte(assetBytes[i]);
				}
			}

			if (!skipSignature && transaction.signature) {
				const signatureBuffer = Buffer.from(transaction.signature, 'hex');
				for (let i = 0; i < signatureBuffer.length; i++) {
					byteBuffer.writeByte(signatureBuffer[i]);
				}
			}

			if (!skipSecondSignature && transaction.signSignature) {
				const signSignatureBuffer = Buffer.from(
					transaction.signSignature,
					'hex'
				);
				for (let i = 0; i < signSignatureBuffer.length; i++) {
					byteBuffer.writeByte(signSignatureBuffer[i]);
				}
			}

			byteBuffer.flip();
      return byteBuffer.toBuffer();
}

function getHash(transaction){
  return hashSeed(getBytes(transaction));
}

function getId(transaction){
  const hash = getHash(transaction);
		const temp = Buffer.alloc(8);
		for (let i = 0; i < 8; i++) {
			temp[i] = hash[7 - i];
		}

		const id = (new BigNumber("0x"+temp.toString("hex"))).toString();
		return id;
}

module.exports = {getId: getId,
                  getHash: getHash,
                getBytes: getBytes,
              getDataBytes: getDataBytes}
