import Image from "next/image";
import { Grid2X2 } from "lucide-react";
import Link from "next/link";

export function MobileHeroPhoto({ image, name, photosHref }: { image: string | null; name: string; photosHref: string }) {
  if (!image) {
    return <div className="flex h-116 items-center justify-center bg-gray-200 text-gray-500">No image available</div>;
  }
  return (
    <div className="relative h-116 overflow-hidden">
      <Image src={image} alt={name} fill priority className="object-cover" sizes="100vw" />
      <Link href={photosHref}
        className="absolute bottom-14 right-4 inline-flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-xs font-extrabold shadow-md">
        <Grid2X2 className="h-3.5 w-3.5" />Photos
      </Link>
    </div>
  );
}

export function TabletPhotoGallery({ gallery, name, photosHref }: { gallery: string[]; name: string; photosHref: string }) {
  if (gallery.length === 0) {
    return <div className="grid h-120 grid-cols-[2fr_1fr] gap-1 bg-gray-200"><div className="flex items-center justify-center text-gray-500">No images</div></div>;
  }
  return (
    <section className="relative grid h-120 grid-cols-[2fr_1fr] gap-1 overflow-hidden">
      <div className="relative">
        <Image src={gallery[0]} alt={name} fill priority className="object-cover" sizes="65vw" />
      </div>
      <div className="grid grid-rows-2 gap-1">
        {gallery.slice(1, 3).map((img, index) => (
          <div key={index} className="relative">
            <Image src={img} alt={`${name} view ${index + 2}`} fill className="object-cover" sizes="35vw" />
          </div>
        ))}
        <Link href={photosHref}
          className="absolute bottom-5 right-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-extrabold shadow-md">
          <Grid2X2 className="h-4 w-4" /> Photos
        </Link>
      </div>
    </section>
  );
}

export function DesktopPhotoGallery({ gallery, name, photosHref }: { gallery: string[]; name: string; photosHref: string }) {
  if (gallery.length === 0) {
    return <div className="grid h-136 grid-cols-[1.15fr_1fr] gap-3 rounded-4xl bg-gray-200"><div className="flex items-center justify-center text-gray-500">No images</div></div>;
  }
  return (
    <section className="grid h-136 grid-cols-[1.15fr_1fr] gap-3 overflow-hidden rounded-4xl">
      <div className="relative">
        <Image src={gallery[0]} alt={name} fill priority className="object-cover" sizes="48vw" />
      </div>
      <div className="grid grid-cols-2 gap-3 relative">
        {gallery.slice(1, 5).map((img, index) => (
          <div key={index} className="relative overflow-hidden">
            <Image src={img} alt={`${name} gallery ${index + 1}`} fill className="object-cover" sizes="24vw" />
          </div>
        ))}
        <Link href={photosHref}
          className="absolute bottom-6 right-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-extrabold shadow-md">
          <Grid2X2 className="h-4 w-4" /> Photos
        </Link>
          
      </div>
    </section>
  );
}