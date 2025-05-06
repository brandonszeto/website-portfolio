document.addEventListener("DOMContentLoaded", () => {
  // ... (Keep all existing code from your previous version: consts, getCssVariable, themeStyles, helpers, plugins, other chart functions) ...
  // START OF COPYING YOUR EXISTING CODE (ensure it's all here)
  const eventsCanvas = document.getElementById("eventsChart");
  const dailyStatsCanvas = document.getElementById("dailyStatsChart");
  const batteryCanvas = document.getElementById("batteryPercentageChart");

  const eventsErrorElement = document.getElementById("events-error");
  const statsErrorElement = document.getElementById("stats-error");
  const batteryErrorElement = document.getElementById("battery-error");

  const eventsLoadingElement = document.getElementById("events-loading");
  const statsLoadingElement = document.getElementById("stats-loading");
  const batteryLoadingElement = document.getElementById("battery-loading");

  const baseUrl = "https://api.brandonszeto.com";

  let eventsChartInstance = null;
  let dailyStatsChartInstance = null;
  let batteryChartInstance = null;

  const getCssVariable = (variableName) => {
    return getComputedStyle(document.documentElement)
      .getPropertyValue(variableName)
      .trim();
  };

  const themeStyles = {
    fontFamily: getCssVariable("--article-font-family"),
    textColor: getCssVariable("--color-fg4"),
    titleColor: getCssVariable("--color-fg1"),
    gridColor: getCssVariable("--color-bg0"),
    tooltipBg: getCssVariable("--color-bg1"),
    tooltipTextColor: getCssVariable("--color-fg1"),
    energyChargeColor: getCssVariable("--color-ac1"),
    energyChargeBg: getCssVariable("--color-ac1-h"),
    energyDriveColor: getCssVariable("--color-ac0"),
    energyDriveBg: getCssVariable("--color-ac0-h"),
    odometerColor: getCssVariable("--color-ac3"),
    odometerBg: getCssVariable("--color-ac3-h"),
    lifetimeEnergyColor: getCssVariable("--color-ac1"),
    lifetimeEnergyBg: getCssVariable("--color-ac1-h"),
    batteryChargeEventBg:
      getCssVariable("--color-battery-charge-event-bg") ||
      "rgba(75, 192, 75, 0.2)",
    batteryDriveEventBg:
      getCssVariable("--color-battery-drive-event-bg") ||
      "rgba(255, 99, 132, 0.2)",
    batteryChargeLineColor:
      getCssVariable("--color-battery-charge-line") ||
      getCssVariable("--color-ac1") ||
      "rgb(75, 192, 75)",
    batteryDriveLineColor:
      getCssVariable("--color-battery-drive-line") ||
      getCssVariable("--color-ac0") ||
      "rgb(255, 99, 132)",
    batteryIdleLineColor:
      getCssVariable("--color-battery-idle-line") ||
      getCssVariable("--color-fg3") ||
      "rgb(128, 128, 128)",
  };

  Chart.defaults.font.family = themeStyles.fontFamily;
  Chart.defaults.color = themeStyles.textColor;
  Chart.defaults.borderColor = themeStyles.gridColor;

  const showMessage = (element, message) => {
    if (element) {
      element.textContent = message;
      element.style.display = "block";
    }
  };
  const hideMessage = (element) => {
    if (element) {
      element.style.display = "none";
    }
  };

  const backgroundEventsPlugin = {
    id: "backgroundEvents",
    beforeDatasetsDraw(chart, args, pluginOptions) {
      const { ctx, chartArea, scales } = chart;
      if (!chartArea) return;
      const { top, bottom, left, right } = chartArea;
      const xScale = scales.x;
      const events = pluginOptions.events || [];
      const chargeColor = pluginOptions.chargeColor || "rgba(0, 255, 0, 0.1)";
      const driveColor = pluginOptions.driveColor || "rgba(255, 0, 0, 0.1)";
      ctx.save();
      ctx.beginPath();
      ctx.rect(left, top, right - left, bottom - top);
      ctx.clip();
      events.forEach((event) => {
        if (
          !event.type ||
          typeof event.start_time !== "number" ||
          typeof event.end_time !== "number"
        )
          return;
        let color;
        if (event.type === "charge") color = chargeColor;
        else if (event.type === "drive") color = driveColor;
        else return;
        const eventStartTimeMs = event.start_time * 1000;
        const eventEndTimeMs = event.end_time * 1000;
        if (
          eventEndTimeMs <= xScale.min ||
          eventStartTimeMs >= xScale.max ||
          eventEndTimeMs <= eventStartTimeMs
        )
          return;
        const xStart = xScale.getPixelForValue(eventStartTimeMs);
        const xEnd = xScale.getPixelForValue(eventEndTimeMs);
        const rectX = Math.max(xStart, left);
        const rectX2 = Math.min(xEnd, right);
        const rectWidth = rectX2 - rectX;
        if (rectWidth > 0) {
          ctx.fillStyle = color;
          ctx.fillRect(rectX, top, rectWidth, bottom - top);
        }
      });
      ctx.restore();
    },
  };
  Chart.register(backgroundEventsPlugin);
  // END OF COPYING YOUR EXISTING CODE

  // --- BATTERY PERCENTAGE CHART FUNCTIONS ---
  function generateBatteryChartData(
    apiEvents, // Sorted ASC by start_time
    windowStartTimeMs,
    windowEndTimeMs,
    prevEventBeforeWindow, // Last event that ENDED < windowStartTimeMs
  ) {
    const dataPoints = [];
    let currentBattery = 0;
    let currentEventType = "idle";

    // --- 1. Determine initial point at windowStartTimeMs ---
    let activeEventAtWindowStart = null;

    // Check if prevEventBeforeWindow spans into the window
    if (
      prevEventBeforeWindow &&
      prevEventBeforeWindow.end_time * 1000 > windowStartTimeMs &&
      prevEventBeforeWindow.start_time * 1000 < windowStartTimeMs
    ) {
      activeEventAtWindowStart = prevEventBeforeWindow;
    }
    // Check if the first event in apiEvents spans or starts at windowStartTimeMs
    if (apiEvents.length > 0) {
      const firstApiEvent = apiEvents[0];
      if (
        firstApiEvent.start_time * 1000 < windowStartTimeMs &&
        firstApiEvent.end_time * 1000 > windowStartTimeMs
      ) {
        // This event also spans, potentially more relevant if prevEventBeforeWindow was much older.
        // For simplicity, if both span, let's prefer firstApiEvent if it's closer or is firstApiEvent.
        activeEventAtWindowStart = firstApiEvent;
      } else if (firstApiEvent.start_time * 1000 === windowStartTimeMs) {
        activeEventAtWindowStart = firstApiEvent;
      }
    }

    if (activeEventAtWindowStart) {
      currentEventType = activeEventAtWindowStart.type || "idle";
      const event = activeEventAtWindowStart;
      const eventStartTimeMs = event.start_time * 1000;
      const eventEndTimeMs = event.end_time * 1000;

      if (eventStartTimeMs < windowStartTimeMs) {
        // Event started before window
        if (
          eventEndTimeMs > eventStartTimeMs &&
          typeof event.starting_battery === "number" &&
          typeof event.ending_battery === "number"
        ) {
          const fraction =
            (windowStartTimeMs - eventStartTimeMs) /
            (eventEndTimeMs - eventStartTimeMs);
          currentBattery =
            event.starting_battery +
            (event.ending_battery - event.starting_battery) * fraction;
        } else if (typeof event.starting_battery === "number") {
          // If no duration for interpolation
          currentBattery = event.starting_battery;
        } else if (typeof event.ending_battery === "number") {
          // Fallback, though less ideal for start
          currentBattery = event.ending_battery;
        }
      } else {
        // Event starts exactly at windowStartTimeMs
        currentBattery =
          typeof event.starting_battery === "number"
            ? event.starting_battery
            : 0;
      }
    } else {
      // Window starts in an idle state
      currentEventType = "idle";
      if (
        prevEventBeforeWindow &&
        typeof prevEventBeforeWindow.ending_battery === "number"
      ) {
        currentBattery = prevEventBeforeWindow.ending_battery;
      } else if (
        apiEvents.length > 0 &&
        typeof apiEvents[0].starting_battery === "number"
      ) {
        // No active event at window start, first API event is in the future.
        // Assume battery level was its starting_battery value.
        currentBattery = apiEvents[0].starting_battery;
      } else {
        currentBattery = 0; // Absolute fallback
      }
    }
    currentBattery = Math.max(0, Math.min(100, currentBattery));
    dataPoints.push({
      x: windowStartTimeMs,
      y: currentBattery,
      eventType: currentEventType,
    });

    // --- 2. Process each API event relevant to the window ---
    for (const event of apiEvents) {
      if (
        typeof event.starting_battery !== "number" ||
        typeof event.ending_battery !== "number" ||
        typeof event.start_time !== "number" ||
        typeof event.end_time !== "number"
      ) {
        console.warn("Skipping event due to missing critical data:", event);
        continue;
      }

      const eventStartTimeMs = event.start_time * 1000;
      const eventEndTimeMs = event.end_time * 1000;
      const eventType = event.type || "idle";

      // Skip event if it entirely precedes the last data point we added, or is outside window
      // (The second part is mostly for safety, apiEvents should be filtered)
      let lastPoint = dataPoints[dataPoints.length - 1];
      if (
        eventEndTimeMs <= lastPoint.x ||
        eventEndTimeMs <= windowStartTimeMs ||
        eventStartTimeMs >= windowEndTimeMs
      ) {
        continue;
      }

      const effectiveEventStart = Math.max(eventStartTimeMs, windowStartTimeMs);

      // 2a. Handle Idle period before this event begins (if there's a gap)
      if (effectiveEventStart > lastPoint.x) {
        // Add a point to mark the end of an idle period.
        // Battery level is same as lastPoint.y. eventType is 'idle'.
        dataPoints.push({
          x: effectiveEventStart,
          y: lastPoint.y,
          eventType: "idle",
        });
        lastPoint = dataPoints[dataPoints.length - 1];
      }

      // 2b. Add point for the start of the event (or continuation within window)
      let batteryAtEffectiveStart = event.starting_battery;
      if (eventStartTimeMs < effectiveEventStart) {
        // Event started before this effective start (e.g. before window)
        const totalDuration = eventEndTimeMs - eventStartTimeMs;
        if (totalDuration > 0) {
          const durationInEvent = effectiveEventStart - eventStartTimeMs;
          batteryAtEffectiveStart =
            event.starting_battery +
            (event.ending_battery - event.starting_battery) *
              (durationInEvent / totalDuration);
          batteryAtEffectiveStart = Math.max(
            0,
            Math.min(100, batteryAtEffectiveStart),
          );
        }
      }
      // If last point is at the same time, update it. Otherwise, add new point.
      if (lastPoint.x === effectiveEventStart) {
        lastPoint.y = batteryAtEffectiveStart;
        lastPoint.eventType = eventType; // Event starts, take its type
      } else {
        dataPoints.push({
          x: effectiveEventStart,
          y: batteryAtEffectiveStart,
          eventType: eventType,
        });
      }
      lastPoint = dataPoints[dataPoints.length - 1];

      // 2c. Add point for the end of the event (or continuation point if clipped by windowEnd)
      const effectiveEventEnd = Math.min(eventEndTimeMs, windowEndTimeMs);
      let batteryAtEffectiveEnd = event.ending_battery;

      if (eventEndTimeMs > effectiveEventEnd) {
        // Event clipped at window end
        const totalDuration = eventEndTimeMs - eventStartTimeMs;
        if (totalDuration > 0) {
          const durationInEvent = effectiveEventEnd - eventStartTimeMs;
          batteryAtEffectiveEnd =
            event.starting_battery +
            (event.ending_battery - event.starting_battery) *
              (durationInEvent / totalDuration);
          batteryAtEffectiveEnd = Math.max(
            0,
            Math.min(100, batteryAtEffectiveEnd),
          );
        }
      }
      // Add event end point only if time has progressed from last point.
      if (effectiveEventEnd > lastPoint.x) {
        dataPoints.push({
          x: effectiveEventEnd,
          y: batteryAtEffectiveEnd,
          eventType: eventType,
        });
      } else if (effectiveEventEnd === lastPoint.x) {
        // Event is instantaneous or ends at same time as start
        lastPoint.y = batteryAtEffectiveEnd; // Update battery if different
        lastPoint.eventType = eventType; // Ensure type is correct for this micro-moment
      }
    }

    // --- 3. Ensure line extends to the end of the window ---
    const finalChartPoint = dataPoints[dataPoints.length - 1];
    if (finalChartPoint && finalChartPoint.x < windowEndTimeMs) {
      let tailEventType = "idle"; // Default for the tail segment
      // Check if the *last processed API event* is still ongoing at windowEndTimeMs
      const lastProcessedApiEvent =
        apiEvents.length > 0 ? apiEvents[apiEvents.length - 1] : null;
      if (
        lastProcessedApiEvent &&
        lastProcessedApiEvent.start_time * 1000 < windowEndTimeMs && // It started before window end
        lastProcessedApiEvent.end_time * 1000 > windowEndTimeMs
      ) {
        // And it ends after window end
        tailEventType = lastProcessedApiEvent.type || "idle";
      }
      dataPoints.push({
        x: windowEndTimeMs,
        y: finalChartPoint.y,
        eventType: tailEventType,
      });
    }

    // --- 4. Clean up strictly duplicate consecutive points ---
    const cleanedPoints = [];
    if (dataPoints.length > 0) {
      cleanedPoints.push(dataPoints[0]);
      for (let i = 1; i < dataPoints.length; i++) {
        const prevCleaned = cleanedPoints[cleanedPoints.length - 1];
        const currentOriginal = dataPoints[i];
        if (
          currentOriginal.x === prevCleaned.x &&
          currentOriginal.y === prevCleaned.y &&
          currentOriginal.eventType === prevCleaned.eventType
        ) {
          continue; // Skip exact duplicate
        }
        // If x is same, but y or eventType changed, it creates a vertical line or state change
        // Keep such points. If x is same, type is same, but y differs, update y of prevCleaned.
        if (
          currentOriginal.x === prevCleaned.x &&
          currentOriginal.eventType === prevCleaned.eventType
        ) {
          prevCleaned.y = currentOriginal.y; // Update y for same time, same type (e.g. quick correction)
          continue;
        }
        cleanedPoints.push(currentOriginal);
      }
    }
    return cleanedPoints;
  }

  // --- Function to render the battery percentage line chart (NO CHANGE NEEDED HERE from previous version) ---
  const renderBatteryChart = (canvas, batteryData, eventsForBackground) => {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    if (batteryChartInstance) {
      batteryChartInstance.destroy();
    }
    // console.log("Data passed to renderBatteryChart:", JSON.parse(JSON.stringify(batteryData.slice(0,10))));

    batteryChartInstance = new Chart(ctx, {
      type: "line",
      data: {
        datasets: [
          {
            label: "Battery Percentage",
            data: batteryData,
            fill: false,
            tension: 0.05,
            pointRadius: 0,
            pointHoverRadius: 4,
            borderWidth: 2,
            segment: {
              borderColor: (context) => {
                const eventType = context.p1?.raw?.eventType;
                if (eventType === "charge") {
                  return themeStyles.batteryChargeLineColor;
                } else if (eventType === "drive") {
                  return themeStyles.batteryDriveLineColor;
                }
                return themeStyles.batteryIdleLineColor;
              },
            },
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            type: "time",
            time: {
              unit: "day",
              tooltipFormat: "MMM d, yyyy HH:mm",
              displayFormats: { hour: "HH:mm", day: "MMM d yy" },
            },
            ticks: {
              color: themeStyles.textColor,
              maxRotation: 45,
              minRotation: 45,
              autoSkip: true,
              maxTicksLimit: 10,
            },
            grid: { color: themeStyles.gridColor },
          },
          y: {
            min: 0,
            max: 100,
            ticks: {
              color: themeStyles.textColor,
              stepSize: 25,
              callback: (value) => value + "%",
            },
            grid: { color: themeStyles.gridColor },
          },
        },
        plugins: {
          backgroundEvents: {
            events: eventsForBackground,
            chargeColor: themeStyles.batteryChargeEventBg,
            driveColor: themeStyles.batteryDriveEventBg,
          },
          legend: { display: false },
          tooltip: {
            backgroundColor: themeStyles.tooltipBg,
            titleColor: themeStyles.tooltipTextColor,
            bodyColor: themeStyles.tooltipTextColor,
            mode: "index",
            intersect: false,
            callbacks: {
              title: (tooltipItems) =>
                tooltipItems[0]?.parsed?.x
                  ? new Date(tooltipItems[0].parsed.x).toLocaleString()
                  : "",
              label: (context) => {
                let label = context.dataset.label || "Battery";
                if (label) label += ": ";
                if (context.parsed.y !== null)
                  label += context.parsed.y.toFixed(0) + "%";
                const pointEventType = context.raw?.eventType;
                if (pointEventType) label += ` (${pointEventType})`;
                return label;
              },
            },
          },
        },
      },
    });
  };

  // ... (processEventsData, renderEventsChart, processDailyStatsData, renderDailyStatsChart - UNCHANGED) ...
  // PASTE THE UNCHANGED FUNCTIONS HERE:
  // processEventsData, renderEventsChart, processDailyStatsData, renderDailyStatsChart
  const processEventsData = (events, days = 7) => {
    const now = new Date();
    const xDaysAgo = new Date(now);
    xDaysAgo.setDate(now.getDate() - days);
    const startTimeLimit = xDaysAgo.getTime() / 1000;
    const recentEvents = events.filter(
      (event) => event.start_time >= startTimeLimit,
    );
    const hourlyBuckets = {};
    const hoursInPeriod = days * 24;
    const labels = [];
    const startHour = new Date(xDaysAgo);
    startHour.setMinutes(0, 0, 0);
    for (let i = 0; i < hoursInPeriod; i++) {
      const bucketTimestamp = new Date(startHour);
      bucketTimestamp.setHours(startHour.getHours() + i);
      const bucketKey = bucketTimestamp.toISOString();
      hourlyBuckets[bucketKey] = 0;
      labels.push(bucketTimestamp);
    }
    recentEvents.forEach((event) => {
      const eventStartTime = new Date(event.start_time * 1000);
      eventStartTime.setMinutes(0, 0, 0);
      const bucketKey = eventStartTime.toISOString();
      if (hourlyBuckets.hasOwnProperty(bucketKey)) {
        if (event.type === "charge" && event.kwh_added) {
          hourlyBuckets[bucketKey] += event.kwh_added;
        } else if (event.type === "drive" && event.energy_used_kwh) {
          hourlyBuckets[bucketKey] -= event.energy_used_kwh;
        }
      }
    });
    const data = Object.values(hourlyBuckets);
    return { labels, data };
  };

  const renderEventsChart = (canvas, labels, data) => {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (eventsChartInstance) eventsChartInstance.destroy();
    eventsChartInstance = new Chart(ctx, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          {
            label: "energy change (kWh)",
            data: data,
            backgroundColor: data.map((value) =>
              value >= 0
                ? themeStyles.energyChargeBg
                : themeStyles.energyDriveBg,
            ),
            borderColor: data.map((value) =>
              value >= 0
                ? themeStyles.energyChargeColor
                : themeStyles.energyDriveColor,
            ),
            borderWidth: 1,
            barPercentage: 1.0,
            categoryPercentage: 1.0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            type: "time",
            time: {
              unit: "day",
              tooltipFormat: "MMM d, yyyy HH:mm",
              displayFormats: { hour: "HH", day: "MMM d" },
            },
            ticks: {
              maxRotation: 45,
              minRotation: 45,
              autoSkip: true,
              maxTicksLimit: Math.min(24, labels.length / (24 / 6)),
              major: { enabled: true },
              color: themeStyles.textColor,
            },
            grid: { color: themeStyles.gridColor },
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: "energy change (kWh)",
              color: themeStyles.titleColor,
              font: { weight: "bold" },
            },
            ticks: {
              color: themeStyles.textColor,
              callback: (value) => value + " kWh",
            },
            grid: { color: themeStyles.gridColor },
          },
        },
        plugins: {
          legend: { labels: { color: themeStyles.textColor } },
          tooltip: {
            backgroundColor: themeStyles.tooltipBg,
            titleColor: themeStyles.tooltipTextColor,
            bodyColor: themeStyles.tooltipTextColor,
            callbacks: {
              title: (tooltipItems) => {
                const d = new Date(tooltipItems[0].parsed.x);
                const nextHour = new Date(d);
                nextHour.setHours(d.getHours() + 1);
                return `${d.toLocaleDateString()} ${d.getHours()}:00 - ${nextHour.getHours()}:00`;
              },
              label: (context) => {
                let label = context.dataset.label || "";
                if (label) label += ": ";
                if (context.parsed.y !== null) {
                  const value = context.parsed.y;
                  label += `${value >= 0 ? "+" : ""}${value.toFixed(2)} kWh`;
                  label += value >= 0 ? " (gain)" : " (loss)";
                }
                return label;
              },
            },
          },
        },
      },
    });
  };

  const processDailyStatsData = (stats, days = 7) => {
    const now = new Date();
    const xDaysAgo = new Date(now);
    xDaysAgo.setDate(now.getDate() - days);
    const startTimeLimit = xDaysAgo.getTime() / 1000;
    const recentStats = stats
      .filter((stat) => stat.timestamp_unix >= startTimeLimit)
      .sort((a, b) => a.timestamp_unix - b.timestamp_unix);
    const odometerData = [];
    const energyData = [];
    recentStats.forEach((stat) => {
      const timestampDate = new Date(stat.timestamp_unix * 1000);
      odometerData.push({ x: timestampDate, y: stat.odometer });
      energyData.push({ x: timestampDate, y: stat.lifetime_energy_kwh });
    });
    return { odometerData, energyData };
  };

  const renderDailyStatsChart = (canvas, odometerData, energyData) => {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (dailyStatsChartInstance) dailyStatsChartInstance.destroy();
    dailyStatsChartInstance = new Chart(ctx, {
      type: "line",
      data: {
        datasets: [
          {
            label: "odometer",
            data: odometerData,
            borderColor: themeStyles.odometerColor,
            backgroundColor: themeStyles.odometerBg,
            tension: 0.1,
            yAxisID: "yOdometer",
            pointRadius: 2,
            pointHoverRadius: 5,
            fill: false,
          },
          {
            label: "lifetime energy",
            data: energyData,
            borderColor: themeStyles.lifetimeEnergyColor,
            backgroundColor: themeStyles.lifetimeEnergyBg,
            tension: 0.1,
            yAxisID: "yEnergy",
            pointRadius: 2,
            pointHoverRadius: 5,
            fill: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        stacked: false,
        scales: {
          x: {
            type: "time",
            time: {
              unit: "day",
              tooltipFormat: "PPP",
              displayFormats: { day: "MMM d, yy" },
            },
            ticks: { color: themeStyles.textColor },
            grid: { color: themeStyles.gridColor },
          },
          yOdometer: {
            type: "linear",
            display: true,
            position: "left",
            title: {
              display: true,
              text: "odometer",
              color: themeStyles.odometerColor,
              font: { weight: "bold" },
            },
            ticks: { color: themeStyles.odometerColor },
            grid: { color: themeStyles.gridColor },
          },
          yEnergy: {
            type: "linear",
            display: true,
            position: "right",
            title: {
              display: true,
              text: "lifetime energy (kWh)",
              color: themeStyles.lifetimeEnergyColor,
              font: { weight: "bold" },
            },
            ticks: {
              color: themeStyles.lifetimeEnergyColor,
              callback: (value) => value.toFixed(0) + " kWh",
            },
            grid: { drawOnChartArea: false },
          },
        },
        plugins: {
          legend: { labels: { color: themeStyles.textColor } },
          tooltip: {
            backgroundColor: themeStyles.tooltipBg,
            titleColor: themeStyles.tooltipTextColor,
            bodyColor: themeStyles.tooltipTextColor,
            callbacks: {
              title: (tooltipItems) =>
                tooltipItems[0]?.parsed?.x
                  ? new Date(tooltipItems[0].parsed.x).toLocaleDateString()
                  : "",
              label: (context) => {
                let label = context.dataset.label || "";
                if (label) label += ": ";
                if (context.parsed.y !== null) {
                  let value = context.parsed.y;
                  if (context.dataset.label === "lifetime energy")
                    label += value.toFixed(2) + " kWh";
                  else if (context.dataset.label === "odometer")
                    label += value.toFixed(0);
                  else label += value.toFixed(2);
                }
                return label;
              },
            },
          },
        },
      },
    });
  };

  // --- Fetch Data and Initialize Charts (NO CHANGE NEEDED HERE from previous version) ---
  const initializeCharts = async () => {
    const daysToDisplay = 7;

    const energyChangeEventsParams = new URLSearchParams({
      limit: daysToDisplay * 24 * 2,
      order_by: "start_time",
      direction: "DESCENDING",
    });
    try {
      hideMessage(eventsErrorElement);
      showMessage(eventsLoadingElement, "Loading ...");
      const response = await fetch(
        `${baseUrl}/tesla/events/all?${energyChangeEventsParams.toString()}`,
      );
      if (!response.ok) throw new Error(`HTTP status ${response.status}`);
      const rawEventsDataForEnergy = await response.json();
      const { labels, data } = processEventsData(
        rawEventsDataForEnergy,
        daysToDisplay,
      );
      renderEventsChart(eventsCanvas, labels, data);
    } catch (error) {
      console.error("Error fetching/processing Energy Change Events:", error);
      showMessage(eventsErrorElement, `Error: ${error.message}`);
    } finally {
      hideMessage(eventsLoadingElement);
    }

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - daysToDisplay);
    const fetchStartDate = new Date(startDate);
    fetchStartDate.setDate(startDate.getDate() - 1);
    const windowStartTimeMs = startDate.getTime();
    const windowEndTimeMs = endDate.getTime();
    const batteryEventsParams = new URLSearchParams({
      limit: 1000,
      order_by: "start_time",
      direction: "ASCENDING",
      start_timestamp: Math.floor(fetchStartDate.getTime() / 1000),
      end_timestamp: Math.floor(windowEndTimeMs / 1000),
    });
    try {
      hideMessage(batteryErrorElement);
      showMessage(batteryLoadingElement, "Loading ...");
      const response = await fetch(
        `${baseUrl}/tesla/events/all?${batteryEventsParams.toString()}`,
      );
      if (!response.ok) throw new Error(`HTTP status ${response.status}`);
      let allFetchedEvents = await response.json();
      let prevEventBeforeWindow = null;
      for (let i = allFetchedEvents.length - 1; i >= 0; i--) {
        const event = allFetchedEvents[i];
        if (
          event.end_time * 1000 < windowStartTimeMs &&
          typeof event.ending_battery === "number"
        ) {
          prevEventBeforeWindow = event;
          break;
        }
      }
      const apiEventsInOrAroundWindow = allFetchedEvents.filter(
        (event) =>
          event.end_time * 1000 > windowStartTimeMs &&
          event.start_time * 1000 < windowEndTimeMs,
      );
      const batteryData = generateBatteryChartData(
        apiEventsInOrAroundWindow,
        windowStartTimeMs,
        windowEndTimeMs,
        prevEventBeforeWindow,
      );
      // console.log("Generated Battery Data for Chart (first 10 points):", JSON.parse(JSON.stringify(batteryData.slice(0,10))));
      renderBatteryChart(batteryCanvas, batteryData, apiEventsInOrAroundWindow);
    } catch (error) {
      console.error("Error fetching or processing Battery Events:", error);
      showMessage(batteryErrorElement, `Error: ${error.message}`);
    } finally {
      hideMessage(batteryLoadingElement);
    }

    const statsParams = new URLSearchParams({
      limit: daysToDisplay + 5,
      order_by: "timestamp_unix",
      direction: "DESCENDING",
    });
    try {
      hideMessage(statsErrorElement);
      showMessage(statsLoadingElement, "Loading ...");
      const response = await fetch(
        `${baseUrl}/tesla/daily_stats/all?${statsParams.toString()}`,
      );
      if (!response.ok) throw new Error(`HTTP status ${response.status}`);
      const rawStatsData = await response.json();
      const { odometerData, energyData } = processDailyStatsData(
        rawStatsData,
        daysToDisplay,
      );
      renderDailyStatsChart(dailyStatsCanvas, odometerData, energyData);
    } catch (error) {
      console.error("Error fetching/processing Daily Stats:", error);
      showMessage(statsErrorElement, `Error: ${error.message}`);
    } finally {
      hideMessage(statsLoadingElement);
    }
  };

  initializeCharts();
});
