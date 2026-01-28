const res = await fetch("http://127.0.0.1:3000/api/admin/grants", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: "tobias.doehring@vfa-interlift.de",
    trainingId: "cmkwzf3re0000nskwzamrevmv",
    credits: 5,
    note: "Manuell vergeben (Test)",
  }),
});

console.log("Status:", res.status);
console.log(await res.text());
