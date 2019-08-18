declare module 'parse-data-url' {
    export default function parseDataUrl(url: string): null | {
        mediaType: string,
        contentType: string,
        charset: string,
        base64: boolean,
        data: string,
        toBuffer: () => Uint8Array
    };
}

declare module 'image-data-uri' {
    export function decode(url: string): null | {
        imageType: string,
        dataBase64: string,
        dataBuffer: Buffer,
    };
}