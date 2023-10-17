const admin = require("firebase-admin");
const serviceAccount = require("./config/serviceAccountKey.json");
const { id_ID, fakerID_ID: faker } = require("@faker-js/faker");

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

const db = admin.firestore();

const orderCollection = "orders";
const storeCollection = "stores";

async function updateStoreStatus(orderData) {
  const storeRef = db.collection(storeCollection).doc(orderData.payload.storeName);

  const storeSnapshot = await storeRef.get();

  let storeStatus;
  if (storeSnapshot.exists) {
    storeStatus = storeSnapshot.data();
    switch (orderData.payload.sapaStatus) {
      case 1101:
        storeStatus.new += 1;
        break;
      case 1102:
        storeStatus.packing += 1;
        break;
      case 1103:
        storeStatus.process += 1;
        break;
      case 1104:
        storeStatus.selesai += 1;
        break;
      case 1105:
        storeStatus.cancel += 1;
        break;
      default:
        break;
    }
  } else {
    storeStatus = {
      storeName: orderData.payload.storeName,
      new: orderData.payload.sapaStatus === 1101 ? 1 : 0,
      packing: orderData.payload.sapaStatus === 1102 ? 1 : 0,
      process: orderData.payload.sapaStatus === 1103 ? 1 : 0,
      selesai: orderData.payload.sapaStatus === 1104 ? 1 : 0,
      cancel: orderData.payload.sapaStatus === 1105 ? 1 : 0,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    };
  }

  await storeRef.set(storeStatus);
  console.log(`Store status for ${orderData.payload.storeName} uploaded/updated.`);
}

function generateStoreName() {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 4; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  result += "-" + faker.location.street();
  return result;
}

async function generateStores(n) {
  const storeNames = [];
  const stores = [];
  for (let i = 0; i < n; i++) {
    const storeName = generateStoreName();
    const storeData = {
      storeName: storeName,
      new: 0,
      packing: 0,
      process: 0,
      selesai: 0,
      cancel: 0,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    };
    stores.push(storeData);
    const storeRef = db.collection(storeCollection).doc(storeData.storeName);
    await storeRef.set(storeData);
    console.log(`Store ${storeName} uploaded.`);
    storeNames.push(storeName);
  }
  return storeNames;
}

async function getExistingStoreNames() {
  const storeNames = [];
  const storesSnapshot = await db.collection(storeCollection).get();
  storesSnapshot.forEach((doc) => {
    storeNames.push(doc.id);
  });
  return storeNames;
}

function createOrderData(storeNames) {
  const currentDate = new Date();
  const shipmentNumber = `S-${currentDate.getTime()}-${faker.string.alphanumeric(7)}`;
  const orderNumber = `O-${currentDate.getTime()}-${faker.string.alphanumeric(7)}`;
  const orderDate = faker.date.recent();
  const estimatedDeliveryDate = faker.date.future({ days: 10, refDate: orderDate });
    // Memilih nama toko secara acak dari array storeNames
    const randomStoreName = storeNames[Math.floor(Math.random() * storeNames.length)];
  return {
    payload: {
      shipmentNumber: shipmentNumber,
      price: faker.commerce.price(),
      intendedReceiver: faker.person.fullName(),
      orderDate: orderDate,
      estimatedDeliveryDate: estimatedDeliveryDate,
      deliverySlotDesc: faker.date.soon({ days: 1, refDate: estimatedDeliveryDate }),
      deliveryTimeSlot: "",
      isSendStore: faker.helpers.arrayElement(["T", "F"]),
      appId: faker.helpers.arrayElement([379, 402, 1500, 91, 95, 396, 415, 92, 330, 335]),
      app: faker.helpers.arrayElement(["ALFAGIFT", "GRABMART", "ALFAMIND", "ALFAMIKRO", "GOMART"]),
      deliveryType: faker.helpers.arrayElement(["Dikirim", "Diambil di toko"]),
      deliveryTypeId: faker.string.numeric({ min: 0, max: 5 }),
      deliveryMethod: faker.string.numeric({ min: 0, max: 2 }),
      timer: faker.string.numeric({ min: 3600, max: 86400 }),
      updateStoreStatusdeliveryKecamatan: faker.location.city(),
      paymentName: faker.finance.transactionType(),
      paymentId: faker.string.numeric({ min: 1, max: 30 }),
      shipmentStatus: faker.string.numeric({ min: 1, max: 40 }),
      sapaStatus: faker.helpers.arrayElement([1101, 1102, 1103, 1104, 1105]),
      orderNumber: orderNumber,
      receivedDate: "",
      receivedTime: "",
      orderDateGroup: "",
      deliveryKelurahan: faker.location.state(),
      returRefundID: 0,
      returRefundStatus: 0,
      flagVipMember: faker.helpers.arrayElement([0, 1]),
      flagNewMember: faker.helpers.arrayElement([true, false]),
      matStatus: 0,
      matNo: "",
      flexiTimeDesc: "",
      isDeliveryFlexiTime: faker.helpers.arrayElement([0, 1]),
      storeName: randomStoreName,
    },
    code: 200,
    message: "Success",
  };
}

async function uploadOrders(n, storeNames) {
  for (let i = 0; i < n; i++) {
    const orderData = createOrderData(storeNames);

    const orderRef = db.collection(orderCollection).doc(orderData.payload.shipmentNumber);
    await orderRef.set(orderData);
    console.log(`Order ${orderData.payload.shipmentNumber} uploaded.`);

    await updateStoreStatus(orderData);
  }
  console.log(`Total of ${n} orders have been uploaded.`);
}

async function main() {
  try {
    const storeNames = await generateStores(1);
    await uploadOrders(10, storeNames);
  } catch (error) {
    console.error("Terjadi kesalahan:", error);
  }
}

main();