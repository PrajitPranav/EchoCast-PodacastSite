const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("✅ MongoDB connected"))
.catch(err => console.error("❌ MongoDB error:", err));

// --- Schemas & Models ---
const userSchema = new mongoose.Schema({
  username: { type: String },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});
const User = mongoose.model("User", userSchema);

const podcastSchema = new mongoose.Schema({
  title: String,
  host: String,
  coverImage: String,
  category: String
});
const Podcast = mongoose.model("Podcast", podcastSchema);

const episodeSchema = new mongoose.Schema({
  title: String,
  host: String, // Kept to display on card easily
  coverImage: String,
  audioUrl: String,
  duration: String,
  podcastId: { type: mongoose.Schema.Types.ObjectId, ref: 'Podcast' }
});
const Episode = mongoose.model("Episode", episodeSchema);

// --- Auth Routes ---
const JWT_SECRET = process.env.JWT_SECRET || "supersecretpodcastkey";

app.post("/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Email already registered!" });
    }
    const newUser = new User({ username, email, password });
    await newUser.save();
    
    const token = jwt.sign({ id: newUser._id, email: newUser.email }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ message: "User registered successfully!", token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found!" });
    if (user.password !== password) {
      return res.status(400).json({ message: "Invalid credentials!" });
    }
    
    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ message: "Login successful!", token, username: user.username });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// --- API Routes ---
app.get("/api/episodes", async (req, res) => {
  try {
    const episodes = await Episode.find();
    res.json(episodes);
  } catch (err) {
    res.status(500).json({ message: "Server error fetching episodes" });
  }
});

// --- Seed Data Route (for development purposes) ---
app.post("/api/seed", async (req, res) => {
  try {
    await Episode.deleteMany({});
    
    const dummyEpisodes = [
      {
        title: "Breaking Through Fear & Doubt",
        host: "Nolan Bator",
        coverImage: "https://api.dicebear.com/7.x/adventurer/svg?seed=podcaster1",
        audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
        duration: "30:42"
      },
      {
        title: "Building Resilience in Tough Times",
        host: "Maren Geidt",
        coverImage: "https://api.dicebear.com/7.x/adventurer/svg?seed=podcaster2",
        audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
        duration: "28:30"
      },
      {
        title: "Redefining Success in Life & Work",
        host: "Ruben Bergson",
        coverImage: "https://api.dicebear.com/7.x/adventurer/svg?seed=podcaster3",
        audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
        duration: "36:10"
      },
      {
        title: "Unlocking Your Full Potential",
        host: "Maria Vaccaro",
        coverImage: "https://api.dicebear.com/7.x/adventurer/svg?seed=podcaster4",
        audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
        duration: "20:00"
      }
    ];

    await Episode.insertMany(dummyEpisodes);
    res.json({ message: "Dummy episodes seeded successfully!" });
  } catch (err) {
    res.status(500).json({ message: "Error seeding data", error: err });
  }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
