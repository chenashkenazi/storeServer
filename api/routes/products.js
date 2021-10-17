const { request } = require('express');
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const Product = require('../models/product')

// Get all products
router.get('/', async (req, res, next) => {
    try {
        const products = await Product.find({});
        if (products) {
            const response = {
                count: products.length,
                products: products 
            };
            res.status(200).json(response);
        } else {
            res.status(404).json({message: 'No products found'})
        }
    } catch (ex) {
        console.log(ex);
        res.status(500).json({
            error: ex
        });
    }
});

// Add new product
// First check if product doesn't already exist
router.post('/', async (req, res, next) => {
    try {
        const searchProduct = await Product.findOne({ name: req.body.name }).exec();
        if (searchProduct) {
            return res.status(404).json({
                message: 'Product is already exist'
            });
        }

        const product = new Product({
            name: req.body.name,
            quantity: 1
        });

        await product.save();
        return res.status(201).json({
            message: 'Created product successfully',
                createdProduct: {
                    name: product.name,
                    quantity: product.quantity,
                }
        });
    } catch (ex) {
        console.log(ex);
        res.status(500).json({
            error: ex
        });
    }
});

// Get product by its name
router.get('/:productName', async (req, res, next) => {
    try {
        const productName = req.params.productName;
        const product = await Product.findOne({ name: productName }).exec();
        if (product) {
            res.status(200).json(product);
        } else {
            res.status(404).json({message: 'No valid entry found for the provided name'})
        }
    } catch (ex) {
        console.log(ex);
        res.status(500).json({
            error: ex
        });
    }

});

module.exports = router;