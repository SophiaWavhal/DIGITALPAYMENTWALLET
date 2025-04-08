require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware setup
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(cookieParser());
app.use(express.json()); // This replaces body-parser.json()

// Database connection
// mongoose.connect('mongodb+srv://dnyandagirish2004:dnyanda19@cluster0.ex5kjrv.mongodb.net/digital_wallet?retryWrites=true&w=majority', {
mongoose.connect('mongodb+srv://sophiawavhal170404:sophi2025@cluster0.vlnnkjx.mongodb.net/EasyPayDatabase?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Schemas
const UserSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 50
  },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
  },
  password: { 
    type: String, 
    required: true,
    minlength: 6
  },
  phone: { 
    type: String,
    trim: true,
    match: [/^[0-9]{10}$/, 'Please fill a valid phone number']
  },
  address: { 
    type: String,
    trim: true,
    maxlength: 200
  },
  balance: { 
    type: Number, 
    default: 0,
    min: 0
  },
  role: { 
    type: String, 
    enum: ['user', 'admin'], 
    default: 'user' 
  },
  accounts: [{
    accountNumber: {
     type: String,
    //   unique: true,
    //   // required: true
     },
    ifscCode: {
      type: String,
      required: true
    },
    accountType: {
      type: String,
      enum: ['savings', 'current', 'salary'],
      required: true
    },
    balance: {
      type: Number,
      required: true,
      min: 0
    },
    createdAt: { 
      type: Date, 
      default: Date.now 
    }
  }],
  status: {
    type: String,
    enum: ['active', 'suspended'],
    default: 'active'
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

const TransactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  amount: { type: Number, required: true },
  type: { type: String, enum: ['credit', 'debit', 'transfer', 'bill','bank_transfer','qr_payment','split_payment'], required: true },
  description: { type: String },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  recipientEmail: { type: String },
  category: { type: String },
  paymentMethod: { type: String },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'completed' },
  createdAt: { type: Date, default: Date.now }
});

const BillSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: { type: String, required: true },
  provider: { type: String, required: true },
  customerId: { type: String, required: true },
  lastAmount: { type: Number },
  paymentMethod: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const OfferSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  cashback: { type: Number, required: true },
  validUntil: { type: Date, required: true },
  category: { type: String, required: true },
  image: { type: String },
  active: { type: Boolean, default: true }
});

const NotificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});


// Models
const User = mongoose.model('User', UserSchema);
const Transaction = mongoose.model('Transaction', TransactionSchema);
const Bill = mongoose.model('Bill', BillSchema);
const Offer = mongoose.model('Offer', OfferSchema);
const Notification = mongoose.model('Notification', NotificationSchema);

// Auth Middleware
const authenticate = async (req, res, next) => {
  try {
    const token = req.cookies.token || req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ 
        success: false, 
        message: 'Account suspended. Please contact support.' 
      });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    res.status(401).json({ 
      success: false, 
      message: 'Please authenticate' 
    });
  }
};

const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      message: 'Admin access required' 
    });
  }
  next();
};

// Auth Routes
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required' 
      });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 6 characters' 
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email already registered' 
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword });
    await user.save();

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(201).json({ 
      success: true, 
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        balance: user.balance,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during signup' 
    });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password are required' 
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ 
        success: false, 
        message: 'Account suspended. Please contact support.' 
      });
    }

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({ 
      success: true, 
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        balance: user.balance,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during login' 
    });
  }
});

app.post('/api/auth/logout', (req, res) => {
  try {
    res.clearCookie('token');
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Logout failed' });
  }
});

