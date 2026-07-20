"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const client_1 = require("../client");
exports.NotificationService = {
    getAll: async () => {
        const res = await client_1.api.get('/notifications');
        return res.data.data;
    },
    markAsRead: async (id) => {
        const res = await client_1.api.patch(`/notifications/${id}/read`);
        return res.data;
    }
};
//# sourceMappingURL=notification.service.js.map