/**
 * Simple QR Code Generator
 * For testing and development purposes
 */

/**
 * Generate a simple QR code data URL
 * This creates a basic QR-like pattern for testing
 */
export function generateTestQRCode(data: string): string {
  // Create a simple pattern that looks like a QR code
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    return generateFallbackQRCode(data);
  }
  
  // Fill white background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, size, size);
  
  // Create QR-like pattern
  ctx.fillStyle = '#000000';
  const blockSize = 8;
  
  // Generate pattern based on data hash
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    hash = ((hash << 5) - hash + data.charCodeAt(i)) & 0xffffffff;
  }
  
  // Create pseudo-random pattern
  for (let x = 0; x < size; x += blockSize) {
    for (let y = 0; y < size; y += blockSize) {
      const random = Math.abs(Math.sin(hash + x + y)) * 1000;
      if (Math.floor(random) % 3 === 0) {
        ctx.fillRect(x, y, blockSize, blockSize);
      }
    }
  }
  
  // Add corner markers (like real QR codes)
  drawCornerMarker(ctx, 0, 0, blockSize);
  drawCornerMarker(ctx, size - blockSize * 7, 0, blockSize);
  drawCornerMarker(ctx, 0, size - blockSize * 7, blockSize);
  
  return canvas.toDataURL('image/png');
}

function drawCornerMarker(ctx: CanvasRenderingContext2D, x: number, y: number, blockSize: number) {
  // Outer square
  ctx.fillRect(x, y, blockSize * 7, blockSize * 7);
  // Inner white square
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(x + blockSize, y + blockSize, blockSize * 5, blockSize * 5);
  // Center black square
  ctx.fillStyle = '#000000';
  ctx.fillRect(x + blockSize * 2, y + blockSize * 2, blockSize * 3, blockSize * 3);
}

function generateFallbackQRCode(data: string): string {
  // Fallback: return a simple SVG
  const svg = `
    <svg width="256" height="256" xmlns="http://www.w3.org/2000/svg">
      <rect width="256" height="256" fill="white"/>
      <rect x="10" y="10" width="236" height="236" fill="none" stroke="black" stroke-width="2"/>
      <text x="128" y="128" text-anchor="middle" font-family="monospace" font-size="12" fill="black">
        QRIS Payment
      </text>
      <text x="128" y="150" text-anchor="middle" font-family="monospace" font-size="10" fill="black">
        ${data.substring(0, 20)}...
      </text>
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

/**
 * Generate QR code with custom styling
 */
export function generateStyledQRCode(
  data: string, 
  options: {
    size?: number;
    foregroundColor?: string;
    backgroundColor?: string;
    margin?: number;
  } = {}
): string {
  const {
    size = 256,
    foregroundColor = '#000000',
    backgroundColor = '#FFFFFF',
    margin = 4
  } = options;
  
  // This would integrate with a real QR code library
  // For now, return the test QR code with styling info
  return generateTestQRCode(data);
}

/**
 * Generate QRIS-specific QR code
 */
export function generateQRISCode(
  paymentId: string,
  amount: number,
  merchantName: string = 'Trading Platform',
  merchantId: string = 'MERCHANT001'
): string {
  // QRIS format: EMV QR Code
  const qrisData = {
    id: '26',
    data: {
      '00': '01', // Payload Format Indicator
      '01': '12', // Point of Initiation Method
      '52': '0000', // Merchant Category Code
      '53': '360', // Transaction Currency (IDR)
      '54': amount.toString(), // Transaction Amount
      '58': 'ID', // Country Code
      '59': merchantName, // Merchant Name
      '60': 'Jakarta', // Merchant City
      '62': {
        '07': paymentId // Additional Data Field Template
      }
    }
  };
  
  // Convert to string format for QR code
  const qrString = JSON.stringify(qrisData);
  
  return generateTestQRCode(qrString);
}


