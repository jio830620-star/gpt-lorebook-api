import express from "express";
import cors from "cors";
import fs from "fs";

const app = express();

app.use(cors());
app.use(express.json());

const LOREBOOK_PATH = "./lorebook.json";
const STATE_PATH = "./state.json";

function readJson(path, fallback) {
  try {
    if (!fs.existsSync(path)) return fallback;
    return JSON.parse(fs.readFileSync(path, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJson(path, data) {
  fs.writeFileSync(path, JSON.stringify(data, null, 2), "utf8");
}

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "Lorebook API is running"
  });
});

app.post("/search-lore", (req, res) => {
  const query = req.body.query || "";
  const lorebook = readJson(LOREBOOK_PATH, []);

  const results = lorebook.filter(entry =>
    entry.keys?.some(key => query.includes(key))
  );

  res.json({ results });
});

app.post("/save-state", (req, res) => {
  const { state } = req.body;

  const states = readJson(STATE_PATH, []);

  const saved = {
    time: new Date().toISOString(),
    state
  };

  states.push(saved);
  writeJson(STATE_PATH, states);

  res.json({
    success: true,
    saved
  });
});

app.post("/add-lore", (req, res) => {
  const { name, keys, content } = req.body;

  const lorebook = readJson(LOREBOOK_PATH, []);

  const newEntry = {
    name,
    keys,
    content
  };

  lorebook.push(newEntry);
  writeJson(LOREBOOK_PATH, lorebook);

  res.json({
    success: true,
    added: newEntry
  });
});

app.post("/update-lore", (req, res) => {
  const { name, keys, content } = req.body;

  const lorebook = readJson(LOREBOOK_PATH, []);

  const index = lorebook.findIndex(entry => entry.name === name);

  if (index === -1) {
    const newEntry = { name, keys, content };
    lorebook.push(newEntry);
    writeJson(LOREBOOK_PATH, lorebook);

    return res.json({
      success: true,
      mode: "added",
      entry: newEntry
    });
  }

  lorebook[index] = {
    ...lorebook[index],
    keys: keys || lorebook[index].keys,
    content: content || lorebook[index].content
  };

  writeJson(LOREBOOK_PATH, lorebook);

  res.json({
    success: true,
    mode: "updated",
    entry: lorebook[index]
  });
});

app.listen(process.env.PORT || 3000);
