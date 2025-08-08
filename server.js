const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors()); // ✅ разрешает кросс-доменные запросы

const API_KEY = 'b826b731-8156-485e-b995-8c848d71784e';
const PLAYER_ID = 'a937e042-ad7c-4814-acd7-896ef6ddc72e';

app.get('/stats', async (req, res) => {
  try {
    const matches = await axios.get(
      `https://open.faceit.com/data/v4/players/${PLAYER_ID}/history?game=cs2&limit=30`,
      { headers: { Authorization: `Bearer ${API_KEY}` } }
    );

    let totalKills = 0, totalDeaths = 0, wins = 0, hsTotal = 0;
    const results = [];

    for (const match of matches.data.items) {
      const matchId = match.match_id;
      const matchStats = await axios.get(
        `https://open.faceit.com/data/v4/matches/${matchId}/stats`,
        { headers: { Authorization: `Bearer ${API_KEY}` } }
      );

      const round = matchStats.data.rounds[0];
      const playerStats = round.teams.flatMap(team => team.players)
        .find(p => p.player_id === PLAYER_ID);

      if (!playerStats) continue;

      const { Kills, Deaths, Headshots } = playerStats.stats;
      totalKills += parseInt(Kills);
      totalDeaths += parseInt(Deaths);
      hsTotal += parseInt(Headshots);

      const won = round.teams.find(t => t.team_id === playerStats.team_id).team_stats.TeamWin === "1";
      if (won) wins++;
      results.push(won ? "W" : "L");
    }

    const kd = (totalKills / totalDeaths).toFixed(2);
    const avgKills = (totalKills / matches.data.items.length).toFixed(1);
    const winRate = ((wins / matches.data.items.length) * 100).toFixed(1);
    const hsPercent = ((hsTotal / totalKills) * 100).toFixed(1);

    res.json({
      kd,
      avgKills,
      winRate,
      hsPercent,
      results
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
