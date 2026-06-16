import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";

const app = express();

app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "Lorebook API running with Supabase"
  });
});

/* =========================
   SEARCH LORE
========================= */

app.post("/search-lore", async (req, res) => {
  try {
    const { campaign, query } = req.body;

    const { data, error } =
      await supabase
        .from("lorebook")
        .select("*")
        .eq("campaign", campaign);

    if (error) {
      return res.status(500).json(error);
    }

    const q = (query || "").toLowerCase();

    const results = data.filter(entry => {
      const name =
        (entry.name || "").toLowerCase();

      const content =
        (entry.content || "").toLowerCase();

      const keys =
        entry.keys || [];

      return (
        name.includes(q) ||
        content.includes(q) ||
        keys.some(key =>
          String(key)
            .toLowerCase()
            .includes(q)
        )
      );
    });

    res.json({ results });
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

/* =========================
   ADD LORE
========================= */

app.post("/add-lore", async (req, res) => {
  try {
    const {
      campaign,
      name,
      keys,
      content
    } = req.body;

    const { data, error } =
      await supabase
        .from("lorebook")
        .insert([
          {
            campaign,
            name,
            keys,
            content
          }
        ])
        .select();

    if (error) {
      return res.status(500).json(error);
    }

    res.json({
      success: true,
      added: data[0]
    });
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

/* =========================
   UPDATE LORE
========================= */

app.post("/update-lore", async (req, res) => {
  try {
    const {
      campaign,
      name,
      keys,
      content
    } = req.body;

    const { data: existing, error: findError } =
      await supabase
        .from("lorebook")
        .select("*")
        .eq("campaign", campaign)
        .eq("name", name)
        .limit(1);

    if (findError) {
      return res.status(500).json(findError);
    }

    if (!existing.length) {
      return res.status(404).json({
        success: false,
        error:
          "Entry not found. Use add-lore."
      });
    }

    const updateData = {};

    if (keys !== undefined)
      updateData.keys = keys;

    if (content !== undefined)
      updateData.content = content;

    const {
      data,
      error
    } = await supabase
      .from("lorebook")
      .update(updateData)
      .eq("campaign", campaign)
      .eq("name", name)
      .select();

    if (error) {
      return res.status(500).json(error);
    }

    res.json({
      success: true,
      mode: "updated",
      entry: data[0]
    });
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

/* =========================
   ADMIN LOREBOOK
========================= */

app.get(
  "/admin/lorebook/:campaign",
  async (req, res) => {
    try {
      const campaign =
        req.params.campaign;

      const { data, error } =
        await supabase
          .from("lorebook")
          .select("*")
          .eq("campaign", campaign);

      if (error) {
        return res
          .status(500)
          .json(error);
      }

      res.json({
        campaign,
        count: data.length,
        entries: data
      });
    } catch (err) {
      res.status(500).json({
        error: err.message
      });
    }
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
