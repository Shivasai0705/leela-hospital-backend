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
      <head><title>Leela Hospitals Backend</title></head>
      <body style="font-family: Arial; text-align: center; padding: 50px;">
        <h1 style="color: #f97316;">🏥 Leela Hospitals</h1>
        <p>Backend Server is Running ✅</p>
        <p><a href="/admin-dashboard.html">📊 Admin Dashboard</a></p>
        <p><a href="/api/appointments">📋 View Appointments API</a></p>
      </body>
    </html>
  `);
});

// ===== MONGODB ATLAS CONNECTION =====
mongoose.connect('mongodb+srv://shivasaikatukojwala590_db_user:u9g1NrMu8YiIZ6xk@leelahospitals.hyd0ps1.mongodb.net/hospital_db?retryWrites=true&w=majority&appName=LeelaHospitals')
  .then(() => console.log('✅ Connected to MongoDB Atlas!'))
  .catch(err => console.log('❌ MongoDB Error:', err));

// ===== SCHEMA =====
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
  doctor: { type: String, required: true },
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

const Appointment = mongoose.model('Appointment', appointmentSchema);

// ===== API ROUTES =====

// 1. POST - Book Appointment
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

// 2. GET - All Appointments
app.get('/api/appointments', async (req, res) => {
  try {
    const appointments = await Appointment.find().sort({ createdAt: -1 });
    res.json({ success: true, appointments });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. GET - Single Appointment
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

// 4. PUT - Update Status
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

// 5. DELETE - Delete Appointment
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

// 6. GET - Stats
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

// 7. GET - Search
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

// ===== START SERVER =====
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Admin Dashboard: http://localhost:${PORT}/admin-dashboard.html`);
  console.log(`📋 API Endpoint: http://localhost:${PORT}/api/appointments`);
});