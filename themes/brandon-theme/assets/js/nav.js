const menuToggle = document.getElementById("menu-toggle");
const mainNav = document.getElementById("main-nav");

if (menuToggle && mainNav) {
  // Start hidden explicitly
  if (menuToggle.getAttribute("aria-expanded") === "false") {
    mainNav.style.display = "none";
  }

  menuToggle.addEventListener("click", () => {
    const isExpanded = menuToggle.getAttribute("aria-expanded") === "true";

    // Toggle ARIA attributes
    menuToggle.setAttribute("aria-expanded", !isExpanded);
    mainNav.setAttribute("aria-hidden", isExpanded);

    // Toggle visibility using class AND display style
    mainNav.classList.toggle("is-open");
    if (!isExpanded) {
      mainNav.style.display = "block"; // Show (the nav container)
    } else {
      mainNav.style.display = "none"; // Hide
    }
  });
} else {
  if (!menuToggle) console.error("Menu toggle button not found!");
  if (!mainNav) console.error("Main navigation element (#main-nav) not found!");
}
