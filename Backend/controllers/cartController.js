const Cart = require('../models/Cart');
const Item = require('../models/Item');

exports.getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id }).populate('items.item');
    res.json({ cart: cart || { items: [] } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.addToCart = async (req, res) => {
  try {
    const { itemId, quantity = 1 } = req.body;
    const item = await Item.findById(itemId);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    if (!item.isAvailable) return res.status(400).json({ message: 'Item is unavailable' });

    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      cart = await Cart.create({ user: req.user.id, items: [] });
    }

    const existing = cart.items.find((entry) => entry.item.toString() === itemId);
    if (existing) {
      existing.quantity += Number(quantity);
    } else {
      cart.items.push({ item: itemId, quantity: Number(quantity) });
    }

    await cart.save();
    await cart.populate('items.item');
    res.json({ cart });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body;
    const { itemId } = req.params;
    
    const item = await Item.findById(itemId);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    const existing = cart.items.find((entry) => entry.item.toString() === itemId);
    if (!existing) return res.status(404).json({ message: 'Item not in cart' });

    if (Number(quantity) <= 0) {
      cart.items = cart.items.filter((entry) => entry.item.toString() !== itemId);
    } else {
      if (!item.isAvailable && Number(quantity) > existing.quantity) {
        return res.status(400).json({ message: 'Item is out of stock' });
      }
      existing.quantity = Number(quantity);
    }

    await cart.save();
    await cart.populate('items.item');
    res.json({ cart });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.removeCartItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    cart.items = cart.items.filter((entry) => entry.item.toString() !== itemId);
    await cart.save();
    await cart.populate('items.item');
    res.json({ cart });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });
    cart.items = [];
    await cart.save();
    res.json({ cart });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
