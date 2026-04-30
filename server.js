const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const path = require("path");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, ".")));

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("✅ MongoDB connected"))
.catch(err => console.error("❌ MongoDB error:", err));

const userSchema = new mongoose.Schema({
  username: { type: String },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});
const User = mongoose.model("User", userSchema);

const episodeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: "" },
  host: { type: String, default: "Unknown Host" },
  coverImage: { type: String, default: "" },
  audioUrl: { type: String, default: "" },
  duration: { type: String, default: "0:00" },
  category: { type: String, default: "General" },
  createdAt: { type: Date, default: Date.now }
});
const Episode = mongoose.model("Episode", episodeSchema);

const reactionSchema = new mongoose.Schema({
  episodeId: { type: mongoose.Schema.Types.ObjectId, ref: "Episode", required: true },
  userId: { type: String, default: "anonymous" },
  reactionType: { type: String, required: true, enum: ["fire", "funny", "mindblowing", "relatable"] },
  timestamp: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});
const Reaction = mongoose.model("Reaction", reactionSchema);

const insightSchema = new mongoose.Schema({
  episodeId: { type: mongoose.Schema.Types.ObjectId, ref: "Episode", required: true },
  userId: { type: String, default: "anonymous" },
  timestamp: { type: Number, required: true },
  text: { type: String, required: true, maxlength: 500 },
  visibility: { type: String, enum: ["public", "private"], default: "public" },
  createdAt: { type: Date, default: Date.now }
});
const Insight = mongoose.model("Insight", insightSchema);

const JWT_SECRET = process.env.JWT_SECRET || "supersecretpodcastkey";

app.post("/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "Email already registered!" });
    const newUser = new User({ username, email, password });
    await newUser.save();
    const token = jwt.sign({ id: newUser._id, email: newUser.email }, JWT_SECRET, { expiresIn: "1d" });
    res.json({ message: "User registered successfully!", token });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found!" });
    if (user.password !== password) return res.status(400).json({ message: "Invalid credentials!" });
    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: "1d" });
    res.json({ message: "Login successful!", token, username: user.username });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/", (req, res) => res.redirect("/home.html"));

app.get("/api/episodes", async (req, res) => {
  try {
    const episodes = await Episode.find().sort({ createdAt: -1 });
    res.json(episodes);
  } catch (err) {
    res.status(500).json({ message: "Server error fetching episodes" });
  }
});

app.get("/api/episodes/:id", async (req, res) => {
  try {
    const episode = await Episode.findById(req.params.id);
    if (!episode) return res.status(404).json({ message: "Episode not found" });
    res.json(episode);
  } catch (err) {
    res.status(500).json({ message: "Server error fetching episode" });
  }
});

app.post("/api/episodes", async (req, res) => {
  try {
    const episode = new Episode(req.body);
    await episode.save();
    res.status(201).json({ message: "Episode created!", episode });
  } catch (err) {
    res.status(500).json({ message: "Server error creating episode", error: err.message });
  }
});

app.post("/api/reactions", async (req, res) => {
  try {
    const { episodeId, reactionType, timestamp, userId } = req.body;
    const reaction = new Reaction({ episodeId, reactionType, timestamp: Math.floor(timestamp || 0), userId: userId || "anonymous" });
    await reaction.save();
    res.status(201).json({ message: "Reaction saved!", reaction });
  } catch (err) {
    res.status(500).json({ message: "Error saving reaction", error: err.message });
  }
});

app.get("/api/reactions/:episodeId", async (req, res) => {
  try {
    const reactions = await Reaction.find({ episodeId: req.params.episodeId }).sort({ timestamp: 1 });
    res.json(reactions);
  } catch (err) {
    res.status(500).json({ message: "Error fetching reactions", error: err.message });
  }
});

app.post("/api/insights", async (req, res) => {
  try {
    const { episodeId, timestamp, text, visibility, userId } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ message: "Insight text is required" });
    const insight = new Insight({ episodeId, timestamp: Math.floor(timestamp || 0), text: text.trim(), visibility: visibility || "public", userId: userId || "anonymous" });
    await insight.save();
    res.status(201).json({ message: "Insight saved!", insight });
  } catch (err) {
    res.status(500).json({ message: "Error saving insight", error: err.message });
  }
});

