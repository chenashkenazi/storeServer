const express = require('express');
const app = express();
const morgan = require('morgan');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const { MongoClient } = require('mongodb');
const { redis } = require('./helpers/redis');

const productsRoutes = require('./api/routes/products');
const orderRoutes = require('./api/routes/orders');
const { reset } = require('nodemon');

// Connect to DB
const uri = `mongodb://chenash:${process.env.MONGO_ATLAS_PW}@theaterdb-shard-00-00.l3igt.mongodb.net:27017,theaterdb-shard-00-01.l3igt.mongodb.net:27017,theaterdb-shard-00-02.l3igt.mongodb.net:27017/TheaterDB?ssl=true&replicaSet=atlas-v138ap-shard-0&authSource=admin&retryWrites=true&w=majority`
mongoose.connect( uri || 'mongodb://localhost/test')
.then(()=>{
    console.log("Connected to Database");
})
.catch(err => {
    console.log(err);
});

mongoose.Promise = global.Promise;

app.use(morgan('dev'));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

// Handling CORS errors
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 
                'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
        res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET')
        return res.status(200).json({})
    }
    next();
});

// Routes which should handle requests
app.use('/products', productsRoutes);
app.use('/orders', orderRoutes);

app.use((req, res, next) => {
    const error = new Error('Not found');
    error.status = 404;
    next(error);
})

app.use((error, req, res, next) => {
    res.status(error.status || 500);
    res.json({
        error: {
            message: error.message
        }
    })
})

module.exports = app;