// Transaction history endpoint
app.get('/api/transactions/history', authenticate, async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ success: true, transactions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// User session endpoint
app.get('/api/auth/me', authenticate, async (req, res) => {
  try {
    res.json({ 
      success: true, 
      user: {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        balance: req.user.balance,
        role: req.user.role
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});


app.get('/api/user/profile', authenticate, async (req, res) => {
  res.json({ success: true, user: req.user });
});

app.put('/api/user/profile', authenticate, async (req, res) => {
  try {
    const updates = req.body;
    const allowedUpdates = ['name', 'phone', 'address'];
    const isValidUpdate = Object.keys(updates).every(update => allowedUpdates.includes(update));
    
    if (!isValidUpdate) {
      return res.status(400).json({ success: false, message: 'Invalid updates' });
    }

    Object.keys(updates).forEach(update => req.user[update] = updates[update]);
    await req.user.save();

    res.json({ success: true, user: req.user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});


app.post('/api/transactions/send', authenticate, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { recipientEmail, amount, description, paymentMethod, fromAccount } = req.body;
    const amountNum = parseFloat(amount);

    // Validate input
    if (!recipientEmail || !amountNum) {
      await session.abortTransaction();
      return res.status(400).json({ 
        success: false, 
        message: 'Recipient email and amount are required' 
      });
    }

    // Find recipient
    const recipient = await User.findOne({ email: recipientEmail }).session(session);
    if (!recipient) {
      await session.abortTransaction();
      return res.status(404).json({ 
        success: false, 
        message: 'Recipient not found' 
      });
    }

    
    if (req.user._id.toString() === recipient._id.toString()) {
      await session.abortTransaction();
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot send money to yourself' 
      });
    }

    
    if (paymentMethod === 'wallet') {
      if (req.user.balance < amountNum) {
        await session.abortTransaction();
        return res.status(400).json({ 
          success: false, 
          message: 'Insufficient wallet balance' 
        });
      }
      req.user.balance -= amountNum;
      recipient.balance += amountNum;
    } 
    // Handle bank payment
    else if (paymentMethod === 'bank') {
      if (!fromAccount) {
        await session.abortTransaction();
        return res.status(400).json({ 
          success: false, 
          message: 'Bank account required' 
        });
      }

      // Find and update sender's bank account
      const senderAccount = req.user.accounts.find(
        acc => acc.accountNumber === fromAccount
      );
      
      if (!senderAccount || senderAccount.balance < amountNum) {
        await session.abortTransaction();
        return res.status(400).json({ 
          success: false, 
          message: 'Insufficient bank balance' 
        });
      }

      senderAccount.balance -= amountNum;
      recipient.balance += amountNum;
    }

    // Create transactions
    const senderTransaction = new Transaction({
      userId: req.user._id,
      amount: -amountNum,
      type: paymentMethod === 'bank' ? 'bank_transfer' : 'transfer',
      description: description || 'Money Transfer',
      recipient: recipient._id,
      recipientEmail,
      paymentMethod,
      status: 'completed',
      metadata: paymentMethod === 'bank' ? { fromAccount } : {}
    });

    const recipientTransaction = new Transaction({
      userId: recipient._id,
      amount: amountNum,
      type: paymentMethod === 'bank' ? 'bank_transfer' : 'transfer',
      description: description || 'Money Received',
      paymentMethod,
      status: 'completed'
    });

    // Save all changes
    await Promise.all([
      req.user.save({ session }),
      recipient.save({ session }),
      senderTransaction.save({ session }),
      recipientTransaction.save({ session })
    ]);

    await session.commitTransaction();

    res.json({ 
      success: true, 
      message: 'Money sent successfully',
      newBalance: paymentMethod === 'wallet' ? req.user.balance : undefined
    });

  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  } finally {
    session.endSession();
  }
});
app.get('/api/transactions/history', authenticate, async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .populate('recipient', 'name email')
      .populate('sender', 'name email')
      .lean();

    // Enhance transactions with proper display information
    const enhancedTransactions = transactions.map(tx => {
      if (!tx.metadata) {
        tx.metadata = {};
      }
      
      // For bill payments, ensure we have provider information
      if (tx.type === 'bill' && !tx.metadata.billProvider) {
        const providerMatch = tx.description.match(/(.*) bill payment/);
        if (providerMatch) {
          tx.metadata.billProvider = providerMatch[1];
        }
      }
      
      return tx;
    });

    res.json({ success: true, transactions: enhancedTransactions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
// In your backend (server.js)
app.post('/api/wallet/topup', authenticate, async (req, res) => {
  try {
    const { amount, paymentMethod } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid amount' 
      });
    }

    // Update user balance
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $inc: { balance: amount } },
      { new: true }
    );

    // Create transaction record
    const transaction = new Transaction({
      userId: req.user._id,
      amount: amount,
      type: 'credit',
      description: `Wallet topup via ${paymentMethod}`,
      paymentMethod
    });
    await transaction.save();
    const notification = new Notification({
      userId: req.user._id,
      title: 'Wallet Topup',
      message: `Your wallet has been credited with ₹${amount.toFixed(2)}`
    });
    await notification.save();
    res.json({
      success: true,
      message: 'Wallet topup successful',
      newBalance: user.balance
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

app.post('/api/bills/pay', authenticate, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      category,
      provider,
      customerId,
      amount,
      paymentMethod,
      fromAccount,
      description
    } = req.body;

    const amountNum = parseFloat(amount);

    // Validate amount
    if (!amountNum || amountNum <= 0) {
      throw new Error('Invalid amount');
    }

    // 🔄 Re-fetch user inside session to avoid transaction mismatch
    const user = await User.findById(req.user._id).session(session);
    if (!user) throw new Error('User not found');

    // 💸 Handle wallet payment
    if (paymentMethod === 'wallet') {
      if (user.balance < amountNum) {
        throw new Error('Insufficient wallet balance');
      }
      user.balance -= amountNum;
    }

    // 🏦 Handle bank payment
    else if (paymentMethod === 'bank') {
      if (!fromAccount) {
        throw new Error('Bank account required');
      }

      const bankAccount = user.accounts.find(
        acc => acc.accountNumber === fromAccount
      );

      if (!bankAccount || bankAccount.balance < amountNum) {
        throw new Error('Insufficient bank balance');
      }

      bankAccount.balance -= amountNum;
    }

    
    const transaction = new Transaction({
      userId: user._id,
      amount: -amountNum,
      type: 'bill',
      description: description || `${provider} bill payment`,
      category,
      paymentMethod,
      status: 'completed',
      metadata: {
        billProvider: provider,
        billCategory: category,
        customerId,
        ...(paymentMethod === 'bank' && { fromAccount })
      }
    });

    
    const bill = new Bill({
      userId: user._id,
      category,
      provider,
      customerId,
      amount: amountNum,
      paymentMethod,
      description
    });

    
    const notification = new Notification({
      userId: user._id,
      title: 'Bill Payment',
      message: `Your ${provider} bill of ₹${amountNum} has been paid successfully`
    });

   
    await Promise.all([
      user.save({ session }),
      transaction.save({ session }),
      bill.save({ session }),
      notification.save({ session })
    ]);

    await session.commitTransaction();

    res.json({
      success: true,
      message: 'Bill payment successful',
      newBalance: paymentMethod === 'wallet' ? user.balance : undefined,
      fromAccount: paymentMethod === 'bank' ? fromAccount : undefined
    });

  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({
      success: false,
      message: error.message || 'Bill payment failed'
    });
  } finally {
    session.endSession();
  }
});
// Get user notifications
app.get('/api/user/notifications', authenticate, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
      
    res.json({ 
      success: true, 
      notifications 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Mark notification as read
app.put('/api/user/notifications/:id/read', authenticate, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ 
        success: false, 
        message: 'Notification not found' 
      });
    }

    res.json({ 
      success: true, 
      notification 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

app.get('/api/offers', async (req, res) => {
  try {
    const offers = await Offer.find({ 
      active: true,
      validUntil: { $gt: new Date() }
    }).sort({ cashback: -1 });

    res.json({ 
      success: true,
      offers 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Get user's activated offers
app.get('/api/user/offers', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('activatedOffers')
      .populate('activatedOffers.offer', 'title cashback');

    res.json({ 
      success: true,
      activatedOffers: user.activatedOffers || [] 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Activate a specific offer
app.post('/api/offers/:offerId/activate', authenticate, async (req, res) => {
  try {
    const offer = await Offer.findOne({
      _id: req.params.offerId,
      active: true,
      validUntil: { $gt: new Date() }
    });

    if (!offer) {
      return res.status(404).json({ 
        success: false, 
        message: 'Offer not found or expired' 
      });
    }

    const user = await User.findById(req.user._id);

    // Ensure activatedOffers exists
    if (!Array.isArray(user.activatedOffers)) {
      user.activatedOffers = [];
    }

    const alreadyActivated = user.activatedOffers.some(
      o => o.offer.toString() === req.params.offerId
    );

    if (alreadyActivated) {
      return res.status(400).json({ 
        success: false, 
        message: 'Offer already activated' 
      });
    }

    // Add to user's activated offers
    user.activatedOffers.push({ 
      offer: offer._id,
      activatedAt: new Date() 
    });

    await user.save();

    // Save notification
    const notification = new Notification({
      userId: req.user._id,
      title: 'Offer Activated',
      message: `You activated "${offer.title}" with ${offer.cashback}% cashback`
    });
    await notification.save();

    res.json({ 
      success: true,
      cashback: offer.cashback,
      message: 'Offer activated successfully'
    });

  } catch (error) {
    console.error('Offer Activation Error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to activate offer' 
    });
  }
});

app.get('/api/user/accounts', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('accounts');
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    res.json({ 
      success: true, 
      accounts: user.accounts || [] 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Bank transfer endpoint
// Updated bank transfer endpoint
app.post('/api/transactions/bank-transfer', authenticate, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { fromAccount, toAccount, recipientName, amount, ifscCode } = req.body;
    const amountNum = parseFloat(amount);

    // Validate input
    if (!fromAccount || !toAccount || !recipientName || !amount || !ifscCode) {
      await session.abortTransaction();
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required' 
      });
    }

    if (isNaN(amountNum) || amountNum <= 0) {
      await session.abortTransaction();
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid amount' 
      });
    }

    // Find sender and verify balance
    const sender = await User.findOne({
      _id: req.user._id,
      'accounts.accountNumber': fromAccount
    }).session(session);

    if (!sender) {
      await session.abortTransaction();
      return res.status(400).json({ 
        success: false, 
        message: 'Sender account not found' 
      });
    }

    // Find the specific account
    const senderAccount = sender.accounts.find(acc => acc.accountNumber === fromAccount);
    if (!senderAccount) {
      await session.abortTransaction();
      return res.status(400).json({ 
        success: false, 
        message: 'Sender account not found' 
      });
    }

    if (senderAccount.balance < amountNum) {
      await session.abortTransaction();
      return res.status(400).json({ 
        success: false, 
        message: 'Insufficient balance' 
      });
    }

    // Update sender's balance using arrayFilters
    await User.updateOne(
      { 
        _id: req.user._id,
        'accounts.accountNumber': fromAccount 
      },
      { 
        $inc: { 'accounts.$[account].balance': -amountNum } 
      },
      { 
        arrayFilters: [{ 'account.accountNumber': fromAccount }],
        session 
      }
    );

    // Find recipient and update balance
    const recipientUpdate = await User.updateOne(
      { 'accounts.accountNumber': toAccount },
      { $inc: { 'accounts.$[account].balance': amountNum } },
      { 
        arrayFilters: [{ 'account.accountNumber': toAccount }],
        session 
      }
    );

    if (recipientUpdate.matchedCount === 0) {
      await session.abortTransaction();
      return res.status(404).json({ 
        success: false, 
        message: 'Recipient account not found' 
      });
    }

    // Get recipient details for transaction record
    const recipient = await User.findOne({
      'accounts.accountNumber': toAccount
    }).session(session);

    // Create transactions for both parties
    const senderTransaction = new Transaction({
      userId: req.user._id,
      amount: -amountNum,
      type: 'bank_transfer',
      description: `Transfer to ${recipientName} (${toAccount})`,
      paymentMethod: 'bank_transfer',
      status: 'completed',
      metadata: {
        fromAccount,
        toAccount,
        ifscCode,
        recipientName
      }
    });

    const recipientTransaction = new Transaction({
      userId: recipient._id,
      amount: amountNum,
      type: 'bank_transfer',
      description: `Transfer from ${sender.name} (${fromAccount})`,
      paymentMethod: 'bank_transfer',
      status: 'completed',
      metadata: {
        fromAccount,
        toAccount,
        ifscCode,
        senderName: sender.name
      }
    });

    // Create notifications one by one with session
    const senderNotification = new Notification({
      userId: req.user._id,
      title: 'Transfer Sent',
      message: `You transferred ₹${amountNum.toFixed(2)} to ${recipientName}`
    });

    const recipientNotification = new Notification({
      userId: recipient._id,
      title: 'Transfer Received',
      message: `You received ₹${amountNum.toFixed(2)} from ${sender.name}`
    });

    // Save all documents in transaction
    await senderTransaction.save({ session });
    await recipientTransaction.save({ session });
    await senderNotification.save({ session });
    await recipientNotification.save({ session });

    // Commit the transaction
    await session.commitTransaction();
    
    // Get updated sender balance
    const updatedSender = await User.findById(req.user._id).session(session);
    const updatedAccount = updatedSender.accounts.find(acc => acc.accountNumber === fromAccount);

    res.json({ 
      success: true,
      message: 'Transfer completed successfully',
      newBalance: updatedAccount.balance
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Transfer error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Transfer failed' 
    });
  } finally {
    session.endSession();
  }
});

app.post('/api/user/add-account', authenticate, async (req, res) => {
  try {
    const { accountNumber, ifscCode, accountType, balance } = req.body;

    // Validate IFSC format
    if (!/^[A-Za-z]{4}0[A-Za-z0-9]{6}$/.test(ifscCode)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid IFSC code format'
      });
    }

    
    const user = await User.findById(req.user._id);
    const accountExists = user.accounts.some(
      acc => acc.accountNumber === accountNumber
    );

    if (accountExists) {
      return res.status(400).json({
        success: false,
        message: 'Account already exists'
      });
    }

    
    user.accounts.push({
      accountNumber,
      ifscCode,
      accountType,
      balance: parseFloat(balance),
      createdAt: new Date()
    });

    await user.save();

    res.json({
      success: true,
      message: 'Account added successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

const generateAccountNumber = () => {
  return Math.floor(1000000000 + Math.random() * 9000000000).toString(); // 10-digit number
};

const generateIFSCCode = () => {
  const bankCodes = ['SBIN', 'HDFC', 'ICIC', 'UBIN', 'CNRB']; // Common bank codes
  const randomBank = bankCodes[Math.floor(Math.random() * bankCodes.length)];
  const branchCode = Math.random().toString(36).substring(2, 8).toUpperCase(); // 6-char alphanumeric
  return `${randomBank}0${branchCode}`; // Format: BANK0BRANCH
};


app.post('/api/user/add-account', authenticate, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { accountType, balance } = req.body;
    
    
    if (balance < 1000) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Minimum initial deposit is ₹1000'
      });
    }

    // Generate valid bank details
    const accountNumber = generateAccountNumber();
    const ifscCode = generateIFSCCode();

    // Verify IFSC format
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscCode)) {
      await session.abortTransaction();
      return res.status(500).json({
        success: false,
        message: 'Failed to generate valid bank details'
      });
    }

    // Add account to user
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        $push: {
          accounts: {
            accountNumber,
            ifscCode,
            accountType,
            balance: parseFloat(balance),
            createdAt: new Date()
          }
        }
      },
      { new: true, session }
    );

    // Create transaction record
    const transaction = new Transaction({
      userId: req.user._id,
      amount: parseFloat(balance),
      type: 'account_opening',
      description: `New ${accountType} account opened`,
      status: 'completed',
      metadata: {
        accountNumber,
        ifscCode
      }
    });

    // Create notification
    const notification = new Notification({
      userId: req.user._id,
      title: 'New Account Created',
      message: `${accountType} account opened (${accountNumber}) with ₹${balance}`
    });

    await Promise.all([
      transaction.save({ session }),
      notification.save({ session })
    ]);

    await session.commitTransaction();

    res.json({
      success: true,
      account: {
        accountNumber,
        ifscCode,
        accountType,
        balance: parseFloat(balance)
      }
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Account creation error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Account creation failed'
    });
  } finally {
    session.endSession();
  }
});

app.post('/api/transactions/qr-payment', authenticate, async (req, res) => {
  try {
    const { recipientEmail, amount, description } = req.body;
    if (!recipientEmail || !amount) {
      return res.status(400).json({ success: false, message: 'Recipient email and amount required' });
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum)) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }

    const sender = await User.findById(req.user._id);
    const recipient = await User.findOne({ email: recipientEmail });

    if (!recipient) return res.status(404).json({ success: false, message: 'Recipient not found' });
    if (sender.balance < amountNum) {
      return res.status(400).json({ success: false, message: 'Insufficient balance' });
    }

    sender.balance -= amountNum;
    recipient.balance += amountNum;

    const senderTransaction = new Transaction({
      userId: sender._id,
      amount: -amountNum,
      type: 'qr_payment',
      description,
      recipient: recipient._id,
      recipientEmail,
      paymentMethod: 'wallet',
      status: 'completed'
    });

    const recipientTransaction = new Transaction({
      userId: recipient._id,
      amount: amountNum,
      type: 'qr_payment',
      description: `${description} (received)`,
      recipient: sender._id,
      paymentMethod: 'wallet',
      status: 'completed'
    });

    const senderNotification = new Notification({
      userId: sender._id,
      title: 'QR Payment Sent',
      message: `You sent ₹${amountNum.toFixed(2)} to ${recipient.name || recipient.email}`
    });

    const recipientNotification = new Notification({
      userId: recipient._id,
      title: 'QR Payment Received',
      message: `You received ₹${amountNum.toFixed(2)} from ${sender.name || sender.email}`
    });

    await Promise.all([
      sender.save(),
      recipient.save(),
      senderTransaction.save(),
      recipientTransaction.save(),
      senderNotification.save(),
      recipientNotification.save()
    ]);

    res.json({ success: true, message: 'QR payment processed', newBalance: sender.balance });
  } catch (error) {
    console.error('QR Payment Error:', error);
    res.status(500).json({ success: false, message: error.message || 'QR payment failed' });
  }
});

app.get('/api/admin/users', authenticate, isAdmin, async (req, res) => {
  try {
    const users = await User.find({}, '-password');
    res.send({ users });
  } catch (error) {
    res.status(500).send({ error: 'Failed to fetch users' });
  }
});

app.get('/api/admin/transactions', authenticate, isAdmin, async (req, res) => {
  try {
    const transactions = await Transaction.find().populate('userId', 'name email');
    res.send({ transactions });
  } catch (error) {
    res.status(500).send({ error: 'Failed to fetch transactions' });
  }
});

app.put('/api/admin/users/:userId/toggle-status', authenticate, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).send({ error: 'User not found' });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.send({ 
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    res.status(500).send({ error: 'Failed to update user status' });
  }
});

const SplitSchema = new mongoose.Schema({
  title: { type: String, required: true },
  totalAmount: { type: Number, required: true },
  description: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  participants: [{
    email: { type: String, required: true },
    amount: { type: Number, required: true },
    paid: { type: Boolean, default: false }
  }],
  transactions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' }],
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

// const Transaction = mongoose.model('Transaction', TransactionSchema);
const Split = mongoose.model('Split', SplitSchema);

// Updated Split Money Endpoint
app.post('/api/split-money', authenticate, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { title, totalAmount, description, participants } = req.body;
    const createdBy = req.user._id;

    // Validation
    if (!title || !totalAmount || !participants || participants.length === 0) {
      await session.abortTransaction();
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const total = parseFloat(totalAmount);
    if (isNaN(total) || total <= 0) {
      await session.abortTransaction();
      return res.status(400).json({ error: 'Invalid total amount' });
    }

    const sumOfParts = participants.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    if (Math.abs(sumOfParts - total) > 0.01) {
      await session.abortTransaction();
      return res.status(400).json({ error: 'Amounts do not add up to total' });
    }

    // Create split record
    const split = new Split({
      title,
      totalAmount: total,
      description,
      createdBy,
      participants,
      status: 'pending'
    });

    // Save split first to get its ID
    await split.save({ session });

    // Create transactions for each participant
    const transactionIds = [];
    for (const participant of participants) {
      const recipient = await User.findOne({ email: participant.email }).session(session);
      if (!recipient) {
        await session.abortTransaction();
        return res.status(400).json({ error: `User not found: ${participant.email}` });
      }

      const transaction = new Transaction({
        userId: createdBy,
        amount: parseFloat(participant.amount),
        type: 'split_payment',
        description: description || `${title} (split payment)`,
        recipient: recipient._id,
        recipientEmail: participant.email,
        status: 'pending',
        splitId: split._id
      });

      await transaction.save({ session });
      transactionIds.push(transaction._id);
    }

    // Update split with transaction references
    split.transactions = transactionIds;
    await split.save({ session });

    await session.commitTransaction();

    res.status(201).json({
      success: true,
      message: 'Money split successfully',
      split
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Split money error:', error);
    res.status(500).json({
      error: 'Failed to split money',
      details: error.message
    });
  } finally {
    session.endSession();
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});