app.get("/api/insights/:episodeId", async (req, res) => {
  try {
    const userId = req.query.userId || "anonymous";
    const insights = await Insight.find({
      episodeId: req.params.episodeId,
      $or: [{ visibility: "public" }, { userId }]
    }).sort({ timestamp: 1 });
    res.json(insights);
  } catch (err) {
    res.status(500).json({ message: "Error fetching insights", error: err.message });
  }
});

app.post("/api/seed", async (req, res) => {
  try {
    await Episode.deleteMany({});
    const episodes = [
      {
        title: "Breaking Through Fear & Doubt",
        description: "In this powerful episode, we explore the psychology behind fear and self-doubt. Learn proven mental frameworks and real-world techniques that high performers use to push through their limits, silence the inner critic, and take bold action every single day. Whether you're facing career anxiety, imposter syndrome, or just feeling stuck — this episode gives you the tools to break free.",
        host: "Nolan Bator",
        coverImage: "https://api.dicebear.com/7.x/adventurer/svg?seed=podcaster1",
        audioUrl: "https://ia800905.us.archive.org/19/items/FREE_background_music_dls/percentusethis.mp3",
        duration: "30:42",
        category: "Mindset"
      },
      {
        title: "Building Resilience in Tough Times",
        description: "Resilience isn't just bouncing back — it's bouncing forward. In this deeply insightful conversation, Maren Geidt shares stories of people who transformed adversity into their greatest advantage. Packed with actionable strategies for building mental toughness, finding meaning in struggle, and emerging stronger from every setback life throws your way.",
        host: "Maren Geidt",
        coverImage: "https://api.dicebear.com/7.x/adventurer/svg?seed=podcaster2",
        audioUrl: "https://ia800905.us.archive.org/19/items/FREE_background_music_dls/pocketmenuvariousartists.mp3",
        duration: "28:30",
        category: "Mindset"
      },
      {
        title: "Redefining Success in Life & Work",
        description: "What does success really mean in the modern world? Ruben Bergson challenges conventional definitions of achievement and invites us to reconsider our relationship with ambition, work-life balance, and fulfillment. A thought-provoking episode for anyone questioning the traditional ladder of success and searching for a path that truly feels right.",
        host: "Ruben Bergson",
        coverImage: "https://api.dicebear.com/7.x/adventurer/svg?seed=podcaster3",
        audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3",
        duration: "36:10",
        category: "Career"
      },
      {
        title: "Unlocking Your Full Potential",
        description: "Your greatest enemy is the ceiling you put on yourself. Maria Vaccaro dives deep into the science of human potential — exploring neuroplasticity, habit formation, and the surprising power of environment design in shaping who you become. A must-listen for anyone ready to level up and break through the invisible barriers holding them back.",
        host: "Maria Vaccaro",
        coverImage: "https://api.dicebear.com/7.x/adventurer/svg?seed=podcaster4",
        audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3",
        duration: "20:00",
        category: "Self-Growth"
      },
      {
        title: "The Future of AI & Human Creativity",
        description: "As artificial intelligence rapidly reshapes industries, what happens to human creativity? This episode examines the beautiful collaboration between human imagination and machine intelligence. Discover why the future belongs to those who learn to work alongside AI, and how to build skills that remain irreplaceable in an automated world.",
        host: "Aisha Patel",
        coverImage: "https://api.dicebear.com/7.x/adventurer/svg?seed=podcaster5",
        audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3",
        duration: "44:18",
        category: "Technology"
      },
      {
        title: "Climate Action: Every Voice Counts",
        description: "Climate change is the defining challenge of our generation. In this episode, we hear from activists, scientists, and everyday people making a real difference. Discover how individual action, community organizing, and policy advocacy can work together to create the lasting systemic change our planet urgently needs.",
        host: "Priya Sharma",
        coverImage: "https://api.dicebear.com/7.x/adventurer/svg?seed=podcaster6",
        audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3",
        duration: "38:55",
        category: "Environment"
      }
    ];
    await Episode.insertMany(episodes);
    res.json({ message: "Episodes seeded successfully!", count: episodes.length });
  } catch (err) {
    res.status(500).json({ message: "Error seeding data", error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
