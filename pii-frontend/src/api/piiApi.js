export async function extractPII(files) {
  const formData = new FormData();

  files.forEach((file) => {
    formData.append("files", file);
  });

  const response = await fetch("http://127.0.0.1:8000/extract", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("PII extraction failed");
  }

  return response.json();
}
