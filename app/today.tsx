import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { CyclingColors } from '@/constants/Colors';
import { usePlanStore } from '@/lib/store/planStore';
import DayHeader from '@/components/today/DayHeader';
import SummaryCard from '@/components/today/SummaryCard';
import AdvisoryCards from '@/components/today/AdvisoryCards';
import SupplyPlan from '@/components/today/SupplyPlan';
import DayWaypointSection from '@/components/today/DayWaypointSection';
import RouteMap from '@/components/common/RouteMap';
import {
  buildGoogleMapsDirectionsUrl,
  GOOGLE_MAPS_WAYPOINT_LIMIT,
} from '@/lib/logic/mapsUrl';
import { getCoordinateAtKm } from '@/lib/data/route';
import { useWaypointStore } from '@/lib/store/waypointStore';
import RiskBar from '@/components/today/RiskBar';
import ElevationChart from '@/components/today/ElevationChart';
import { getRouteElevationProfile } from '@/lib/data/route';
import { getNearestBikeHotels } from '@/lib/data/bikeHotels';
import { getHospitalsInRange } from '@/lib/data/guideInfo';
import type { RiskSummary, BikeHotel } from '@/lib/types';

export default function TodayScreen() {
  const dayPlan = usePlanStore((s) => s.dayPlan);
  const selectedGoal = usePlanStore((s) => s.selectedGoal);
  const dayNumber = usePlanStore((s) => s.dayNumber);
  const sunTimes = usePlanStore((s) => s.sunTimes);
  const difficultyLevel = usePlanStore((s) => s.difficultyLevel);
  const riskSummary = usePlanStore((s) => s.riskSummary);
  const isLoading = usePlanStore((s) => s.isLoading);
  const waypoints = useWaypointStore((s) => s.waypoints);

  const handleOpenGoogleMaps = useCallback(() => {
    if (!dayPlan) return;
    const origin = getCoordinateAtKm(dayPlan.startKm);
    const destination = getCoordinateAtKm(dayPlan.endKm);
    if (!origin || !destination) return;

    const dayWaypoints = waypoints
      .filter(
        (w) =>
          w.kmFromStart > dayPlan.startKm + 0.5 &&
          w.kmFromStart < dayPlan.endKm - 0.5,
      )
      .slice(0, GOOGLE_MAPS_WAYPOINT_LIMIT)
      .map((w) => ({ lat: w.lat, lng: w.lng }));

    const url = buildGoogleMapsDirectionsUrl({
      origin,
      destination,
      waypoints: dayWaypoints,
      travelMode: 'bicycling',
    });

    Linking.openURL(url).catch((err) =>
      console.warn('Failed to open Google Maps:', err),
    );
  }, [dayPlan, waypoints]);

  // Default risk summary if none calculated
  const displayRisks: RiskSummary = useMemo(() => {
    if (riskSummary) return riskSummary;
    // Generate from day plan data
    if (!dayPlan) {
      return {
        climb: 'low',
        wind: 'low',
        heat: 'low',
        rain: 'low',
        supply: 'low',
        traffic: 'low',
        sunset: 'low',
      };
    }
    return {
      climb: dayPlan.elevationGainM > 1000 ? 'high' : dayPlan.elevationGainM > 500 ? 'medium' : 'low',
      wind: dayPlan.weather?.some((w) => w.windSpeedKmh > 30) ? 'high' : dayPlan.weather?.some((w) => w.windSpeedKmh > 15) ? 'medium' : 'low',
      heat: dayPlan.weather?.some((w) => w.tempC > 35) ? 'high' : dayPlan.weather?.some((w) => w.tempC > 30) ? 'medium' : 'low',
      rain: dayPlan.weather?.some((w) => w.precipitationProbability > 60) ? 'high' : dayPlan.weather?.some((w) => w.precipitationProbability > 30) ? 'medium' : 'low',
      supply: dayPlan.supplyPlan.length < 2 ? 'high' : dayPlan.supplyPlan.length < 4 ? 'medium' : 'low',
      traffic: 'low',
      sunset: 'low',
    };
  }, [riskSummary, dayPlan]);

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={CyclingColors.primary} />
        <Text style={styles.loadingText}>プランを準備中...</Text>
      </View>
    );
  }

  // No plan selected
  if (!dayPlan || !selectedGoal) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>📋</Text>
        <Text style={styles.emptyTitle}>プランが未選択です</Text>
        <Text style={styles.emptySubtitle}>
          ホーム画面でゴールを選択してください
        </Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonText}>ホームに戻る</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Find start name from current position
  const startName = `KP ${dayPlan.startKm}`;
  const endName = selectedGoal.nameZh;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* A. Day Header */}
        <DayHeader
          dayNumber={dayNumber}
          startName={startName}
          endName={endName}
          difficultyLevel={difficultyLevel}
        />

        {/* B. Summary Card */}
        <SummaryCard plan={dayPlan} sunTimes={sunTimes ?? undefined} />

        {/* B1. Route map (day segment) */}
        <RouteMap
          mode="day"
          highlightStartKm={dayPlan.startKm}
          highlightEndKm={dayPlan.endKm}
          title="🗺️ 今日のルート"
        />

        {/* B1b. Launch external nav */}
        <TouchableOpacity
          style={styles.gmapsButton}
          onPress={handleOpenGoogleMaps}
          activeOpacity={0.7}
        >
          <Text style={styles.gmapsButtonText}>
            🧭 Google Maps でナビを開く
          </Text>
        </TouchableOpacity>

        {/* B2. Today's waypoints */}
        <DayWaypointSection
          dayStartKm={dayPlan.startKm}
          dayEndKm={dayPlan.endKm}
        />

        {/* C. Advisory Cards */}
        <AdvisoryCards cards={dayPlan.advisoryCards} />

        {/* D. Supply Plan */}
        <SupplyPlan supplyPoints={dayPlan.supplyPlan} />

        {/* E. Risk Bar */}
        <RiskBar risks={displayRisks} />

        {/* F. Elevation Profile Chart */}
        <ElevationChart
          elevationProfile={getRouteElevationProfile()}
          startKm={dayPlan.startKm}
          endKm={dayPlan.endKm}
          hazards={dayPlan.hazards}
          checkpoints={dayPlan.checkpoints}
        />

        {/* G. Hotel Search & Bike-Friendly Hotels */}
        {selectedGoal.hasAccommodation && (() => {
          const nearbyHotels = getNearestBikeHotels(dayPlan.endKm, 5);
          return (
            <View style={styles.hotelSection}>
              <Text style={styles.hotelTitle}>🏨 宿泊を探す</Text>
              <View style={styles.hotelButtons}>
                <TouchableOpacity
                  style={[styles.hotelBtn, { backgroundColor: '#003580' }]}
                  onPress={() =>
                    Linking.openURL(
                      `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(selectedGoal.nameZh + ' 台灣')}`,
                    )
                  }
                  activeOpacity={0.7}
                >
                  <Text style={styles.hotelBtnText}>Booking.com</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.hotelBtn, { backgroundColor: '#FBCC33' }]}
                  onPress={() =>
                    Linking.openURL(
                      `https://www.expedia.com.tw/Hotel-Search?destination=${encodeURIComponent(selectedGoal.nameZh)}`,
                    )
                  }
                  activeOpacity={0.7}
                >
                  <Text style={[styles.hotelBtnText, { color: '#1a1a1a' }]}>
                    Expedia
                  </Text>
                </TouchableOpacity>
              </View>

              {nearbyHotels.length > 0 && (
                <View style={styles.bikeHotelList}>
                  <Text style={styles.bikeHotelLabel}>
                    🚲 自行車友善旅宿（ゴール付近）
                  </Text>
                  {nearbyHotels.map((hotel) => (
                    <View key={hotel.id} style={styles.bikeHotelItem}>
                      <TouchableOpacity
                        style={styles.bikeHotelInfo}
                        onPress={() =>
                          Linking.openURL(
                            `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(hotel.name)}`,
                          )
                        }
                        activeOpacity={0.6}
                      >
                        <Text style={styles.bikeHotelName} numberOfLines={1}>
                          {hotel.name}
                        </Text>
                        <Text style={styles.bikeHotelAddr} numberOfLines={1}>
                          {hotel.address}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() =>
                          Linking.openURL(
                            `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hotel.name + ' ' + hotel.address)}`,
                          )
                        }
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Text style={styles.bikeHotelMapHint}>MAP</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
          );
        })()}

        {/* H. Emergency: Hospitals */}
        {(() => {
          const hospitals = getHospitalsInRange(dayPlan.startKm, dayPlan.endKm);
          if (hospitals.length === 0) return null;
          return (
            <View style={styles.hospitalSection}>
              <Text style={styles.hospitalTitle}>🏥 緊急時の病院</Text>
              {hospitals.slice(0, 3).map((h, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.hospitalItem}
                  onPress={() =>
                    Linking.openURL(
                      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(h.name + ' ' + h.address)}`,
                    )
                  }
                  activeOpacity={0.6}
                >
                  <View style={styles.hospitalInfo}>
                    <Text style={styles.hospitalName} numberOfLines={1}>{h.name}</Text>
                    <Text style={styles.hospitalAddr} numberOfLines={1}>{h.address}</Text>
                  </View>
                  <Text style={styles.hospitalKm}>{Math.round(h.kmFromStart - dayPlan.startKm)} km</Text>
                </TouchableOpacity>
              ))}
            </View>
          );
        })()}

        {/* I. CTA Buttons */}
        <View style={styles.ctaContainer}>
          <TouchableOpacity
            style={styles.ctaPrimary}
            onPress={() => router.push('/next')}
            activeOpacity={0.7}
          >
            <Text style={styles.ctaPrimaryIcon}>🚴</Text>
            <Text style={styles.ctaPrimaryText}>走行開始</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.ctaSecondary}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Text style={styles.ctaSecondaryText}>ゴール変更</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CyclingColors.background,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: CyclingColors.background,
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: CyclingColors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: CyclingColors.background,
    paddingHorizontal: 24,
    gap: 8,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: CyclingColors.textPrimary,
  },
  emptySubtitle: {
    fontSize: 14,
    color: CyclingColors.textSecondary,
    textAlign: 'center',
  },
  backButton: {
    marginTop: 16,
    backgroundColor: CyclingColors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonText: {
    color: CyclingColors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  gmapsButton: {
    marginHorizontal: 16,
    marginTop: 8,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: CyclingColors.card,
    borderWidth: 1.5,
    borderColor: CyclingColors.primary,
    alignItems: 'center',
  },
  gmapsButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: CyclingColors.primary,
  },
  ctaContainer: {
    marginHorizontal: 16,
    marginTop: 24,
    gap: 10,
  },
  ctaPrimary: {
    flexDirection: 'row',
    backgroundColor: CyclingColors.primary,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    elevation: 4,
    shadowColor: CyclingColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  ctaPrimaryIcon: {
    fontSize: 24,
  },
  ctaPrimaryText: {
    color: CyclingColors.white,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 1,
  },
  ctaSecondary: {
    backgroundColor: CyclingColors.card,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: CyclingColors.cardBorder,
  },
  ctaSecondaryText: {
    color: CyclingColors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  hotelSection: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  hotelTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: CyclingColors.textPrimary,
    marginBottom: 8,
  },
  hotelButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  hotelBtn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  hotelBtnText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  bikeHotelList: {
    marginTop: 12,
  },
  bikeHotelLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: CyclingColors.textPrimary,
    marginBottom: 8,
  },
  bikeHotelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CyclingColors.card,
    borderRadius: 10,
    padding: 12,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: CyclingColors.divider,
  },
  bikeHotelInfo: {
    flex: 1,
  },
  bikeHotelName: {
    fontSize: 14,
    fontWeight: '600',
    color: CyclingColors.textPrimary,
  },
  bikeHotelAddr: {
    fontSize: 11,
    color: CyclingColors.textSecondary,
    marginTop: 2,
  },
  bikeHotelMapHint: {
    fontSize: 10,
    fontWeight: '800',
    color: CyclingColors.primary,
    backgroundColor: CyclingColors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
    marginLeft: 8,
  },
  hospitalSection: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  hospitalTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: CyclingColors.textSecondary,
    marginBottom: 6,
  },
  hospitalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CyclingColors.card,
    borderRadius: 8,
    padding: 10,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: CyclingColors.divider,
  },
  hospitalInfo: {
    flex: 1,
  },
  hospitalName: {
    fontSize: 13,
    fontWeight: '600',
    color: CyclingColors.textPrimary,
  },
  hospitalAddr: {
    fontSize: 11,
    color: CyclingColors.textSecondary,
  },
  hospitalKm: {
    fontSize: 12,
    fontWeight: '700',
    color: CyclingColors.textLight,
    marginLeft: 8,
  },
  bottomSpacer: {
    height: 40,
  },
});
