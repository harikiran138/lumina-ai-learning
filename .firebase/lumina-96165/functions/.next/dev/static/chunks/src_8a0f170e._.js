(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/src/lib/utils.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "cn",
    ()=>cn,
    "formatDate",
    ()=>formatDate,
    "formatDateTime",
    ()=>formatDateTime,
    "formatTime",
    ()=>formatTime,
    "getChartColors",
    ()=>getChartColors,
    "storage",
    ()=>storage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/clsx/dist/clsx.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/tailwind-merge/dist/bundle-mjs.mjs [app-client] (ecmascript)");
;
;
function cn(...inputs) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["twMerge"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["clsx"])(inputs));
}
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString();
}
function formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
    });
}
function formatDateTime(dateString) {
    return `${formatDate(dateString)} ${formatTime(dateString)}`;
}
function getChartColors(isDark) {
    return {
        primary: '#fbbf24',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        text: isDark ? '#d1d5db' : '#4b5563',
        grid: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        background: 'rgba(251, 191, 36, 0.2)'
    };
}
const storage = {
    set: (key, data)=>{
        try {
            if ("TURBOPACK compile-time truthy", 1) {
                localStorage.setItem(key, JSON.stringify(data));
            }
        } catch (error) {
            console.error('Failed to save to localStorage:', error);
        }
    },
    get: (key)=>{
        try {
            if ("TURBOPACK compile-time truthy", 1) {
                const data = localStorage.getItem(key);
                return data ? JSON.parse(data) : null;
            }
            //TURBOPACK unreachable
            ;
        } catch (error) {
            console.error('Failed to read from localStorage:', error);
            return null;
        }
    },
    remove: (key)=>{
        try {
            if ("TURBOPACK compile-time truthy", 1) {
                localStorage.removeItem(key);
            }
        } catch (error) {
            console.error('Failed to remove from localStorage:', error);
        }
    }
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/app/actions/data:8966d2 [app-client] (ecmascript) <text/javascript>", ((__turbopack_context__) => {
"use strict";

/* __next_internal_action_entry_do_not_use__ [{"6087403c0d53d9e2b79a4755a9fd767a6a93e0aae2":"authenticateUser"},"src/app/actions/auth.ts",""] */ __turbopack_context__.s([
    "authenticateUser",
    ()=>authenticateUser
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-client-wrapper.js [app-client] (ecmascript)");
"use turbopack no side effects";
;
var authenticateUser = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createServerReference"])("6087403c0d53d9e2b79a4755a9fd767a6a93e0aae2", __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["callServer"], void 0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["findSourceMapURL"], "authenticateUser"); //# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4vYXV0aC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHNlcnZlcic7XG5cbmltcG9ydCBjbGllbnRQcm9taXNlIGZyb20gJ0AvbGliL21vbmdvZGInO1xuaW1wb3J0IHsgVXNlciB9IGZyb20gJ0AvbGliL2FwaSc7XG5cbmNvbnN0IERCX05BTUUgPSAndGVzdCc7IC8vIFVwZGF0ZSBpZiB1c2luZyBhIGRpZmZlcmVudCBEQiBuYW1lXG5jb25zdCBDT0xMRUNUSU9OX05BTUUgPSAndXNlcnMnO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gYXV0aGVudGljYXRlVXNlcihlbWFpbDogc3RyaW5nLCBwYXNzd29yZDogc3RyaW5nKTogUHJvbWlzZTxVc2VyIHwgbnVsbD4ge1xuICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IGNsaWVudCA9IGF3YWl0IGNsaWVudFByb21pc2U7XG4gICAgICAgIGNvbnN0IGRiID0gY2xpZW50LmRiKERCX05BTUUpO1xuXG4gICAgICAgIC8vIEZpbmQgdXNlciBieSBlbWFpbFxuICAgICAgICBjb25zdCB1c2VyID0gYXdhaXQgZGIuY29sbGVjdGlvbihDT0xMRUNUSU9OX05BTUUpLmZpbmRPbmUoeyBlbWFpbCB9KTtcblxuICAgICAgICBpZiAoIXVzZXIpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdVc2VyIG5vdCBmb3VuZDonLCBlbWFpbCk7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFZlcmlmeSBwYXNzd29yZFxuICAgICAgICAvLyBXQVJOSU5HOiBJbiBwcm9kdWN0aW9uLCBwYXNzd29yZHMgbXVzdCBiZSBoYXNoZWQgKGUuZy4sIHVzaW5nIGJjcnlwdCkuXG4gICAgICAgIC8vIFNpbmNlIHdlIHNlZWRlZCBwbGFpbiB0ZXh0IHBhc3N3b3Jkcywgd2UgY29tcGFyZSBkaXJlY3RseSBmb3Igbm93LlxuICAgICAgICBpZiAodXNlci5wYXNzd29yZCAhPT0gcGFzc3dvcmQpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdJbnZhbGlkIHBhc3N3b3JkIGZvcjonLCBlbWFpbCk7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFJldHVybiB1c2VyIG9iamVjdCB3aXRob3V0IHNlbnNpdGl2ZSBkYXRhXG4gICAgICAgIGNvbnN0IHsgcGFzc3dvcmQ6IF8sIF9pZCwgLi4udXNlclByb2ZpbGUgfSA9IHVzZXI7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGlkOiBfaWQudG9TdHJpbmcoKSxcbiAgICAgICAgICAgIC4uLnVzZXJQcm9maWxlXG4gICAgICAgIH0gYXMgVXNlcjtcblxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ0F1dGhlbnRpY2F0aW9uIGVycm9yOicsIGVycm9yKTtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVnaXN0ZXJVc2VyKHVzZXJEYXRhOiBQYXJ0aWFsPFVzZXI+ICYgeyBwYXNzd29yZDogc3RyaW5nIH0pOiBQcm9taXNlPFVzZXIgfCB7IGVycm9yOiBzdHJpbmcgfT4ge1xuICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IGNsaWVudCA9IGF3YWl0IGNsaWVudFByb21pc2U7XG4gICAgICAgIGNvbnN0IGRiID0gY2xpZW50LmRiKERCX05BTUUpO1xuXG4gICAgICAgIC8vIENoZWNrIGlmIHVzZXIgYWxyZWFkeSBleGlzdHNcbiAgICAgICAgY29uc3QgZXhpc3RpbmdVc2VyID0gYXdhaXQgZGIuY29sbGVjdGlvbihDT0xMRUNUSU9OX05BTUUpLmZpbmRPbmUoeyBlbWFpbDogdXNlckRhdGEuZW1haWwgfSk7XG4gICAgICAgIGlmIChleGlzdGluZ1VzZXIpIHtcbiAgICAgICAgICAgIHJldHVybiB7IGVycm9yOiAnVXNlciBhbHJlYWR5IGV4aXN0cycgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFByZXBhcmUgbmV3IHVzZXIgZG9jdW1lbnRcbiAgICAgICAgY29uc3QgbmV3VXNlciA9IHtcbiAgICAgICAgICAgIC4uLnVzZXJEYXRhLFxuICAgICAgICAgICAgY3JlYXRlZEF0OiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgICAgICAgICBzdGF0dXM6ICdhY3RpdmUnLFxuICAgICAgICAgICAgLy8gQXNzaWduIGRlZmF1bHQgYXZhdGFyIGlmIG1pc3NpbmdcbiAgICAgICAgICAgIGF2YXRhcjogdXNlckRhdGEuYXZhdGFyIHx8IGBodHRwczovL3VpLWF2YXRhcnMuY29tL2FwaS8/bmFtZT0ke2VuY29kZVVSSUNvbXBvbmVudCh1c2VyRGF0YS5uYW1lIHx8ICdVc2VyJyl9JmJhY2tncm91bmQ9cmFuZG9tYFxuICAgICAgICB9O1xuXG4gICAgICAgIC8vIEluc2VydCBpbnRvIERCXG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGRiLmNvbGxlY3Rpb24oQ09MTEVDVElPTl9OQU1FKS5pbnNlcnRPbmUobmV3VXNlcik7XG5cbiAgICAgICAgaWYgKCFyZXN1bHQuYWNrbm93bGVkZ2VkKSB7XG4gICAgICAgICAgICByZXR1cm4geyBlcnJvcjogJ0ZhaWxlZCB0byBjcmVhdGUgdXNlcicgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHsgcGFzc3dvcmQsIC4uLmNyZWF0ZWRVc2VyIH0gPSBuZXdVc2VyO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgaWQ6IHJlc3VsdC5pbnNlcnRlZElkLnRvU3RyaW5nKCksXG4gICAgICAgICAgICAuLi5jcmVhdGVkVXNlclxuICAgICAgICB9IGFzIFVzZXI7XG5cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBjb25zb2xlLmVycm9yKCdSZWdpc3RyYXRpb24gZXJyb3I6JywgZXJyb3IpO1xuICAgICAgICByZXR1cm4geyBlcnJvcjogJ0ludGVybmFsIHNlcnZlciBlcnJvcicgfTtcbiAgICB9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6ImlTQVFzQiJ9
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/app/actions/data:30edd9 [app-client] (ecmascript) <text/javascript>", ((__turbopack_context__) => {
"use strict";

/* __next_internal_action_entry_do_not_use__ [{"40f96f98da9dffa2aeb1f5b30ef940139d42c05b50":"registerUser"},"src/app/actions/auth.ts",""] */ __turbopack_context__.s([
    "registerUser",
    ()=>registerUser
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-client-wrapper.js [app-client] (ecmascript)");
"use turbopack no side effects";
;
var registerUser = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createServerReference"])("40f96f98da9dffa2aeb1f5b30ef940139d42c05b50", __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["callServer"], void 0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["findSourceMapURL"], "registerUser"); //# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4vYXV0aC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHNlcnZlcic7XG5cbmltcG9ydCBjbGllbnRQcm9taXNlIGZyb20gJ0AvbGliL21vbmdvZGInO1xuaW1wb3J0IHsgVXNlciB9IGZyb20gJ0AvbGliL2FwaSc7XG5cbmNvbnN0IERCX05BTUUgPSAndGVzdCc7IC8vIFVwZGF0ZSBpZiB1c2luZyBhIGRpZmZlcmVudCBEQiBuYW1lXG5jb25zdCBDT0xMRUNUSU9OX05BTUUgPSAndXNlcnMnO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gYXV0aGVudGljYXRlVXNlcihlbWFpbDogc3RyaW5nLCBwYXNzd29yZDogc3RyaW5nKTogUHJvbWlzZTxVc2VyIHwgbnVsbD4ge1xuICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IGNsaWVudCA9IGF3YWl0IGNsaWVudFByb21pc2U7XG4gICAgICAgIGNvbnN0IGRiID0gY2xpZW50LmRiKERCX05BTUUpO1xuXG4gICAgICAgIC8vIEZpbmQgdXNlciBieSBlbWFpbFxuICAgICAgICBjb25zdCB1c2VyID0gYXdhaXQgZGIuY29sbGVjdGlvbihDT0xMRUNUSU9OX05BTUUpLmZpbmRPbmUoeyBlbWFpbCB9KTtcblxuICAgICAgICBpZiAoIXVzZXIpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdVc2VyIG5vdCBmb3VuZDonLCBlbWFpbCk7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFZlcmlmeSBwYXNzd29yZFxuICAgICAgICAvLyBXQVJOSU5HOiBJbiBwcm9kdWN0aW9uLCBwYXNzd29yZHMgbXVzdCBiZSBoYXNoZWQgKGUuZy4sIHVzaW5nIGJjcnlwdCkuXG4gICAgICAgIC8vIFNpbmNlIHdlIHNlZWRlZCBwbGFpbiB0ZXh0IHBhc3N3b3Jkcywgd2UgY29tcGFyZSBkaXJlY3RseSBmb3Igbm93LlxuICAgICAgICBpZiAodXNlci5wYXNzd29yZCAhPT0gcGFzc3dvcmQpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdJbnZhbGlkIHBhc3N3b3JkIGZvcjonLCBlbWFpbCk7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFJldHVybiB1c2VyIG9iamVjdCB3aXRob3V0IHNlbnNpdGl2ZSBkYXRhXG4gICAgICAgIGNvbnN0IHsgcGFzc3dvcmQ6IF8sIF9pZCwgLi4udXNlclByb2ZpbGUgfSA9IHVzZXI7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGlkOiBfaWQudG9TdHJpbmcoKSxcbiAgICAgICAgICAgIC4uLnVzZXJQcm9maWxlXG4gICAgICAgIH0gYXMgVXNlcjtcblxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ0F1dGhlbnRpY2F0aW9uIGVycm9yOicsIGVycm9yKTtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVnaXN0ZXJVc2VyKHVzZXJEYXRhOiBQYXJ0aWFsPFVzZXI+ICYgeyBwYXNzd29yZDogc3RyaW5nIH0pOiBQcm9taXNlPFVzZXIgfCB7IGVycm9yOiBzdHJpbmcgfT4ge1xuICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IGNsaWVudCA9IGF3YWl0IGNsaWVudFByb21pc2U7XG4gICAgICAgIGNvbnN0IGRiID0gY2xpZW50LmRiKERCX05BTUUpO1xuXG4gICAgICAgIC8vIENoZWNrIGlmIHVzZXIgYWxyZWFkeSBleGlzdHNcbiAgICAgICAgY29uc3QgZXhpc3RpbmdVc2VyID0gYXdhaXQgZGIuY29sbGVjdGlvbihDT0xMRUNUSU9OX05BTUUpLmZpbmRPbmUoeyBlbWFpbDogdXNlckRhdGEuZW1haWwgfSk7XG4gICAgICAgIGlmIChleGlzdGluZ1VzZXIpIHtcbiAgICAgICAgICAgIHJldHVybiB7IGVycm9yOiAnVXNlciBhbHJlYWR5IGV4aXN0cycgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFByZXBhcmUgbmV3IHVzZXIgZG9jdW1lbnRcbiAgICAgICAgY29uc3QgbmV3VXNlciA9IHtcbiAgICAgICAgICAgIC4uLnVzZXJEYXRhLFxuICAgICAgICAgICAgY3JlYXRlZEF0OiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgICAgICAgICBzdGF0dXM6ICdhY3RpdmUnLFxuICAgICAgICAgICAgLy8gQXNzaWduIGRlZmF1bHQgYXZhdGFyIGlmIG1pc3NpbmdcbiAgICAgICAgICAgIGF2YXRhcjogdXNlckRhdGEuYXZhdGFyIHx8IGBodHRwczovL3VpLWF2YXRhcnMuY29tL2FwaS8/bmFtZT0ke2VuY29kZVVSSUNvbXBvbmVudCh1c2VyRGF0YS5uYW1lIHx8ICdVc2VyJyl9JmJhY2tncm91bmQ9cmFuZG9tYFxuICAgICAgICB9O1xuXG4gICAgICAgIC8vIEluc2VydCBpbnRvIERCXG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGRiLmNvbGxlY3Rpb24oQ09MTEVDVElPTl9OQU1FKS5pbnNlcnRPbmUobmV3VXNlcik7XG5cbiAgICAgICAgaWYgKCFyZXN1bHQuYWNrbm93bGVkZ2VkKSB7XG4gICAgICAgICAgICByZXR1cm4geyBlcnJvcjogJ0ZhaWxlZCB0byBjcmVhdGUgdXNlcicgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHsgcGFzc3dvcmQsIC4uLmNyZWF0ZWRVc2VyIH0gPSBuZXdVc2VyO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgaWQ6IHJlc3VsdC5pbnNlcnRlZElkLnRvU3RyaW5nKCksXG4gICAgICAgICAgICAuLi5jcmVhdGVkVXNlclxuICAgICAgICB9IGFzIFVzZXI7XG5cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBjb25zb2xlLmVycm9yKCdSZWdpc3RyYXRpb24gZXJyb3I6JywgZXJyb3IpO1xuICAgICAgICByZXR1cm4geyBlcnJvcjogJ0ludGVybmFsIHNlcnZlciBlcnJvcicgfTtcbiAgICB9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjZSQTJDc0IifQ==
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/lib/api.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// Mock Data API - Optimized for Simple Frontend Demo
// No database, no local storage, just static JSON.
__turbopack_context__.s([
    "api",
    ()=>api
]);
// Authentication API - Connected to MongoDB via Server Actions
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$actions$2f$data$3a$8966d2__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$text$2f$javascript$3e$__ = __turbopack_context__.i("[project]/src/app/actions/data:8966d2 [app-client] (ecmascript) <text/javascript>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$actions$2f$data$3a$30edd9__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$text$2f$javascript$3e$__ = __turbopack_context__.i("[project]/src/app/actions/data:30edd9 [app-client] (ecmascript) <text/javascript>");
;
class RealAPI {
    static instance;
    currentUser = null;
    constructor(){}
    static getInstance() {
        if (!RealAPI.instance) {
            RealAPI.instance = new RealAPI();
        }
        return RealAPI.instance;
    }
    async login(email, password) {
        if (!password) {
            throw new Error("Password is required for login.");
        }
        const user = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$actions$2f$data$3a$8966d2__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$text$2f$javascript$3e$__["authenticateUser"])(email, password);
        if (user) {
            this.currentUser = user;
            if ("TURBOPACK compile-time truthy", 1) {
                sessionStorage.setItem('lumina_user', JSON.stringify(user));
            }
            return user;
        }
        throw new Error("Invalid email or password.");
    }
    async getCurrentUser() {
        // Check memory first
        if (this.currentUser) return this.currentUser;
        // Check session storage
        if ("TURBOPACK compile-time truthy", 1) {
            const stored = sessionStorage.getItem('lumina_user');
            if (stored) {
                this.currentUser = JSON.parse(stored);
                return this.currentUser;
            }
        }
        return null;
    }
    async createUser(userData) {
        if (!userData.password) {
            throw new Error("Password is required for signup.");
        }
        // Call server action
        const result = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$actions$2f$data$3a$30edd9__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$text$2f$javascript$3e$__["registerUser"])(userData);
        if ('error' in result) {
            throw new Error(result.error);
        }
        return result;
    }
    // Dashboard Data - Connected to MongoDB
    async getDashboardData(userRole, userId) {
        const user = await this.getCurrentUser();
        if (!user) return {};
        if (userRole === 'student') {
            // Dynamically import server actions to avoid build issues if mixed
            const { getStudentDashboard } = await __turbopack_context__.A("[project]/src/app/actions/data.ts [app-client] (ecmascript, async loader)");
            const data = await getStudentDashboard(user.email);
            return data || {};
        }
        if (userRole === 'teacher') {
            const { getTeacherDashboard } = await __turbopack_context__.A("[project]/src/app/actions/data.ts [app-client] (ecmascript, async loader)");
            return await getTeacherDashboard(user.email);
        }
        if (userRole === 'admin') {
            const { getAdminDashboard } = await __turbopack_context__.A("[project]/src/app/actions/data.ts [app-client] (ecmascript, async loader)");
            return await getAdminDashboard(user.email);
        }
        return {};
    }
    async getStudentProfile() {
        const user = await this.getCurrentUser();
        if (!user) return null;
        const { getStudentProfile } = await __turbopack_context__.A("[project]/src/app/actions/data.ts [app-client] (ecmascript, async loader)");
        return await getStudentProfile(user.email);
    }
    async updateProfile(data) {
        const user = await this.getCurrentUser();
        if (!user) return {
            success: false,
            error: 'Not authenticated'
        };
        const { updateStudentProfile } = await __turbopack_context__.A("[project]/src/app/actions/data.ts [app-client] (ecmascript, async loader)");
        return await updateStudentProfile(user.email, data);
    }
    async getCourseDetails(courseId) {
        const { getCourseDetails } = await __turbopack_context__.A("[project]/src/app/actions/data.ts [app-client] (ecmascript, async loader)");
        return await getCourseDetails(courseId);
    }
    async getEnrolledCourses() {
        const user = await this.getCurrentUser();
        if (!user) return null;
        const { getStudentProgress } = await __turbopack_context__.A("[project]/src/app/actions/data.ts [app-client] (ecmascript, async loader)");
        return await getStudentProgress(user.email);
    }
    async getCommunityData(channelId) {
        const { getCommunityData } = await __turbopack_context__.A("[project]/src/app/actions/data.ts [app-client] (ecmascript, async loader)");
        return await getCommunityData(channelId);
    }
    async logout() {
        this.currentUser = null;
        if ("TURBOPACK compile-time truthy", 1) {
            sessionStorage.removeItem('lumina_user');
        }
    }
}
const api = RealAPI.getInstance();
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/dashboard/AdminSidebar.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>AdminSidebar
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$layout$2d$dashboard$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__LayoutDashboard$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/layout-dashboard.js [app-client] (ecmascript) <export default as LayoutDashboard>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$users$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Users$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/users.js [app-client] (ecmascript) <export default as Users>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$settings$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Settings$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/settings.js [app-client] (ecmascript) <export default as Settings>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$log$2d$out$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__LogOut$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/log-out.js [app-client] (ecmascript) <export default as LogOut>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$database$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Database$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/database.js [app-client] (ecmascript) <export default as Database>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Shield$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/shield.js [app-client] (ecmascript) <export default as Shield>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/utils.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/api.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
;
;
const navItems = [
    {
        name: 'Dashboard',
        href: '/admin/dashboard',
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$layout$2d$dashboard$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__LayoutDashboard$3e$__["LayoutDashboard"]
    },
    {
        name: 'Users',
        href: '/admin/users',
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$users$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Users$3e$__["Users"]
    },
    {
        name: 'System',
        href: '/admin/system',
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$database$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Database$3e$__["Database"]
    },
    {
        name: 'Security',
        href: '/admin/security',
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Shield$3e$__["Shield"]
    },
    {
        name: 'Settings',
        href: '/admin/settings',
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$settings$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Settings$3e$__["Settings"]
    }
];
function AdminSidebar() {
    _s();
    const pathname = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"])();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"])();
    const handleLogout = async ()=>{
        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["api"].logout();
        router.push('/login');
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("aside", {
        className: "fixed left-4 top-4 bottom-4 w-64 backdrop-blur-3xl bg-black/20 border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] z-30 hidden lg:flex flex-col rounded-3xl transition-all duration-300",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center justify-center h-16 border-b border-white/10",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                    href: "/",
                    className: "text-2xl font-bold",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "gradient-text",
                            children: "Lumina"
                        }, void 0, false, {
                            fileName: "[project]/src/components/dashboard/AdminSidebar.tsx",
                            lineNumber: 32,
                            columnNumber: 21
                        }, this),
                        " ✨"
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/dashboard/AdminSidebar.tsx",
                    lineNumber: 31,
                    columnNumber: 17
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/components/dashboard/AdminSidebar.tsx",
                lineNumber: 30,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("nav", {
                className: "p-4 space-y-2",
                children: navItems.map((item)=>{
                    const isActive = pathname === item.href;
                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                        href: item.href,
                        suppressHydrationWarning: true,
                        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300", isActive ? "bg-lumina-primary/20 text-lumina-primary shadow-[0_0_15px_rgba(255,215,0,0.1)] border border-lumina-primary/10" : "text-gray-400 hover:bg-white/5 hover:text-gray-200 hover:translate-x-1"),
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(item.icon, {
                                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("mr-3 h-5 w-5", isActive ? "text-lumina-primary" : "text-gray-500 group-hover:text-gray-300")
                            }, void 0, false, {
                                fileName: "[project]/src/components/dashboard/AdminSidebar.tsx",
                                lineNumber: 50,
                                columnNumber: 29
                            }, this),
                            item.name
                        ]
                    }, item.name, true, {
                        fileName: "[project]/src/components/dashboard/AdminSidebar.tsx",
                        lineNumber: 39,
                        columnNumber: 25
                    }, this);
                })
            }, void 0, false, {
                fileName: "[project]/src/components/dashboard/AdminSidebar.tsx",
                lineNumber: 35,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute bottom-4 left-4 right-4",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                    onClick: handleLogout,
                    suppressHydrationWarning: true,
                    className: "flex items-center w-full px-4 py-3 text-sm font-medium text-red-400/80 rounded-xl hover:bg-red-500/10 hover:text-red-400 border border-transparent hover:border-red-500/20 transition-all duration-300",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$log$2d$out$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__LogOut$3e$__["LogOut"], {
                            className: "mr-3 h-5 w-5"
                        }, void 0, false, {
                            fileName: "[project]/src/components/dashboard/AdminSidebar.tsx",
                            lineNumber: 62,
                            columnNumber: 21
                        }, this),
                        "Sign Out"
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/dashboard/AdminSidebar.tsx",
                    lineNumber: 57,
                    columnNumber: 17
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/components/dashboard/AdminSidebar.tsx",
                lineNumber: 56,
                columnNumber: 13
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/dashboard/AdminSidebar.tsx",
        lineNumber: 29,
        columnNumber: 9
    }, this);
}
_s(AdminSidebar, "0h+B63IiVHeDT9bDhB3JTwv8ebY=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"]
    ];
});
_c = AdminSidebar;
var _c;
__turbopack_context__.k.register(_c, "AdminSidebar");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/ui/ThemeToggle.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>ThemeToggle
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$moon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Moon$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/moon.js [app-client] (ecmascript) <export default as Moon>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$sun$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Sun$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/sun.js [app-client] (ecmascript) <export default as Sun>");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
function ThemeToggle() {
    _s();
    const [isDark, setIsDark] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ThemeToggle.useEffect": ()=>{
            // Check initial theme
            if (localStorage.getItem('theme') === 'dark' || !('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                setIsDark(true);
                document.documentElement.classList.add('dark');
            } else {
                setIsDark(false);
                document.documentElement.classList.remove('dark');
            }
        }
    }["ThemeToggle.useEffect"], []);
    const toggleTheme = ()=>{
        if (isDark) {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
            setIsDark(false);
        } else {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
            setIsDark(true);
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
        onClick: toggleTheme,
        suppressHydrationWarning: true,
        className: "p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors",
        "aria-label": "Toggle Theme",
        children: isDark ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$sun$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Sun$3e$__["Sun"], {
            className: "w-6 h-6"
        }, void 0, false, {
            fileName: "[project]/src/components/ui/ThemeToggle.tsx",
            lineNumber: 39,
            columnNumber: 23
        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$moon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Moon$3e$__["Moon"], {
            className: "w-6 h-6"
        }, void 0, false, {
            fileName: "[project]/src/components/ui/ThemeToggle.tsx",
            lineNumber: 39,
            columnNumber: 53
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/components/ui/ThemeToggle.tsx",
        lineNumber: 33,
        columnNumber: 9
    }, this);
}
_s(ThemeToggle, "q9ovQTvwIdpxeVii6kJLTuTYpwE=");
_c = ThemeToggle;
var _c;
__turbopack_context__.k.register(_c, "ThemeToggle");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/dashboard/TopNav.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>TopNav
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$ThemeToggle$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ui/ThemeToggle.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$bell$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Bell$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/bell.js [app-client] (ecmascript) <export default as Bell>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$search$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Search$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/search.js [app-client] (ecmascript) <export default as Search>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$menu$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Menu$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/menu.js [app-client] (ecmascript) <export default as Menu>");
'use client';
;
;
;
function TopNav({ onMenuClick, user = {
    name: 'Student User',
    role: 'Student',
    initial: 'S'
} }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
        className: "fixed top-4 right-4 left-4 lg:left-72 h-16 backdrop-blur-xl bg-black/20 border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] z-20 px-4 sm:px-6 lg:px-8 flex items-center justify-between rounded-2xl transition-all duration-300",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: onMenuClick,
                        suppressHydrationWarning: true,
                        className: "lg:hidden p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 mr-4",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$menu$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Menu$3e$__["Menu"], {
                            className: "w-6 h-6"
                        }, void 0, false, {
                            fileName: "[project]/src/components/dashboard/TopNav.tsx",
                            lineNumber: 22,
                            columnNumber: 21
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/components/dashboard/TopNav.tsx",
                        lineNumber: 17,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "relative hidden sm:block w-64",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: "text",
                                placeholder: "Search...",
                                suppressHydrationWarning: true,
                                className: "w-full pl-10 pr-4 py-2 border border-white/10 rounded-xl bg-white/5 focus:ring-2 focus:ring-lumina-primary/50 focus:border-lumina-primary/50 text-sm text-white placeholder-gray-500 transition-all duration-300 backdrop-blur-sm"
                            }, void 0, false, {
                                fileName: "[project]/src/components/dashboard/TopNav.tsx",
                                lineNumber: 25,
                                columnNumber: 21
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$search$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Search$3e$__["Search"], {
                                className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4"
                            }, void 0, false, {
                                fileName: "[project]/src/components/dashboard/TopNav.tsx",
                                lineNumber: 31,
                                columnNumber: 21
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/dashboard/TopNav.tsx",
                        lineNumber: 24,
                        columnNumber: 17
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/dashboard/TopNav.tsx",
                lineNumber: 16,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center space-x-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        suppressHydrationWarning: true,
                        className: "p-2 rounded-xl text-gray-400 hover:text-lumina-primary hover:bg-white/5 transition-all duration-300 relative",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$bell$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Bell$3e$__["Bell"], {
                                className: "w-5 h-5"
                            }, void 0, false, {
                                fileName: "[project]/src/components/dashboard/TopNav.tsx",
                                lineNumber: 39,
                                columnNumber: 21
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                            }, void 0, false, {
                                fileName: "[project]/src/components/dashboard/TopNav.tsx",
                                lineNumber: 40,
                                columnNumber: 21
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/dashboard/TopNav.tsx",
                        lineNumber: 35,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$ThemeToggle$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                        fileName: "[project]/src/components/dashboard/TopNav.tsx",
                        lineNumber: 42,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center space-x-3 border-l border-white/10 pl-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "text-right hidden sm:block",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-sm font-medium text-white",
                                        children: user.name
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/dashboard/TopNav.tsx",
                                        lineNumber: 45,
                                        columnNumber: 25
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-xs text-lumina-primary/80 capitalize",
                                        children: user.role
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/dashboard/TopNav.tsx",
                                        lineNumber: 46,
                                        columnNumber: 25
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/dashboard/TopNav.tsx",
                                lineNumber: 44,
                                columnNumber: 21
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "w-9 h-9 rounded-full bg-gradient-to-br from-lumina-primary to-amber-600 flex items-center justify-center text-black font-bold shadow-lg shadow-amber-500/20",
                                children: user.initial
                            }, void 0, false, {
                                fileName: "[project]/src/components/dashboard/TopNav.tsx",
                                lineNumber: 48,
                                columnNumber: 21
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/dashboard/TopNav.tsx",
                        lineNumber: 43,
                        columnNumber: 17
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/dashboard/TopNav.tsx",
                lineNumber: 34,
                columnNumber: 13
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/dashboard/TopNav.tsx",
        lineNumber: 15,
        columnNumber: 9
    }, this);
}
_c = TopNav;
var _c;
__turbopack_context__.k.register(_c, "TopNav");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/app/admin/layout.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>AdminLayout
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$dashboard$2f$AdminSidebar$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/dashboard/AdminSidebar.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$dashboard$2f$TopNav$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/dashboard/TopNav.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
function AdminLayout({ children }) {
    _s();
    const [sidebarOpen, setSidebarOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "min-h-screen bg-gray-50 dark:bg-black",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$dashboard$2f$AdminSidebar$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                fileName: "[project]/src/app/admin/layout.tsx",
                lineNumber: 17,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$dashboard$2f$TopNav$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                onMenuClick: ()=>setSidebarOpen(!sidebarOpen),
                user: {
                    name: 'Admin User',
                    role: 'Administrator',
                    initial: 'A'
                }
            }, void 0, false, {
                fileName: "[project]/src/app/admin/layout.tsx",
                lineNumber: 18,
                columnNumber: 13
            }, this),
            sidebarOpen && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "fixed inset-0 bg-black/50 z-40 lg:hidden",
                onClick: ()=>setSidebarOpen(false)
            }, void 0, false, {
                fileName: "[project]/src/app/admin/layout.tsx",
                lineNumber: 25,
                columnNumber: 17
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
                className: "lg:ml-64 pt-16 min-h-screen transition-all duration-300",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "container mx-auto px-4 sm:px-6 lg:px-8 py-8",
                    children: children
                }, void 0, false, {
                    fileName: "[project]/src/app/admin/layout.tsx",
                    lineNumber: 29,
                    columnNumber: 17
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/app/admin/layout.tsx",
                lineNumber: 28,
                columnNumber: 13
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/app/admin/layout.tsx",
        lineNumber: 16,
        columnNumber: 9
    }, this);
}
_s(AdminLayout, "5rGDkYpGQ8fHM9RkMWnKOwsxadk=");
_c = AdminLayout;
var _c;
__turbopack_context__.k.register(_c, "AdminLayout");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=src_8a0f170e._.js.map