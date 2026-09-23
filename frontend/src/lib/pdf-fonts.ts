import { jsPDF } from 'jspdf';

let fontsLoaded = false;
let regularFontBase64: string | null = null;
let boldFontBase64: string | null = null;

async function fetchFontAsBase64(url: string): Promise<string> {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export async function loadCyrillicFonts(doc: jsPDF): Promise<void> {
  if (!fontsLoaded) {
    regularFontBase64 = await fetchFontAsBase64('/fonts/Roboto-Regular.ttf');
    boldFontBase64 = await fetchFontAsBase64('/fonts/Roboto-Bold.ttf');
    fontsLoaded = true;
  }

  doc.addFileToVFS('Roboto-Regular.ttf', regularFontBase64!);
  doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');

  doc.addFileToVFS('Roboto-Bold.ttf', boldFontBase64!);
  doc.addFont('Roboto-Bold.ttf', 'Roboto', 'bold');

  doc.setFont('Roboto', 'normal');
}
