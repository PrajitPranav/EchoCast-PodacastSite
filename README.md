# EchoCast - Full-Fledged Podcast Website

Welcome to your Podcast application! This project has been upgraded to a fully dynamic web application featuring user authentication, MongoDB integration, and a persistent global audio player.

## Features

- **JWT Authentication:** Secure User signup and login mechanism with persistent session tracking using `localStorage`.
- **MongoDB Backend:** Serves episodes and podcast data directly from the backend via REST APIs.
- **Dynamic Frontend:** Automatically fetches, renders, and loads the latest podcast episodes.
- **Global Audio Player:** A pinned, bottom-bar audio player built beautifully using vanilla HTML/CSS/JS, capable of scrubbing and volume control.
- **Premium Design:** Seamless aesthetics and visual excellence.

## How to Run It Flawlessly

### 1. Prerequisites

You must have **Node.js** installed on your system. You also need a **MongoDB** database. You can either use a local installation (like MongoDB Compass / Server) or a free cloud database like [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).

### 2. Set Up Environment Variables

In your `d:\Project\EchoCast\Podcast` directory, open or create a file named `.env`. It must contain the following keys:

```ini
PORT=5000
MONGO_URI=mongodb://localhost:27017/podcast-app
JWT_SECRET=supersecretpodcastkey
```
*(Replace `MONGO_URI` with your Atlas connection string if you are using the cloud).*

### 3. Install Dependencies

Open a terminal in the `d:\Project\EchoCast\Podcast` directory and install the necessary Node.js modules:

```bash
npm install
```

### 4. Start the Server

Run the backend Express server:

```bash
npm start
```
You should see:
```text
✅ MongoDB connected
🚀 Server running on http://localhost:3000
```

### 5. Seed Initial Data (Very Important!)

To populate the dynamic frontend with playable episodes without manually typing them into your database, run the following `curl` command (or use Postman) to hit the seed endpoint **while your server is running**:

```bash
curl -X POST http://localhost:3000/api/seed
```
This will insert four interactive podcast episodes with real audio files into your database.

### 6. View the App

Since this is a simple HTML frontend, there's no build step required for the frontend. Simply open `home.html` in your web browser, or use a tool like VS Code Live Server to serve it. 

*Try signing up, observe the personalized welcome message, and click on any episode carefully to see the Audio Player pop up and begin playing magically from the bottom screen.*
