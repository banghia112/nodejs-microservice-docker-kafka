const express = require('express')
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const mongoose = require('mongoose');
const app = express()
const port = 3000

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

const corsOptions = {
    origin: ['http://class-service:8001', 'http://grades-service:8000', 'http://students-service:9000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type'],
};
  
app.use(cors(corsOptions));

app.use('/class', createProxyMiddleware({
    target: 'http://class-service:8001', // Replace with the address of your backend service
    onError: (err) => {
        console.log('error from class ===> gateway',err);
    }
}));

app.use('/grades', createProxyMiddleware({
    target: 'http://grades-service:8000', // Replace with the address of your backend service
    changeOrigin: true,
    onError: (err) => {
        console.log('error from grades ===> gateway',err);
    }
}));

app.use('/students', createProxyMiddleware({
    target: 'http://students-service:9000', // Replace with the address of your backend service
    changeOrigin: true,
    onError: (err) => {
        console.log('error from students ===> gateway',err);
    }
}));

mongoose.connect('mongodb://mongoDB:27017/test', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then((res) => {
    console.log('====================================');
    console.log("mongoDB connected", res);
    console.log('====================================');
})

app.use((req, res, next) => {
    console.log('Time:', Date.now())
    next()
})

app.get('/query', (req, res) => {
    console.log("🚀 ~ file: index.js:13 ~ app.get ~ res:", res,req)
    res.send('Hello World!')
}) 

app.post('/write', (req, res) => {
    res.send('Got a POST request')
})

app.put('/put', (req, res) => {
    res.send('Got a PUT request at /user')
})

app.delete('/delete', (req, res) => {
    res.send('Got a DELETE request at /user')
})

  
  