declare module "expo-document-picker" {
  export type DocumentPickerAsset = {
    uri: string;
  };

  export type DocumentPickerResult =
    | {
        canceled: boolean;
        assets?: DocumentPickerAsset[];
      }
    | {
        type: "success";
        uri: string;
      };

  export function getDocumentAsync(options?: {
    type?: string | string[];
    copyToCacheDirectory?: boolean;
  }): Promise<DocumentPickerResult>;
}

declare module "expo-sharing" {
  export function isAvailableAsync(): Promise<boolean>;
  export function shareAsync(
    url: string,
    options?: {
      mimeType?: string;
      dialogTitle?: string;
    }
  ): Promise<void>;
}

declare module "expo-file-system" {
  export const cacheDirectory: string | null;
  export const documentDirectory: string | null;
  export const EncodingType: {
    Base64: "base64";
  };
  export function readAsStringAsync(
    uri: string,
    options?: {
      encoding?: string;
    }
  ): Promise<string>;
  export function writeAsStringAsync(
    uri: string,
    data: string,
    options?: {
      encoding?: string;
    }
  ): Promise<void>;
}

declare function require(name: string): any;
