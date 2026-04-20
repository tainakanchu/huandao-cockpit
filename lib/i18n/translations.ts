// ============================================
// 環島コックピット - i18n 翻訳データ
// 対応言語: ja (日本語), zh-TW (繁體中文)
// ============================================

export type Locale = 'ja' | 'zh-TW';

const translations = {
  ja: {
    // Navigation
    appTitle: '環島コックピット',
    todayPlan: '今日のプラン',
    riding: '走行中',
    tripPlan: '旅程プラン',
    daySummary: 'デイサマリー',
    home: 'ホーム',
    today: '今日',

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
    daysOfPlan: (days: number) => `${days}日間のプラン`,
    todayGoalLabel: (name: string, km: string) => `今日のゴール: ${name} (${km}km)`,

    // Goal tiers
    tierMajor: '主要',
    tierMid: '中間',
    tierMinor: '小規模',

    // Accommodation
    noAccommodation: '宿泊なし',
    noAccommodationTitle: '宿泊施設なし',
    noAccommodationMessage: (name: string, nearest: string) =>
      `${name} には宿泊施設がありません。最寄りの宿泊可能な場所: ${nearest}`,
    selectAnyway: 'そのまま選択',
    selectAlternative: '代替を選ぶ',

    // Position adjuster
    setPosition: '現在位置を設定',
    current: '現在',
    cancel: 'キャンセル',
    set: '設定',
    enterKm: 'km を入力...',

    // Trip planner
    tripOverview: '旅程概要',
    days: '日間',
    totalElevation: '獲得標高',
    avgDaily: 'km/日 平均',
    targetDistancePerDay: '目標距離 / 日',
    autoGenerate: '自動生成',
    daySchedule: '日程プラン',
    createPlanPrompt: '「自動生成」を押してプランを作成してください',
    startTrip: (days: number) => `トリップ開始 (${days}日間)`,

    // Waypoints (BIWAICHI 風の経由地機能)
    waypointsTitle: '経由地',
    waypointsSubtitle: (count: number, max: number) =>
      `${count} / ${max} 件`,
    waypointsEmpty: '経由地はまだありません',
    waypointsEmptyHint: '立ち寄りたい場所を追加すると、各日のプランに反映されます',
    addWaypoint: '+ 経由地を追加',
    addWaypointTitle: '経由地を追加',
    waypointLimitReached: (max: number) =>
      `経由地は最大 ${max} 件までです`,
    clearWaypoints: 'すべて削除',
    clearWaypointsConfirm: '経由地をすべて削除しますか？',
    remove: '削除',
    waypointCategoryAll: 'すべて',
    waypointCategoryAccommodation: '🏨 宿泊',
    waypointCategorySightseeing: '🏞️ 景勝地',
    waypointCategoryMajor: '⭐ 主要都市',
    waypointCategoryFood: '🍜 グルメ',
    waypointCategoryCustom: '📍 カスタム',
    added: '追加済',
    dayStops: (count: number) => `立ち寄り ${count} 箇所`,
    noStopsOnDay: '立ち寄り予定なし',
    stopsOnDay: '立ち寄り',

    // Trip day card
    statusPlanned: '計画済',
    statusActive: '🔵 走行中',
    statusCompleted: '✅ 完了',
    statusSkipped: '⏭️ スキップ',
    skip: 'スキップ',

    // Day endpoint picker
    changeGoalForDay: (day: number) => `Day ${day} のゴールを変更`,
    departurePoint: (km: string) => `出発地点: KP ${km}km`,
    close: '閉じる',

    // Difficulty
    diffEasy: 'やさしい',
    diffModerate: 'ふつう',
    diffHard: 'きつい',
    diffCritical: '危険',

    // Today screen
    preparingPlan: 'プランを準備中...',
    noPlanSelected: 'プランが未選択です',
    selectGoalPrompt: 'ホーム画面でゴールを選択してください',
    backToHome: 'ホームに戻る',
    startRide: '走行開始',
    changeGoal: 'ゴール変更',

    // Summary card
    todaySummary: '今日のサマリー',
    distance: '距離',
    elevation: '獲得標高',
    estimatedTime: '予想時間',
    sunsetMargin: '日没余裕',
    temperature: '気温',
    windSpeed: '風速',
    precipitation: '降水確率',

    // Advisory
    advisoryTitle: '注意事項',

    // Supply
    supplyPlan: '補給プラン',
    noSupplyData: '補給ポイントデータなし',
    supplyLight: '軽食',
    supplyWater: '水分補給',
    supplyMeal: '食事',
    supplyFinal: '最終補給',

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

    // Next screen
    next: '次',
    after: 'その次',
    noNextEvent: '次のイベントなし',
    todayGoal: '本日のゴール',
    supplyDone: '補給済み',
    rest: '休憩',
    conditionNote: '体調メモ',
    supplyComplete: '補給完了',
    waterReset: '水分レベルをリセットしました',
    restRecorded: '休憩記録',
    restRecordedMsg: '休憩を記録しました',
    noteRecorded: 'メモ記録',
    noteRecordedMsg: '体調メモを記録しました',
    unconfirmed: '未確認',
    delay: '遅延',
    wind: '風',

    // Summary screen
    dayComplete: (day: number) => `第 ${day} 日 完了`,
    arrivedAt: (name: string) => `📍 ${name} に到着`,
    ridingDistance: '走行距離',
    ridingTime: '走行時間',
    dayBreakdown: (day: number) => `Day ${day} 内訳`,
    plannedDistance: '計画距離',
    plannedElevation: '計画標高',
    actualRidingTime: '実走行時間',
    ridingNotes: '📝 走行メモ',
    nextDay: '次の日へ進む',
    nextDayWithGoal: (name: string, km: string) =>
      `次の日: ${name} (${km}km)`,

    // Trip progress
    tripTimeline: '旅程タイムライン',
    noTripPlan: '旅程プランがまだ設定されていません',
    daysCompleted: '日完了',
    completed: '完了',
    inProgress: '走行中',
    planned: '予定',
    skipped: 'スキップ',

    // Cumulative stats
    cumulativeStats: '累計スタッツ',
    totalDistance: '走行距離',
    completedDays: '完了日数',
    avgDailyDistance: '平均日距離',
    totalRidingTime: '総走行時間',
    totalElevationGain: '総獲得標高',

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

    // History screen
    history: '旅行履歴',
    noHistory: 'まだ走行記録がありません',
    noHistorySub: 'ゴールに到着すると記録が残ります',
    totalProgress: '全体進捗',
    dayLabel: (day: number) => `第 ${day} 天`,
    delete: '削除',
    deleteRecordConfirm: 'この日の記録を削除しますか？',
    undoLastDay: '最後の日を取り消す',
    undoLastDayConfirm: (goalName: string) =>
      `${goalName} への到着を取り消して、前の日に戻りますか？`,
    undo: '取り消す',

    // Language switcher
    langJa: '日本語',
    langZhTW: '繁體中文',
    noInfo: '情報なし',
  },
  'zh-TW': {
    appTitle: '環島駕駛艙',
    todayPlan: '今日計畫',
    riding: '騎行中',
    tripPlan: '旅程規劃',
    daySummary: '日報總結',
    home: '首頁',
    today: '今日',

    currentPosition: '目前位置',
    change: '變更',
    targetDistance: '目標距離',
    goalCandidates: '目的地候選',
    showMore: '顯示更多',
    showMajorOnly: '僅顯示主要',
    noGoalsAhead: '前方沒有目的地候選',
    generatingPlan: '正在生成計畫...',
    createPlan: '建立計畫',
    daysOfPlan: (days: number) => `${days}天的計畫`,
    todayGoalLabel: (name: string, km: string) => `今日目的地: ${name} (${km}km)`,

    tierMajor: '主要',
    tierMid: '中型',
    tierMinor: '小型',

    noAccommodation: '無住宿',
    noAccommodationTitle: '無住宿設施',
    noAccommodationMessage: (name: string, nearest: string) =>
      `${name} 沒有住宿設施。最近的住宿地點: ${nearest}`,
    selectAnyway: '繼續選擇',
    selectAlternative: '選擇替代',

    setPosition: '設定目前位置',
    current: '目前',
    cancel: '取消',
    set: '設定',
    enterKm: '輸入 km...',

    tripOverview: '旅程概要',
    days: '天',
    totalElevation: '總爬升',
    avgDaily: 'km/日 平均',
    targetDistancePerDay: '每日目標距離',
    autoGenerate: '自動生成',
    daySchedule: '日程規劃',
    createPlanPrompt: '請按「自動生成」來建立計畫',
    startTrip: (days: number) => `開始旅程 (${days}天)`,

    // Waypoints
    waypointsTitle: '途中停靠點',
    waypointsSubtitle: (count: number, max: number) =>
      `${count} / ${max} 個`,
    waypointsEmpty: '尚未設定停靠點',
    waypointsEmptyHint: '新增想順路造訪的地點，會反映至每日行程',
    addWaypoint: '+ 新增停靠點',
    addWaypointTitle: '新增停靠點',
    waypointLimitReached: (max: number) =>
      `停靠點最多 ${max} 個`,
    clearWaypoints: '全部清除',
    clearWaypointsConfirm: '確定要清除所有停靠點嗎？',
    remove: '移除',
    waypointCategoryAll: '全部',
    waypointCategoryAccommodation: '🏨 住宿',
    waypointCategorySightseeing: '🏞️ 景點',
    waypointCategoryMajor: '⭐ 主要城市',
    waypointCategoryFood: '🍜 美食',
    waypointCategoryCustom: '📍 自訂',
    added: '已加入',
    dayStops: (count: number) => `停靠 ${count} 處`,
    noStopsOnDay: '當日無停靠',
    stopsOnDay: '停靠點',

    statusPlanned: '已規劃',
    statusActive: '🔵 進行中',
    statusCompleted: '✅ 完成',
    statusSkipped: '⏭️ 跳過',
    skip: '跳過',

    changeGoalForDay: (day: number) => `變更第 ${day} 天的目的地`,
    departurePoint: (km: string) => `出發點: KP ${km}km`,
    close: '關閉',

    diffEasy: '輕鬆',
    diffModerate: '適中',
    diffHard: '困難',
    diffCritical: '危險',

    preparingPlan: '正在準備計畫...',
    noPlanSelected: '尚未選擇計畫',
    selectGoalPrompt: '請在首頁選擇目的地',
    backToHome: '返回首頁',
    startRide: '開始騎行',
    changeGoal: '變更目的地',

    todaySummary: '今日摘要',
    distance: '距離',
    elevation: '總爬升',
    estimatedTime: '預估時間',
    sunsetMargin: '日落餘裕',
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

    next: '下一個',
    after: '再下一個',
    noNextEvent: '無下一個事件',
    todayGoal: '今日目的地',
    supplyDone: '已補給',
    rest: '休息',
    conditionNote: '身體狀況',
    supplyComplete: '補給完成',
    waterReset: '水分已重置',
    restRecorded: '休息紀錄',
    restRecordedMsg: '已記錄休息',
    noteRecorded: '備註紀錄',
    noteRecordedMsg: '已記錄身體狀況',
    unconfirmed: '未確認',
    delay: '延遲',
    wind: '風',

    dayComplete: (day: number) => `第 ${day} 天 完成`,
    arrivedAt: (name: string) => `📍 已到達 ${name}`,
    ridingDistance: '騎行距離',
    ridingTime: '騎行時間',
    dayBreakdown: (day: number) => `第 ${day} 天 明細`,
    plannedDistance: '計畫距離',
    plannedElevation: '計畫爬升',
    actualRidingTime: '實際騎行時間',
    ridingNotes: '📝 騎行備註',
    nextDay: '前往下一天',
    nextDayWithGoal: (name: string, km: string) =>
      `下一天: ${name} (${km}km)`,

    tripTimeline: '旅程時間軸',
    noTripPlan: '尚未設定旅程規劃',
    daysCompleted: '天完成',
    completed: '完成',
    inProgress: '進行中',
    planned: '已規劃',
    skipped: '跳過',

    cumulativeStats: '累計統計',
    totalDistance: '騎行距離',
    completedDays: '完成天數',
    avgDailyDistance: '平均每日距離',
    totalRidingTime: '總騎行時間',
    totalElevationGain: '總爬升高度',

    advStrongHeadwind: '強烈逆風',
    advModerateHeadwind: '中度逆風',
    advTailwind: '順風',
    advMajorClimbing: '大量爬坡日',
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
    advArrivingAfterDark: '天黑後到達',
    advSunsetRisk: '日落風險',
    advMonitorDaylight: '注意日照時間',

    // History screen
    history: '旅行紀錄',
    noHistory: '尚無騎行紀錄',
    noHistorySub: '到達目的地後會自動記錄',
    totalProgress: '整體進度',
    dayLabel: (day: number) => `第 ${day} 天`,
    delete: '刪除',
    deleteRecordConfirm: '確定要刪除這天的紀錄嗎？',
    undoLastDay: '撤銷最後一天',
    undoLastDayConfirm: (goalName: string) =>
      `確定要撤銷到達 ${goalName} 的紀錄，回到前一天嗎？`,
    undo: '撤銷',

    // Language switcher
    langJa: '日本語',
    langZhTW: '繁體中文',
    noInfo: '無資訊',
  },
} as const;

export default translations;
