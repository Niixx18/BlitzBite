const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Shop = require('./models/Shop');
const Item = require('./models/Item');

const seed = async () => {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');

    // Purana seed data delete karo
    await Shop.deleteMany({ name: { $in: ['Pizza Palace', 'Burger Hub', 'Indian Dhaba', 'Chinese Corner', 'Healthy Bites'] } });

    // Owner user dhundo ya banao
    let owner = await User.findOne({ email: 'owner@blitzbite.com' });
    if (!owner) {
        owner = await User.create({
            firstName: 'Demo',
            lastName: 'Owner',
            email: 'owner@blitzbite.com',
            phone: '9999999999',
            password: 'password123',
            userType: 'restaurant'
        });
    }

    const shops = [
        {
            name: 'Pizza Palace',
            description: 'Best pizzas in town!',
            category: 'Italian',
            location: { street: 'MG Road', city: 'Patna', state: 'Bihar', zipCode: '800001' },
            items: [
                { name: 'Margherita Pizza', price: 199, category: 'Pizza', description: 'Classic cheese pizza', metadata: { spiceLevel: 'mild', calories: 800 } },
                { name: 'Pepperoni Pizza', price: 299, category: 'Pizza', description: 'Loaded with pepperoni', metadata: { spiceLevel: 'mild', calories: 950 } },
                { name: 'Garlic Bread', price: 99, category: 'Sides', description: 'Crispy garlic bread', metadata: { spiceLevel: 'none', calories: 300 } },
            ]
        },
        {
            name: 'Burger Hub',
            description: 'Juicy burgers for everyone!',
            category: 'Fast Food',
            location: { street: 'Station Road', city: 'Patna', state: 'Bihar', zipCode: '800001' },
            items: [
                { name: 'Classic Burger', price: 149, category: 'Burger', description: 'Juicy beef patty burger', metadata: { spiceLevel: 'mild', calories: 600 } },
                { name: 'Cheese Burger', price: 179, category: 'Burger', description: 'Double cheese loaded', metadata: { spiceLevel: 'mild', calories: 700 } },
                { name: 'French Fries', price: 79, category: 'Sides', description: 'Crispy golden fries', metadata: { spiceLevel: 'none', calories: 400 } },
                { name: 'Cold Drink', price: 49, category: 'Beverages', description: 'Refreshing cold drink', metadata: { spiceLevel: 'none', calories: 150 } },
            ]
        },
        {
            name: 'Indian Dhaba',
            description: 'Authentic Indian flavors!',
            category: 'Indian',
            location: { street: 'Boring Road', city: 'Patna', state: 'Bihar', zipCode: '800001' },
            items: [
                { name: 'Butter Chicken', price: 280, category: 'Main Course', description: 'Creamy butter chicken curry', metadata: { spiceLevel: 'medium', calories: 550 } },
                { name: 'Dal Makhani', price: 220, category: 'Main Course', description: 'Slow cooked black lentils', metadata: { spiceLevel: 'mild', calories: 450 } },
                { name: 'Garlic Naan', price: 40, category: 'Bread', description: 'Soft garlic naan', metadata: { spiceLevel: 'none', calories: 200 } },
                { name: 'Jeera Rice', price: 120, category: 'Rice', description: 'Fragrant cumin rice', metadata: { spiceLevel: 'none', calories: 350 } },
                { name: 'Lassi', price: 80, category: 'Beverages', description: 'Sweet or salty lassi', metadata: { spiceLevel: 'none', calories: 200 } },
            ]
        },
        {
            name: 'Chinese Corner',
            description: 'Authentic Chinese cuisine!',
            category: 'Chinese',
            location: { street: 'Frazer Road', city: 'Patna', state: 'Bihar', zipCode: '800001' },
            items: [
                { name: 'Veg Fried Rice', price: 150, category: 'Rice', description: 'Wok tossed fried rice', metadata: { spiceLevel: 'mild', calories: 500 } },
                { name: 'Chicken Manchurian', price: 220, category: 'Main Course', description: 'Spicy manchurian gravy', metadata: { spiceLevel: 'hot', calories: 600 } },
                { name: 'Spring Rolls', price: 120, category: 'Starters', description: 'Crispy veggie spring rolls', metadata: { spiceLevel: 'mild', calories: 350 } },
                { name: 'Hakka Noodles', price: 160, category: 'Noodles', description: 'Stir fried hakka noodles', metadata: { spiceLevel: 'medium', calories: 550 } },
            ]
        },
        {
            name: 'Healthy Bites',
            description: 'Eat healthy, stay fit!',
            category: 'Healthy',
            location: { street: 'Patliputra Colony', city: 'Patna', state: 'Bihar', zipCode: '800013' },
            items: [
                { name: 'Fruit Bowl', price: 120, category: 'Healthy', description: 'Fresh seasonal fruits', metadata: { spiceLevel: 'none', calories: 200 } },
                { name: 'Quinoa Salad', price: 180, category: 'Salad', description: 'Protein rich quinoa salad', metadata: { spiceLevel: 'none', calories: 350 } },
                { name: 'Green Smoothie', price: 150, category: 'Beverages', description: 'Spinach banana smoothie', metadata: { spiceLevel: 'none', calories: 250 } },
            ]
        }
    ];

    for (const shopData of shops) {
        const { items, ...shopFields } = shopData;
        const shop = await Shop.create({ ...shopFields, owner: owner._id });
        console.log(`✅ Shop created: ${shop.name}`);

        for (const itemData of items) {
            await Item.create({ ...itemData, shop: shop._id });
            console.log(`   🍔 Item added: ${itemData.name}`);
        }
    }

    console.log('\n🎉 Seed complete!');
    process.exit(0);
};

seed().catch((err) => {
    console.error(err);
    process.exit(1);
});