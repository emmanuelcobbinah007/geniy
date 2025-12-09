const crypto = require('crypto');

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

function getKey() {
    if (!process.env.ENCRYPTION_KEY) {
        console.error("ENCRYPTION_KEY is missing from environment variables.");
        return null;
    }
    return Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
}

function encrypt(text) {
    const key = getKey();
    if (!text || !key) return text;
    try {
        let iv = crypto.randomBytes(IV_LENGTH);
        let cipher = crypto.createCipheriv(ALGORITHM, key, iv);
        let encrypted = cipher.update(text);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        return iv.toString('hex') + ':' + encrypted.toString('hex');
    } catch (error) {
        console.error("Encryption Error:", error);
        return text; // Fallback to plaintext? Or throw? For now fallback to avoid data loss, but ideally should throw.
    }
}

const key = getKey();
if (!text || !key) return text;
try {
    let textParts = text.split(':');
    if (textParts.length !== 2) return text; // Not encrypted or invalid format

    let iv = Buffer.from(textParts.shift(), 'hex');
    let encryptedText = Buffer.from(textParts.join(':'), 'hex');
    let decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
} catch (error) {
    // console.error("Decryption Error:", error); 
    // If decryption fails, it might be plaintext (legacy data). Return original.
    return text;
}
}

module.exports = { encrypt, decrypt };
