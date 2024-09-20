const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
const dropperBtn = document.getElementById('dropper-btn') as HTMLButtonElement;
const dropperCircle = document.getElementById('dropper-circle') as HTMLDivElement;
const colorHexDisplay = document.getElementById('color-hex') as HTMLSpanElement;
const imageUpload = document.getElementById('image-upload') as HTMLInputElement;

let isDropperEnabled = false;
let isZoomCircleVisible = false;
let zoomCanvas: HTMLCanvasElement | null = null;
let zoomCtx: CanvasRenderingContext2D | null = null;
let lastX = -1, lastY = -1;

function handleImageUpload(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const aspectRatio = img.width / img.height;
        const canvasWidth = canvas.clientWidth;
        const canvasHeight = canvasWidth / aspectRatio;

        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        zoomCanvas = document.createElement('canvas');
        zoomCanvas.width = canvasWidth;
        zoomCanvas.height = canvasHeight;
        zoomCtx = zoomCanvas.getContext('2d');
        if (zoomCtx) {
          zoomCtx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  }
}

imageUpload.addEventListener('change', handleImageUpload);

dropperBtn.addEventListener('click', () => {
  isDropperEnabled = !isDropperEnabled;
  canvas.style.cursor = isDropperEnabled ? 'crosshair' : 'default';
  dropperCircle.style.display = isDropperEnabled ? 'block' : 'none';
});

function updateZoomCircle(x: number, y: number) {
  const rect = canvas.getBoundingClientRect();
  const adjustedX = x - rect.left + window.scrollX;
  const adjustedY = y - rect.top + window.scrollY;

  if (Math.abs(adjustedX - lastX) < 3 && Math.abs(adjustedY - lastY) < 3) {
    return;
  }
  lastX = adjustedX;
  lastY = adjustedY;

  if (zoomCtx) {
    const pixel = zoomCtx.getImageData(adjustedX, adjustedY, 1, 1).data;
    const hexColor = rgbToHex(pixel[0], pixel[1], pixel[2]);
    dropperCircle.style.borderColor = hexColor;

    dropperCircle.style.left = `${x}px`;
    dropperCircle.style.top = `${y}px`;

    zoomCanvasArea(adjustedX, adjustedY, dropperCircle, hexColor);
  }
}

function zoomCanvasArea(x: number, y: number, zoomContainer: HTMLDivElement, colorHex: string) {
  const zoomSize = 150;
  const zoomLevel = 3;

  zoomContainer.style.backgroundImage = '';

  const zoomResultCanvas = document.createElement('canvas');
  zoomResultCanvas.width = zoomSize * zoomLevel;
  zoomResultCanvas.height = zoomSize * zoomLevel;
  const zoomResultCtx = zoomResultCanvas.getContext('2d');

  if (zoomResultCtx) {
    zoomResultCtx.drawImage(zoomCanvas!, x - zoomSize / 2, y - zoomSize / 2, zoomSize, zoomSize, 0, 0, zoomSize * zoomLevel, zoomSize * zoomLevel);

    zoomContainer.style.backgroundImage = `url(${zoomResultCanvas.toDataURL()})`;
    zoomContainer.style.backgroundSize = `${zoomSize * zoomLevel}px ${zoomSize * zoomLevel}px`;

    let colorCodeText = zoomContainer.querySelector('.color-code');
    if (!colorCodeText) {
      colorCodeText = document.createElement('div');
      colorCodeText.className = 'color-code';
      zoomContainer.appendChild(colorCodeText);
    }
    colorCodeText.textContent = colorHex;
  }
}

canvas.addEventListener('mousemove', (e) => {
  if (!isDropperEnabled) return;

  if (isZoomCircleVisible) return;

  isZoomCircleVisible = true;
  requestAnimationFrame(() => {
    updateZoomCircle(e.clientX, e.clientY);
    isZoomCircleVisible = false;
  });
});

canvas.addEventListener('click', (e) => {
  if (isDropperEnabled) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left + window.scrollX;
    const y = e.clientY - rect.top + window.scrollY;

    if (zoomCtx) {
      const pixel = zoomCtx.getImageData(x, y, 1, 1).data;
      const hexColor = rgbToHex(pixel[0], pixel[1], pixel[2]);

      colorHexDisplay.textContent = hexColor;
      navigator.clipboard.writeText(hexColor);
    }

    isDropperEnabled = false;
    canvas.style.cursor = 'default';
    dropperCircle.style.display = 'none';
  }
});


function rgbToHex(r: number, g: number, b: number): string {
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
}

window.addEventListener('resize', (event: Event) => {
  handleImageUpload({...event, target: {files: imageUpload.files || null}} as unknown as Event);
});
