import express from "express";
import helmet from "helmet";
import fs from "fs/promises";
import { readFileSync, writeFileSync } from "fs"; 
import bcrypt from "bcrypt";
import {authenticate} from "./middleware/authenticate.js";

//import watchlistRoutes from "./routes/watchlist.js";
import { get } from "http";
import path from "path";
import { fileURLToPath } from "url";
import jwt from "jsonwebtoken";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORT = process.env.PORT;
const app = express();

app.use(helmet());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Family Movie Watchlist API");
});

app.post("/api/auth/login", async (req, res) => {
  const username = req.body?.username;
  const password = req.body?.password;

  // 1. Strict validation: Must exist, must be a string, and cannot be empty or just spaces
  if (
    typeof username !== 'string' || 
    typeof password !== 'string' || 
    username.trim() === '' || 
    password.trim() === ''
  ) {
    return res.status(400).send();
  }

  const users = await getUsers();
  const user = users.find(u => u.username === username);
  if (!user) {
    return res.status(401).send();
  }
  if (!(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).send();
  }
  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role }, 
    process.env.JWT_SECRET, 
    { expiresIn: "1h" }
  );

  res.status(200).json({token});
})

app.use(authenticate);

app.get("/api/watchlist/:userId", (req, res) => {
  res.status(200).json({watchlist: getWatchlist(req.params.userId)});
})

app.post("/api/watchlist/:userId/movies", async (req, res) => {
  //GET MOVIE DATA
  if (req.user.role == "child" && req.user.id != req.params.userId) {
    return res.status(403).send();
  }
  const movieData = req.body;
  updateUserWatchlist(req.params.userId, "add", movieData);
  res.status(201).send();
})

app.put("/api/watchlist/:userId/movies/:movieId", async (req, res) => {
  if (req.user.role === "child" && req.user.id != req.params.userId) {
    return res.status(403).send();
  }
  const movieData = req.body;
  updateUserWatchlist(req.params.userId, "update", movieData, req.params.movieId);
  return res.status(200).send();
})

app.delete("/api/watchlist/:userId/movies/:movieId", async (req, res) => {
  if (req.user.role == "child" && req.user.id != req.params.userId) {
    return res.status(403).send();
  }
  if (req.user.role == "parent"
    || (req.user.role == "child" && req.user.id == req.params.userId) 
  ) {
    //GET MOVIE DATA
    const movieData = req.body;
    const movieId = Number(req.params.movieId);
    updateUserWatchlist(req.params.userId, "remove", movieData, movieId);
    res.status(200).send();
  }
})

//app.use("/api/watchlist", watchlistRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}...`);
});

async function getUsers() {
  const filePath = path.join(__dirname, 'data/users.json');
  const fileData = await fs.readFile(filePath, 'utf8');
  return JSON.parse(fileData);
}

async function getHash(data) {
  const hash = await bcrypt.hash(data, 12);
  return hash;
}

function getWatchlist(userId) {
  try {
    const filePath = path.join(__dirname, 'data/watchlists.json');
    const fileData = readFileSync(filePath, 'utf8');
    const watchlists = JSON.parse(fileData);
    return watchlists[String(userId)] || [];
  } catch (err) {
    if (err.code === 'ENOENT') {
      return [];
    }
    throw err;
  }
}
function updateUserWatchlist(userId, action, movieData, movieId) {
  let watchlists = {};
  const filePath = path.join(__dirname, 'data/watchlists.json');
  try {
    const fileData = readFileSync(filePath, 'utf8');
    watchlists = JSON.parse(fileData);
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.error("Error reading watchlist file:", err);
      throw err;
    }
  }
  const userKey = String(userId);
  if (!watchlists[userKey]) {
    watchlists[userKey] = [];
  }
  if (action === 'add') {
    const currentList = watchlists[userKey];
    const nextId = currentList.length > 0 
      ? Math.max(...currentList.map(movie => movie.id)) + 1 
      : 1;
    const newMovie = {
      id: nextId,
      title: movieData.title,
      genre: movieData.genre,
      watched: movieData.watched ?? false
    };
    watchlists[userKey].push(newMovie);
  } else if (action === 'update') {
    watchlists[userKey] = watchlists[userKey].map(movie => {
      if (movie.id === Number(movieId)) {
        return {
          ...movie,
          title: movieData.title !== undefined ? movieData.title : movie.title,
          genre: movieData.genre !== undefined ? movieData.genre : movie.genre,
          watched: movieData.watched !== undefined ? movieData.watched : movie.watched
        };
      }
      return movie;
    });
  } else if (action === 'remove') {
    watchlists[userKey] = watchlists[userKey].filter(movie => movie.id !== movieId);
  } else {
    throw new Error("Invalid action. Must be 'add' or 'remove'.");
  }
  writeFileSync(filePath, JSON.stringify(watchlists, null, 2), 'utf8');
}