const form = document.getElementById("uploadForm");
const resultBox = document.getElementById("result");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData(form);

  const response = await fetch("/analyze", {
    method: "POST",
    body: formData
  });

  const data = await response.json();
  resultBox.textContent = JSON.stringify(data, null, 2);
});

function copyResult() {
  navigator.clipboard.writeText(resultBox.textContent);
  alert("Copied to clipboard!");
}

function downloadResult() {
  const blob = new Blob([resultBox.textContent], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "pharmaguard_result.json";
  link.click();
}
