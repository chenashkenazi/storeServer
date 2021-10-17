const mongoose = require('mongoose');

const orderSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    userEmail: { type: String, required: true },
    productName: { type: String, ref: 'Product', required: true }
});

module.exports = mongoose.model('Order', orderSchema)