const randomWords = require("random-words");
const cliProgress = require("cli-progress");
const admin = require("firebase-admin");
const serviceAccount = require("./config/serviceAccountKey.json");

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

const db = admin.firestore();

const collection = "posts"; // Nama koleksi Anda
const ndocs = 10; // Jumlah dokumen dummy

console.log("Mengunggah data dummy...");

const bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
bar.start(ndocs, 0);

for (let i = 0; i < ndocs; i++) {
  const storeName = generateRandomStoreName();
  const docRef = db.collection(collection).doc(storeName);
  const obj = {
    now: getRandomNumber(1, 50),
    new: getRandomNumber(1, 50),
    packing: getRandomNumber(1, 50),
    process: getRandomNumber(1, 50),
    selesai: getRandomNumber(1, 50),
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  };
  docRef.set(obj);

  bar.update(1);
}
bar.stop();
console.log("Pengunggahan selesai!");

function generateRandomStoreName() {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 4; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}
