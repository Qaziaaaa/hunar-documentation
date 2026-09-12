const { getCollection, isConnected } = require('../../shared/db/connection');

async function getJobs() {
  const jobsCol = getCollection('jobs');
  if (!jobsCol) {
    throw new Error('Database is not connected yet.');
  }
  const docs = await jobsCol.find({}).toArray();
  docs.forEach(function (d) {
    delete d._id;
  });
  return docs;
}

async function saveJobs(arr) {
  const jobsCol = getCollection('jobs');
  if (!jobsCol) {
    throw new Error('Database is not connected yet.');
  }
  await jobsCol.deleteMany({});
  if (arr.length) {
    await jobsCol.insertMany(arr.map(function (j) {
      return Object.assign({}, j, { updatedAt: new Date() });
    }));
  }
  return arr.length;
}

module.exports = {
  getJobs,
  saveJobs
};
