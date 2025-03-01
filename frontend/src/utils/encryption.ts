import CryptoJS from 'crypto-js';

export const generateEncryptionKey = (): string => {
  return CryptoJS.lib.WordArray.random(32).toString();
};

export const encryptData = (data: string, key: string): string => {
  return CryptoJS.AES.encrypt(data, key).toString();
};

export const decryptData = (encryptedData: string, key: string): string => {
  const bytes = CryptoJS.AES.decrypt(encryptedData, key);
  return bytes.toString(CryptoJS.enc.Utf8);
};
