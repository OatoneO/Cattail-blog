import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

export async function getRecentlyPlayed() {
  const accessToken = await getAccessToken();

  const response = await fetch(
    "https://api.spotify.com/v1/me/player/recently-played?limit=5",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `Error fetching recently played tracks: ${response.statusText}`
    );
  }

  return response.json();
}

async function getAccessToken() {
  let accessToken = await redis.get("spotify_access_token");

  if (!accessToken) {
    // Refresh the token if it doesn't exist
    accessToken = await refreshAccessToken();
    const expiry = 3600; // Token expires in 1 hour
    await redis.set("spotify_access_token", accessToken, { ex: expiry });
  }

  return accessToken;
}

async function refreshAccessToken() {
  const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN;
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    throw new Error(`Error refreshing access token: ${response.statusText}`);
  }

  const data = await response.json();
  return data.access_token;
}
