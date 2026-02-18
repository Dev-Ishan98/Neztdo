// src/utils/localStorageHelper.js
import { encrypt, decrypt } from "./encryptionHelper";

export function setLocalStorageData(key, data) {
  const encryptedData = encrypt(data);
  localStorage.setItem(key, encryptedData);
}

export function getLocalStorageData(key) {
  const storedData = localStorage.getItem(key);
  if (!storedData) return null;
  return decrypt(storedData);
}

export function removeLocalStorageData(key) {
  localStorage.removeItem(key);
}
