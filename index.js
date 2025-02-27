const express = require('express');
const app = express();
const path = require("path");
const cors = require('cors');
const multer = require('multer');
const mongoose = require("mongoose");
const session = require('express-session');
const flash = require('connect-flash');
const ejsMate = require('ejs-mate');
const fs = require('fs');
require("dotenv").config();
const nodemailer = require("nodemailer");
const bodyParser = require("body-parser");


// Ensure 'uploads' directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

app.use(session({
    secret: "MySuperSecret",
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 1000 * 60 * 60 * 24 * 3,
        maxAge: 1000 * 60 * 60 * 24 * 3,
        httpOnly: true
    }
}));

app.use(flash());
app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'));

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

mongoose.connect('mongodb://127.0.0.1:27017/studentDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log("MongoDB Connected"))
.catch(err => console.error("MongoDB Connection Error:", err));


// Configure Nodemailer
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
// Define Student Schema
const studentSchema = new mongoose.Schema({
    name: String,
    enrollmentNo: String,
    branch: String,
    image: String
});

const Student = mongoose.model('Student', studentSchema);

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    next();
});

app.get('/home', (req, res) => {
    res.render('home.ejs');
});

app.get('/addData', (req, res) => {
    res.render("addData.ejs");
});

// Route to Handle Form Submission
app.post('/submit', upload.single('image'), async (req, res) => {
    try {
        const { name, enrollmentNo, branch } = req.body;
        const imagePath = req.file ? req.file.filename : null;

        // Check if the student already exists in the database
        const existingStudent = await Student.findOne({ enrollmentNo });

        if (existingStudent) {
            req.flash("error", "The student is already registered");
            return res.redirect('/addData');
        }

        // If student is not found, save the new entry
        const newStudent = new Student({ name, enrollmentNo, branch, image: imagePath });
        await newStudent.save();

        req.flash("success", "Data is Added Successfully");
        res.redirect('/addData');
    } catch (error) {
        console.error("❌ Error saving student data:", error);
        req.flash("error", "Error saving student data.");
        res.redirect('/addData');
    }
});

app.get('/students', async (req, res) => {
    try {
        const students = await Student.find();
        res.render("studentsData", { students });
    } catch (err) {
        console.error("❌ Error fetching students:", err);
        res.status(500).send("Internal Server Error");
    }
});


app.post("/send-email", (req, res) => {
    const { email, message } = req.body;
  
    const mailOptions = {
      from: email,
      to: "gouravsharma.s172@gmail.com", 
      subject: "New Feedback Received",
      text: `You have received feedback from ${email}:\n\n${message}`,
    };
  
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
        req.flash("success", "email is not send :(");
        res.redirect('/home');
      } else {
        req.flash("success", "email is send Successfully");
        res.redirect('/home');
      }
    });
  });
const port = 3000;
app.listen(port, () => {
    console.log(`✅ Server is running on http://localhost:${port}`);
});
