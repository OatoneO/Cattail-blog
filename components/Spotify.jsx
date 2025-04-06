import { getRecentlyPlayed } from "@/lib/spotify";
import SpotifyIcon from "@/public/icons/SpotifyIcon";
import Image from "next/image";
import MusicIcon from "./MusicIcon";

export default async function Spotify() {
  const data = await getRecentlyPlayed();
  const items = data.items;

  return (
    <div className="px-8 pt-3 shadow-[0_0px_1.2px_rgb(140,140,140)] rounded-2xl">
      <div className="flex justify-between mb-4">
        <div className="flex items-center mb-2 ">
          <MusicIcon className="w-10 h-10" />
          <h2 className="text-sm font-semibold text-green-200 opacity-60">
            RECENTLY PLAYED
          </h2>
        </div>
        <div className="flex items-center">
          <SpotifyIcon className="w-8 h-8" />
        </div>
      </div>

      <ul>
        {items.map((item) => {
          return (
            <li key={item.track.name} className="flex items-center gap-3 mb-4">
              <Image
                width={40}
                height={40}
                src={item.track.album.images[0]?.url}
                alt="track picture"
                className="object-cover rounded-lg"
              />
              <div className="text-sm">
                <p className="font-semibold ">{item.track.name}</p>
                <p className="text-muted-foreground">
                  {item.track.artists.map((artist) => artist.name).join(", ")}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
