const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// ===== MIDDLEWARE =====
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ===== ROOT ROUTE =====
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head><title>Dr. Mediequip+ & Leela Hospitals Backend</title></head>
      <body style="font-family: Arial; text-align: center; padding: 50px;">
        <h1 style="color: #1B3A6B;">🏥 Dr. Mediequip+</h1>
        <h2 style="color: #f97316;">& Leela Hospitals</h2>
        <p>Backend Server is Running ✅</p>
        <p><a href="/admin-dashboard.html">📊 Admin Dashboard</a></p>
      </body>
    </html>
  `);
});

// ===== MONGODB ATLAS CONNECTION =====
mongoose.connect('mongodb+srv://shivasaikatukojwala590_db_user:u9g1NrMu8YiIZ6xk@leelahospitals.hyd0ps1.mongodb.net/hospital_db?retryWrites=true&w=majority&appName=LeelaHospitals')
  .then(() => console.log('✅ Connected to MongoDB Atlas!'))
  .catch(err => console.log('❌ MongoDB Error:', err));

// ===== SCHEMAS =====

// 1. Leela Hospitals - Appointment Schema
const appointmentSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  dateOfBirth: Date,
  gender: String,
  address: String,
  city: String,
  state: String,
  zipCode: String,
  emergencyContact: String,
  emergencyPhone: String,
  appointmentDate: { type: Date, required: true },
  appointmentTime: { type: String, required: true },
  department: { type: String, required: true },
 
  reason: { type: String, required: true },
  symptoms: String,
  insuranceProvider: String,
  insuranceId: String,
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending' 
  },
  createdAt: { type: Date, default: Date.now }
});

// 2. Dr. Mediequip+ - Contact/Inquiry Schema
const inquirySchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  hospitalName: { type: String, required: true },
  categories: [String],
  specificEquipment: String,
  urgency: { 
    type: String, 
    enum: ['immediate', 'urgent', 'standard', 'planning'],
    required: true 
  },
  budget: { 
    type: String, 
    enum: ['under-50k', '50k-2lakh', '2lakh-10lakh', '10lakh-50lakh', 'above-50lakh'],
    required: true 
  },
  message: String,
  status: { 
    type: String, 
    enum: ['new', 'contacted', 'quoted', 'follow-up', 'closed'],
    default: 'new' 
  },
  source: { type: String, default: 'website' },
  notes: [{
    text: String,
    createdAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now }
});

// 3. User Schema for Admin Login
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['superadmin', 'admin', 'support'],
    default: 'admin' 
  },
  access: {
    leelaHospitals: { type: Boolean, default: true },
    mediequip: { type: Boolean, default: true }
  },
  createdAt: { type: Date, default: Date.now }
});

const Appointment = mongoose.model('Appointment', appointmentSchema);
const Inquiry = mongoose.model('Inquiry', inquirySchema);
const User = mongoose.model('User', userSchema);

// ===== API ROUTES =====

// ===== LEELA HOSPITALS ROUTES =====

// POST - Book Appointment
app.post('/api/appointments', async (req, res) => {
  try {
    const appointment = new Appointment(req.body);
    await appointment.save();
    console.log('📝 New Appointment:', appointment.firstName, appointment.lastName);
    res.status(201).json({ 
      success: true, 
      message: 'Appointment booked successfully!',
      appointment 
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET - All Appointments
app.get('/api/appointments', async (req, res) => {
  try {
    const appointments = await Appointment.find().sort({ createdAt: -1 });
    res.json({ success: true, appointments });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET - Single Appointment
app.get('/api/appointments/:id', async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ success: false, error: 'Appointment not found' });
    }
    res.json({ success: true, appointment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT - Update Appointment Status
app.put('/api/appointments/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!appointment) {
      return res.status(404).json({ success: false, error: 'Appointment not found' });
    }
    res.json({ success: true, appointment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE - Delete Appointment
app.delete('/api/appointments/:id', async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndDelete(req.params.id);
    if (!appointment) {
      return res.status(404).json({ success: false, error: 'Appointment not found' });
    }
    res.json({ success: true, message: 'Appointment deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET - Stats
app.get('/api/stats', async (req, res) => {
  try {
    const total = await Appointment.countDocuments();
    const pending = await Appointment.countDocuments({ status: 'pending' });
    const confirmed = await Appointment.countDocuments({ status: 'confirmed' });
    const completed = await Appointment.countDocuments({ status: 'completed' });
    const cancelled = await Appointment.countDocuments({ status: 'cancelled' });
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const todayAppointments = await Appointment.countDocuments({
      appointmentDate: { $gte: today, $lt: tomorrow }
    });

    res.json({
      success: true,
      stats: { 
        total, 
        pending, 
        confirmed, 
        completed, 
        cancelled, 
        today: todayAppointments 
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET - Search
app.get('/api/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      const appointments = await Appointment.find().sort({ createdAt: -1 });
      return res.json({ success: true, appointments });
    }
    const appointments = await Appointment.find({
      $or: [
        { firstName: { $regex: q, $options: 'i' } },
        { lastName: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { phone: { $regex: q, $options: 'i' } },
        { department: { $regex: q, $options: 'i' } },
        { doctor: { $regex: q, $options: 'i' } }
      ]
    });
    res.json({ success: true, appointments });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== DR. MEDIEQUIP+ ROUTES =====

// POST - Submit Inquiry
app.post('/api/inquiries', async (req, res) => {
  try {
    const inquiry = new Inquiry(req.body);
    await inquiry.save();
    console.log('📝 New Mediequip Inquiry:', inquiry.name, 'from', inquiry.hospitalName);
    res.status(201).json({ 
      success: true, 
      message: 'Inquiry submitted successfully!',
      inquiry 
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET - All Inquiries
app.get('/api/inquiries', async (req, res) => {
  try {
    const { status } = req.query;
    const query = status ? { status } : {};
    const inquiries = await Inquiry.find(query).sort({ createdAt: -1 });
    res.json({ success: true, inquiries });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET - Single Inquiry
app.get('/api/inquiries/:id', async (req, res) => {
  try {
    const inquiry = await Inquiry.findById(req.params.id);
    if (!inquiry) {
      return res.status(404).json({ success: false, error: 'Inquiry not found' });
    }
    res.json({ success: true, inquiry });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT - Update Inquiry Status
app.put('/api/inquiries/:id', async (req, res) => {
  try {
    const { status, notes } = req.body;
    const inquiry = await Inquiry.findById(req.params.id);
    if (!inquiry) {
      return res.status(404).json({ success: false, error: 'Inquiry not found' });
    }
    inquiry.status = status;
    if (notes) {
      inquiry.notes.push({ text: notes });
    }
    await inquiry.save();
    res.json({ success: true, inquiry });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE - Delete Inquiry
app.delete('/api/inquiries/:id', async (req, res) => {
  try {
    const inquiry = await Inquiry.findByIdAndDelete(req.params.id);
    if (!inquiry) {
      return res.status(404).json({ success: false, error: 'Inquiry not found' });
    }
    res.json({ success: true, message: 'Inquiry deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET - Mediequip Stats
app.get('/api/mediequip-stats', async (req, res) => {
  try {
    const total = await Inquiry.countDocuments();
    const newInquiries = await Inquiry.countDocuments({ status: 'new' });
    const contacted = await Inquiry.countDocuments({ status: 'contacted' });
    const quoted = await Inquiry.countDocuments({ status: 'quoted' });
    const followUp = await Inquiry.countDocuments({ status: 'follow-up' });
    const closed = await Inquiry.countDocuments({ status: 'closed' });
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const todayInquiries = await Inquiry.countDocuments({
      createdAt: { $gte: today, $lt: tomorrow }
    });

    res.json({
      success: true,
      stats: { 
        total, 
        new: newInquiries,
        contacted, 
        quoted, 
        followUp, 
        closed,
        today: todayInquiries 
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET - Combined Stats
app.get('/api/combined-stats', async (req, res) => {
  try {
    const appointments = await Appointment.aggregate([
      { $group: { 
        _id: null, 
        total: { $sum: 1 },
        pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
        confirmed: { $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] } },
        completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } }
      }}
    ]);

    const inquiries = await Inquiry.aggregate([
      { $group: { 
        _id: null, 
        total: { $sum: 1 },
        new: { $sum: { $cond: [{ $eq: ['$status', 'new'] }, 1, 0] } },
        contacted: { $sum: { $cond: [{ $eq: ['$status', 'contacted'] }, 1, 0] } },
        quoted: { $sum: { $cond: [{ $eq: ['$status', 'quoted'] }, 1, 0] } },
        followUp: { $sum: { $cond: [{ $eq: ['$status', 'follow-up'] }, 1, 0] } },
        closed: { $sum: { $cond: [{ $eq: ['$status', 'closed'] }, 1, 0] } }
      }}
    ]);

    res.json({
      success: true,
      stats: {
        appointments: appointments[0] || { total: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0 },
        inquiries: inquiries[0] || { total: 0, new: 0, contacted: 0, quoted: 0, followUp: 0, closed: 0 }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== START SERVER =====
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Admin Dashboard: http://localhost:${PORT}/admin-dashboard.html`);
});