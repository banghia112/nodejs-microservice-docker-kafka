const express = require('express')
const { Kafka, CompressionTypes, logLevel } = require('kafkajs')
const fs = require('fs')
const ip = require('ip')
const mongoose = require('mongoose');
const StudentSchema = require('./Schema/Students')

const main = async () => {
  const app = express()
  const host = process.env.HOST_IP || ip.address()
  const port = 9000
  const topic = 'students-topic'

  app.use(express.json())
  app.use(express.urlencoded({ extended: false })) 

  mongoose.connect('mongodb://mongodb:27017/test', {
  useNewUrlParser: true,
  useUnifiedTopology: true
  }).then((res) => {
    console.log('====================================');
    console.log("mongoDB connected");
    console.log('====================================');
  })
  
  const kafka = new Kafka({
    logLevel: logLevel.NOTHING,
    clientId: 'student-client',
    // brokers: [`kafka-service-kafka-1:9092`],
    brokers: [`kafka:9092`],
  })
  
  const producer = kafka.producer({
    transactionTimeout: 3000
  })
  
  const consumer = kafka.consumer({
    groupId: 'student-group'
  })
  
  await producer.connect()
  await consumer.connect()
  await consumer.subscribe({topic})
  await consumer.run({
    eachMessage: async ({topic, partition, message}) => {
      console.log('====================================');
      console.log(`MESSAGE FROM [${topic}] ====`, message);
      console.log('====================================');
    }
  })

  const sendMessage = (key, value) => {
    return producer
      .send({
        topic,
        compression: CompressionTypes.GZIP,
        messages: [
          {key, value}
        ],
      })
      .then((res) => console.log('message send ===============', res))
      .catch(e => console.error(`[example/producer] ${e.message}`, e))
  }

  app.use((req, res, next) => {
    console.log('Time:', Date.now())
    next()
  })
  
  app.get('/students/getAll', async (req, res) => {
    console.log('====================================');
    console.log('GET - REQUEST');
    console.log('====================================');
    const students = await StudentSchema.find().limit(10)
    res.status(200).send(students)
  })  

  app.post('/students/add', async (req,res) => {
    console.log('====================================');
    console.log('POST - REQUEST');
    console.log('====================================');
    const body = req.body
    rs = await StudentSchema.create(body)
    console.log("🚀 ~ file: index.js:83 ~ app.post ~ rs:", rs)
    sendMessage('add-student', JSON.stringify(rs))
    res.status(200).send(JSON.stringify(rs))
  })

  app.get('/students/:id',async (req, res) => {
    console.log('====================================');
    console.log('GET - REQUEST', req?.params);
    console.log('====================================');
    const {id} = req?.params
    const students = await StudentSchema.findById(id)
    res.status(200).send(students)
  })

  app.delete('/students/:id', async (req, res) => {
    console.log('====================================');
    console.log('GET - REQUEST', req?.params);
    console.log('====================================');
    const {id} = req?.params
    sendMessage('delete-student', JSON.stringify({id}))
    const students = await StudentSchema.deleteOne({_id: id})
    res.status(200).send(students)
  })

  app.listen(port, () => {
    console.log(`class service listening on port ${port}`)
  })

}

main()
