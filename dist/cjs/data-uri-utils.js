"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function decodeImageDataURI(dataURI) {
    var regExMatches = dataURI.match('data:(image/.*);base64,(.*)');
    if (regExMatches === null) {
        return regExMatches;
    }
    var dataBase64 = regExMatches[2];
    var data = Uint8Array.from(atob(dataBase64), function (c) { return c.charCodeAt(0); });
    return {
        imageType: regExMatches[1],
        dataBase64: dataBase64,
        data: data,
    };
}
exports.decodeImageDataURI = decodeImageDataURI;
//# sourceMappingURL=data-uri-utils.js.map