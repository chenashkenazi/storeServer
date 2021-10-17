const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { redis } = require('../../helpers/redis');

const Order = require('../models/order');
const Product = require('../models/product');
const order = require('../models/order');

// Get all orders
router.get('/', async (req, res, next) => {
    try {
        const orders = await Order.find({});
        if (orders) {
            const response = {
                count: orders.length,
                orders: orders
            }
            res.status(200).json(response);
        }
    } catch (ex) {
        console.log(ex);
        res.status(500).json({
            error: ex
        });
    }
});

// New order
// Check if exists in redis and user's email is the same
// Create new order, save to db, update product quantity to 0 
router.post('/', async (req, res, next) => {
    try {
        const userEmail = req.body.userEmail;
        const productDetails = await Product.findOne({ name: req.body.productName }).exec();

        const lockedProductEmail = await redis.get(productDetails.name);
        if (lockedProductEmail && lockedProductEmail != userEmail) {
            return res.status(404).json({
                message: 'Product is not available'
            });
        }
        const order = new Order({
            _id: mongoose.Types.ObjectId(),
            userEmail: req.body.userEmail,
            productName: req.body.productName
        });
        await order.save();
        await Product.updateOne({ name: req.body.productName }, { $set: { quantity: 0 } });
        return res.status(201).json({
            message: 'Order stored',
            createdOrder: {
                _id: order._id,
                userEmail: order.userEmail,
                productName: order.productName
            },
            request: {
                type: 'GET',
                url: req.url
            }
        });
    } catch (ex) {
        console.log(ex);
        res.status(500).json({
            error: ex
        });
    }
});

// Hold order for 5 minutes
// Find product, check if exists and check if available
router.post('/holdorder/', async (req, res, next) => {
    try {
        const userEmail = req.body.userEmail;
        const productDetails = await Product.findOne({ name: req.body.productName }).exec();
        if (!productDetails) {
            return res.status(404).json({
                message: 'Product not found'
            });
        }

        if (productDetails.quantity === 0) {
            return res.status(404).json({
                message: `${productDetails.name} is sold out`
            });
        }

        const lockedProductEmail = await redis.get(productDetails.name);
        if (lockedProductEmail) {
            return res.status(404).json({
                message: `Product is in order`
            });
        } else {
            const holdProductEmail = await redis.setex(productDetails.name, 300, userEmail);
            return res.status(201).json({
                message: 'Order locked for 5 minutes'
            });
        }

        
    } catch (ex) {
        console.log(ex);
        res.status(500).json({
            error: ex
        });
    }
});

// Find order by id
router.get('/:orderId', async (req, res, next) => {
    try { 
        const order = await Order.findById(req.params.orderId).exec();
        if (!order) {
            res.status(404).json({
                message: 'Order not found'
            })
        }
        res.status(200).json({
            order: order,
        })
    } catch (ex) {
        console.log(ex);
        res.status(500).json({
            error: ex
        });
    }
});

// Delete order
// First change the product quantity to 1 and then delete order
router.delete('/:orderId', async (req, res, next) => {

    try {
        const order = await Order.findById(req.params.orderId).exec();
        if (order) {
            await Product.updateOne({ name: order.productName }, { $set: { quantity: 1 } });
            await order.remove({ _id: req.params.orderId });
            return res.status(200).json({
                message: 'Product updated & order deleted'
            });
        } else {
            return res.status(200).json({
                message: 'Order not found'
            });
        }
    } catch (ex) {
        console.log(ex);
        res.status(500).json({
            error: ex
        });
    }

});

module.exports = router;