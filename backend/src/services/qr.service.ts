// src/services/qr.service.ts

import QRCode from 'qrcode';

export const generateQRCode = async (text: string): Promise<string> => {
  try {
    // Генерируем QR-код в формате base64
    const qrCodeDataUrl = await QRCode.toDataURL(text, {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    // Извлекаем base64 часть из Data URL
    const base64Data = qrCodeDataUrl.replace(/^data:image\/png;base64,/, '');
    console.log(base64Data);
    return base64Data;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
};