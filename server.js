import express from "express";
import cors from "cors";
import fs from "fs";

const app = express();

app.use(cors());
app.use(express.json());

function getLorebookPath(campaign) {
  return `./lorebooks/${campaign}.json`;
}

function getStatePath(campaign) {
  return `./lorebooks/${campaign}_state.json`;
}

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
  const { campaign, query } = req.body;

  const lorebook = readJson(
    getLorebookPath(campaign || "default"),
    []
  );

const q = (query || "").toLowerCase();

const results = lorebook.filter(entry => {
  const name = (entry.name || "").toLowerCase();
  const content = (entry.content || "").toLowerCase();
  const keys = entry.keys || [];

  return (
    name.includes(q) ||
    content.includes(q) ||
    keys.some(key => {
      const k = String(key).toLowerCase();
      return q.includes(k) || k.includes(q);
    })
  );
});

  res.json({ results });
});

app.post("/save-state", (req, res) => {
  const { campaign, state } = req.body;

  const states = readJson(
    getStatePath(campaign || "default"),
    []
  );

  const saved = {
    time: new Date().toISOString(),
    state
  };

  states.push(saved);

  writeJson(
    getStatePath(campaign || "default"),
    states
  );

  res.json({
    success: true,
    saved
  });
});

app.post("/add-lore", (req, res) => {
  const {
    campaign,
    name,
    keys,
    content
  } = req.body;

  const lorebook = readJson(
    getLorebookPath(campaign || "default"),
    []
  );

  const newEntry = {
    name,
    keys,
    content
  };

  lorebook.push(newEntry);

  writeJson(
    getLorebookPath(campaign || "default"),
    lorebook
  );

  res.json({
    success: true,
    added: newEntry
  });
});

app.post("/update-lore", (req, res) => {
  const {
    campaign,
    name,
    keys,
    content
  } = req.body;

  const lorebook = readJson(
    getLorebookPath(campaign || "default"),
    []
  );

  const index = lorebook.findIndex(
    entry => entry.name === name
  );

  if (index === -1) {
    const newEntry = {
      name,
      keys,
      content
    };

    lorebook.push(newEntry);

    writeJson(
      getLorebookPath(campaign || "default"),
      lorebook
    );

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

  writeJson(
    getLorebookPath(campaign || "default"),
    lorebook
  );

  res.json({
    success: true,
    mode: "updated",
    entry: lorebook[index]
  });
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Lorebook API running");
});
