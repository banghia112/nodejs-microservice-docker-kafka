console.log('====================================');
console.log("test__________");
console.log('====================================');

const express = require('express')
const mongoose = require('mongoose');
const { Kafka, CompressionTypes, logLevel } = require('kafkajs');
const ClassSchema = require('./Schema/Classes')


const main = async () => {
  const app = express()
  const port = 8001
  const student_topic = 'students-topic'
  const grades_topic = 'grades-topic'
  const class_topic = 'class-topic'

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
    clientId: 'class-client',
    // brokers: [`kafka-service-kafka-1:9092`],
    brokers: [`kafka:9092`],
  })

  const producer = kafka.producer({
    transactionTimeout: 3000
  })
  
  const consumer = kafka.consumer({
    groupId: 'class-group'
  })

  const processMessage = async (key, value) => {
    const valueObj = JSON.parse(value)
    console.log("🚀 ~ file: index.js:47 ~ processMessage ~ valueObj:", valueObj)
    if(key === 'add-student') { 
      const {class: classNumber} = valueObj
      const rs = await ClassSchema.find({number: classNumber})
      console.log("🚀 ~ file: index.js:49 ~ processMessage ~ rs:", rs, classNumber)
      if(!rs || rs?.length <= 0) {
        console.log(1)
        const createClass = await ClassSchema.create({
          number: classNumber,
          numberOfStudents: 1,
          students: [
            valueObj
          ],
          avgScore: valueObj?.avgScore
        })
      }else {
        console.log(2, valueObj?.avgScore)
        const newStudents = [...rs[0]?.students, valueObj]
        const updateClass = await ClassSchema.updateOne({number: classNumber}, {
          numberOfStudents: rs[0]?.numberOfStudents + 1,
          students: newStudents,
          avgScore: newStudents?.reduce((previousValue, currentStudent) => previousValue + parseFloat(currentStudent?.avgScore), 0) / newStudents?.length
        })
      }
      sendMessage(class_topic,'add-student', value)
    }
    if(key === 'delete-student') {
      const {class: classNumber} = valueObj
      const rs = await ClassSchema.find({number: classNumber})
      if(rs && rs?.length > 0) {
        const newStudents = rs[0]?.students?.splice(rs[0]?.students?.map(item => item?._id).indexOf(valueObj?._id), 1)
        const updateClass = await ClassSchema.updateOne({number: classNumber}, {
          numberOfStudents: rs[0]?.numberOfStudents - 1,
          students: newStudents,
          avgScore: newStudents?.reduce((previousValue, currentStudent) => previousValue + parseFloat(currentStudent?.avgScore), 0) / newStudents?.length
        })
      }
    }
  }

  await producer.connect()
  await consumer.connect()
  await consumer.subscribe({topic: student_topic})
  await consumer.subscribe({topic: grades_topic})
  await consumer.run({
    eachMessage: async ({topic, partition, message}) => {
      const key = Buffer.from(message?.key, 'base64').toString('utf-8')
      const value = Buffer.from(message?.value, 'base64').toString('utf-8')
      console.log('====================================');
      console.log(`MESSAGE FROM [${topic}] ====`, message);
      console.log(`KEY [${key}] ====`);
      console.log(`VALUE [${value}] ====`);
      console.log('====================================');
      processMessage(key, value)
    }
  })

  const sendMessage = (topic, key, value) => {
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
    console.log('Time from class service', Date.now())
    console.log('====================================');
    console.log(req.baseUrl);
    console.log(req.url);
    console.log(req.originalUrl);
    console.log('====================================');
    next()
  })
  
  app.get('/class/getAll', async (req, res) => {
    console.log('====================================');
    console.log('GET - REQUEST');
    console.log('====================================');
    const classes = await ClassSchema.find().limit(10)
    res.status(200).send(classes)
  })  

  app.post('/class/add', async (req,res) => {
    console.log('====================================');
    console.log('POST - REQUEST');
    console.log('====================================');
    const body = req.body
    rs = await ClassSchema.create(body)
    console.log("🚀 ~ file: index.js:83 ~ app.post ~ rs:", rs)
    sendMessage(class_topic,'add-class', JSON.stringify(body))
    res.status(200).send(JSON.stringify(rs))
  })

  app.delete('class/:id', async (req, res) => {
    console.log('====================================');
    console.log('GET - REQUEST', req?.params);
    console.log('====================================');
    const {id} = req?.params
    const classe = await ClassSchema.deleteOne({_id: id})
    sendMessage(class_topic,'delete-class', JSON.stringify({id}))
    res.status(200).send(classe)
  })

  app.listen(port, () => {
    console.log(`class service listening on port ${port}`)
  })
    
}

main()