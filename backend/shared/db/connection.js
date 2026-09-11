const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';

const client = new MongoClient(MONGODB_URI, {
  serverSelectionTimeoutMS: 15000,
  connectTimeoutMS: 15000,
  maxPoolSize: 10
});

let db = null;
let dbConnecting = false;

function tryConnectDb() {
  if (dbConnecting) return;
  dbConnecting = true;
  client.connect()
    .then(function () {
      dbConnecting = false;
      db = client.db('hunar');
      console.log('MongoDB connected (' + new Date().toISOString() + ')');
    })
    .catch(function (err) {
      dbConnecting = false;
      db = null;
      console.error('MongoDB connection failed (' + new Date().toISOString() + '):', err.message.slice(0, 180));
      setTimeout(tryConnectDb, 10000);
    });
}

function isConnected() {
  return !!db;
}

function getCollection(name) {
  if (!db) return null;
  return db.collection(name);
}

module.exports = {
  tryConnectDb,
  isConnected,
  getCollection
};
