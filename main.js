const fs = require("fs");

// ============================================================
// Function 1: getShiftDuration(startTime, endTime)
// startTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// endTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// Returns: string formatted as h:mm:ss
// ============================================================
function parseTimeToSeconds(timeStr) {
  timeStr = timeStr.trim().toLowerCase();
  const parts = timeStr.split(" ");
  const period = parts[1];
  const [hStr, mStr, sStr] = parts[0].split(":");
  let hours = parseInt(hStr, 10);
  const minutes = parseInt(mStr, 10);
  const seconds = parseInt(sStr, 10);
  if (period === "am") {
    if (hours === 12) hours = 0;
    } else {
    if (hours !== 12) hours += 12;
    }
 
  return hours * 3600 + minutes * 60 + seconds;
}

function secondsToDuration(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

function getShiftDuration(startTime, endTime) {
    // TODO: Implement this function
    const startSec = parseTimeToSeconds(startTime);
    const endSec = parseTimeToSeconds(endTime);
    let diff = endSec - startSec;
    if (diff < 0) diff += 24 * 3600;
    return secondsToDuration(diff);
}

// ============================================================
// Function 2: getIdleTime(startTime, endTime)
// startTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// endTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// Returns: string formatted as h:mm:ss
// ============================================================
function getIdleTime(startTime, endTime) {
    // TODO: Implement this function
  const startSec = parseTimeToSeconds(startTime);
  const endSec = parseTimeToSeconds(endTime);
  const deliveryStart = 8 * 3600;   
  const deliveryEnd   = 22 * 3600;
  let idle = 0;
  if (startSec < deliveryStart) {
    const earlyEnd = Math.min(endSec, deliveryStart);
    idle += earlyEnd - startSec;
  }
  if (endSec > deliveryEnd) {
    const lateStart = Math.max(startSec, deliveryEnd);
    idle += endSec - lateStart;
  }
  return secondsToDuration(idle);
}

// ============================================================
// Function 3: getActiveTime(shiftDuration, idleTime)
// shiftDuration: (typeof string) formatted as h:mm:ss
// idleTime: (typeof string) formatted as h:mm:ss
// Returns: string formatted as h:mm:ss
// ============================================================
function parseDurationToSeconds(durStr) {
  durStr = durStr.trim();
  const [hStr, mStr, sStr] = durStr.split(":");
  return parseInt(hStr, 10) * 3600 + parseInt(mStr, 10) * 60 + parseInt(sStr, 10);
}

function getActiveTime(shiftDuration, idleTime) {
    // TODO: Implement this function
     const shiftSec = parseDurationToSeconds(shiftDuration);
  const idleSec  = parseDurationToSeconds(idleTime);
  return secondsToDuration(shiftSec - idleSec);
}

// ============================================================
// Function 4: metQuota(date, activeTime)
// date: (typeof string) formatted as yyyy-mm-dd
// activeTime: (typeof string) formatted as h:mm:ss
// Returns: boolean
// ============================================================

function isEidPeriod(dateStr) {
  const d = new Date(dateStr);
  const year = d.getUTCFullYear();
  const month = d.getUTCMonth() + 1; 
  const day = d.getUTCDate();
  return year === 2025 && month === 4 && day >= 10 && day <= 30;
}
// i adde smth small to readshift and the one under it 
// samll fix
//rtyuio
function metQuota(date, activeTime) {
    // TODO: Implement this function
    const activeSec = parseDurationToSeconds(activeTime);
  const quotaSec  = isEidPeriod(date)
    ? 6 * 3600: 8 * 3600 + 24 * 60;
    return activeSec >= quotaSec;
}

// ============================================================
// Function 5: addShiftRecord(textFile, shiftObj)
// textFile: (typeof string) path to shifts text file
// shiftObj: (typeof object) has driverID, driverName, date, startTime, endTime
// Returns: object with 10 properties or empty object {}
// ============================================================
function readShifts(textFile) {
  const content = fs.readFileSync(textFile, "utf8").trim();
  if (!content) return [];
  return content.split("\n").map((line) => line.split(",").map((c) => c.trim().replace(/\r/g, "")));
}

function writeShifts(textFile, rows) {
  const content = rows.map((r) => r.join(",")).join("\n");
  fs.writeFileSync(textFile, content, "utf8");
}

function addShiftRecord(textFile, shiftObj) {
    // TODO: Implement this function
     const { driverID, driverName, date, startTime, endTime } = shiftObj;
 
  const rows = readShifts(textFile);
  for (const row of rows) {
    if (row[0] === driverID && row[2] === date) {
      return {};
    }
  }
  const shiftDuration = getShiftDuration(startTime, endTime);
  const idleTime      = getIdleTime(startTime, endTime);
  const activeTime    = getActiveTime(shiftDuration, idleTime);
  const quota         = metQuota(date, activeTime);
  const hasBonus      = false;
 
  const newRow = [
    driverID,
    driverName,
    date,
    startTime.trim(),
    endTime.trim(),
    shiftDuration,
    idleTime,
    activeTime,
    quota,
    hasBonus,
  ];
   let lastIndexOfDriver = -1;
  for (let i = 0; i < rows.length; i++) {
    if (rows[i][0] === driverID) {
      lastIndexOfDriver = i;
    }
  }
  if (lastIndexOfDriver === -1) {
    rows.push(newRow);
  } else {
    rows.splice(lastIndexOfDriver + 1, 0, newRow);
  }
  writeShifts(textFile, rows);
  return {
    driverID,
    driverName,
    date,
    startTime: startTime.trim(),
    endTime: endTime.trim(),
    shiftDuration,
    idleTime,
    activeTime,
    metQuota: quota,
    hasBonus,
  };
}

// ============================================================
// Function 6: setBonus(textFile, driverID, date, newValue)
// textFile: (typeof string) path to shifts text file
// driverID: (typeof string)
// date: (typeof string) formatted as yyyy-mm-dd
// newValue: (typeof boolean)
// Returns: nothing (void)
// ============================================================
function setBonus(textFile, driverID, date, newValue) {
    // TODO: Implement this function
    const rows = readShifts(textFile);
  for (const row of rows) {
    if (row[0] === driverID && row[2] === date) {
      row[9] = String(newValue);
       break;
    }
  }
  writeShifts(textFile, rows);
}

// ============================================================
// Function 7: countBonusPerMonth(textFile, driverID, month)
// textFile: (typeof string) path to shifts text file
// driverID: (typeof string)
// month: (typeof string) formatted as mm or m
// Returns: number (-1 if driverID not found)
// ============================================================
function countBonusPerMonth(textFile, driverID, month) {
    // TODO: Implement this function
    const rows = readShifts(textFile);
  const targetMonth = parseInt(month, 10);
  const driverRows = rows.filter((r) => r[0] === driverID);
  if (driverRows.length === 0) return -1;
  let count = 0;
  for (const row of driverRows) {
    const rowMonth = parseInt(row[2].split("-")[1], 10);
    if (rowMonth === targetMonth && row[9].trim().toLowerCase() === "true") {
      count++;
    }
  }
  return count;
}

// ============================================================
// Function 8: getTotalActiveHoursPerMonth(textFile, driverID, month)
// textFile: (typeof string) path to shifts text file
// driverID: (typeof string)
// month: (typeof number)
// Returns: string formatted as hhh:mm:ss
// ============================================================
function parseAnyDurationToSeconds(durStr) {
  durStr = durStr.trim();
  const [hStr, mStr, sStr] = durStr.split(":");
  return parseInt(hStr, 10) * 3600 + parseInt(mStr, 10) * 60 + parseInt(sStr, 10);
}

function secondsToLongDuration(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function getTotalActiveHoursPerMonth(textFile, driverID, month) {
    // TODO: Implement this function
    const rows = readShifts(textFile);
  const targetMonth = typeof month === "number" ? month : parseInt(month, 10);
  let totalSec = 0;
  for (const row of rows) {
    if (row[0] !== driverID) continue;
    const rowMonth = parseInt(row[2].split("-")[1], 10);
    if (rowMonth !== targetMonth) continue;
    totalSec += parseAnyDurationToSeconds(row[7]);
     }
     return secondsToLongDuration(totalSec);
}

// ============================================================
// Function 9: getRequiredHoursPerMonth(textFile, rateFile, bonusCount, driverID, month)
// textFile: (typeof string) path to shifts text file
// rateFile: (typeof string) path to driver rates text file
// bonusCount: (typeof number) total bonuses for given driver per month
// driverID: (typeof string)
// month: (typeof number)
// Returns: string formatted as hhh:mm:ss
// ============================================================
function readRates(rateFile) {
  const content = fs.readFileSync(rateFile, "utf8").trim();
  if (!content) return [];
  return content.split("\n").map((line) => {
    const parts = line.split(",").map((c) => c.trim().replace(/\r/g, ""));
    return {
      driverID: parts[0],
      dayOff: parts[1],
      basePay: parseInt(parts[2], 10),
      tier: parseInt(parts[3], 10),
    };
  });
}

function getDayName(dateStr) {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[new Date(dateStr).getUTCDay()];
}

function getRequiredHoursPerMonth(textFile, rateFile, bonusCount, driverID, month) {
    // TODO: Implement this function
    const rows = readShifts(textFile);
  const rates = readRates(rateFile);
  const targetMonth = typeof month === "number" ? month : parseInt(month, 10);
 
  const rate = rates.find((r) => r.driverID === driverID);
    if (!rate) return secondsToLongDuration(0);
    const dayOff = rate.dayOff;
 
  let totalSec = 0;
 

  for (const row of rows) {
    if (row[0] !== driverID) continue;
    const dateStr = row[2];
    const rowMonth = parseInt(dateStr.split("-")[1], 10);
     if (rowMonth !== targetMonth) continue;
     if (dayOff && getDayName(dateStr) === dayOff) continue;
     const quotaSec = isEidPeriod(dateStr)
      ? 6 * 3600: 8 * 3600 + 24 * 60;
      totalSec += quotaSec;
  }
  const bonusDeduction = bonusCount * 2 * 3600;
  totalSec = Math.max(0, totalSec - bonusDeduction);
  return secondsToLongDuration(totalSec);
}

// ============================================================
// Function 10: getNetPay(driverID, actualHours, requiredHours, rateFile)
// driverID: (typeof string)
// actualHours: (typeof string) formatted as hhh:mm:ss
// requiredHours: (typeof string) formatted as hhh:mm:ss
// rateFile: (typeof string) path to driver rates text file
// Returns: integer (net pay)
// ============================================================
function getNetPay(driverID, actualHours, requiredHours, rateFile) {
    // TODO: Implement this function
    const rates = readRates(rateFile);
const rate = rates.find((r) => r.driverID === driverID);
if (!rate) return 0;

const { basePay, tier } = rate;
 
  const actualSec   = parseAnyDurationToSeconds(actualHours);
  const requiredSec = parseAnyDurationToSeconds(requiredHours);
  if (actualSec >= requiredSec) return basePay;
 
  const missingSec = requiredSec - actualSec;
  const missingHours = missingSec / 3600;
  const allowance = { 1: 50, 2: 20, 3: 10, 4: 3 }[tier] || 0;
  const billableHours = Math.max(0, missingHours - allowance);
  const billableFullHours = Math.floor(billableHours);
 
  const deductionRatePerHour = Math.floor(basePay / 185);
  const salaryDeduction = billableFullHours * deductionRatePerHour;
 
  return basePay - salaryDeduction;
}

module.exports = {
    getShiftDuration,
    getIdleTime,
    getActiveTime,
    metQuota,
    addShiftRecord,
    setBonus,
    countBonusPerMonth,
    getTotalActiveHoursPerMonth,
    getRequiredHoursPerMonth,
    getNetPay
};
