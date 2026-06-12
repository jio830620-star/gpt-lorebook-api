import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

const lorebook = [
  {
    name: "루나 블러드하트",
    keys: ["루나", "블러드하트"],
    content: "진조 뱀파이어"
  }
];

app.post("/search-lore", (req, res) => {
  const query = req.body.query || "";

  const results = lorebook.filter(entry =>
    entry.keys.some(key => query.includes(key))
  );

  res.json({ results });
});

app.listen(process.env.PORT || 3000);
