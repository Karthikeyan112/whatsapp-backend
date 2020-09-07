// import express from 'express';
const express = require('express');
const mongoose = require('mongoose');
const Messages = require('./dbMessages');
const Pusher = require('pusher');
const cors = require('cors');
// const bodyParser = require('body-parser');


const app = express();
const PORT = process.env.PORT || 9000;
const pusher = new Pusher({
  appId: '1067883',
  key: 'e34e52b0f32500ab1a66',
  secret: 'f9977056850e7ea7541f',
  cluster: 'ap2',
  encrypted: true
});

app.use(express.json());
app.use(cors());
// app.use((req, res, next) => {
//   res.setHeader('Access-Control-Allow-Origin', '*');
//   res.setHeader('Access-Control-Allow-Headers', '*');
//   next();
// });

const connectionUrl = 'mongodb+srv://admin:admin@cluster0.866iw.mongodb.net/whatsappdb?retryWrites=true&w=majority'
mongoose.connect(connectionUrl, {
  useCreateIndex: true,
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const db = mongoose.connection;
db.once('open', () => {
  console.log('DB connnected');

  const msgCollection = db.collection('messagecontents');
  const changeStrem = msgCollection.watch();

  changeStrem.on('change', (change) => {
    if (change.operationType === 'insert') {
      const messageDetails = change.fullDocument;
      pusher.trigger('messages', 'inserted', 
      {
        name: messageDetails.name,
        message: messageDetails.message,
        timestamp: messageDetails.timestamp,
        received: messageDetails.received
      });
    } else {
      console.log('Error triggering Pusher');
    }
  })
})

app.get('/', (req, res) => {
  res.status(200).send('Hello World');
});

app.post('/messages/new', (req, res) => {
  const dbMessage = req.body;

  Messages.create(dbMessage, (err, data) => {
    if(err) {
      res.status(500).send(err);
    } else {
      res.status(201).send(data);
    }
  });
});

app.get('/messages/sync', (req, res) => {
  Messages.find((err, data) => {
    if(err) {
      res.status(500).send(err);
    } else {
      res.status(200).send(data);
    }
  });
});


app.listen(PORT, () => {
  console.log(`app is running on http://localhost:${PORT}`);
})
