// ============================================
// 環島コックピット - i18n 翻訳データ
// 対応言語: ja (日本語), zh-TW (繁體中文)
// ============================================

export type Locale = 'ja' | 'zh-TW';

const ja = {
  // Navigation / app chrome
  appTitle: '環島コックピット',
  todayPlan: '今日のプラン',
  riding: '走行中',
  tripPlan: '旅程プラン',
  daySummary: 'デイサマリー',
  home: 'ホーム',
  today: '今日',

  // Common
  cancel: 'キャンセル',
  close: '閉じる',
  set: '設定',
  remove: '削除',
  delete: '削除',
  undo: '取り消す',
  confirm: '了解',
  noInfo: '情報なし',
  kmUnit: 'km',
  mUnit: 'm',
  minuteSuffix: (n: number) => `${n}分`,

  // Weekdays (short)
  weekdays: ['日', '月', '火', '水', '木', '金', '土'] as readonly string[],

  // Language
  langJa: '日本語',
  langZhTW: '繁體中文',

  // Offline
  offlineBanner: '📡 オフライン — キャッシュ済みデータで表示中',

  // Home screen
  currentPosition: '現在位置',
  change: '変更',
  targetDistance: '目標距離',
  goalCandidates: 'ゴール候補',
  showMore: 'もっと見る',
  showMajorOnly: '主要のみ表示',
  noGoalsAhead: '前方にゴール候補がありません',
  generatingPlan: 'プランを生成中...',
  createPlan: 'プランを作成',
  history: '旅行履歴',
  historyEmptyHint: '走行を完了するとここに記録されます',
  historySummary: (rides: number, km: string) => `${rides} 回 · 累計 ${km}km`,
  startDefaultName: '台北',

  // Goal / tier
  tierMajor: '主要',
  tierMid: '中間',
  tierMinor: '小規模',
  noAccommodation: '宿泊なし',
  noAccommodationTitle: '宿泊施設なし',
  noAccommodationMessage: (name: string, nearest: string) =>
    `${name} には宿泊施設がありません。最寄りの宿泊可能な場所: ${nearest}`,
  selectAnyway: 'そのまま選択',
  selectAlternative: '代替を選ぶ',

  // Position adjuster
  setPosition: '現在位置を設定',
  current: '現在',
  enterKm: 'km を入力...',
  startPointName: '台北/松山（出発点）',
  useGps: '📍 GPSで現在地を取得',
  gpsLocating: 'GPS取得中...',
  gpsPermissionDenied: 'GPS位置情報の権限がありません。設定アプリから許可してください。',
  gpsTimeout: 'GPS取得に時間がかかっています。屋外で再試行してください。',
  gpsOffRoute: (km: number) =>
    `ルートから約 ${km}km 離れた場所にいます。最寄りの KP を現在位置として設定しますか？`,
  gpsOffRouteConfirm: '設定する',
  gpsSet: (km: number) => `現在位置を KP ${km}km に設定しました`,

  // Today screen
  preparingPlan: 'プランを準備中...',
  noPlanSelected: 'プランが未選択です',
  selectGoalPrompt: 'ホーム画面でゴールを選択してください',
  backToHome: 'ホームに戻る',
  startRide: '走行開始',
  changeGoal: 'ゴール変更',
  rideLabel: 'ライド',
  todayRouteTitle: '🗺️ 今日のルート',
  openInGoogleMaps: '🧭 Google Maps でナビを開く',
  findHotels: '🏨 宿泊を探す',
  bikeFriendlyHotels: '🚲 自行車友善旅宿（ゴール付近）',
  emergencyHospitals: '🏥 緊急時の病院',

  // Ride date chips
  rideDateLabel: '走る日',
  rideDateToday: '今日',
  rideDateTomorrow: '明日',
  rideDateOffset: (n: number) => `+${n}日`,

  // Summary card (Today)
  todaySummary: '今日のサマリー',
  distance: '距離',
  elevation: '獲得標高',
  movingTime: '走行時間',
  totalTime: '所要時間',
  stopTimeSub: (minutes: number) => `+休憩 ${minutes}分`,
  sunrise: '日の出',
  sunset: '日没',
  temperature: '気温',
  windSpeed: '風速',
  precipitation: '降水確率',

  // Advisory
  advisoryTitle: '注意事項',

  // Supply plan
  supplyPlan: '補給プラン',
  noSupplyData: '補給ポイントデータなし',
  supplyLight: '軽食',
  supplyWater: '水分補給',
  supplyMeal: '食事',
  supplyFinal: '最終補給',
  findRestaurantsNearby: '🍽️ 周辺のレストランを探す',

  // Risk bar
  riskOverview: 'リスク概要',
  riskClimb: '登坂',
  riskWind: '風',
  riskHeat: '暑さ',
  riskRain: '雨',
  riskSupply: '補給',
  riskTraffic: '交通',
  riskSunset: '日没',

  // Elevation chart
  elevationProfile: '高低差プロファイル',
  noElevationData: '高低差データなし',
  steepSection: '急坂区間',
  supply: '補給',
  currentLocation: '現在地',

  // Waypoints
  waypointsTitle: '経由地',
  waypointsSubtitle: (count: number, max: number) => `${count} / ${max} 件`,
  waypointsEmpty: '経由地はまだありません',
  waypointsEmptyHint:
    '立ち寄りたい場所を追加すると、各日のプランに反映されます',
  addWaypoint: '+ 経由地を追加',
  addWaypointTitle: '経由地を追加',
  waypointLimitReached: (max: number) => `経由地は最大 ${max} 件までです`,
  clearWaypoints: 'すべて削除',
  clearWaypointsConfirm: '経由地をすべて削除しますか？',
  waypointCategoryAll: 'すべて',
  waypointCategoryAccommodation: '🏨 宿泊',
  waypointCategorySightseeing: '🏞️ 景勝地',
  waypointCategoryMajor: '⭐ 主要都市',
  waypointCategoryFood: '🍜 グルメ',
  waypointCategoryCustom: '📍 カスタム',
  added: '追加済',
  dayStops: (count: number) => `立ち寄り ${count} 箇所`,
  stopsOnDay: '立ち寄り',
  pickerSubtitleDay: (startKm: number, endKm: number, count: number, max: number) =>
    `今日の区間 (KP ${startKm}-${endKm}km) · ${count}/${max}`,
  scopeToday: '📍 今日の区間',
  scopeAll: '🗺️ 全区間',
  subtitleMajorWithLodging: '主要 · 宿泊可',
  subtitleLodging: '宿泊可',
  subtitleMajorCity: '主要都市',
  subtitleScenic: '景勝地',
  subtitleGourmet: 'グルメ',

  // Today waypoint section
  todayStopsTitle: '🛣️ 今日の立ち寄り',
  todayStopsSubtitle: (day: number, all: number, max: number) =>
    `${day} 箇所 ・ 全体 ${all}/${max}`,
  noStopsInRange: '今日の区間に立ち寄りはありません',
  stopOffsetFromStart: (offsetKm: number, routeKm: number) =>
    `スタートから +${offsetKm}km (KP ${routeKm})`,
  addStopButton: '+ 立ち寄りを追加',
  removeStopTitle: '立ち寄りから外しますか？',
  removeStopButton: '外す',

  // OSM search modal
  osmSearchTitle: '🔍 場所を検索',
  osmAddButtonFromPicker: '🔍 場所を検索して追加',
  osmHint:
    '名前や地名で検索できます。ルートから離れた場所はそのまま地図に表示され、立ち寄り順は最寄りのルート km で並びます。',
  osmPlaceholder: '例: 日月潭、九份老街、7-11 台南...',
  osmSearchButton: '検索',
  osmSearching: '検索中...',
  osmSearchFailed: (msg: string) => `検索失敗: ${msg}`,
  osmNoResults: '結果なし',
  osmDetour: (km: string) => `経路から ${km}km`,
  osmTodaySegment: '今日の区間',
  osmAddedNotice: (name: string, km: number) =>
    `✓ ${name} を追加しました (KP ${km}km)`,
  osmDuplicateNotice: '既に追加済みです',
  osmAddFailedNotice: (msg: string) => `追加失敗: ${msg}`,

  // Route map legend
  mapDefaultTitle: '🗺️ ルート',
  mapStart: 'スタート',
  mapGoal: 'ゴール',
  mapLegendHuandao: '環島一號線',
  mapLegendToday: '今日の区間',
  mapLegendWaypoints: (count: number) => `● 経由地 ${count}`,

  // Difficulty
  diffEasy: 'やさしい',
  diffModerate: 'ふつう',
  diffHard: 'きつい',
  diffCritical: '危険',

  // Next screen (riding)
  next: '次',
  after: 'その次',
  noNextEvent: '次のイベントなし',
  todayGoal: '本日のゴール',
  unconfirmed: '未確認',
  locationPermissionMissing: '📍 位置情報の権限がありません。設定から許可してください。',
  gpsTracking: (km: string) => `📡 GPS追跡中 — ${km} km`,
  arriveButton: 'ゴール到着',
  arriveConfirmTitle: 'ゴール到着',
  arriveConfirmMessage: (name: string) => `${name}に到着しましたか？`,
  notYet: 'まだ',
  yesArrived: '到着した',
  changeGoalConfirmTitle: 'ゴール変更',
  changeGoalConfirmMessage: '走行を中断してゴールを変更しますか？',
  changeConfirm: '変更する',
  exitRideTitle: '走行を中断しますか？',
  exitRideMessage: '走行中です。ホームに戻ると現在の走行セッションが終了します。',
  exitRideConfirm: '中断して戻る',
  exitRideKeepRiding: '走行を続ける',

  // Checkpoint types (display)
  cpSevenEleven: 'セブンイレブン',
  cpFamilyMart: 'ファミリーマート',
  cpHiLife: 'Hi-Life',
  cpOkMart: 'OK マート',
  cpWater: '水場',
  cpFood: '食事処',
  cpStation: '駅',
  cpBikeShop: '自転車店',
  cpPolice: '交番',
  cpViewpoint: '景観スポット',

  // Quick actions
  supplyDone: '補給済み',
  rest: '休憩',
  conditionNote: '体調メモ',
  supplyComplete: '補給完了',
  waterReset: '水分レベルをリセットしました',
  restRecorded: '休憩記録',
  restRecordedMsg: '休憩を記録しました',
  noteRecorded: 'メモ記録',
  noteRecordedMsg: '体調メモを記録しました',
  restLogPrefix: '休憩',
  noteLogPrefix: '体調メモ',

  // Condition panel
  conditionEta: 'ETA',
  conditionDelay: '遅延',
  conditionSunsetMargin: '日没余裕',
  conditionWind: '風',

  // Summary screen (arrival)
  arrivedTitle: '到着',
  arrivedAt: (name: string) => `📍 ${name} に到着`,
  ridingDistance: '走行距離',
  ridingTime: '走行時間',
  ridingNotes: '📝 走行メモ',
  finishRideTitle: 'ライドを完了',
  finishRideMessage: '記録を保存してホームに戻りますか？',
  finishConfirm: '完了する',

  // Cumulative stats
  cumulativeStats: '累計スタッツ',
  totalDistance: '累計距離',
  rideCount: 'ライド回数',
  avgDistance: '平均距離',
  totalRidingTime: '総走行時間',
  totalElevationGain: '総獲得標高',
  rideCountUnit: '回',

  // History
  noHistory: 'まだ走行記録がありません',
  noHistorySub: 'ゴールに到着すると記録が残ります',
  totalProgress: '全体進捗',
  deleteRecordConfirm: 'この日の記録を削除しますか？',
  undoLastDay: '最後の記録を取り消す',
  undoLastDayConfirm: (goalName: string) =>
    `${goalName} への到着を取り消しますか？`,

  // Advisory messages
  advStrongHeadwind: '強い向かい風',
  advModerateHeadwind: '中程度の向かい風',
  advTailwind: '追い風',
  advMajorClimbing: '大きな登坂日',
  advSignificantClimbing: 'かなりの登坂',
  advModerateClimbing: '中程度の登坂',
  advExtremeHeat: '酷暑警報',
  advHeatAdvisory: '暑さ注意',
  advHeavyRain: '大雨予報',
  advRainLikely: '降雨の可能性',
  advPossibleShowers: 'にわか雨の可能性',
  advNoSupply: '補給ポイントなし',
  advLongSupplyGap: '長い補給空白区間',
  advSupplyGap: '補給空白区間',
  advDangerousSection: '危険区間',
  advCautionAhead: '前方注意',
  advArrivingAfterDark: '日没後の到着',
  advSunsetRisk: '日没リスク',
  advMonitorDaylight: '日照時間に注意',

  // Advisory bodies
  bodySunsetCritical: (minutesAfter: number) =>
    `現在のペースでは日没の約 ${minutesAfter} 分後に到着する見込みです。本日の走行距離を短縮するか、ペースを上げることを検討してください。台湾の幹線道路での夜間走行は非常に危険です。`,
  bodySunsetWarning: (minutesBefore: number) =>
    `到着予定は日没のわずか ${minutesBefore} 分前です。ペースを維持するか、早めの停止を検討してください。`,
  bodySunsetInfo: (minutesBefore: number) =>
    `到着予定は日没の約 ${minutesBefore} 分前です。ペースに注意してください。`,
  bodyStrongHeadwind: (maxWind: number) =>
    `最大 ${maxWind} km/h の強い向かい風が予想されます。大幅なペースダウンが見込まれます。待機またはルート変更を検討してください。`,
  bodyModerateHeadwind: (maxWind: number) =>
    `最大 ${maxWind} km/h の向かい風が予想されます。時間と体力に余裕を持ってください。`,
  bodyTailwind: (maxWind: number) =>
    `本日は最大 ${maxWind} km/h の追い風が期待できます。距離を稼ぐ好条件です。`,
  bodyClimbCritical: (gain: number, extra: string) =>
    `合計獲得標高: ${gain} m。${extra}`,
  bodyClimbCriticalDefault:
    'ペース配分に注意し、十分な食料と水を確保してください。',
  bodyClimbWarning: (gain: number) =>
    `合計獲得標高: ${gain} m。時間に余裕を持ち、登坂では体力を温存してください。`,
  bodyClimbInfo: (gain: number) => `本日の合計獲得標高: ${gain} m。`,
  bodyHeatCritical: (feelsLike: number) =>
    `体感温度は最高 ${feelsLike}°C に達する見込みです。ピーク時間帯（11:00〜14:00）は休憩してください。水分補給を大幅に増やしてください。`,
  bodyHeatWarning: (feelsLike: number) =>
    `体感温度は最高 ${feelsLike}°C に達する見込みです。早朝に出発し、日陰で休憩を取り、こまめに水分補給してください。`,
  bodyRainCritical: (mm: number, prob: number) =>
    `最大 ${mm} mm の降雨が予想されます（確率 ${prob}%）。路面が滑りやすくなります。レインギアの準備または待機を検討してください。`,
  bodyRainWarning: (prob: number, mm: number) =>
    `降雨が予想されます（確率 ${prob}%、約 ${mm} mm）。レインギアを準備し、下り坂では注意してください。`,
  bodyRainInfo: (prob: number) =>
    `降水確率 ${prob}%。レインギアの準備を検討してください。`,
  bodyNoSupply:
    '本日のルート上にコンビニや水源がありません。出発時にすべての食料と水を携行してください。',
  bodyLongSupplyGap: (gapKm: number) =>
    `${gapKm} km にわたって補給ポイントがありません。この区間に入る前に十分に補給してください。`,
  bodySupplyGap: (gapKm: number) =>
    `${gapKm} km にわたって補給ポイントがありません。補給計画を立ててください。`,
  bodyCautionAhead: (count: number) =>
    `本日のルートに ${count} 箇所の危険区間があります。交通量の多い区間やトンネルでは十分注意してください。`,

  // Supply plan reasons
  supplyReasonFinal: '本日最後の補給ポイント。水と食料を十分に補充してください。',
  supplyReasonBeforeGap: (gapKm: number) =>
    `${gapKm} km の補給空白区間の前。十分に補充してください。`,
  supplyReasonMealInTown: (townName: string) =>
    `${townName}付近。町で食事休憩に最適。`,
  supplyReasonMealMidpoint: '本日の中間地点付近。食事休憩に最適。',
  supplyReasonWaterRefill: '水の補充ポイント。',
  supplyReasonWaterGap: (distToNext: number) =>
    `次の補給まで ${distToNext} km。水を補充してください。`,
  supplyReasonLightStop: '任意の軽い立ち寄り。',
};

