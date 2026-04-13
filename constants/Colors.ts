// ============================================
// 環島コックピット - カラーパレット
// 台湾をイメージしたカラースキーム
// Primary: 民進黨グリーン系
// Accent: 廟の朱赤・金
// ============================================

export const CyclingColors = {
  // 民進黨グリーン — 台湾の自然・環島の緑
  primary: '#1B7A3D',       // 台湾グリーン（民進黨旗ベース）
  primaryDark: '#145C2E',   // 深い森の緑
  primaryLight: '#D4EDDA',  // 淡い若葉

  // 廟の朱赤 — 台湾の伝統建築・媽祖廟
  accent: '#C8402A',        // 朱赤（廟の柱・門）
  accentDark: '#9E3221',    // 深い紅

  // 危険・警告
  critical: '#D32F2F',      // 警告赤
  criticalDark: '#B71C1C',

  // 成功・安全
  success: '#2E7D32',       // 竹の緑
  successDark: '#1B5E20',

  // 背景 — 温かみのある白（和紙・宣紙風）
  background: '#FAF8F5',    // 暖かいオフホワイト
  card: '#FFFFFF',
  cardBorder: '#E8E4DF',    // 自然な境界線
  textPrimary: '#2D2A26',   // 墨色
  textSecondary: '#6B6560',  // 薄墨
  textLight: '#B5AFA8',     // 淡墨
  white: '#FFFFFF',
  black: '#000000',
  divider: '#E8E4DF',

  // Supply checkpoint type colors — 台湾ブランドカラー
  supply: {
    seven_eleven: '#F17922',  // 7-Eleven オレンジ
    family_mart: '#00694B',   // FamilyMart グリーン
    hi_life: '#E53935',       // Hi-Life レッド
    ok_mart: '#0D47A1',       // OK Mart ブルー
    water: '#0277BD',         // 水・海の青
    food: '#E65100',          // 小吃の橙
    station: '#37474F',       // 台鉄ダークグレー
    bike_shop: '#5D4037',     // 木の茶
    police: '#1565C0',        // 警察ブルー
    viewpoint: '#00838F',     // 太平洋のティール
  },

  // Severity — 廟のカラーパレットから
  severity: {
    info: '#1B7A3D',          // 台湾グリーン
    infoBg: '#E8F5E9',        // 淡い緑
    warning: '#E8A317',       // 廟の金色
    warningBg: '#FFF8E1',     // 淡い金
    critical: '#C8402A',      // 朱赤
    criticalBg: '#FDECEA',    // 淡い朱
  },

  // Difficulty — 茶道の器を参考に
  difficulty: {
    Easy: '#2E7D32',          // 青竹
    Moderate: '#E8A317',      // 金茶
    Hard: '#C8402A',          // 朱赤
    Critical: '#B71C1C',      // 深紅
  },

  // Risk level
  risk: {
    low: '#2E7D32',           // 竹の緑
    medium: '#E8A317',        // 廟の金
    high: '#C8402A',          // 朱赤
  },
} as const;

// Legacy export for compatibility
const Colors = {
  light: {
    text: CyclingColors.textPrimary,
    background: CyclingColors.background,
    tint: CyclingColors.primary,
    tabIconDefault: CyclingColors.textLight,
    tabIconSelected: CyclingColors.primary,
  },
  dark: {
    text: '#fff',
    background: '#000',
    tint: '#fff',
    tabIconDefault: '#ccc',
    tabIconSelected: '#fff',
  },
};

export default Colors;
