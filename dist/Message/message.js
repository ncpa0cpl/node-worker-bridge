"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMessagePacker = void 0;
const getMessagePacker = (config) => {
    const { parseMessagesWithJSON = false } = config;
    if (parseMessagesWithJSON) {
        return {
            read(v) {
                return JSON.parse(v);
            },
            create(v) {
                return JSON.stringify(v);
            },
        };
    }
    return {
        read(v) {
            return v;
        },
        create(v) {
            return v;
        },
    };
};
exports.getMessagePacker = getMessagePacker;
