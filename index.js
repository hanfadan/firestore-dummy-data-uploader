const admin = require("firebase-admin");
const serviceAccount = require("./config/serviceAccountKey.json");
const { id_ID, fakerID_ID: faker } = require("@faker-js/faker");

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

const db = admin.firestore();

const orderCollection = "orders";
const storeCollection = "stores";

async function generateStoreData (orderData) {
  const storeRef = db.collection(storeCollection).doc(orderData.payload.storeName);

  const storeSnapshot = await storeRef.get();

  let storeStatus;
  if (storeSnapshot.exists) {
    storeStatus = storeSnapshot.data();
    switch (orderData.payload.sapaStatus) {
      case 1101: storeStatus.new += 1; break;
      case 1102: storeStatus.packing += 1; break;
      case 1103: storeStatus.process += 1; break;
      case 1104: storeStatus.selesai += 1; break;
      case 1105: storeStatus.cancel += 1; break;
      default: break;
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

function generateStoreName () {
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

async function getExistingStoreNames () {
  const storeNames = [];
  const storesSnapshot = await db.collection(storeCollection).get();
  storesSnapshot.forEach(doc => {
    storeNames.push(doc.id);
  });
  return storeNames;
}

function createOrderData (storeNames) {
  const currentDate = new Date();
  const shipmentNumber = `S-${currentDate.getTime()}-${faker.string.alphanumeric(7)}`;
  const orderNumber = `O-${currentDate.getTime()}-${faker.string.alphanumeric(7)}`;

  // Memilih nama toko secara acak dari array storeNames
  const randomStoreName = storeNames[Math.floor(Math.random() * storeNames.length)];

  return {
    payload: {
      shipmentNumber: shipmentNumber,
      orderNumber: orderNumber,
      sapaStatus: faker.helpers.arrayElement([1101, 1102, 1103, 1104, 1105]),
      shipmentStatus: faker.string.numeric({ min: 10, max: 20 }),
      price: faker.commerce.price(),
      intendedReceiver: faker.person.firstName(),
      orderDate: faker.date.recent({ days: 10 }),
      estimatedDeliveryDate: faker.date.future({ years: 10 }),
      deliverySlotDesc: "14:00 - 16:00",
      deliveryTimeSlot: "14:00 - 16:00",
      isSendStore: "T",
      appId: faker.helpers.arrayElement([379, 402, 1500, 91, 95, 396, 415, 92, 330, 335]),
      app: faker.helpers.arrayElement(["ALFAGIFT", "GRABMART", "ALFAMIND", "ALFAMIKRO","GOMART"]),
      deliveryType: faker.helpers.arrayElement(["Dikirim","Diambil di toko"]),
      deliveryTypeId: faker.string.numeric({ min: 0, max: 5 }),
      deliveryMethod: faker.string.numeric({ min: 0, max: 2 }),
      timer: faker.string.numeric({ min: 8000, max: 10000 }),
      deliveryKecamatan: faker.location.city(),
      paymentName: faker.finance.transactionType(),
      paymentId: faker.string.numeric({ min: 20, max: 30 }),
      deliveryPhone: faker.phone.number(),
      deliveryDirection: `https://maps.google.com/maps?q=${faker.location.latitude()},${faker.location.longitude()}`,
      deliveryAddress: faker.location.streetAddress(true),
      totalQty: faker.string.numeric({ min: 1, max: 5 }),
      qrCode: {
        ShipmentNo: "",
        Head: [],
        Body: [],
        ExpiredAt: ""
      },
      nik: faker.string.alphanumeric(8),
      kurir: faker.person.fullName(),
      podImage: "",
      podImageDate: "",
      updatedDate: currentDate.toISOString(),
      receiverName: "-",
      receiverOther: "",
      receiverRelation: "-",
      receiverLat: parseFloat(faker.location.latitude()),
      receiverLong: parseFloat(faker.location.longitude()),
      OrderProducts: [
        {
          productName: faker.commerce.productName(),
          qty: faker.string.numeric({ min: 1, max: 5 }),
          qtyOriginal: faker.string.numeric({ min: 1, max: 5 }),
          qtyEdit: faker.string.numeric({ min: 1, max: 5 }),
          image: faker.image.url(),
          productID: faker.string.numeric(),
          barcodeID: "",
          tbtopID: faker.string.numeric(),
          tbtoID: faker.string.numeric(),
          tbtdID: faker.string.numeric(),
          sku: faker.string.alphanumeric(10),
          qtyBundle: 1,
          stockOrigin: 0,
          isStockBackup: 0,
          plu: faker.string.alphanumeric(4),
          attrQtyOos: 0,
          productType: faker.string.numeric({ min: 200, max: 220 }),
          totalQtqBundle: 0
        }
      ],
      receivedDate: currentDate.toLocaleDateString(),
      receivedTime: currentDate.toLocaleTimeString(),
      gomartPinStatus: 3,
      gomartPinMessage: "",
      reasonForCancel: "",
      canceledDate: "01 Jan 0001",
      canceledTime: "00:00",
      showQr: true,
      returRefundID: 0,
      returRefundStatus: 0,
      qrAndroid: false,
      billNo: "",
      pin: faker.person.firstName(),
      storeName: randomStoreName,
      roomId: "",
      unreadChatCount: 0,
      isChatEnabled: true,
      endDateChat: "",
      showChat: true,
      storeTier: 1,
      flagVipMember: "0",
      flagNewMember: false,
      isPosAndroid: "F",
      matStatus: 0,
      matNo: "",
      flexiTimeDesc: "14:00 - 16:00",
      isDeliveryFlexiTime: 1,
      storeStatus: "T",
      storeCompany: "SAT",
      ticket: {
        id: faker.string.numeric(),
        shipmentNo: shipmentNumber,
        orderNo: orderNumber,
        storeCode: randomStoreName,
        externalTicketId: faker.string.numeric(),
        externalUserId: faker.string.numeric({ min: 50000000000, max: 52000000000 }),
        description: "testing",
        status: "Open",
        priority: "Medium",
        problem: {
          id: 1,
          name: faker.finance.transactionDescription(),
          sequence: 1
        },
        staffName: faker.person.fullName(),
        createdDate: faker.date.recent({ days: 5 }),
        createdTimeSpan: "2 hari yang lalu",
        conversations: [],
        attachments: []
      }
    },
    code: 200,
    message: "Success"
  }
}

async function uploadOrders (n, storeNames) {
  // const storeNames = await getExistingStoreNames();
  for (let i = 0; i < n; i++) {
    const orderData = createOrderData(storeNames);

    const orderRef = db.collection(orderCollection).doc(orderData.payload.shipmentNumber);
    await orderRef.set(orderData);
    console.log(`Order ${orderData.payload.shipmentNumber} uploaded.`);

    await generateStoreData(orderData);
  }
  console.log(`Total of ${n} orders have been uploaded.`);
}

generateStores(10)
  .then(storeNames => {
    return uploadOrders(100, storeNames);
  })
  .catch(error => {
    console.error('Terjadi kesalahan:', error);
  });

