document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("imageForm");
  const spinner = document.querySelector(".spinner-border");
  const generatedImage = document.getElementById("generatedImage");
  const imageSection = document.querySelector(".image-section");
  const skeletonLoader = document.querySelector(".skeleton-loader");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    toggleLoader(true);
    try {
      const formData = new FormData(form);
      const response = await fetch(
        "https://future4u.replit.app/generate-images",
        {
          method: "POST",
          body: formData,
        }
      );
      const data = await response.json();
      if (data.imageData && data.imageData.length > 0) {
        displayGeneratedImage(data.imageData[0]);
      } else {
        console.error("No image data found");
        toggleLoader(false);
      }
    } catch (error) {
      console.error("Error:", error);
      toggleLoader(false);
    }
  });

  function toggleLoader(show) {
    spinner.style.display = show ? "inline-block" : "none";
    skeletonLoader.style.display = show ? "block" : "none";
    if (!show) imageSection.style.display = "none";
  }

  function displayGeneratedImage(imageSrc) {
    generatedImage.src = imageSrc;
    generatedImage.onload = () => {
      toggleLoader(false);
      imageSection.style.display = "block";
    };
  }

  window.handleDownload = function () {
    if (generatedImage.src) {
      const link = document.createElement("a");
      link.href = generatedImage.src;
      link.download = "downloadedImage.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      alert("No image available for download.");
    }
  };
});
