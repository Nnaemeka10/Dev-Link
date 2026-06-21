import type { ListingImageVariant } from '../types/listing.js';

const DEFAULT_IMAGE_WIDTHS = [320, 640, 960, 1280];
const DEFAULT_THUMBNAIL_WIDTH = 480;

function injectCloudinaryTransformation(url: string, transformation: string): string {
    const uploadMarker = '/image/upload/';

    if (!url.includes(uploadMarker)) {
        return url;
    }

    return url.replace(uploadMarker, `${uploadMarker}${transformation}/`);
}

export function buildCloudinaryImageUrl(url: string, width: number): string {
    return injectCloudinaryTransformation(url, `f_auto,q_auto,c_fill,g_auto,w_${width}`);
}

export function buildListingThumbnailUrl(url: string, width = DEFAULT_THUMBNAIL_WIDTH): string {
    return buildCloudinaryImageUrl(url, width);
}

export function buildListingImageVariants(url: string, widths = DEFAULT_IMAGE_WIDTHS): ListingImageVariant[] {
    return widths.map((width) => ({
        width,
        url: buildCloudinaryImageUrl(url, width),
    }));
}

export function buildSrcSet(variants: ListingImageVariant[]): string {
    return variants.map((variant) => `${variant.url} ${variant.width}w`).join(', ');
}
