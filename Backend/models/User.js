const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
    // Basic Info
    firstName: {
        type: String,
        trim: true,
        maxlength: [50, 'First name cannot exceed 50 characters']
    },
    lastName: {
        type: String,
        trim: true,
        maxlength: [50, 'Last name cannot exceed 50 characters']
    },
    email: {
        type: String,
        unique: true,
        sparse: true,
        lowercase: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please provide a valid email'
        ]
    },
   phone: {
    type: String,
    required: [true, 'Please provide a phone number'],
    unique: true,
    sparse: true,
    match: [/^\d{10}$/, 'Please provide a valid 10-digit phone number']
},
    password: {
        type: String,
        minlength: [6, 'Password must be at least 6 characters'],
        select: false
    },

    // Profile complete kiya ya nahi
    isProfileComplete: {
        type: Boolean,
        default: false
    },

    // Address Info
    address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: {
            type: String,
            default: 'India'
        },
        isDefault: {
            type: Boolean,
            default: false
        }
    },

    // Profile
    profilePhoto: {
        type: String,
        default: null
    },
    dateOfBirth: Date,

    // Account Status
    isActive: {
        type: Boolean,
        default: true
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    isPhoneVerified: {
        type: Boolean,
        default: false
    },

    // Password reset
    passwordResetToken: String,
    passwordResetExpires: Date,

    // User Type
    userType: {
        type: String,
        enum: ['customer', 'restaurant', 'delivery'],
        default: 'customer'
    },

    // Rider Details
    vehicleType: {
        type: String,
        trim: true
    },
    vehicleNumber: {
        type: String,
        trim: true
    },

    // Preferences
    preferences: {
        dietaryRestrictions: [String],
        allergens: [String],
        favoriteRestaurants: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Shop'
            }
        ]
    }
}, {
    timestamps: true
});

userSchema.pre('save', async function(next) {
    if (!this.isModified('password') || !this.password) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

userSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.createPasswordResetToken = function() {
    const resetToken = crypto.randomBytes(32).toString('hex');
    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    this.passwordResetExpires = Date.now() + 60 * 60 * 1000;
    return resetToken;
};

module.exports = mongoose.model('User', userSchema);