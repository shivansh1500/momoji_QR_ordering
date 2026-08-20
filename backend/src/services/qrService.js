import QRCode from 'qrcode';

export async function generateQRDataURL(token) {
  const url = `http://localhost:5173/menu?table=${token}`;
  return QRCode.toDataURL(url, {
    errorCorrectionLevel: 'H',
    margin: 2,
    color: {
      dark: '#061C15',
      light: '#B1E09D'
    }
  });
}

export async function generateQRBuffer(token) {
  const url = `http://localhost:5173/menu?table=${token}`;
  return QRCode.toBuffer(url, {
    errorCorrectionLevel: 'H',
    margin: 2,
    color: {
      dark: '#061C15',
      light: '#FFFFFF'
    }
  });
}
