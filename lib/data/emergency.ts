// ============================================
// 環島コックピット - 緊急情報（静的データ）
// ============================================

export const EMERGENCY_INFO = {
  emergencyNumber: '119',
  policeNumber: '110',
  taiwanRailwaysBikeInfo:
    'Taiwan Railways (TRA) allows folded bikes on all trains for free. Non-folded bikes are permitted on designated bike-friendly cars (兩鐵列車) with a half-price ticket. Reservations can be made online or at the station.',
  bikeRepairHotline: '0800-365-225 (Giant customer service hotline)',
  usefulLinks: [
    {
      name: '環島1號線 官方サイト',
      url: 'https://www.cycling-lifestyle.org.tw/',
    },
    {
      name: 'Taiwan Railways (台鐵)',
      url: 'https://www.railway.gov.tw/',
    },
    {
      name: 'Taiwan Cycling Route No.1 Map',
      url: 'https://www.taiwantrip.com.tw/',
    },
    {
      name: 'Giant レンタルバイク',
      url: 'https://www.giantcyclingworld.com/',
    },
    {
      name: '中央気象署 (天気予報)',
      url: 'https://www.cwa.gov.tw/',
    },
  ],
  tips: [
    '7-Eleven and FamilyMart offer free bike pump service at most locations',
    'Most train stations have bike assembly/disassembly areas near the entrance',
    'Carry your passport at all times - police checkpoints are common in remote areas',
    'Convenience stores (CVS) have free restrooms, Wi-Fi, and phone charging',
    'The Suhua Highway (蘇花公路) section is the most dangerous - consider the train bypass',
    'South to north (counter-clockwise) is slightly easier due to prevailing winds',
    'Hualien to Taitung has limited supply stops - stock up before departing',
    'Many temples offer free overnight stays for cyclists (ask politely)',
    'ibon machines at 7-Eleven can print maps and purchase train tickets',
    'Bring a headlight and taillight - tunnels on Route 1 can be very dark',
    'Tap water in Taiwan is not safe to drink - use boiled water or buy bottled',
    'Most police stations (派出所) will help cyclists with minor emergencies',
    'Download offline maps before entering mountain sections (signal is weak)',
    'Rest at milepost shelters (里程涼亭) along Route 1 - they have shade and water',
  ],
} as const;
