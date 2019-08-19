export function decodeImageDataURI (dataURI: string) {
    const regExMatches = dataURI.match('data:(image/.*);base64,(.*)');
    if (regExMatches === null) {
        return regExMatches;
    }
    const dataBase64 = regExMatches[2];
    const data = Uint8Array.from(atob(dataBase64), c => c.charCodeAt(0))
    return {
        imageType: regExMatches[1],
        dataBase64,
        data,
    };
}