export async function getImageSize(url: string) {
  const img = new Image();
  img.src = url;

  // Wait until the image is loaded
  await img.decode();

  return {
    width: img.naturalWidth,
    height: img.naturalHeight,
  };
}
