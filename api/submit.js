export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const {
    name,
    address,
    neighbourhood,
    model,
    evidence,
    sourceUrl,
    turnstileToken,
  } = req.body || {};

  if (!name || !address || !neighbourhood || !turnstileToken) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  const verifyRes = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret: process.env.TURNSTILE_SECRET_KEY,
        response: turnstileToken,
        remoteip: req.headers["x-forwarded-for"],
      }),
    },
  );
  const verify = await verifyRes.json();
  if (!verify.success) {
    res.status(400).json({ error: "Verification failed" });
    return;
  }

  const fields = [
    { name: "Name", value: name },
    { name: "Address", value: address },
    { name: "Neighbourhood", value: neighbourhood },
    { name: "Tipping model", value: model || "not-sure" },
    { name: "Evidence", value: evidence || "not given" },
  ];
  if (sourceUrl) fields.push({ name: "Source URL", value: sourceUrl });

  const discordRes = await fetch(process.env.DISCORD_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      embeds: [
        {
          title: "New place submitted",
          fields,
          color: 0x17221c,
        },
      ],
    }),
  });
  if (!discordRes.ok) {
    res.status(502).json({ error: "Could not deliver notification" });
    return;
  }

  res.status(200).json({ ok: true });
}
