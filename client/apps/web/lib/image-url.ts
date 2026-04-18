const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(
    /\/$/,
    "",
).replace(/\/api$/, "");

export function resolveImageUrl(
    imagePath?: string | null,
    fallbackPath = "/placeholder-room.jpg",
): string {
    if (!imagePath) {
        return fallbackPath;
    }

    if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
        return imagePath;
    }

    const normalizedPath = imagePath.startsWith("/")
        ? imagePath
        : `/${imagePath}`;

    return apiBaseUrl ? `${apiBaseUrl}${normalizedPath}` : normalizedPath;
}
