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

/* ===========================
   기본 상태 확인
=========================== */

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "Lorebook API running with Supabase"
  });
});

/* ===========================
   로어 검색
=========================== */

app.post("/search-lore", async (req, res) => {
  try {
    const { campaign, query } = req.body;

    const { data, error } = await supabase
      .from("lorebook")
      .select("*")
      .eq("campaign", campaign);

    if (error) throw error;

    const q = (query || "").toLowerCase();

    const results = data.filter(entry => {
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

  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/* ===========================
   로어 추가
=========================== */

app.post("/add-lore", async (req, res) => {
  try {
    const {
      campaign,
      name,
      keys,
      content
    } = req.body;

    const { data, error } = await supabase
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

    if (error) throw error;

    res.json({
      success: true,
      added: data[0]
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/* ===========================
   로어 수정
=========================== */

app.post("/update-lore", async (req, res) => {
  try {
    const {
      campaign,
      name,
      keys,
      content
    } = req.body;

    const { data: existing } = await supabase
      .from("lorebook")
      .select("*")
      .eq("campaign", campaign)
      .eq("name", name)
      .limit(1);

    if (!existing.length) {
      return res.status(404).json({
        success: false,
        error: "Entry not found"
      });
    }

    const { data, error } = await supabase
      .from("lorebook")
      .update({
        keys:
          keys ?? existing[0].keys,
        content:
          content ?? existing[0].content
      })
      .eq("campaign", campaign)
      .eq("name", name)
      .select();

    if (error) throw error;

    res.json({
      success: true,
      entry: data[0]
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/* ===========================
   캠페인 전체 출력
=========================== */

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

      if (error) throw error;

      res.json({
        campaign,
        count: data.length,
        entries: data
      });

    } catch (err) {
      res.status(500).json({
        success: false,
        error: err.message
      });
    }
  }
);

/* ===========================
   세이브 저장
=========================== */

app.post("/save-state", async (req, res) => {
  try {
    const {
      campaign,
      state
    } = req.body;

    const { data, error } =
      await supabase
        .from("states")
        .insert([
          {
            campaign,
            state
          }
        ])
        .select();

    if (error) throw error;

    res.json({
      success: true,
      saved: data[0]
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/* ===========================
   세이브 조회
=========================== */

app.get(
  "/admin/state/:campaign",
  async (req, res) => {
    try {
      const campaign =
        req.params.campaign;

      const { data, error } =
        await supabase
          .from("states")
          .select("*")
          .eq("campaign", campaign);

      if (error) throw error;

      res.json({
        campaign,
        count: data.length,
        states: data
      });

    } catch (err) {
      res.status(500).json({
        success: false,
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
