const DEMO_PROFILE_INTERESTS = {
  demo_frontend_mira: [
    "frontend polish",
    "notification badges",
    "accessible component states",
    "small UI refactors"
  ],
  demo_indie_game_ren: [
    "indie game prototypes",
    "platformer feel",
    "tiny playtests",
    "game UI"
  ],
  demo_anime_sora: [
    "anime watchlists",
    "cozy sci-fi",
    "recommendation threads",
    "fandom notes"
  ],
  demo_market_ivy: [
    "paper-trading notes",
    "sample portfolio practice",
    "market education",
    "risk-free learning"
  ],
  demo_cyber_noah: [
    "local security labs",
    "fake data exercises",
    "password-audit practice",
    "safe learning environments"
  ],
  demo_backend_jules: [
    "backend APIs",
    "Postgres queries",
    "cache headers",
    "friendly error responses"
  ],
  demo_ui_lena: [
    "design systems",
    "button states",
    "neutral color naming",
    "interface clarity"
  ],
  demo_data_kai: [
    "data notebooks",
    "sample app events",
    "clean labels",
    "search demos"
  ],
  demo_cloud_ari: [
    "demo deploys",
    "health checks",
    "rollback notes",
    "DevOps checklists"
  ],
  demo_community_tess: [
    "demo community prompts",
    "build-in-public notes",
    "teammate shoutouts",
    "small project wins"
  ]
}

const getDemoProfileInterests = (username) => (
  DEMO_PROFILE_INTERESTS[username] || [
    "local sample content",
    "demo community discussion",
    "portfolio app testing"
  ]
)

module.exports = {
  DEMO_PROFILE_INTERESTS,
  getDemoProfileInterests
}