const zhTW: typeof ja = {
  // Navigation / app chrome
  appTitle: '環島駕駛艙',
  todayPlan: '今日的行程',
  riding: '騎行中',
  tripPlan: '旅程規劃',
  daySummary: '騎行總結',
  home: '首頁',
  today: '今日',

  // Common
  cancel: '取消',
  close: '關閉',
  set: '設定',
  remove: '移除',
  delete: '刪除',
  undo: '撤銷',
  confirm: '確定',
  noInfo: '無資訊',
  kmUnit: 'km',
  mUnit: 'm',
  minuteSuffix: (n: number) => `${n}分`,

  weekdays: ['日', '一', '二', '三', '四', '五', '六'] as readonly string[],

  langJa: '日本語',
  langZhTW: '繁體中文',

  offlineBanner: '📡 離線模式 — 顯示已快取的資料',

  // Home
  currentPosition: '目前位置',
  change: '變更',
  targetDistance: '目標距離',
  goalCandidates: '目的地候選',
  showMore: '顯示更多',
  showMajorOnly: '僅顯示主要',
  noGoalsAhead: '前方沒有目的地候選',
  generatingPlan: '正在建立行程...',
  createPlan: '建立行程',
  history: '騎行紀錄',
  historyEmptyHint: '完成騎行後會在此顯示紀錄',
  historySummary: (rides: number, km: string) => `${rides} 次 · 累計 ${km}km`,
  startDefaultName: '台北',

  tierMajor: '主要',
  tierMid: '中型',
  tierMinor: '小型',
  noAccommodation: '無住宿',
  noAccommodationTitle: '無住宿設施',
  noAccommodationMessage: (name: string, nearest: string) =>
    `${name} 沒有住宿設施。最近的住宿地點: ${nearest}`,
  selectAnyway: '仍然選擇',
  selectAlternative: '選擇其他',

  setPosition: '設定目前位置',
  current: '目前',
  enterKm: '輸入 km...',
  startPointName: '台北/松山（起點）',
  useGps: '📍 以 GPS 取得目前位置',
  gpsLocating: '定位中...',
  gpsPermissionDenied: '未取得 GPS 位置權限。請到設定中允許。',
  gpsTimeout: '定位花費時間較久，請在室外重試。',
  gpsOffRoute: (km: number) =>
    `目前位置距路線約 ${km}km。要將最近的 KP 設為目前位置嗎？`,
  gpsOffRouteConfirm: '設定',
  gpsSet: (km: number) => `已將目前位置設為 KP ${km}km`,

  preparingPlan: '準備行程中...',
  noPlanSelected: '尚未選擇行程',
  selectGoalPrompt: '請在首頁選擇目的地',
  backToHome: '返回首頁',
  startRide: '開始騎行',
  changeGoal: '變更目的地',
  rideLabel: '騎行',
  todayRouteTitle: '🗺️ 今日的路線',
  openInGoogleMaps: '🧭 用 Google Maps 導航',
  findHotels: '🏨 尋找住宿',
  bikeFriendlyHotels: '🚲 自行車友善旅宿（目的地附近）',
  emergencyHospitals: '🏥 緊急就醫',

  rideDateLabel: '騎行日',
  rideDateToday: '今天',
  rideDateTomorrow: '明天',
  rideDateOffset: (n: number) => `+${n}天`,

  todaySummary: '今日摘要',
  distance: '距離',
  elevation: '總爬升',
  movingTime: '騎行時間',
  totalTime: '所需時間',
  stopTimeSub: (minutes: number) => `+休息 ${minutes}分`,
  sunrise: '日出',
  sunset: '日落',
  temperature: '氣溫',
  windSpeed: '風速',
  precipitation: '降雨機率',

  advisoryTitle: '注意事項',

  supplyPlan: '補給計畫',
  noSupplyData: '無補給點資料',
  supplyLight: '輕食',
  supplyWater: '補水',
  supplyMeal: '用餐',
  supplyFinal: '最後補給',
  findRestaurantsNearby: '🍽️ 尋找附近餐廳',

  riskOverview: '風險概要',
  riskClimb: '爬坡',
  riskWind: '風',
  riskHeat: '高溫',
  riskRain: '雨',
  riskSupply: '補給',
  riskTraffic: '交通',
  riskSunset: '日落',

  elevationProfile: '海拔剖面圖',
  noElevationData: '無海拔資料',
  steepSection: '陡坡路段',
  supply: '補給',
  currentLocation: '目前位置',

  waypointsTitle: '途中停靠點',
  waypointsSubtitle: (count: number, max: number) => `${count} / ${max} 個`,
  waypointsEmpty: '尚未設定停靠點',
  waypointsEmptyHint: '新增想順路造訪的地點，會反映至每日行程',
  addWaypoint: '+ 新增停靠點',
  addWaypointTitle: '新增停靠點',
  waypointLimitReached: (max: number) => `停靠點最多 ${max} 個`,
  clearWaypoints: '全部清除',
  clearWaypointsConfirm: '確定要清除所有停靠點嗎？',
  waypointCategoryAll: '全部',
  waypointCategoryAccommodation: '🏨 住宿',
  waypointCategorySightseeing: '🏞️ 景點',
  waypointCategoryMajor: '⭐ 主要城市',
  waypointCategoryFood: '🍜 美食',
  waypointCategoryCustom: '📍 自訂',
  added: '已加入',
  dayStops: (count: number) => `停靠 ${count} 處`,
  stopsOnDay: '停靠點',
  pickerSubtitleDay: (startKm: number, endKm: number, count: number, max: number) =>
    `今日路段 (KP ${startKm}-${endKm}km) · ${count}/${max}`,
  scopeToday: '📍 今日路段',
  scopeAll: '🗺️ 全路段',
  subtitleMajorWithLodging: '主要 · 有住宿',
  subtitleLodging: '有住宿',
  subtitleMajorCity: '主要城市',
  subtitleScenic: '景點',
  subtitleGourmet: '美食',

  todayStopsTitle: '🛣️ 今日的停靠',
  todayStopsSubtitle: (day: number, all: number, max: number) =>
    `${day} 處 · 全部 ${all}/${max}`,
  noStopsInRange: '今日路段內沒有停靠點',
  stopOffsetFromStart: (offsetKm: number, routeKm: number) =>
    `從起點 +${offsetKm}km (KP ${routeKm})`,
  addStopButton: '+ 新增停靠',
  removeStopTitle: '要從停靠點移除嗎？',
  removeStopButton: '移除',

  osmSearchTitle: '🔍 搜尋地點',
  osmAddButtonFromPicker: '🔍 搜尋地點並新增',
  osmHint:
    '以名稱或地名搜尋。離路線較遠的地點會照原位顯示，停靠順序以最近的路線 km 排序。',
  osmPlaceholder: '例: 日月潭、九份老街、7-11 台南...',
  osmSearchButton: '搜尋',
  osmSearching: '搜尋中...',
  osmSearchFailed: (msg: string) => `搜尋失敗: ${msg}`,
  osmNoResults: '無結果',
  osmDetour: (km: string) => `距路線 ${km}km`,
  osmTodaySegment: '今日路段',
  osmAddedNotice: (name: string, km: number) =>
    `✓ 已新增 ${name} (KP ${km}km)`,
  osmDuplicateNotice: '已經新增過',
  osmAddFailedNotice: (msg: string) => `新增失敗: ${msg}`,

  mapDefaultTitle: '🗺️ 路線',
  mapStart: '起點',
  mapGoal: '終點',
  mapLegendHuandao: '環島一號線',
  mapLegendToday: '今日路段',
  mapLegendWaypoints: (count: number) => `● 停靠點 ${count}`,

  diffEasy: '輕鬆',
  diffModerate: '適中',
  diffHard: '困難',
  diffCritical: '危險',

  next: '下一個',
  after: '再下一個',
  noNextEvent: '沒有下一個事件',
  todayGoal: '今日目的地',
  unconfirmed: '未確認',
  locationPermissionMissing: '📍 沒有位置權限，請在設定中允許。',
  gpsTracking: (km: string) => `📡 GPS 追蹤中 — ${km} km`,
  arriveButton: '到達目的地',
  arriveConfirmTitle: '到達目的地',
  arriveConfirmMessage: (name: string) => `已經到達 ${name} 了嗎？`,
  notYet: '還沒',
  yesArrived: '已到達',
  changeGoalConfirmTitle: '變更目的地',
  changeGoalConfirmMessage: '要中斷騎行並變更目的地嗎？',
  changeConfirm: '變更',
  exitRideTitle: '要中斷騎行嗎？',
  exitRideMessage: '目前正在騎行中。返回首頁會結束此次騎行。',
  exitRideConfirm: '中斷並返回',
  exitRideKeepRiding: '繼續騎行',

  cpSevenEleven: '7-Eleven',
  cpFamilyMart: '全家',
  cpHiLife: '萊爾富',
  cpOkMart: 'OK 超商',
  cpWater: '補水站',
  cpFood: '用餐',
  cpStation: '車站',
  cpBikeShop: '單車店',
  cpPolice: '派出所',
  cpViewpoint: '觀景點',

  supplyDone: '已補給',
  rest: '休息',
  conditionNote: '身體狀況',
  supplyComplete: '補給完成',
  waterReset: '水分已重置',
  restRecorded: '休息紀錄',
  restRecordedMsg: '已記錄休息',
  noteRecorded: '備註紀錄',
  noteRecordedMsg: '已記錄身體狀況',
  restLogPrefix: '休息',
  noteLogPrefix: '身體狀況',

  conditionEta: 'ETA',
  conditionDelay: '延遲',
  conditionSunsetMargin: '日落餘裕',
  conditionWind: '風',

  arrivedTitle: '抵達',
  arrivedAt: (name: string) => `📍 已抵達 ${name}`,
  ridingDistance: '騎行距離',
  ridingTime: '騎行時間',
  ridingNotes: '📝 騎行備註',
  finishRideTitle: '完成騎行',
  finishRideMessage: '要儲存紀錄並返回首頁嗎？',
  finishConfirm: '完成',

  cumulativeStats: '累計統計',
  totalDistance: '累計距離',
  rideCount: '騎行次數',
  avgDistance: '平均距離',
  totalRidingTime: '總騎行時間',
  totalElevationGain: '總爬升高度',
  rideCountUnit: '次',

  noHistory: '尚無騎行紀錄',
  noHistorySub: '抵達目的地後會自動記錄',
  totalProgress: '整體進度',
  deleteRecordConfirm: '確定要刪除這筆紀錄嗎？',
  undoLastDay: '撤銷最近的紀錄',
  undoLastDayConfirm: (goalName: string) =>
    `要撤銷抵達 ${goalName} 的紀錄嗎？`,

  advStrongHeadwind: '強勁逆風',
  advModerateHeadwind: '中度逆風',
  advTailwind: '順風',
  advMajorClimbing: '大量爬坡',
  advSignificantClimbing: '顯著爬坡',
  advModerateClimbing: '中度爬坡',
  advExtremeHeat: '極端高溫警報',
  advHeatAdvisory: '高溫注意',
  advHeavyRain: '大雨預報',
  advRainLikely: '可能降雨',
  advPossibleShowers: '可能陣雨',
  advNoSupply: '無補給點',
  advLongSupplyGap: '長距離無補給區間',
  advSupplyGap: '補給空白區間',
  advDangerousSection: '危險路段',
  advCautionAhead: '前方注意',
  advArrivingAfterDark: '天黑後抵達',
  advSunsetRisk: '日落風險',
  advMonitorDaylight: '注意日照時間',

  bodySunsetCritical: (minutesAfter: number) =>
    `依目前配速，預計日落後約 ${minutesAfter} 分抵達。請考慮縮短今日騎行距離或加快配速。台灣主要道路的夜間騎行非常危險。`,
  bodySunsetWarning: (minutesBefore: number) =>
    `預計抵達時間距日落只剩 ${minutesBefore} 分。維持配速或考慮提早收車。`,
  bodySunsetInfo: (minutesBefore: number) =>
    `預計抵達時間距日落約 ${minutesBefore} 分。請留意配速。`,
  bodyStrongHeadwind: (maxWind: number) =>
    `預計最大 ${maxWind} km/h 的強勁逆風，配速將大幅下降。考慮等候或調整路線。`,
  bodyModerateHeadwind: (maxWind: number) =>
    `預計最大 ${maxWind} km/h 的逆風。請預留更多時間與體力。`,
  bodyTailwind: (maxWind: number) =>
    `今日預計最大 ${maxWind} km/h 順風，是增加距離的好條件。`,
  bodyClimbCritical: (gain: number, extra: string) =>
    `總爬升: ${gain} m。${extra}`,
  bodyClimbCriticalDefault: '注意配速分配，備妥足夠的糧食與飲水。',
  bodyClimbWarning: (gain: number) =>
    `總爬升: ${gain} m。預留充足時間，爬坡時溫存體力。`,
  bodyClimbInfo: (gain: number) => `今日總爬升: ${gain} m。`,
  bodyHeatCritical: (feelsLike: number) =>
    `體感溫度最高可達 ${feelsLike}°C。請在尖峰時段（11:00〜14:00）休息，大幅增加水分補給。`,
  bodyHeatWarning: (feelsLike: number) =>
    `體感溫度最高可達 ${feelsLike}°C。建議清晨出發、陰影處休息、勤補水分。`,
  bodyRainCritical: (mm: number, prob: number) =>
    `預計最大降雨量 ${mm} mm（機率 ${prob}%），路面濕滑。請準備雨具或考慮等候。`,
  bodyRainWarning: (prob: number, mm: number) =>
    `預計降雨（機率 ${prob}%、約 ${mm} mm）。請準備雨具，下坡時留意。`,
  bodyRainInfo: (prob: number) =>
    `降雨機率 ${prob}%。建議準備雨具。`,
  bodyNoSupply: '今日路線上沒有超商或水源，出發時請攜足糧食與飲水。',
  bodyLongSupplyGap: (gapKm: number) =>
    `連續 ${gapKm} km 沒有補給點。進入該路段前請充分補給。`,
  bodySupplyGap: (gapKm: number) =>
    `連續 ${gapKm} km 沒有補給點。請規劃補給方式。`,
  bodyCautionAhead: (count: number) =>
    `今日路線上有 ${count} 處危險路段。請在車流量大的區段和隧道內格外小心。`,

  supplyReasonFinal: '今日最後的補給點。請充分補充飲水與糧食。',
  supplyReasonBeforeGap: (gapKm: number) =>
    `即將進入 ${gapKm} km 無補給區間。請充分補給。`,
  supplyReasonMealInTown: (townName: string) =>
    `${townName}附近。適合在市區用餐休息。`,
  supplyReasonMealMidpoint: '今日路段的中間點附近。適合用餐休息。',
  supplyReasonWaterRefill: '可補水的地點。',
  supplyReasonWaterGap: (distToNext: number) =>
    `距下一個補給 ${distToNext} km。請補水。`,
  supplyReasonLightStop: '可視情況簡單停靠。',
};

const translations = { ja, 'zh-TW': zhTW } as const;

export default translations;
