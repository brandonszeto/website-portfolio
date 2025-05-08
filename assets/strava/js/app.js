// app.js

document.addEventListener("DOMContentLoaded", () => {
  // --- Theming and Global Chart Setup ---
  const getCssVariable = (variableName) => {
    return getComputedStyle(document.documentElement)
      .getPropertyValue(variableName)
      .trim();
  };

  function addAlpha(hex, alpha) {
    hex = hex.replace("#", "");

    if (hex.length === 3) {
      hex = hex
        .split("")
        .map((c) => c + c)
        .join("");
    }

    if (hex.length !== 6) {
      throw new Error("Invalid HEX color");
    }

    const alphaHex = Math.round(alpha * 255)
      .toString(16)
      .padStart(2, "0");
    return `#${hex}${alphaHex}`;
  }

  const themeStyles = {
    fontFamily: getCssVariable("--body-font-family"),
    textColor: getCssVariable("--color-fg4") || "#666",
    titleColor: getCssVariable("--color-fg1") || "#333",
    gridColor: getCssVariable("--color-bg0") || "#e5e5e5",
    tooltipBg: getCssVariable("--color-bg1") || "#fff",
    tooltipTextColor: getCssVariable("--color-fg1") || "#333",
    // Example mappings for chart-specific colors (adjust as needed)
    runColor: getCssVariable("--color-ac1") || "rgb(255, 99, 132)",
    runBg: addAlpha(getCssVariable("--color-ac1"), 0.25),
    swimColor: getCssVariable("--color-ac3") || "rgb(54, 162, 235)",
    swimBg: addAlpha(getCssVariable("--color-ac3"), 0.25),
    durationColor: getCssVariable("--color-ac0") || "rgb(75, 192, 192)",
    durationBg: addAlpha(getCssVariable("--color-ac0"), 0.25),
    heatmapBaseColor: "rgb(75, 192, 192)",
  };

  Chart.defaults.font.family = themeStyles.fontFamily;
  Chart.defaults.color = themeStyles.textColor;
  Chart.defaults.borderColor = themeStyles.gridColor; // Default for grid lines

  // --- Strava Chart Specific Setup ---
  const base_url = "https://api.brandonszeto.com";
  const params = new URLSearchParams({
    limit: 100,
    order_by: "start_time",
    direction: "DESCENDING",
  });
  const apiUrl = `${base_url}/strava/events/all?${params.toString()}`;
  const errorMessageDiv = document.getElementById("errorMessage");

  // Canvas elements for Strava charts
  const activityPieChartCanvas = document.getElementById("activityPieChart");
  const activityHeatmapChartCanvas = document.getElementById(
    "activityHeatmapChart",
  );
  const cumulativeStatsChartCanvas = document.getElementById(
    "cumulativeStatsChart",
  );

  let myPieChartInstance = null;
  let myHeatmapChartInstance = null;
  let myCumulativeChartInstance = null;

  // --- Main function to fetch data and trigger chart drawing ---
  async function fetchAndDrawCharts() {
    if (errorMessageDiv) errorMessageDiv.textContent = "";

    try {
      console.log("Fetching data from:", apiUrl);
      const response = await fetch(apiUrl);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `API request failed with status ${response.status}: ${errorText}`,
        );
      }

      const responseData = await response.json();
      console.log("API Response Data:", responseData);

      let events;
      if (Array.isArray(responseData)) {
        events = responseData;
      } else if (responseData && Array.isArray(responseData.events)) {
        events = responseData.events;
      } else if (responseData && Array.isArray(responseData.data)) {
        events = responseData.data;
      } else {
        console.error(
          "Could not find events array in API response. Response:",
          responseData,
        );
        if (errorMessageDiv) {
          errorMessageDiv.textContent =
            "Error: Could not parse events from API response. Check console for details.";
        }
        return;
      }

      if (!events || events.length === 0) {
        console.log("No events found.");
        if (errorMessageDiv)
          errorMessageDiv.textContent = "No activity data found to display.";
        myPieChartInstance = destroyChart(myPieChartInstance);
        myHeatmapChartInstance = destroyChart(myHeatmapChartInstance);
        myCumulativeChartInstance = destroyChart(myCumulativeChartInstance);
        return;
      }

      drawActivityPieChart(events);
      drawActivityHeatmapChart(events);
      drawCumulativeStatsChart(events);
    } catch (error) {
      console.error("Error fetching or drawing charts:", error);
      if (errorMessageDiv)
        errorMessageDiv.textContent = `Error: ${error.message}. Check the console for more details.`;
      myPieChartInstance = destroyChart(myPieChartInstance);
      myHeatmapChartInstance = destroyChart(myHeatmapChartInstance);
      myCumulativeChartInstance = destroyChart(myCumulativeChartInstance);
    }
  }

  // --- Helper to destroy existing chart ---
  function destroyChart(chartInstance) {
    if (chartInstance && chartInstance instanceof Chart) {
      chartInstance.destroy();
    }
    return null; // Return null to allow re-assignment: e.g., myPieChartInstance = destroyChart(myPieChartInstance);
  }

  // --- Function to draw the Pie Chart ---
  function drawActivityPieChart(events) {
    if (!activityPieChartCanvas) {
      console.error("Pie chart canvas element not found!");
      if (errorMessageDiv)
        errorMessageDiv.textContent +=
          "\nError: Pie chart canvas element is missing.";
      return;
    }
    const ctx = activityPieChartCanvas.getContext("2d");

    const activityCounts = {};
    events.forEach((event) => {
      const activityType = event.sport_type || "Unknown";
      activityCounts[activityType] = (activityCounts[activityType] || 0) + 1;
    });

    const labels = Object.keys(activityCounts);
    const data = Object.values(activityCounts);
    // Dynamic colors for pie chart are generally good, but could also be themed if fewer, consistent categories
    const backgroundColors = labels.map(
      (_, i) => `hsl(${(i * 360) / labels.length + 15}, 70%, 60%)`,
    );

    myPieChartInstance = destroyChart(myPieChartInstance);

    myPieChartInstance = new Chart(ctx, {
      type: "pie",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Number of Activities",
            data: data,
            backgroundColor: backgroundColors,
            borderColor: themeStyles.tooltipBg, // Contrast border for slices
            borderWidth: 1,
            hoverOffset: 8,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: "Activity Types Distribution",
            color: themeStyles.titleColor,
            font: { family: themeStyles.fontFamily, size: 16 },
          },
          tooltip: {
            backgroundColor: themeStyles.tooltipBg,
            titleColor: themeStyles.tooltipTextColor,
            bodyColor: themeStyles.tooltipTextColor,
            callbacks: {
              label: function (context) {
                let label = context.label || "";
                if (label) label += ": ";
                if (context.parsed !== null) {
                  label += context.parsed;
                  const total = context.dataset.data.reduce((a, b) => a + b, 0);
                  const percentage =
                    ((context.parsed / total) * 100).toFixed(1) + "%";
                  label += ` (${percentage})`;
                }
                return label;
              },
            },
          },
          legend: {
            position: "right", // <--- THIS IS THE CHANGE
            labels: {
              color: themeStyles.textColor,
              font: { family: themeStyles.fontFamily },
            },
          },
        },
      },
    });
  }

  function drawActivityHeatmapChart(events) {
    if (!activityHeatmapChartCanvas) {
      console.error("Heatmap chart canvas element not found!");
      if (errorMessageDiv)
        errorMessageDiv.textContent +=
          "\nError: Heatmap chart canvas element is missing.";
      return;
    }
    const ctx = activityHeatmapChartCanvas.getContext("2d");

    const utcHourlyActivityDuration = new Array(24).fill(0);
    events.forEach((event) => {
      let startTimestampMs;
      if (event.start_time_iso) {
        startTimestampMs = new Date(event.start_time_iso).getTime();
      } else if (typeof event.start_time === "number") {
        startTimestampMs = event.start_time * 1000;
      } else {
        return;
      }

      if (isNaN(startTimestampMs)) {
        return;
      }
      const durationSeconds = event.elapsed_time_seconds;
      if (typeof durationSeconds !== "number" || durationSeconds <= 0) {
        return;
      }

      const utcDate = new Date(startTimestampMs);
      const originalUtcHour = utcDate.getUTCHours();
      const durationMinutes = durationSeconds / 60;

      if (originalUtcHour >= 0 && originalUtcHour < 24) {
        utcHourlyActivityDuration[originalUtcHour] += durationMinutes;
      }
    });

    const pstShiftedHourlyActivityDuration = new Array(24).fill(0);
    for (let pstHour = 0; pstHour < 24; pstHour++) {
      const correspondingUtcHour = (pstHour + 7) % 24;
      pstShiftedHourlyActivityDuration[pstHour] =
        utcHourlyActivityDuration[correspondingUtcHour];
    }

    const hourlyActivityDuration = pstShiftedHourlyActivityDuration;
    const roundedHourlyActivityDuration = hourlyActivityDuration.map((d) =>
      Math.round(d),
    );
    const labels = Array.from({ length: 24 }, (_, i) => {
      const hour12 = i % 12 || 12;
      const ampm = i < 12 || i === 24 ? "AM" : "PM";
      if (i === 0) return `12 AM`; // Midnight
      return `${hour12} ${ampm}`;
    });
    const data = roundedHourlyActivityDuration;
    const maxDuration = Math.max(...data, 1); // Ensure maxDuration is at least 1 to avoid division by zero

    // --- MODIFIED SECTION TO PARSE RGB STRING ---
    let r = 75,
      g = 192,
      b = 192; // Default fallback color (teal-ish)
    const colorString = themeStyles.heatmapBaseColor;

    if (colorString && typeof colorString === "string") {
      if (colorString.startsWith("rgb(")) {
        const parts = colorString
          .substring(4, colorString.length - 1)
          .split(",")
          .map((s) => parseInt(s.trim(), 10));
        if (parts.length === 3 && parts.every((p) => !isNaN(p))) {
          [r, g, b] = parts;
        } else {
          console.warn(
            "Invalid RGB string for heatmap base:",
            colorString,
            "- using default color.",
          );
        }
      } else {
        console.warn(
          "Heatmap base color is not in expected 'rgb(R, G, B)' format:",
          colorString,
          "- using default color.",
        );
        // Note: If you also want to support hex from CSS variable here, you'd add parsing for it.
        // For now, it strictly expects "rgb(R,G,B)" if provided, or uses the hardcoded default.
      }
    } else if (colorString !== undefined) {
      // It's defined but not a string
      console.warn(
        "Heatmap base color is not a string:",
        colorString,
        "- using default color.",
      );
    } else {
      // It's undefined
      console.warn(
        "Heatmap base color is undefined in themeStyles - using default color.",
      );
    }
    // --- END OF MODIFIED SECTION ---

    const backgroundColors = data.map(
      (d) =>
        `rgba(${r}, ${g}, ${b}, ${0.15 + (maxDuration > 0 ? d / maxDuration : 0) * 0.85})`,
    );
    const borderColors = data.map(
      (d) =>
        `rgba(${Math.max(0, r - 14)}, ${Math.max(0, g - 42)}, ${Math.max(0, b - 35)}, ${0.3 + (maxDuration > 0 ? d / maxDuration : 0) * 0.7})`, // Darker version
    );

    myHeatmapChartInstance = destroyChart(myHeatmapChartInstance);

    myHeatmapChartInstance = new Chart(ctx, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Total Activity Duration (minutes, approx. PST)",
            data: data,
            backgroundColor: backgroundColors,
            borderColor: borderColors,
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: "Total Minutes Active",
              color: themeStyles.titleColor,
              font: {
                family: themeStyles.fontFamily,
              },
            },
            ticks: {
              color: themeStyles.textColor,
              font: { family: themeStyles.fontFamily },
            },
            grid: { color: themeStyles.gridColor },
          },
          x: {
            title: {
              display: true,
              text: "Time of Day (Approx. PST, UTC-8h)",
              color: themeStyles.titleColor,
              font: { family: themeStyles.fontFamily },
            },
            ticks: {
              color: themeStyles.textColor,
              font: { family: themeStyles.fontFamily },
            },
            grid: { color: themeStyles.gridColor },
          },
        },
        plugins: {
          title: {
            display: true,
            text: "Activity Heatmap by Time of Day",
            color: themeStyles.titleColor,
            font: { family: themeStyles.fontFamily, size: 16 },
          },
          tooltip: {
            backgroundColor: themeStyles.tooltipBg,
            titleColor: themeStyles.tooltipTextColor,
            bodyColor: themeStyles.tooltipTextColor,
            callbacks: {
              label: (ctx) =>
                `${ctx.dataset.label || ""}: ${ctx.parsed.y} minutes`,
            },
          },
          legend: {
            labels: {
              color: themeStyles.textColor,
              font: { family: themeStyles.fontFamily },
            },
          },
        },
      },
    });
  }

  // --- Function to draw the Cumulative Stats Line Chart ---
  function drawCumulativeStatsChart(events) {
    if (!cumulativeStatsChartCanvas) {
      console.error("Cumulative stats chart canvas element not found!");
      if (errorMessageDiv)
        errorMessageDiv.textContent +=
          "\nError: Cumulative stats chart canvas element is missing.";
      return;
    }
    const ctx = cumulativeStatsChartCanvas.getContext("2d");

    const sortedEvents = [...events].reverse();

    let cumulativeMilesRun = 0;
    let cumulativeMetersSwam = 0;
    let cumulativeActiveMinutes = 0;

    const runDataPoints = [];
    const swimDataPoints = [];
    const durationDataPoints = [];

    sortedEvents.forEach((event) => {
      let timestamp;
      if (event.start_time_iso) {
        timestamp = new Date(event.start_time_iso).getTime();
      } else if (typeof event.start_time === "number") {
        timestamp = event.start_time * 1000;
      } else {
        return;
      }

      if (isNaN(timestamp)) {
        return;
      }
      const eventTime = new Date(timestamp);

      const activeSeconds = event.moving_time_seconds || 0;
      cumulativeActiveMinutes += activeSeconds / 60;

      const distanceInMeters = event.distance_meters;
      if (event.sport_type === "Run" && typeof distanceInMeters === "number") {
        cumulativeMilesRun += distanceInMeters / 1609.34;
      }
      if (event.sport_type === "Swim" && typeof distanceInMeters === "number") {
        cumulativeMetersSwam += distanceInMeters;
      }

      runDataPoints.push({
        x: eventTime,
        y: parseFloat(cumulativeMilesRun.toFixed(2)),
      });
      swimDataPoints.push({
        x: eventTime,
        y: parseFloat(cumulativeMetersSwam.toFixed(0)),
      });
      durationDataPoints.push({
        x: eventTime,
        y: parseFloat(cumulativeActiveMinutes.toFixed(2)),
      });
    });

    myCumulativeChartInstance = destroyChart(myCumulativeChartInstance);

    myCumulativeChartInstance = new Chart(ctx, {
      type: "line",
      data: {
        datasets: [
          {
            label: "Cumulative Miles Run",
            data: runDataPoints,
            borderColor: themeStyles.runColor,
            backgroundColor: themeStyles.runBg,
            yAxisID: "yMiles",
            tension: 0.1,
            fill: true,
          },
          {
            label: "Cumulative Meters Swam",
            data: swimDataPoints,
            borderColor: themeStyles.swimColor,
            backgroundColor: themeStyles.swimBg,
            yAxisID: "yMeters",
            tension: 0.1,
            fill: true,
          },
          {
            label: "Cumulative Active Minutes",
            data: durationDataPoints,
            borderColor: themeStyles.durationColor,
            backgroundColor: themeStyles.durationBg,
            yAxisID: "yMinutes",
            tension: 0.1,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          title: {
            display: true,
            text: "Cumulative Activity Stats Over Time",
            color: themeStyles.titleColor,
            font: { family: themeStyles.fontFamily, size: 16 },
          },
          tooltip: {
            backgroundColor: themeStyles.tooltipBg,
            titleColor: themeStyles.tooltipTextColor,
            bodyColor: themeStyles.tooltipTextColor,
            callbacks: {
              label: function (context) {
                let label = context.dataset.label || "";
                if (label) label += ": ";
                if (context.parsed.y !== null) {
                  label += context.parsed.y.toLocaleString();
                  if (context.dataset.yAxisID === "yMiles") label += " miles";
                  else if (context.dataset.yAxisID === "yMeters") label += " m";
                  else if (context.dataset.yAxisID === "yMinutes")
                    label += " min";
                }
                return label;
              },
            },
          },
          legend: {
            labels: {
              color: themeStyles.textColor,
              font: { family: themeStyles.fontFamily },
            },
          },
        },
        scales: {
          x: {
            type: "time",
            time: {
              unit: "day",
              tooltipFormat: "MMM d, yyyy HH:mm",
              // ... other displayFormats
            },
            title: {
              display: true,
              text: "Date",
              color: themeStyles.textColor,
              font: { family: themeStyles.fontFamily },
            },
            ticks: {
              color: themeStyles.textColor,
              font: { family: themeStyles.fontFamily },
            },
            grid: { color: themeStyles.gridColor },
          },
          yMiles: {
            type: "linear",
            display: true,
            position: "left",
            title: {
              display: true,
              text: "Miles Run",
              color: themeStyles.titleColor,
              font: { family: themeStyles.fontFamily },
            },
            beginAtZero: true,
            ticks: {
              color: themeStyles.textColor,
              font: { family: themeStyles.fontFamily },
            },
            grid: { color: themeStyles.gridColor, drawOnChartArea: true },
          },
          yMeters: {
            type: "linear",
            display: true,
            position: "right",
            title: {
              display: true,
              text: "Meters Swam",
              color: themeStyles.titleColor,
              font: { family: themeStyles.fontFamily },
            },
            beginAtZero: true,
            ticks: {
              color: themeStyles.textColor,
              font: { family: themeStyles.fontFamily },
            },
            grid: { drawOnChartArea: false, color: themeStyles.gridColor },
          },
          yMinutes: {
            type: "linear",
            display: true,
            position: "right",
            title: {
              display: true,
              text: "Active Minutes",
              color: themeStyles.titleColor,
              font: { family: themeStyles.fontFamily },
            },
            beginAtZero: true,
            ticks: {
              color: themeStyles.textColor,
              font: { family: themeStyles.fontFamily },
            },
            grid: { drawOnChartArea: false, color: themeStyles.gridColor },
          },
        },
      },
    });
  }

  // Initial fetch and draw
  if (
    activityPieChartCanvas &&
    activityHeatmapChartCanvas &&
    cumulativeStatsChartCanvas
  ) {
    fetchAndDrawCharts();
  } else {
    console.warn(
      "One or more Strava chart canvas elements are missing. Charts will not be drawn.",
    );
    if (errorMessageDiv)
      errorMessageDiv.textContent =
        "Required chart canvas elements are missing in the HTML.";
  }
});
