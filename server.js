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
  } catch (err) {
    console.error("JSON READ ERROR:", err);
    return fallback;
  }
}

function writeJson(path, data) {
  fs.writeFileSync(
    path,
    JSON.stringify(data, null, 2),
    "utf8"
  );
}

function backupLorebook(path) {
  try {
    if (!fs.existsSync(path)) return;

    fs.copyFileSync(
      path,
      `${path}.bak`
    );

    console.log("BACKUP CREATED:", `${path}.bak`);
  } catch (err) {
    console.error("BACKUP ERROR:", err);
  }
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

  const path = getLorebookPath(
    campaign || "default"
  );

  const lorebook = readJson(path, []);

  backupLorebook(path);

  const newEntry = {
    name,
    keys,
    content
  };

  lorebook.push(newEntry);

  writeJson(path, lorebook);

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

  const path = getLorebookPath(
    campaign || "default"
  );

  const lorebook = readJson(path, []);

  if (lorebook.length === 0) {
    return res.status(500).json({
      success: false,
      error:
        "Lorebook empty. Update blocked."
    });
  }

  backupLorebook(path);

  const index = lorebook.findIndex(
    entry =>
      String(entry.name)
        .trim()
        .toLowerCase() ===
      String(name)
        .trim()
        .toLowerCase()
  );

  if (index === -1) {
    return res.status(404).json({
      success: false,
      error:
        "Entry not found. Use add-lore."
    });
  }

  lorebook[index] = {
    ...lorebook[index],
    keys:
      keys ?? lorebook[index].keys,
    content:
      content ??
      lorebook[index].content
  };

  writeJson(path, lorebook);

  res.json({
    success: true,
    mode: "updated",
    entry: lorebook[index]
  });
});

/* ===== 관리자 ===== */

app.get(
  "/admin/lorebook/:campaign",
  (req, res) => {
    const campaign =
      req.params.campaign;

    const lorebook = readJson(
      getLorebookPath(campaign),
      []
    );

    res.json({
      campaign,
      count: lorebook.length,
      entries: lorebook
    });
  }
);

app.get(
  "/admin/state/:campaign",
  (req, res) => {
    const campaign =
      req.params.campaign;

    const states = readJson(
      getStatePath(campaign),
      []
    );

    res.json({
      campaign,
      count: states.length,
      states
    });
  }
);

app.listen(
  process.env.PORT || 3000,
  () => {
    console.log(
      "Lorebook API running"
    );
  }
);
