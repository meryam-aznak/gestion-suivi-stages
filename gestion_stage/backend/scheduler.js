const cron = require('node-cron');
const Stage = require('./models/Stage');

cron.schedule('0 0 * * *', async () => {
  const today = new Date();

  await Stage.updateMany(
    { dateDebut: { $lte: today }, dateFin: { $gte: today } },
    { $set: { status: 'EN_COURS' } }
  );

  await Stage.updateMany(
    { dateFin: { $lt: today } },
    { $set: { status: 'TERMINE' } }
  );

  console.log('Stage statuses updated.');
});
