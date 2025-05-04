function setupRangeSliders() {
  const sliders = document.querySelectorAll('input[type="range"]');

  function updateSlider(slider) {
    const min = parseFloat(slider.min);
    const max = parseFloat(slider.max);
    const value = parseFloat(slider.value);

    let outputSpan = null;
    const sliderValueContainer = slider.nextElementSibling;
    if (
      sliderValueContainer &&
      sliderValueContainer.classList.contains("slider-value")
    ) {
      outputSpan = sliderValueContainer.querySelector(".value-display");
    }

    if (outputSpan) {
      outputSpan.textContent = value;
    }

    const percentage = ((value - min) / (max - min)) * 100;
    slider.style.setProperty("--value-percent", percentage + "%");
  }

  sliders.forEach((slider) => {
    updateSlider(slider); // Set initial state
    slider.addEventListener("input", (event) => {
      updateSlider(event.target);
    });
  });
}

// Call the setup function immediately since the DOM elements above are loaded
setupRangeSliders();
