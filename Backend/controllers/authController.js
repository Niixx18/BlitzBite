const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const twilio = require('twilio');
const User = require('../models/User');
const Shop = require('../models/Shop');
const RefreshToken = require('../models/RefreshToken');

const twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);

const otpStore = {};

const generateToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'change_this_secret', {
        expiresIn: '7d'  // 15m se 7d kiya
    });
};

exports.generateToken = generateToken;

const createRefreshToken = async (userId) => {
    const token = crypto.randomBytes(40).toString('hex');
    const expires = Date.now() + 30 * 24 * 60 * 60 * 1000;
    await RefreshToken.create({ token, user: userId, expires });
    return token;
};

exports.register = async (req, res) => {
    try {
        const {
            firstName,
            lastName,
            email,
            phone,
            password,
            userType,
            profilePhoto,
            vehicleType,
            vehicleNumber,
            kitchenName,
            kitchenAddress,
            businessDescription,
            kitchenImage
        } = req.body;

        if (!phone || !email || !password || !userType) {
            return res.status(400).json({ message: 'Phone, email, password, and user type are required' });
        }

        const existingEmail = await User.findOne({ email: email.toLowerCase() });
        if (existingEmail) return res.status(400).json({ message: 'Email address already registered' });

        const existingPhone = await User.findOne({ phone });
        if (existingPhone) return res.status(400).json({ message: 'Phone number already registered' });

        const userPayload = {
            firstName,
            lastName,
            email: email.toLowerCase(),
            phone,
            password,
            userType,
            profilePhoto: profilePhoto || null,
            isProfileComplete: true
        };

        if (userType === 'delivery') {
            userPayload.vehicleType = vehicleType;
            userPayload.vehicleNumber = vehicleNumber;
        }

        const user = await User.create(userPayload);

        // Kitchen Owner automatic Shop creation
        if (userType === 'restaurant') {
            if (!kitchenName) {
                await User.findByIdAndDelete(user._id);
                return res.status(400).json({ message: 'Kitchen name is required for kitchen owners' });
            }
            await Shop.create({
                name: kitchenName,
                description: businessDescription || '',
                featuredImage: kitchenImage || null,
                location: {
                    street: kitchenAddress || '',
                    city: req.body.city || 'Patna',
                    state: req.body.state || 'Bihar',
                    zipCode: req.body.zipCode || '800001',
                    country: 'India'
                },
                owner: user._id,
                isOpen: true,
                isActive: true
            });
        }

        const token = generateToken(user._id);
        const refreshToken = await createRefreshToken(user._id);

        res.status(201).json({
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                phone: user.phone,
                userType: user.userType,
                profilePhoto: user.profilePhoto,
                vehicleType: user.vehicleType,
                vehicleNumber: user.vehicleNumber
            },
            token,
            refreshToken
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, phone, password } = req.body;
        if (!email && !phone) {
            return res.status(400).json({ message: 'Email or phone number is required' });
        }

        let query = {};
        if (phone) {
            query = { phone };
        } else {
            query = { email: email.toLowerCase() };
        }

        const user = await User.findOne(query).select('+password');
        if (!user) return res.status(400).json({ message: 'Invalid credentials' });

        if (!user.password) {
            return res.status(400).json({ message: 'Password not set for this account. Please login using OTP.' });
        }

        const isMatch = await user.matchPassword(password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        const token = generateToken(user._id);
        const refreshToken = await createRefreshToken(user._id);

        res.json({
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                phone: user.phone,
                userType: user.userType
            },
            token,
            refreshToken
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });
        
        const userObj = user.toObject();
        userObj.id = user._id;
        
        res.json({ user: userObj });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { firstName, lastName, phone } = req.body;
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { firstName, lastName, phone },
            { new: true, runValidators: true }
        ).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json({ user });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'No user with that email' });

        const resetToken = user.createPasswordResetToken();
        await user.save({ validateBeforeSave: false });

        const resetURL = `${process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`}/reset-password/${resetToken}`;

        if (process.env.SMTP_HOST && process.env.SMTP_USER) {
            const transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: process.env.SMTP_PORT || 587,
                secure: false,
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
                }
            });

            const message = {
                from: process.env.SMTP_FROM || 'no-reply@example.com',
                to: user.email,
                subject: 'Password reset',
                text: `You requested a password reset. Use this link: ${resetURL}`
            };

            await transporter.sendMail(message);
            return res.json({ message: 'Password reset email sent' });
        }

        res.json({ message: 'No SMTP configured — use link to reset', resetURL });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const token = req.params.token;
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const user = await User.findOne({ passwordResetToken: hashedToken, passwordResetExpires: { $gt: Date.now() } });
        if (!user) return res.status(400).json({ message: 'Token is invalid or has expired' });

        user.password = req.body.password;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();

        const newToken = generateToken(user._id);
        res.json({ message: 'Password reset successful', token: newToken });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) return res.status(400).json({ message: 'Refresh token required' });

        const stored = await RefreshToken.findOne({ token: refreshToken });
        if (!stored) return res.status(401).json({ message: 'Invalid refresh token' });
        if (stored.expires < Date.now()) {
            await RefreshToken.deleteOne({ _id: stored._id });
            return res.status(401).json({ message: 'Refresh token expired' });
        }

        const accessToken = generateToken(stored.user);
        res.json({ token: accessToken });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.logout = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (refreshToken) await RefreshToken.deleteOne({ token: refreshToken });
        res.json({ message: 'Logged out' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.sendOTP = async (req, res) => {
    try {
        const { phone } = req.body;
        if (!phone) return res.status(400).json({ message: 'Phone number required' });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        otpStore[phone] = {
            otp,
            expiresAt: Date.now() + 5 * 60 * 1000
        };

        let sentViaSms = false;
        let smsError = null;

        if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
            try {
                await twilioClient.messages.create({
                    body: `Your BlitzBite OTP is: ${otp}. Valid for 5 minutes.`,
                    from: process.env.TWILIO_PHONE_NUMBER,
                    to: `+91${phone}`
                });
                sentViaSms = true;
            } catch (twilioErr) {
                smsError = twilioErr.message;
                console.error('Twilio Send SMS Error:', twilioErr);
            }
        }

        const responsePayload = {
            message: sentViaSms ? 'OTP sent successfully' : 'OTP generated (SMS failed/skipped, using Dev Mode fallback)',
            devOtp: otp
        };

        if (smsError) {
            responsePayload.error = smsError;
        }

        res.json(responsePayload);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.verifyOTP = async (req, res) => {
    try {
        const { phone, otp } = req.body;
        if (!phone || !otp) return res.status(400).json({ message: 'Phone and OTP required' });

        const record = otpStore[phone];

        if (!record) return res.status(400).json({ message: 'OTP not sent or expired' });

        if (Date.now() > record.expiresAt) {
            delete otpStore[phone];
            return res.status(400).json({ message: 'OTP expired' });
        }

        if (record.otp !== otp) return res.status(400).json({ message: 'Invalid OTP' });

        delete otpStore[phone];

        let user = await User.findOne({ phone });
        if (!user) {
            user = await User.create({ phone, userType: 'customer' });
        }

        const token = generateToken(user._id);
        const refreshToken = await createRefreshToken(user._id);

        res.json({
            user: {
                id: user._id,
                phone: user.phone,
                userType: user.userType
            },
            token,
            refreshToken
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.checkPhone = async (req, res) => {
    try {
        const { phone } = req.body;
        if (!phone) return res.status(400).json({ message: 'Phone number required' });

        const existing = await User.findOne({ phone });
        if (existing) {
            return res.status(400).json({ message: 'Phone number already registered' });
        }
        res.json({ message: 'Phone number is available' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.deleteAccount = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // If user is a restaurant owner, delete their shops and items
        if (user.userType === 'restaurant') {
            const shops = await Shop.find({ owner: userId });
            const shopIds = shops.map(shop => shop._id);

            // Delete all items belonging to these shops
            const Item = require('../models/Item');
            await Item.deleteMany({ shop: { $in: shopIds } });

            // Delete the shops
            await Shop.deleteMany({ owner: userId });
        }

        // Delete all carts associated with the user
        const Cart = require('../models/Cart');
        await Cart.deleteMany({ user: userId });

        // Delete all refresh tokens associated with the user
        await RefreshToken.deleteMany({ user: userId });

        // Delete the user
        await User.deleteOne({ _id: userId });

        res.json({ message: 'Account and associated data deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};