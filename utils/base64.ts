import { Directory, File, Paths } from 'expo-file-system/next';

/**
 * Caracteres válidos para codificación Base64 estándar.
 */
const BASE64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

const BASE64_PAD = '=';
const BASE64_LOOKUP = new Uint8Array(256).fill(255);

for (let index = 0; index < BASE64_ALPHABET.length; index += 1) {
  BASE64_LOOKUP[BASE64_ALPHABET.charCodeAt(index)] = index;
}
BASE64_LOOKUP[BASE64_PAD.charCodeAt(0)] = 0;

/**
 * Convierte un arreglo de bytes a un string codificado en Base64.
 *
 * @param bytes Secuencia de bytes a codificar.
 */
export const encodeBase64 = (bytes: Uint8Array): string => {
  let output = '';

  for (let offset = 0; offset < bytes.length; offset += 3) {
    const chunk0 = bytes[offset];
    const chunk1 = offset + 1 < bytes.length ? bytes[offset + 1] : 0;
    const chunk2 = offset + 2 < bytes.length ? bytes[offset + 2] : 0;

    const enc0 = chunk0 >> 2;
    const enc1 = ((chunk0 & 0x03) << 4) | (chunk1 >> 4);
    const enc2 = ((chunk1 & 0x0f) << 2) | (chunk2 >> 6);
    const enc3 = chunk2 & 0x3f;

    output += BASE64_ALPHABET.charAt(enc0);
    output += BASE64_ALPHABET.charAt(enc1);
    output += offset + 1 < bytes.length ? BASE64_ALPHABET.charAt(enc2) : BASE64_PAD;
    output += offset + 2 < bytes.length ? BASE64_ALPHABET.charAt(enc3) : BASE64_PAD;
  }

  return output;
};

/**
 * Decodifica un string en Base64 a su representación binaria.
 *
 * @param base64 Cadena codificada.
 */
export const decodeBase64 = (base64: string): Uint8Array => {
  const sanitized = base64.replace(/\s/g, '');
  const length = sanitized.length;

  if (length % 4 !== 0) {
    throw new Error('Cadena Base64 inválida.');
  }

  const padding = sanitized.endsWith('==') ? 2 : sanitized.endsWith('=') ? 1 : 0;
  const output = new Uint8Array((length * 3) / 4 - padding);

  let outputOffset = 0;

  for (let index = 0; index < length; index += 4) {
    const encoded0 = BASE64_LOOKUP[sanitized.charCodeAt(index)];
    const encoded1 = BASE64_LOOKUP[sanitized.charCodeAt(index + 1)];
    const encoded2 = BASE64_LOOKUP[sanitized.charCodeAt(index + 2)];
    const encoded3 = BASE64_LOOKUP[sanitized.charCodeAt(index + 3)];

    if (encoded0 === 255 || encoded1 === 255 || encoded2 === 255 || encoded3 === 255) {
      throw new Error('Cadena Base64 inválida.');
    }

    const byte0 = (encoded0 << 2) | (encoded1 >> 4);
    const byte1 = ((encoded1 & 0x0f) << 4) | (encoded2 >> 2);
    const byte2 = ((encoded2 & 0x03) << 6) | encoded3;

    output[outputOffset] = byte0;
    if (encoded2 !== 64 && outputOffset + 1 < output.length) {
      output[outputOffset + 1] = byte1;
    }
    if (encoded3 !== 64 && outputOffset + 2 < output.length) {
      output[outputOffset + 2] = byte2;
    }

    outputOffset += 3;
  }

  return output;
};

/**
 * Genera una instancia de directorio escribible, asegurando su existencia.
 *
 * @param preferCache Cuando es true utiliza el directorio de cache, sino el de documentos.
 */
export const ensureWritableDirectory = (preferCache = true): Directory => {
  try {
    const candidate = preferCache ? Paths.cache : Paths.document;
    if (!candidate.exists) {
      candidate.create({ intermediates: true, idempotent: true });
    }
    return candidate;
  } catch {
    const fallback = Paths.document;
    if (!fallback.exists) {
      fallback.create({ intermediates: true, idempotent: true });
    }
    return fallback;
  }
};

/**
 * Lee un archivo y retorna su contenido en Base64, evitando APIs de Node.
 *
 * @param uri Ubicación del archivo.
 */
export const readFileAsBase64 = async (uri: string): Promise<string> => {
  const file = new File(uri);
  if (!file.exists) {
    throw new Error('El archivo seleccionado no está disponible.');
  }
  const data = await file.bytes();
  return encodeBase64(new Uint8Array(data));
};

/**
 * Escribe un archivo utilizando un string en Base64.
 *
 * @param directory Directorio donde se generará el archivo.
 * @param filename Nombre del archivo.
 * @param contents Contenido codificado.
 * @param options Opciones adicionales de escritura (se aplica siempre overwrite).
 */
export const writeBase64File = (directory: Directory, filename: string, contents: string): File => {
  if (!directory.exists) {
    directory.create({ intermediates: true, idempotent: true });
  }

  const file = new File(directory, filename);
  file.create({ intermediates: true, overwrite: true });
  const bytes = decodeBase64(contents);
  file.write(bytes);
  return file;
};
