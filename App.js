import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";

const MMH2O_TO_KPA = 0.00980665; // 1 mmH2O → kPa
const GOOD_TOLERANCE_KPA = 0.5;  // 오차 양호 기준 (원하면 숫자만 바꾸면 됨)

export default function App() {
  // 압력 계산 입력값
  const [mmh2o, setMmh2o] = useState("");
  const [deviceKpa, setDeviceKpa] = useState("");

  // 계산 결과
  const [calcResult, setCalcResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  // Offset 조정 기록 (기기장치번호 기준)
  const [deviceId, setDeviceId] = useState("");
  const [oldOffset, setOldOffset] = useState("");
  const [newOffset, setNewOffset] = useState("");
  const [offsetLogs, setOffsetLogs] = useState([]);

  // 압력 계산
  const handleCalc = () => {
    setErrorMsg("");
    const mmVal = parseFloat(mmh2o.replace(",", "."));
    const devVal = parseFloat(deviceKpa.replace(",", "."));

    if (isNaN(mmVal) || isNaN(devVal)) {
      setErrorMsg("수주계(mmH₂O)와 장치 압력(kPa)을 모두 숫자로 입력해주세요.");
      setCalcResult(null);
      return;
    }

    const realKpa = mmVal * MMH2O_TO_KPA; // 실제 압력(kPa)
    const diff = realKpa - devVal;        // 실제 - 장치
    const absDiff = Math.abs(diff);
    const relError = realKpa !== 0 ? (diff / realKpa) * 100 : 0;

    setCalcResult({
      realKpa,
      diff,
      absDiff,
      relError,
    });
  };

  // Offset 기록 추가
  const handleAddOffsetLog = () => {
    setErrorMsg("");
    const oldVal = parseFloat(oldOffset.replace(",", "."));
    const newVal = parseFloat(newOffset.replace(",", "."));

    if (isNaN(oldVal) || isNaN(newVal)) {
      setErrorMsg("Offset 값은 숫자로 입력해주세요.");
      return;
    }

    const delta = newVal - oldVal;
    const now = new Date();
    const ts =
      now.getFullYear() +
      "-" +
      String(now.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(now.getDate()).padStart(2, "0") +
      " " +
      String(now.getHours()).padStart(2, "0") +
      ":" +
      String(now.getMinutes()).padStart(2, "0");

    const log = {
      id: Date.now().toString(),
      deviceId: deviceId.trim() || "기기장치번호 미입력",
      oldVal,
      newVal,
      delta,
      ts,
    };

    setOffsetLogs((prev) => [log, ...prev]);
    setDeviceId("");
    setOldOffset("");
    setNewOffset("");
  };

  const resetAll = () => {
    setMmh2o("");
    setDeviceKpa("");
    setCalcResult(null);
    setDeviceId("");
    setOldOffset("");
    setNewOffset("");
    setOffsetLogs([]);
    setErrorMsg("");
  };

  const hasGoodError =
    calcResult && calcResult.absDiff <= GOOD_TOLERANCE_KPA;

  return (
    <SafeAreaView style={styles.safe}>
      {/* 헤더 */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>관말측정장치 보정 계산기</Text>
          <Text style={styles.subtitle}>
            수주계(mmH₂O) ↔ 장치 압력(kPa) 오차 · Offset 조정 기록
          </Text>
        </View>
        <TouchableOpacity style={styles.resetBtn} onPress={resetAll}>
          <Text style={styles.resetText}>초기화</Text>
        </TouchableOpacity>
      </View>

      {/* 단계 표시 */}
      <View style={styles.stepBar}>
        <View style={styles.stepItem}>
          <View style={[styles.stepCircle, styles.stepCircleActive]}>
            <Text style={styles.stepCircleText}>1</Text>
          </View>
          <Text style={styles.stepLabel}>압력 오차</Text>
        </View>
        <View style={styles.stepDivider} />
        <View style={styles.stepItem}>
          <View style={[styles.stepCircle, styles.stepCircleActive]}>
            <Text style={styles.stepCircleText}>2</Text>
          </View>
          <Text style={styles.stepLabel}>Offset 기록</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {/* 1. 압력 오차 계산 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. 압력 오차 계산</Text>
          <Text style={styles.sectionDesc}>
            관말 수주계 실제 압력(mmH₂O)과 장치 표시 압력(kPa)을 입력하면
            실제 압력을 kPa로 환산하고 오차를 자동 계산합니다.
          </Text>

          <View style={styles.inputRow}>
            <Text style={styles.label}>실제 압력 (수주계)</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="예: 200"
                placeholderTextColor="#6b7280"
                keyboardType="numeric"
                value={mmh2o}
                onChangeText={setMmh2o}
              />
              <Text style={styles.unitText}>mmH₂O</Text>
            </View>
          </View>

          <View style={styles.inputRow}>
            <Text style={styles.label}>장치 표시 압력</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="예: 2.0"
                placeholderTextColor="#6b7280"
                keyboardType="numeric"
                value={deviceKpa}
                onChangeText={setDeviceKpa}
              />
              <Text style={styles.unitText}>kPa</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.calcBtn} onPress={handleCalc}>
            <Text style={styles.calcBtnText}>압력 오차 계산하기</Text>
          </TouchableOpacity>

          {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

          {calcResult && (
            <View style={styles.resultCard}>
              <View
                style={[
                  styles.badgeRow,
                  hasGoodError ? styles.badgeRowGood : styles.badgeRowBad,
                ]}
              >
                <Text style={styles.badgeText}>
                  {hasGoodError ? "오차 양호" : "보정 필요"}
                </Text>
                <Text style={styles.badgeSubText}>
                  기준: ±{GOOD_TOLERANCE_KPA.toFixed(1)} kPa
                </Text>
              </View>

              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>실제 압력(환산)</Text>
                <Text style={styles.resultValue}>
                  {calcResult.realKpa.toFixed(3)} kPa
                </Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>오차 (실제 - 장치)</Text>
                <Text style={styles.resultValue}>
                  {calcResult.diff.toFixed(3)} kPa
                </Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>절대 오차</Text>
                <Text style={styles.resultValue}>
                  {calcResult.absDiff.toFixed(3)} kPa
                </Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>상대 오차</Text>
                <Text style={styles.resultValue}>
                  {calcResult.relError.toFixed(2)} %
                </Text>
              </View>

              <Text style={styles.formulaText}>
                ※ 환산식: 1 mmH₂O = 0.00980665 kPa
              </Text>
            </View>
          )}
        </View>

        {/* 2. Offset 조정 기록 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Offset 조정 기록</Text>
          <Text style={styles.sectionDesc}>
            오차가 있을 경우, 기기장치번호별로 Offset을 어떻게 조정했는지
            기록용으로 남길 수 있습니다.
          </Text>

          <View style={styles.inputRow}>
            <Text style={styles.label}>기기장치번호</Text>
            <TextInput
              style={styles.input}
              placeholder="예: 0000"
              placeholderTextColor="#6b7280"
              value={deviceId}
              onChangeText={setDeviceId}
            />
          </View>

          <View style={styles.inlineRow}>
            <View style={[styles.inlineCol, { marginRight: 6 }]}>
              <Text style={styles.label}>기존 Offset</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="예: 0.50"
                  placeholderTextColor="#6b7280"
                  keyboardType="numeric"
                  value={oldOffset}
                  onChangeText={setOldOffset}
                />
                <Text style={styles.unitText}>kPa</Text>
              </View>
            </View>

            <View style={[styles.inlineCol, { marginLeft: 6 }]}>
              <Text style={styles.label}>조정 후 Offset</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="예: 0.80"
                  placeholderTextColor="#6b7280"
                  keyboardType="numeric"
                  value={newOffset}
                  onChangeText={setNewOffset}
                />
                <Text style={styles.unitText}>kPa</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.saveBtn} onPress={handleAddOffsetLog}>
            <Text style={styles.saveBtnText}>Offset 조정 기록 추가</Text>
          </TouchableOpacity>

          {/* Offset 로그 리스트 */}
          {offsetLogs.length > 0 && (
            <View style={styles.logsSection}>
              <Text style={styles.logsTitle}>기기별 Offset 조정 이력</Text>
              {offsetLogs.map((log) => (
                <View key={log.id} style={styles.logItem}>
                  <Text style={styles.logDevice}>
                    {log.deviceId}
                    <Text style={styles.logTime}>  · {log.ts}</Text>
                  </Text>
                  <Text style={styles.logText}>
                    기존 Offset: {log.oldVal.toFixed(3)} kPa
                  </Text>
                  <Text style={styles.logText}>
                    조정 Offset: {log.newVal.toFixed(3)} kPa
                  </Text>
                  <Text style={styles.logText}>
                    변경량(ΔOffset):{" "}
                    <Text style={styles.logDelta}>
                      {log.delta >= 0 ? "+" : ""}
                      {log.delta.toFixed(3)} kPa
                    </Text>
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// 스타일
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#020617",
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    backgroundColor: "#020617",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    color: "#e5e7eb",
    fontSize: 18,
    fontWeight: "700",
  },
  subtitle: {
    color: "#9ca3af",
    fontSize: 11,
    marginTop: 2,
  },
  resetBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#4b5563",
  },
  resetText: {
    color: "#e5e7eb",
    fontSize: 11,
  },
  stepBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#111827",
    backgroundColor: "#020617",
  },
  stepItem: {
    alignItems: "center",
  },
  stepCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "#4b5563",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 3,
  },
  stepCircleActive: {
    backgroundColor: "#22c55e33",
    borderColor: "#22c55e",
  },
  stepCircleText: {
    color: "#bbf7d0",
    fontSize: 12,
    fontWeight: "600",
  },
  stepLabel: {
    color: "#e5e7eb",
    fontSize: 11,
  },
  stepDivider: {
    flex: 1,
    height: 1,
    backgroundColor: "#1f2937",
    marginHorizontal: 10,
  },
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    backgroundColor: "#020617",
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  sectionTitle: {
    color: "#e5e7eb",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 6,
  },
  sectionDesc: {
    color: "#9ca3af",
    fontSize: 12,
    marginBottom: 10,
  },
  inputRow: {
    marginBottom: 10,
  },
  label: {
    color: "#e5e7eb",
    fontSize: 12,
    marginBottom: 4,
  },
  inputWrapper: {
    position: "relative",
  },
  input: {
    backgroundColor: "#020617",
    borderWidth: 1,
    borderColor: "#374151",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: "#e5e7eb",
    fontSize: 13,
  },
  unitText: {
    position: "absolute",
    right: 10,
    top: 10,
    color: "#6b7280",
    fontSize: 11,
  },
  inlineRow: {
    flexDirection: "row",
    marginBottom: 10,
  },
  inlineCol: {
    flex: 1,
  },
  calcBtn: {
    marginTop: 6,
    backgroundColor: "#22c55e",
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: "center",
  },
  calcBtnText: {
    color: "#022c22",
    fontWeight: "700",
    fontSize: 13,
  },
  errorText: {
    color: "#fb923c",
    fontSize: 12,
    marginTop: 8,
  },
  resultCard: {
    marginTop: 10,
    backgroundColor: "#020617",
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  badgeRow: {
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  badgeRowGood: {
    backgroundColor: "#16a34a33",
  },
  badgeRowBad: {
    backgroundColor: "#f9731633",
  },
  badgeText: {
    color: "#f9fafb",
    fontSize: 12,
    fontWeight: "700",
  },
  badgeSubText: {
    color: "#e5e7eb",
    fontSize: 11,
  },
  resultRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  resultLabel: {
    color: "#e5e7eb",
    fontSize: 12,
  },
  resultValue: {
    color: "#4ade80",
    fontSize: 13,
    fontWeight: "600",
  },
  formulaText: {
    color: "#9ca3af",
    fontSize: 11,
    marginTop: 6,
  },
  saveBtn: {
    marginTop: 6,
    backgroundColor: "#38bdf8",
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: "center",
  },
  saveBtnText: {
    color: "#0f172a",
    fontWeight: "700",
    fontSize: 13,
  },
  logsSection: {
    marginTop: 12,
  },
  logsTitle: {
    color: "#e5e7eb",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6,
  },
  logItem: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#1f2937",
    padding: 8,
    marginBottom: 8,
    backgroundColor: "#020617",
  },
  logDevice: {
    color: "#bfdbfe",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 2,
  },
  logTime: {
    color: "#6b7280",
    fontSize: 11,
    fontWeight: "400",
  },
  logText: {
    color: "#e5e7eb",
    fontSize: 12,
  },
  logDelta: {
    color: "#fbbf24",
    fontWeight: "600",
  },
});