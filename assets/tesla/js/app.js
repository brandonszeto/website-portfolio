document.addEventListener("DOMContentLoaded", () => {
  // Get references to the canvas elements and message elements
  const eventsCanvas = document.getElementById("eventsChart");
  const dailyStatsCanvas = document.getElementById("dailyStatsChart");
  const eventsErrorElement = document.getElementById("events-error");
  const statsErrorElement = document.getElementById("stats-error");
  const eventsLoadingElement = document.getElementById("events-loading");
  const statsLoadingElement = document.getElementById("stats-loading");

  // Base URL for the API
  const baseUrl = "https://api.brandonszeto.com";

  // Store chart instances globally
  let eventsChartInstance = null;
  let dailyStatsChartInstance = null;

  // --- Helper Function to get CSS Variable Values ---
  const getCssVariable = (variableName) => {
    // Ensure styles are computed before trying to get the variable
    return getComputedStyle(document.documentElement)
      .getPropertyValue(variableName)
      .trim();
  };

  // --- Retrieve Theme Styles from CSS ---
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
  };

  // --- Optional: Set Global Chart Defaults ---
  // Apply base font and color to all charts
  Chart.defaults.font.family = themeStyles.fontFamily;
  Chart.defaults.color = themeStyles.textColor; // Default for ticks, labels etc.
  Chart.defaults.borderColor = themeStyles.gridColor; // Default for axis lines etc.

  // --- Helper Functions (showMessage, hideMessage - unchanged) ---
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

  // --- Chart Configuration & Rendering ---

  // Function to process event data (unchanged)
  const processEventsData = (events, days = 7) => {
    // ... (keep existing logic)
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - days);
    const startTimeLimit = sevenDaysAgo.getTime() / 1000; // Convert to Unix timestamp (seconds)

    const recentEvents = events.filter(
      (event) => event.start_time >= startTimeLimit,
    );

    const hourlyBuckets = {};
    const hoursInPeriod = days * 24;
    const labels = [];
    const startHour = new Date(sevenDaysAgo);
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
    // ... (end of existing logic)
  };

  const renderEventsChart = (canvas, labels, data) => {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    if (eventsChartInstance) {
      eventsChartInstance.destroy();
    }

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
              displayFormats: {
                hour: "HH:mm",
                day: "MMM d",
              },
            },
            ticks: {
              maxRotation: 45,
              minRotation: 45,
              autoSkip: true,
              maxTicksLimit: 20,
              color: themeStyles.textColor,
              font: {},
            },
            grid: {
              color: themeStyles.gridColor,
            },
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: "energy change (kWh)",
              color: themeStyles.titleColor,
              font: {
                weight: "bold",
              },
            },
            ticks: {
              color: themeStyles.textColor,
              callback: function (value) {
                return value + " kWh";
              },
            },
            grid: {
              color: themeStyles.gridColor,
            },
          },
        },
        plugins: {
          legend: {
            labels: {
              color: themeStyles.textColor,
            },
          },
          tooltip: {
            backgroundColor: themeStyles.tooltipBg,
            titleColor: themeStyles.tooltipTextColor,
            bodyColor: themeStyles.tooltipTextColor,
            callbacks: {
              title: function (tooltipItems) {
                const date = tooltipItems[0].parsed.x;
                return date ? new Date(date).toLocaleString() : "";
              },
              label: function (context) {
                let label = context.dataset.label || "";
                if (label) {
                  label += ": ";
                }
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

  // Function to process daily stats data (unchanged)
  const processDailyStatsData = (stats, days = 7) => {
    // ... (keep existing logic)
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - days);
    const startTimeLimit = sevenDaysAgo.getTime() / 1000; // Convert to Unix timestamp (seconds)

    const recentStats = stats
      .filter((stat) => stat.timestamp_unix >= startTimeLimit)
      .sort((a, b) => a.timestamp_unix - b.timestamp_unix);

    const labels = [];
    const odometerData = [];
    const energyData = [];

    recentStats.forEach((stat) => {
      const timestampDate = new Date(stat.timestamp_unix * 1000);
      labels.push(timestampDate);
      odometerData.push({ x: timestampDate, y: stat.odometer });
      energyData.push({ x: timestampDate, y: stat.lifetime_energy_kwh });
    });

    return { labels: labels, odometerData, energyData };
    // ... (end of existing logic)
  };

  // Function to render the daily stats line chart (UPDATED with styling)
  const renderDailyStatsChart = (canvas, odometerData, energyData) => {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    if (dailyStatsChartInstance) {
      dailyStatsChartInstance.destroy();
    }

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
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: "index",
          intersect: false,
        },
        stacked: false,
        scales: {
          x: {
            type: "time",
            time: {
              unit: "day",
              tooltipFormat: "PPpp",
              displayFormats: {
                day: "MMM d, yy",
              },
            },
            ticks: {
              color: themeStyles.textColor, // Style x-axis ticks
              // font: { ... }
            },
            grid: {
              color: themeStyles.gridColor, // Style x-axis grid lines
            },
          },
          yOdometer: {
            type: "linear",
            display: true,
            position: "left",
            title: {
              display: true,
              text: "odometer",
              color: themeStyles.odometerColor, // Use specific color for title matching line
              font: {
                weight: "bold",
              },
            },
            ticks: {
              color: themeStyles.odometerColor, // Use specific color for ticks matching line
              // font: { ... }
            },
            grid: {
              color: themeStyles.gridColor, // Style y-axis grid lines (only draws if not drawOnChartArea=false on other axis)
            },
          },
          yEnergy: {
            type: "linear",
            display: true,
            position: "right",
            title: {
              display: true,
              text: "lifetime energy (kWh)",
              color: themeStyles.lifetimeEnergyColor, // Use specific color for title matching line
              font: {
                weight: "bold",
              },
            },
            ticks: {
              color: themeStyles.lifetimeEnergyColor, // Use specific color for ticks matching line
              // font: { ... }
              callback: function (value) {
                return value.toFixed(0) + " kWh";
              },
            },
            grid: {
              drawOnChartArea: false, // Only draw grid lines for the first Y axis
            },
          },
        },
        plugins: {
          legend: {
            // Optional: Style legend if needed
            labels: {
              color: themeStyles.textColor, // Style legend text
              // font: { ... }
            },
          },
          tooltip: {
            backgroundColor: themeStyles.tooltipBg,
            titleColor: themeStyles.tooltipTextColor,
            bodyColor: themeStyles.tooltipTextColor,
            // titleFont, bodyFont can also be set here if needed
            callbacks: {
              title: function (tooltipItems) {
                const date = tooltipItems[0].parsed.x;
                return date ? new Date(date).toLocaleString() : "";
              },
              label: function (context) {
                let label = context.dataset.label || "";
                if (label) {
                  label += ": ";
                }
                if (context.parsed.y !== null) {
                  let value = context.parsed.y;
                  // Label was incorrect in original snippet, fix it
                  if (context.dataset.label === "lifetime energy") {
                    label += value.toFixed(2) + " kWh";
                  } else if (context.dataset.label === "odometer") {
                    // Add units if you know them, e.g., ' mi' or ' km'
                    label += value.toFixed(0); // Example: assuming whole number units like miles/km
                  } else {
                    label += value.toFixed(2);
                  }
                }
                return label;
              },
            },
          },
        },
      },
    });
  };

  // --- Fetch Data and Initialize Charts (unchanged) ---
  const initializeCharts = async () => {
    // ... (keep existing fetch logic for events) ...
    const eventParams = new URLSearchParams({
      limit: 200,
      order_by: "start_time",
      direction: "DESCENDING",
    });

    try {
      hideMessage(eventsErrorElement);
      showMessage(eventsLoadingElement, "Loading ...");
      const response = await fetch(
        `${baseUrl}/tesla/events/all?${eventParams.toString()}`,
      );
      if (!response.ok) {
        throw new Error(`HTTP status ${response.status}`);
      }
      const rawEventsData = await response.json();
      const { labels, data } = processEventsData(rawEventsData, 7);
      renderEventsChart(eventsCanvas, labels, data);
      hideMessage(eventsLoadingElement);
    } catch (error) {
      console.error("Error fetching or processing Events:", error);
      showMessage(
        eventsErrorElement,
        `Error fetching Events: ${error.message}`,
      );
      hideMessage(eventsLoadingElement);
    }

    // ... (keep existing fetch logic for daily stats) ...
    const statsParams = new URLSearchParams({
      limit: 100,
      order_by: "timestamp_unix",
      direction: "DESCENDING",
    });

    try {
      hideMessage(statsErrorElement);
      showMessage(statsLoadingElement, "Loading ...");
      const response = await fetch(
        `${baseUrl}/tesla/daily_stats/all?${statsParams.toString()}`,
      );
      if (!response.ok) {
        throw new Error(`HTTP status ${response.status}`);
      }
      const rawStatsData = await response.json();
      const { odometerData, energyData } = processDailyStatsData(
        rawStatsData,
        7,
      );
      renderDailyStatsChart(dailyStatsCanvas, odometerData, energyData);
      hideMessage(statsLoadingElement);
    } catch (error) {
      console.error("Error fetching or processing Daily Stats:", error);
      showMessage(
        statsErrorElement,
        `Error fetching Daily Stats: ${error.message}`,
      );
      hideMessage(statsLoadingElement);
    }
  };

  // Initialize everything
  initializeCharts();
});
