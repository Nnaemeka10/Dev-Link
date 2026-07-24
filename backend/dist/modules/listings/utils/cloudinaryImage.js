const DEFAULT_IMAGE_WIDTHS = [320, 640, 960, 1280];
const DEFAULT_THUMBNAIL_WIDTH = 480;
function injectCloudinaryTransformation(url, transformation) {
    const uploadMarker = '/image/upload/';
    if (!url.includes(uploadMarker)) {
        return url;
    }
    return url.replace(uploadMarker, `${uploadMarker}${transformation}/`);
}
export function buildCloudinaryImageUrl(url, width) {
    return injectCloudinaryTransformation(url, `f_auto,q_auto,c_fill,g_auto,w_${width}`);
}
export function buildListingThumbnailUrl(url, width = DEFAULT_THUMBNAIL_WIDTH) {
    return buildCloudinaryImageUrl(url, width);
}
export function buildListingImageVariants(url, widths = DEFAULT_IMAGE_WIDTHS) {
    return widths.map((width) => ({
        width,
        url: buildCloudinaryImageUrl(url, width),
    }));
}
export function buildSrcSet(variants) {
    return variants.map((variant) => `${variant.url} ${variant.width}w`).join(', ');
}
//# sourceMappingURL=cloudinaryImage.js.map