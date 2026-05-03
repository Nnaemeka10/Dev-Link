import Image from "next/image";
import { Grid2X2 } from "lucide-react";
import type { StaticImageData } from "next/image";

export function MobileHeroPhoto({ image, name }: { image: StaticImageData; name: string }) {
  return (
    <div className="relative h-[29rem] overflow-hidden">
      <Image src={image} alt={name} fill priority className="object-cover" sizes="100vw" />
    </div>
  );
}

export function TabletPhotoGallery({ gallery, name }: { gallery: StaticImageData[]; name: string }) {
  return (
    <section className="grid h-[30rem] grid-cols-[2fr_1fr] gap-1 overflow-hidden">
      <div className="relative">
        <Image src={gallery[0]} alt={name} fill priority className="object-cover" sizes="65vw" />
      </div>
      <div className="grid grid-rows-2 gap-1">
        {gallery.slice(1, 3).map((image, index) => (
          <div key={index} className="relative">
            <Image src={image} alt={`${name} view ${index + 2}`} fill className="object-cover" sizes="35vw" />
          </div>
        ))}
        <button
          type="button"
          className="absolute bottom-5 right-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-extrabold shadow-md"
        >
          <Grid2X2 className="h-4 w-4" />
          Show all photos
        </button>
      </div>
    </section>
  );
}

export function DesktopPhotoGallery({ gallery, name }: { gallery: StaticImageData[]; name: string }) {
  return (
    <section className="grid h-[34rem] grid-cols-[1.15fr_1fr] gap-3 overflow-hidden rounded-[2rem]">
      <div className="relative">
        <Image src={gallery[4]} alt={name} fill priority className="object-cover" sizes="48vw" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {gallery.slice(0, 4).map((image, index) => (
          <div key={index} className="relative overflow-hidden">
            <Image src={image} alt={`${name} gallery ${index + 1}`} fill className="object-cover" sizes="24vw" />
            {index === 3 ? (
              <button
                type="button"
                className="absolute bottom-5 right-5 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-extrabold shadow-md"
              >
                <Grid2X2 className="h-4 w-4" />
                Show all photos
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
