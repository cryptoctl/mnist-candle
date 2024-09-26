/**
 * Auto crops the image, scales to 28x28 pixel image, and returns as grayscale image.
 * @param {object} mainContext - The 2d context of the source canvas.
 * @param {object} cropContext - The 2d context of an intermediate hidden canvas.
 * @param {object} scaledContext - The 2d context of the destination 28x28 canvas.
 */
export function cropScaleGetImageData(
    mainContext: CanvasRenderingContext2D,
    cropContext: CanvasRenderingContext2D,
    scaledContext: CanvasRenderingContext2D) {

    const cropEl = cropContext.canvas;

    // Get the auto-cropped image data and put into the intermediate/hidden canvas
    cropContext.fillStyle = "rgba(255, 255, 255, 255)"; // white non-transparent color
    cropContext.fillRect(0, 0, cropEl.width, cropEl.height);
    cropContext.save();
    const { w, h, imageData:croppedImage } = cropImageFromCanvas(mainContext);
    cropEl.width = Math.max(w, h) * 1.2;
    cropEl.height = Math.max(w, h) * 1.2;
    const leftPadding = (cropEl.width - w) / 2;
    const topPadding = (cropEl.height - h) / 2;
    cropContext.putImageData(croppedImage, leftPadding, topPadding);

    // Copy image data to scale 28x28 canvas
    scaledContext.save();
    scaledContext.clearRect(0, 0, scaledContext.canvas.height, scaledContext.canvas.width);
    scaledContext.fillStyle = "rgba(255, 255, 255, 255)"; // white non-transparent color
    scaledContext.fillRect(0, 0, cropEl.width, cropEl.height);
    scaledContext.scale(28.0 / cropContext.canvas.width, 28.0 / cropContext.canvas.height);
    scaledContext.drawImage(cropEl, 0, 0);

    // Extract image data and convert into single value (greyscale) array
    const data = rgba2gray(scaledContext.getImageData(0, 0, 28, 28).data);
    scaledContext.restore();

    return data;
}

/**
 * Converts RGBA image data from canvas to grayscale (0 is white & 255 is black).
 * @param data
 */
export function rgba2gray(data:Uint8ClampedArray) {
    let converted = new Uint8Array(data.length / 4);

    // Data is stored as [r0,g0,b0,a0, ... r[n],g[n],b[n],a[n]] where n is number of pixels.
    for (let i = 0; i < data.length; i += 4) {
        let r = 255 - data[i];     // red
        let g = 255 - data[i + 1]; // green
        let b = 255 - data[i + 2]; // blue
        //let a = 255 - data[i + 3]; // alpha

        // Use RGB grayscale coefficients (https://imagej.nih.gov/ij/docs/menus/image.html)
        converted[i / 4] = 0.299 * r + 0.587 * g + 0.114 * b; // 4 times fewer data points but the same number of pixels.
    }
    return converted;
}

/**
 * Auto crops a canvas images and returns its image data.
 * @param {object} ctx - canvas 2d context.
 * src: https://stackoverflow.com/a/22267731
 */
export function cropImageFromCanvas(ctx:CanvasRenderingContext2D) {
    let canvas = ctx.canvas,
        w = canvas.width,
        h = canvas.height,
        imageData = ctx.getImageData(0, 0, canvas.width, canvas.height),
        x,
        y,
        index;
    let tlCorner = { x:w+1, y:h+1 },
        brCorner = { x:-1, y:-1 };

    for (y = 0; y < h; y++) {
        for (x = 0; x < w; x++) {
            index = (y * w + x) * 4;
            let r = imageData.data[index];
            let g = imageData.data[index + 1];
            let b = imageData.data[index + 2];
            if (Math.min(r, g, b) != 255) {
                tlCorner.x = Math.min(x, tlCorner.x);
                tlCorner.y = Math.min(y, tlCorner.y);
                brCorner.x = Math.max(x, brCorner.x);
                brCorner.y = Math.max(y, brCorner.y);
            }
        }
    }
    w = brCorner.x - tlCorner.x;
    h = brCorner.y - tlCorner.y;
    return { w, h, imageData:ctx.getImageData(tlCorner.x, tlCorner.y, w, h) };
}