module.exports = [
"[externals]/mongodb [external] (mongodb, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("mongodb", () => require("mongodb"));

module.exports = mod;
}),
"[project]/src/lib/mongodb.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$mongodb__$5b$external$5d$__$28$mongodb$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/mongodb [external] (mongodb, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$vercel$2f$functions$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@vercel/functions/index.js [app-rsc] (ecmascript)");
;
;
if (!process.env.MONGODB_URI && !process.env.lumina_MONGODB_URI) {
    throw new Error('Invalid/Missing environment variable: "MONGODB_URI" or "lumina_MONGODB_URI"');
}
const uri = process.env.MONGODB_URI || process.env.lumina_MONGODB_URI || "";
const options = {};
let client;
let clientPromise;
if ("TURBOPACK compile-time truthy", 1) {
    // In development mode, use a global variable so that the value
    // is preserved across module reloads caused by HMR (Hot Module Replacement).
    let globalWithMongo = /*TURBOPACK member replacement*/ __turbopack_context__.g;
    if (!globalWithMongo._mongoClientPromise) {
        client = new __TURBOPACK__imported__module__$5b$externals$5d2f$mongodb__$5b$external$5d$__$28$mongodb$2c$__cjs$29$__["MongoClient"](uri, options);
        // Attach connection pool management for Vercel Functions
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$vercel$2f$functions$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["attachDatabasePool"])(client);
        globalWithMongo._mongoClientPromise = client.connect();
    }
    clientPromise = globalWithMongo._mongoClientPromise;
} else //TURBOPACK unreachable
;
const __TURBOPACK__default__export__ = clientPromise;
}),
"[project]/src/app/actions/auth.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/* __next_internal_action_entry_do_not_use__ [{"40f96f98da9dffa2aeb1f5b30ef940139d42c05b50":"registerUser","6087403c0d53d9e2b79a4755a9fd767a6a93e0aae2":"authenticateUser"},"",""] */ __turbopack_context__.s([
    "authenticateUser",
    ()=>authenticateUser,
    "registerUser",
    ()=>registerUser
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/server-reference.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$mongodb$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/mongodb.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-validate.js [app-rsc] (ecmascript)");
;
;
const DB_NAME = 'test'; // Update if using a different DB name
const COLLECTION_NAME = 'users';
async function authenticateUser(email, password) {
    try {
        const client = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$mongodb$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"];
        const db = client.db(DB_NAME);
        // Find user by email
        const user = await db.collection(COLLECTION_NAME).findOne({
            email
        });
        if (!user) {
            console.log('User not found:', email);
            return null;
        }
        // Verify password
        // WARNING: In production, passwords must be hashed (e.g., using bcrypt).
        // Since we seeded plain text passwords, we compare directly for now.
        if (user.password !== password) {
            console.log('Invalid password for:', email);
            return null;
        }
        // Return user object without sensitive data
        const { password: _, _id, ...userProfile } = user;
        return {
            id: _id.toString(),
            ...userProfile
        };
    } catch (error) {
        console.error('Authentication error:', error);
        return null;
    }
}
async function registerUser(userData) {
    try {
        const client = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$mongodb$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"];
        const db = client.db(DB_NAME);
        // Check if user already exists
        const existingUser = await db.collection(COLLECTION_NAME).findOne({
            email: userData.email
        });
        if (existingUser) {
            return {
                error: 'User already exists'
            };
        }
        // Prepare new user document
        const newUser = {
            ...userData,
            createdAt: new Date().toISOString(),
            status: 'active',
            // Assign default avatar if missing
            avatar: userData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name || 'User')}&background=random`
        };
        // Insert into DB
        const result = await db.collection(COLLECTION_NAME).insertOne(newUser);
        if (!result.acknowledged) {
            return {
                error: 'Failed to create user'
            };
        }
        const { password, ...createdUser } = newUser;
        return {
            id: result.insertedId.toString(),
            ...createdUser
        };
    } catch (error) {
        console.error('Registration error:', error);
        return {
            error: 'Internal server error'
        };
    }
}
;
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ensureServerEntryExports"])([
    authenticateUser,
    registerUser
]);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(authenticateUser, "6087403c0d53d9e2b79a4755a9fd767a6a93e0aae2", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(registerUser, "40f96f98da9dffa2aeb1f5b30ef940139d42c05b50", null);
}),
"[project]/.next-internal/server/app/login/page/actions.js { ACTIONS_MODULE0 => \"[project]/src/app/actions/auth.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$actions$2f$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/app/actions/auth.ts [app-rsc] (ecmascript)");
;
;
}),
"[project]/.next-internal/server/app/login/page/actions.js { ACTIONS_MODULE0 => \"[project]/src/app/actions/auth.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "40f96f98da9dffa2aeb1f5b30ef940139d42c05b50",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$actions$2f$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerUser"],
    "6087403c0d53d9e2b79a4755a9fd767a6a93e0aae2",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$actions$2f$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["authenticateUser"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f$login$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$app$2f$actions$2f$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i('[project]/.next-internal/server/app/login/page/actions.js { ACTIONS_MODULE0 => "[project]/src/app/actions/auth.ts [app-rsc] (ecmascript)" } [app-rsc] (server actions loader, ecmascript) <locals>');
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$actions$2f$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/app/actions/auth.ts [app-rsc] (ecmascript)");
}),
"[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/server-reference.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

/* eslint-disable import/no-extraneous-dependencies */ Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "registerServerReference", {
    enumerable: true,
    get: function() {
        return _server.registerServerReference;
    }
});
const _server = __turbopack_context__.r("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server.js [app-rsc] (ecmascript)"); //# sourceMappingURL=server-reference.js.map
}),
"[project]/node_modules/@vercel/functions/headers.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all)=>{
    for(var name in all)__defProp(target, name, {
        get: all[name],
        enumerable: true
    });
};
var __copyProps = (to, from, except, desc)=>{
    if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames(from))if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
            get: ()=>from[key],
            enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
        });
    }
    return to;
};
var __toCommonJS = (mod)=>__copyProps(__defProp({}, "__esModule", {
        value: true
    }), mod);
var headers_exports = {};
__export(headers_exports, {
    CITY_HEADER_NAME: ()=>CITY_HEADER_NAME,
    COUNTRY_HEADER_NAME: ()=>COUNTRY_HEADER_NAME,
    EMOJI_FLAG_UNICODE_STARTING_POSITION: ()=>EMOJI_FLAG_UNICODE_STARTING_POSITION,
    IP_HEADER_NAME: ()=>IP_HEADER_NAME,
    LATITUDE_HEADER_NAME: ()=>LATITUDE_HEADER_NAME,
    LONGITUDE_HEADER_NAME: ()=>LONGITUDE_HEADER_NAME,
    POSTAL_CODE_HEADER_NAME: ()=>POSTAL_CODE_HEADER_NAME,
    REGION_HEADER_NAME: ()=>REGION_HEADER_NAME,
    REQUEST_ID_HEADER_NAME: ()=>REQUEST_ID_HEADER_NAME,
    geolocation: ()=>geolocation,
    ipAddress: ()=>ipAddress
});
module.exports = __toCommonJS(headers_exports);
const CITY_HEADER_NAME = "x-vercel-ip-city";
const COUNTRY_HEADER_NAME = "x-vercel-ip-country";
const IP_HEADER_NAME = "x-real-ip";
const LATITUDE_HEADER_NAME = "x-vercel-ip-latitude";
const LONGITUDE_HEADER_NAME = "x-vercel-ip-longitude";
const REGION_HEADER_NAME = "x-vercel-ip-country-region";
const POSTAL_CODE_HEADER_NAME = "x-vercel-ip-postal-code";
const REQUEST_ID_HEADER_NAME = "x-vercel-id";
const EMOJI_FLAG_UNICODE_STARTING_POSITION = 127397;
function getHeader(headers, key) {
    return headers.get(key) ?? void 0;
}
function getHeaderWithDecode(request, key) {
    const header = getHeader(request.headers, key);
    return header ? decodeURIComponent(header) : void 0;
}
function getFlag(countryCode) {
    const regex = new RegExp("^[A-Z]{2}$").test(countryCode);
    if (!countryCode || !regex) return void 0;
    return String.fromCodePoint(...countryCode.split("").map((char)=>EMOJI_FLAG_UNICODE_STARTING_POSITION + char.charCodeAt(0)));
}
function ipAddress(input) {
    const headers = "headers" in input ? input.headers : input;
    return getHeader(headers, IP_HEADER_NAME);
}
function getRegionFromRequestId(requestId) {
    if (!requestId) {
        return "dev1";
    }
    return requestId.split(":")[0];
}
function geolocation(request) {
    return {
        // city name may be encoded to support multi-byte characters
        city: getHeaderWithDecode(request, CITY_HEADER_NAME),
        country: getHeader(request.headers, COUNTRY_HEADER_NAME),
        flag: getFlag(getHeader(request.headers, COUNTRY_HEADER_NAME)),
        countryRegion: getHeader(request.headers, REGION_HEADER_NAME),
        region: getRegionFromRequestId(getHeader(request.headers, REQUEST_ID_HEADER_NAME)),
        latitude: getHeader(request.headers, LATITUDE_HEADER_NAME),
        longitude: getHeader(request.headers, LONGITUDE_HEADER_NAME),
        postalCode: getHeader(request.headers, POSTAL_CODE_HEADER_NAME)
    };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
    CITY_HEADER_NAME,
    COUNTRY_HEADER_NAME,
    EMOJI_FLAG_UNICODE_STARTING_POSITION,
    IP_HEADER_NAME,
    LATITUDE_HEADER_NAME,
    LONGITUDE_HEADER_NAME,
    POSTAL_CODE_HEADER_NAME,
    REGION_HEADER_NAME,
    REQUEST_ID_HEADER_NAME,
    geolocation,
    ipAddress
});
}),
"[project]/node_modules/@vercel/functions/get-env.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all)=>{
    for(var name in all)__defProp(target, name, {
        get: all[name],
        enumerable: true
    });
};
var __copyProps = (to, from, except, desc)=>{
    if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames(from))if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
            get: ()=>from[key],
            enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
        });
    }
    return to;
};
var __toCommonJS = (mod)=>__copyProps(__defProp({}, "__esModule", {
        value: true
    }), mod);
var get_env_exports = {};
__export(get_env_exports, {
    getEnv: ()=>getEnv
});
module.exports = __toCommonJS(get_env_exports);
const getEnv = (env = process.env)=>({
        /**
   * An indicator to show that System Environment Variables have been exposed to your project's Deployments.
   * @example "1"
   */ VERCEL: get(env, "VERCEL"),
        /**
   * An indicator that the code is running in a Continuous Integration environment.
   * @example "1"
   */ CI: get(env, "CI"),
        /**
   * The Environment that the app is deployed and running on.
   * @example "production"
   */ VERCEL_ENV: get(env, "VERCEL_ENV"),
        /**
   * The domain name of the generated deployment URL. The value does not include the protocol scheme https://.
   * NOTE: This Variable cannot be used in conjunction with Standard Deployment Protection.
   * @example "*.vercel.app"
   */ VERCEL_URL: get(env, "VERCEL_URL"),
        /**
   * The domain name of the generated Git branch URL. The value does not include the protocol scheme https://.
   * @example "*-git-*.vercel.app"
   */ VERCEL_BRANCH_URL: get(env, "VERCEL_BRANCH_URL"),
        /**
   * A production domain name of the project. This is useful to reliably generate links that point to production such as OG-image URLs.
   * The value does not include the protocol scheme https://.
   * @example "myproject.vercel.app"
   */ VERCEL_PROJECT_PRODUCTION_URL: get(env, "VERCEL_PROJECT_PRODUCTION_URL"),
        /**
   * The ID of the Region where the app is running.
   *
   * Possible values:
   * - arn1 (Stockholm, Sweden)
   * - bom1 (Mumbai, India)
   * - cdg1 (Paris, France)
   * - cle1 (Cleveland, USA)
   * - cpt1 (Cape Town, South Africa)
   * - dub1 (Dublin, Ireland)
   * - fra1 (Frankfurt, Germany)
   * - gru1 (São Paulo, Brazil)
   * - hkg1 (Hong Kong)
   * - hnd1 (Tokyo, Japan)
   * - iad1 (Washington, D.C., USA)
   * - icn1 (Seoul, South Korea)
   * - kix1 (Osaka, Japan)
   * - lhr1 (London, United Kingdom)
   * - pdx1 (Portland, USA)
   * - sfo1 (San Francisco, USA)
   * - sin1 (Singapore)
   * - syd1 (Sydney, Australia)
   * - dev1 (Development Region)
   *
   * @example "iad1"
   */ VERCEL_REGION: get(env, "VERCEL_REGION"),
        /**
   * The unique identifier for the deployment, which can be used to implement Skew Protection.
   * @example "dpl_7Gw5ZMBpQA8h9GF832KGp7nwbuh3"
   */ VERCEL_DEPLOYMENT_ID: get(env, "VERCEL_DEPLOYMENT_ID"),
        /**
   * When Skew Protection is enabled in Project Settings, this value is set to 1.
   * @example "1"
   */ VERCEL_SKEW_PROTECTION_ENABLED: get(env, "VERCEL_SKEW_PROTECTION_ENABLED"),
        /**
   * The Protection Bypass for Automation value, if the secret has been generated in the project's Deployment Protection settings.
   */ VERCEL_AUTOMATION_BYPASS_SECRET: get(env, "VERCEL_AUTOMATION_BYPASS_SECRET"),
        /**
   * The Git Provider the deployment is triggered from.
   * @example "github"
   */ VERCEL_GIT_PROVIDER: get(env, "VERCEL_GIT_PROVIDER"),
        /**
   * The origin repository the deployment is triggered from.
   * @example "my-site"
   */ VERCEL_GIT_REPO_SLUG: get(env, "VERCEL_GIT_REPO_SLUG"),
        /**
   * The account that owns the repository the deployment is triggered from.
   * @example "acme"
   */ VERCEL_GIT_REPO_OWNER: get(env, "VERCEL_GIT_REPO_OWNER"),
        /**
   * The ID of the repository the deployment is triggered from.
   * @example "117716146"
   */ VERCEL_GIT_REPO_ID: get(env, "VERCEL_GIT_REPO_ID"),
        /**
   * The git branch of the commit the deployment was triggered by.
   * @example "improve-about-page"
   */ VERCEL_GIT_COMMIT_REF: get(env, "VERCEL_GIT_COMMIT_REF"),
        /**
   * The git SHA of the commit the deployment was triggered by.
   * @example "fa1eade47b73733d6312d5abfad33ce9e4068081"
   */ VERCEL_GIT_COMMIT_SHA: get(env, "VERCEL_GIT_COMMIT_SHA"),
        /**
   * The message attached to the commit the deployment was triggered by.
   * @example "Update about page"
   */ VERCEL_GIT_COMMIT_MESSAGE: get(env, "VERCEL_GIT_COMMIT_MESSAGE"),
        /**
   * The username attached to the author of the commit that the project was deployed by.
   * @example "johndoe"
   */ VERCEL_GIT_COMMIT_AUTHOR_LOGIN: get(env, "VERCEL_GIT_COMMIT_AUTHOR_LOGIN"),
        /**
   * The name attached to the author of the commit that the project was deployed by.
   * @example "John Doe"
   */ VERCEL_GIT_COMMIT_AUTHOR_NAME: get(env, "VERCEL_GIT_COMMIT_AUTHOR_NAME"),
        /**
   * The git SHA of the last successful deployment for the project and branch.
   * NOTE: This Variable is only exposed when an Ignored Build Step is provided.
   * @example "fa1eade47b73733d6312d5abfad33ce9e4068080"
   */ VERCEL_GIT_PREVIOUS_SHA: get(env, "VERCEL_GIT_PREVIOUS_SHA"),
        /**
   * The pull request id the deployment was triggered by. If a deployment is created on a branch before a pull request is made, this value will be an empty string.
   * @example "23"
   */ VERCEL_GIT_PULL_REQUEST_ID: get(env, "VERCEL_GIT_PULL_REQUEST_ID")
    });
const get = (env, key)=>{
    const value = env[key];
    return value === "" ? void 0 : value;
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
    getEnv
});
}),
"[project]/node_modules/@vercel/functions/get-context.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all)=>{
    for(var name in all)__defProp(target, name, {
        get: all[name],
        enumerable: true
    });
};
var __copyProps = (to, from, except, desc)=>{
    if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames(from))if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
            get: ()=>from[key],
            enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
        });
    }
    return to;
};
var __toCommonJS = (mod)=>__copyProps(__defProp({}, "__esModule", {
        value: true
    }), mod);
var get_context_exports = {};
__export(get_context_exports, {
    SYMBOL_FOR_REQ_CONTEXT: ()=>SYMBOL_FOR_REQ_CONTEXT,
    getContext: ()=>getContext
});
module.exports = __toCommonJS(get_context_exports);
const SYMBOL_FOR_REQ_CONTEXT = Symbol.for("@vercel/request-context");
function getContext() {
    const fromSymbol = globalThis;
    return fromSymbol[SYMBOL_FOR_REQ_CONTEXT]?.get?.() ?? {};
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
    SYMBOL_FOR_REQ_CONTEXT,
    getContext
});
}),
"[project]/node_modules/@vercel/functions/wait-until.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all)=>{
    for(var name in all)__defProp(target, name, {
        get: all[name],
        enumerable: true
    });
};
var __copyProps = (to, from, except, desc)=>{
    if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames(from))if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
            get: ()=>from[key],
            enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
        });
    }
    return to;
};
var __toCommonJS = (mod)=>__copyProps(__defProp({}, "__esModule", {
        value: true
    }), mod);
var wait_until_exports = {};
__export(wait_until_exports, {
    waitUntil: ()=>waitUntil
});
module.exports = __toCommonJS(wait_until_exports);
var import_get_context = __turbopack_context__.r("[project]/node_modules/@vercel/functions/get-context.js [app-rsc] (ecmascript)");
const waitUntil = (promise)=>{
    if (promise === null || typeof promise !== "object" || typeof promise.then !== "function") {
        throw new TypeError(`waitUntil can only be called with a Promise, got ${typeof promise}`);
    }
    return (0, import_get_context.getContext)().waitUntil?.(promise);
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
    waitUntil
});
}),
"[project]/node_modules/@vercel/functions/middleware.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all)=>{
    for(var name in all)__defProp(target, name, {
        get: all[name],
        enumerable: true
    });
};
var __copyProps = (to, from, except, desc)=>{
    if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames(from))if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
            get: ()=>from[key],
            enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
        });
    }
    return to;
};
var __toCommonJS = (mod)=>__copyProps(__defProp({}, "__esModule", {
        value: true
    }), mod);
var middleware_exports = {};
__export(middleware_exports, {
    next: ()=>next,
    rewrite: ()=>rewrite
});
module.exports = __toCommonJS(middleware_exports);
function handleMiddlewareField(init, headers) {
    if (init?.request?.headers) {
        if (!(init.request.headers instanceof Headers)) {
            throw new Error("request.headers must be an instance of Headers");
        }
        const keys = [];
        for (const [key, value] of init.request.headers){
            headers.set("x-middleware-request-" + key, value);
            keys.push(key);
        }
        headers.set("x-middleware-override-headers", keys.join(","));
    }
}
function rewrite(destination, init) {
    const headers = new Headers(init?.headers ?? {});
    headers.set("x-middleware-rewrite", String(destination));
    handleMiddlewareField(init, headers);
    return new Response(null, {
        ...init,
        headers
    });
}
function next(init) {
    const headers = new Headers(init?.headers ?? {});
    headers.set("x-middleware-next", "1");
    handleMiddlewareField(init, headers);
    return new Response(null, {
        ...init,
        headers
    });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
    next,
    rewrite
});
}),
"[project]/node_modules/@vercel/functions/cache/in-memory-cache.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all)=>{
    for(var name in all)__defProp(target, name, {
        get: all[name],
        enumerable: true
    });
};
var __copyProps = (to, from, except, desc)=>{
    if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames(from))if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
            get: ()=>from[key],
            enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
        });
    }
    return to;
};
var __toCommonJS = (mod)=>__copyProps(__defProp({}, "__esModule", {
        value: true
    }), mod);
var in_memory_cache_exports = {};
__export(in_memory_cache_exports, {
    InMemoryCache: ()=>InMemoryCache
});
module.exports = __toCommonJS(in_memory_cache_exports);
class InMemoryCache {
    constructor(){
        this.cache = {};
    }
    async get(key) {
        const entry = this.cache[key];
        if (entry) {
            if (entry.ttl && entry.lastModified + entry.ttl * 1e3 < Date.now()) {
                await this.delete(key);
                return null;
            }
            return entry.value;
        }
        return null;
    }
    async set(key, value, options) {
        this.cache[key] = {
            value,
            lastModified: Date.now(),
            ttl: options?.ttl,
            tags: new Set(options?.tags || [])
        };
    }
    async delete(key) {
        delete this.cache[key];
    }
    async expireTag(tag) {
        const tags = Array.isArray(tag) ? tag : [
            tag
        ];
        for(const key in this.cache){
            if (Object.prototype.hasOwnProperty.call(this.cache, key)) {
                const entry = this.cache[key];
                if (tags.some((t)=>entry.tags.has(t))) {
                    delete this.cache[key];
                }
            }
        }
    }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
    InMemoryCache
});
}),
"[project]/node_modules/@vercel/functions/cache/build-client.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all)=>{
    for(var name in all)__defProp(target, name, {
        get: all[name],
        enumerable: true
    });
};
var __copyProps = (to, from, except, desc)=>{
    if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames(from))if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
            get: ()=>from[key],
            enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
        });
    }
    return to;
};
var __toCommonJS = (mod)=>__copyProps(__defProp({}, "__esModule", {
        value: true
    }), mod);
var build_client_exports = {};
__export(build_client_exports, {
    BuildCache: ()=>BuildCache
});
module.exports = __toCommonJS(build_client_exports);
var import_index = __turbopack_context__.r("[project]/node_modules/@vercel/functions/cache/index.js [app-rsc] (ecmascript)");
class BuildCache {
    constructor({ endpoint, headers, onError, timeout = 500 }){
        this.get = async (key)=>{
            const controller = new AbortController();
            const timeoutId = setTimeout(()=>controller.abort(), this.timeout);
            try {
                const res = await fetch(`${this.endpoint}${key}`, {
                    headers: this.headers,
                    method: "GET",
                    signal: controller.signal
                });
                if (res.status === 404) {
                    clearTimeout(timeoutId);
                    return null;
                }
                if (res.status === 200) {
                    const cacheState = res.headers.get(import_index.HEADERS_VERCEL_CACHE_STATE);
                    if (cacheState !== import_index.PkgCacheState.Fresh) {
                        res.body?.cancel?.();
                        clearTimeout(timeoutId);
                        return null;
                    }
                    const result = await res.json();
                    clearTimeout(timeoutId);
                    return result;
                } else {
                    clearTimeout(timeoutId);
                    throw new Error(`Failed to get cache: ${res.statusText}`);
                }
            } catch (error) {
                clearTimeout(timeoutId);
                if (error.name === "AbortError") {
                    const timeoutError = new Error(`Cache request timed out after ${this.timeout}ms`);
                    timeoutError.stack = error.stack;
                    this.onError?.(timeoutError);
                } else {
                    this.onError?.(error);
                }
                return null;
            }
        };
        this.set = async (key, value, options)=>{
            const controller = new AbortController();
            const timeoutId = setTimeout(()=>controller.abort(), this.timeout);
            try {
                const optionalHeaders = {};
                if (options?.ttl) {
                    optionalHeaders[import_index.HEADERS_VERCEL_REVALIDATE] = options.ttl.toString();
                }
                if (options?.tags && options.tags.length > 0) {
                    optionalHeaders[import_index.HEADERS_VERCEL_CACHE_TAGS] = options.tags.join(",");
                }
                if (options?.name) {
                    optionalHeaders[import_index.HEADERS_VERCEL_CACHE_ITEM_NAME] = options.name;
                }
                const res = await fetch(`${this.endpoint}${key}`, {
                    method: "POST",
                    headers: {
                        ...this.headers,
                        ...optionalHeaders
                    },
                    body: JSON.stringify(value),
                    signal: controller.signal
                });
                clearTimeout(timeoutId);
                if (res.status !== 200) {
                    throw new Error(`Failed to set cache: ${res.status} ${res.statusText}`);
                }
            } catch (error) {
                clearTimeout(timeoutId);
                if (error.name === "AbortError") {
                    const timeoutError = new Error(`Cache request timed out after ${this.timeout}ms`);
                    timeoutError.stack = error.stack;
                    this.onError?.(timeoutError);
                } else {
                    this.onError?.(error);
                }
            }
        };
        this.delete = async (key)=>{
            const controller = new AbortController();
            const timeoutId = setTimeout(()=>controller.abort(), this.timeout);
            try {
                const res = await fetch(`${this.endpoint}${key}`, {
                    method: "DELETE",
                    headers: this.headers,
                    signal: controller.signal
                });
                clearTimeout(timeoutId);
                if (res.status !== 200) {
                    throw new Error(`Failed to delete cache: ${res.statusText}`);
                }
            } catch (error) {
                clearTimeout(timeoutId);
                if (error.name === "AbortError") {
                    const timeoutError = new Error(`Cache request timed out after ${this.timeout}ms`);
                    timeoutError.stack = error.stack;
                    this.onError?.(timeoutError);
                } else {
                    this.onError?.(error);
                }
            }
        };
        this.expireTag = async (tag)=>{
            const controller = new AbortController();
            const timeoutId = setTimeout(()=>controller.abort(), this.timeout);
            try {
                if (Array.isArray(tag)) {
                    tag = tag.join(",");
                }
                const res = await fetch(`${this.endpoint}revalidate?tags=${tag}`, {
                    method: "POST",
                    headers: this.headers,
                    signal: controller.signal
                });
                clearTimeout(timeoutId);
                if (res.status !== 200) {
                    throw new Error(`Failed to revalidate tag: ${res.statusText}`);
                }
            } catch (error) {
                clearTimeout(timeoutId);
                if (error.name === "AbortError") {
                    const timeoutError = new Error(`Cache request timed out after ${this.timeout}ms`);
                    timeoutError.stack = error.stack;
                    this.onError?.(timeoutError);
                } else {
                    this.onError?.(error);
                }
            }
        };
        this.endpoint = endpoint;
        this.headers = headers;
        this.onError = onError;
        this.timeout = timeout;
    }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
    BuildCache
});
}),
"[project]/node_modules/@vercel/functions/cache/index.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all)=>{
    for(var name in all)__defProp(target, name, {
        get: all[name],
        enumerable: true
    });
};
var __copyProps = (to, from, except, desc)=>{
    if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames(from))if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
            get: ()=>from[key],
            enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
        });
    }
    return to;
};
var __toCommonJS = (mod)=>__copyProps(__defProp({}, "__esModule", {
        value: true
    }), mod);
var cache_exports = {};
__export(cache_exports, {
    HEADERS_VERCEL_CACHE_ITEM_NAME: ()=>HEADERS_VERCEL_CACHE_ITEM_NAME,
    HEADERS_VERCEL_CACHE_STATE: ()=>HEADERS_VERCEL_CACHE_STATE,
    HEADERS_VERCEL_CACHE_TAGS: ()=>HEADERS_VERCEL_CACHE_TAGS,
    HEADERS_VERCEL_REVALIDATE: ()=>HEADERS_VERCEL_REVALIDATE,
    PkgCacheState: ()=>PkgCacheState,
    getCache: ()=>getCache
});
module.exports = __toCommonJS(cache_exports);
var import_get_context = __turbopack_context__.r("[project]/node_modules/@vercel/functions/get-context.js [app-rsc] (ecmascript)");
var import_in_memory_cache = __turbopack_context__.r("[project]/node_modules/@vercel/functions/cache/in-memory-cache.js [app-rsc] (ecmascript)");
var import_build_client = __turbopack_context__.r("[project]/node_modules/@vercel/functions/cache/build-client.js [app-rsc] (ecmascript)");
const defaultKeyHashFunction = (key)=>{
    let hash = 5381;
    for(let i = 0; i < key.length; i++){
        hash = hash * 33 ^ key.charCodeAt(i);
    }
    return (hash >>> 0).toString(16);
};
const defaultNamespaceSeparator = "$";
let inMemoryCacheInstance = null;
let buildCacheInstance = null;
const getCache = (cacheOptions)=>{
    const resolveCache = ()=>{
        let cache;
        if ((0, import_get_context.getContext)().cache) {
            cache = (0, import_get_context.getContext)().cache;
        } else {
            cache = getCacheImplementation(process.env.SUSPENSE_CACHE_DEBUG === "true");
        }
        return cache;
    };
    return wrapWithKeyTransformation(resolveCache, createKeyTransformer(cacheOptions));
};
function createKeyTransformer(cacheOptions) {
    const hashFunction = cacheOptions?.keyHashFunction || defaultKeyHashFunction;
    return (key)=>{
        if (!cacheOptions?.namespace) return hashFunction(key);
        const separator = cacheOptions.namespaceSeparator || defaultNamespaceSeparator;
        return `${cacheOptions.namespace}${separator}${hashFunction(key)}`;
    };
}
function wrapWithKeyTransformation(resolveCache, makeKey) {
    return {
        get: (key)=>{
            return resolveCache().get(makeKey(key));
        },
        set: (key, value, options)=>{
            return resolveCache().set(makeKey(key), value, options);
        },
        delete: (key)=>{
            return resolveCache().delete(makeKey(key));
        },
        expireTag: (tag)=>{
            return resolveCache().expireTag(tag);
        }
    };
}
let warnedCacheUnavailable = false;
function getCacheImplementation(debug) {
    if (!inMemoryCacheInstance) {
        inMemoryCacheInstance = new import_in_memory_cache.InMemoryCache();
    }
    if (process.env.RUNTIME_CACHE_DISABLE_BUILD_CACHE === "true") {
        debug && console.log("Using InMemoryCache as build cache is disabled");
        return inMemoryCacheInstance;
    }
    const { RUNTIME_CACHE_ENDPOINT, RUNTIME_CACHE_HEADERS } = process.env;
    if (debug) {
        console.log("Runtime cache environment variables:", {
            RUNTIME_CACHE_ENDPOINT,
            RUNTIME_CACHE_HEADERS
        });
    }
    if (!RUNTIME_CACHE_ENDPOINT || !RUNTIME_CACHE_HEADERS) {
        if (!warnedCacheUnavailable) {
            console.warn("Runtime Cache unavailable in this environment. Falling back to in-memory cache.");
            warnedCacheUnavailable = true;
        }
        return inMemoryCacheInstance;
    }
    if (!buildCacheInstance) {
        let parsedHeaders = {};
        try {
            parsedHeaders = JSON.parse(RUNTIME_CACHE_HEADERS);
        } catch (e) {
            console.error("Failed to parse RUNTIME_CACHE_HEADERS:", e);
            return inMemoryCacheInstance;
        }
        let timeout = 500;
        if (process.env.RUNTIME_CACHE_TIMEOUT) {
            const parsed = parseInt(process.env.RUNTIME_CACHE_TIMEOUT, 10);
            if (!isNaN(parsed) && parsed > 0) {
                timeout = parsed;
            } else {
                console.warn(`Invalid RUNTIME_CACHE_TIMEOUT value: "${process.env.RUNTIME_CACHE_TIMEOUT}". Using default: ${timeout}ms`);
            }
        }
        buildCacheInstance = new import_build_client.BuildCache({
            endpoint: RUNTIME_CACHE_ENDPOINT,
            headers: parsedHeaders,
            onError: (error)=>console.error(error),
            timeout
        });
    }
    return buildCacheInstance;
}
var PkgCacheState = /* @__PURE__ */ ((PkgCacheState2)=>{
    PkgCacheState2["Fresh"] = "fresh";
    PkgCacheState2["Stale"] = "stale";
    PkgCacheState2["Expired"] = "expired";
    PkgCacheState2["NotFound"] = "notFound";
    PkgCacheState2["Error"] = "error";
    return PkgCacheState2;
})(PkgCacheState || {});
const HEADERS_VERCEL_CACHE_STATE = "x-vercel-cache-state";
const HEADERS_VERCEL_REVALIDATE = "x-vercel-revalidate";
const HEADERS_VERCEL_CACHE_TAGS = "x-vercel-cache-tags";
const HEADERS_VERCEL_CACHE_ITEM_NAME = "x-vercel-cache-item-name";
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
    HEADERS_VERCEL_CACHE_ITEM_NAME,
    HEADERS_VERCEL_CACHE_STATE,
    HEADERS_VERCEL_CACHE_TAGS,
    HEADERS_VERCEL_REVALIDATE,
    PkgCacheState,
    getCache
});
}),
"[project]/node_modules/@vercel/functions/db-connections/index.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all)=>{
    for(var name in all)__defProp(target, name, {
        get: all[name],
        enumerable: true
    });
};
var __copyProps = (to, from, except, desc)=>{
    if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames(from))if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
            get: ()=>from[key],
            enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
        });
    }
    return to;
};
var __toCommonJS = (mod)=>__copyProps(__defProp({}, "__esModule", {
        value: true
    }), mod);
var db_connections_exports = {};
__export(db_connections_exports, {
    attachDatabasePool: ()=>attachDatabasePool,
    experimental_attachDatabasePool: ()=>experimental_attachDatabasePool
});
module.exports = __toCommonJS(db_connections_exports);
var import_get_context = __turbopack_context__.r("[project]/node_modules/@vercel/functions/get-context.js [app-rsc] (ecmascript)");
const DEBUG = !!process.env.DEBUG;
function getIdleTimeout(dbPool) {
    if ("options" in dbPool && dbPool.options) {
        if ("idleTimeoutMillis" in dbPool.options) {
            return typeof dbPool.options.idleTimeoutMillis === "number" ? dbPool.options.idleTimeoutMillis : 1e4;
        }
        if ("maxIdleTimeMS" in dbPool.options) {
            return typeof dbPool.options.maxIdleTimeMS === "number" ? dbPool.options.maxIdleTimeMS : 0;
        }
        if ("status" in dbPool) {
            return 5e3;
        }
        if ("connect" in dbPool && "execute" in dbPool) {
            return 3e4;
        }
    }
    if ("config" in dbPool && dbPool.config) {
        if ("connectionConfig" in dbPool.config && dbPool.config.connectionConfig) {
            return dbPool.config.connectionConfig.idleTimeout || 6e4;
        }
        if ("idleTimeout" in dbPool.config) {
            return typeof dbPool.config.idleTimeout === "number" ? dbPool.config.idleTimeout : 6e4;
        }
    }
    if ("poolTimeout" in dbPool) {
        return typeof dbPool.poolTimeout === "number" ? dbPool.poolTimeout : 6e4;
    }
    if ("idleTimeout" in dbPool) {
        return typeof dbPool.idleTimeout === "number" ? dbPool.idleTimeout : 0;
    }
    return 1e4;
}
let idleTimeout = null;
let idleTimeoutResolve = ()=>{};
const bootTime = Date.now();
const maximumDuration = 15 * 60 * 1e3 - 1e3;
function waitUntilIdleTimeout(dbPool) {
    if (!process.env.VERCEL_URL || // This is not set during builds where we don't need to wait for idle connections using the mechanism
    !process.env.VERCEL_REGION) {
        return;
    }
    if (idleTimeout) {
        clearTimeout(idleTimeout);
        idleTimeoutResolve();
    }
    const promise = new Promise((resolve)=>{
        idleTimeoutResolve = resolve;
    });
    const waitTime = Math.min(getIdleTimeout(dbPool) + 100, maximumDuration - (Date.now() - bootTime));
    idleTimeout = setTimeout(()=>{
        idleTimeoutResolve?.();
        if (DEBUG) {
            console.log("Database pool idle timeout reached. Releasing connections.");
        }
    }, waitTime);
    const requestContext = (0, import_get_context.getContext)();
    if (requestContext?.waitUntil) {
        requestContext.waitUntil(promise);
    } else {
        console.warn("Pool release event triggered outside of request scope.");
    }
}
function attachDatabasePool(dbPool) {
    if (idleTimeout) {
        idleTimeoutResolve?.();
        clearTimeout(idleTimeout);
    }
    if ("on" in dbPool && dbPool.on && "options" in dbPool && "idleTimeoutMillis" in dbPool.options) {
        const pgPool = dbPool;
        pgPool.on("release", ()=>{
            if (DEBUG) {
                console.log("Client released from pool");
            }
            waitUntilIdleTimeout(dbPool);
        });
        return;
    } else if ("on" in dbPool && dbPool.on && "config" in dbPool && dbPool.config && "connectionConfig" in dbPool.config) {
        const mysqlPool = dbPool;
        mysqlPool.on("release", ()=>{
            if (DEBUG) {
                console.log("MySQL client released from pool");
            }
            waitUntilIdleTimeout(dbPool);
        });
        return;
    } else if ("on" in dbPool && dbPool.on && "config" in dbPool && dbPool.config && "idleTimeout" in dbPool.config) {
        const mysql2Pool = dbPool;
        mysql2Pool.on("release", ()=>{
            if (DEBUG) {
                console.log("MySQL2/MariaDB client released from pool");
            }
            waitUntilIdleTimeout(dbPool);
        });
        return;
    }
    if ("on" in dbPool && dbPool.on && "options" in dbPool && dbPool.options && "maxIdleTimeMS" in dbPool.options) {
        const mongoPool = dbPool;
        mongoPool.on("connectionCheckedOut", ()=>{
            if (DEBUG) {
                console.log("MongoDB connection checked out");
            }
            waitUntilIdleTimeout(dbPool);
        });
        return;
    }
    if ("on" in dbPool && dbPool.on && "options" in dbPool && dbPool.options && "socket" in dbPool.options) {
        const redisPool = dbPool;
        redisPool.on("end", ()=>{
            if (DEBUG) {
                console.log("Redis connection ended");
            }
            waitUntilIdleTimeout(dbPool);
        });
        return;
    }
    throw new Error("Unsupported database pool type");
}
const experimental_attachDatabasePool = attachDatabasePool;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
    attachDatabasePool,
    experimental_attachDatabasePool
});
}),
"[project]/node_modules/@vercel/functions/purge/index.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all)=>{
    for(var name in all)__defProp(target, name, {
        get: all[name],
        enumerable: true
    });
};
var __copyProps = (to, from, except, desc)=>{
    if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames(from))if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
            get: ()=>from[key],
            enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
        });
    }
    return to;
};
var __toCommonJS = (mod)=>__copyProps(__defProp({}, "__esModule", {
        value: true
    }), mod);
var purge_exports = {};
__export(purge_exports, {
    dangerouslyDeleteBySrcImage: ()=>dangerouslyDeleteBySrcImage,
    dangerouslyDeleteByTag: ()=>dangerouslyDeleteByTag,
    invalidateBySrcImage: ()=>invalidateBySrcImage,
    invalidateByTag: ()=>invalidateByTag
});
module.exports = __toCommonJS(purge_exports);
var import_get_context = __turbopack_context__.r("[project]/node_modules/@vercel/functions/get-context.js [app-rsc] (ecmascript)");
const invalidateByTag = (tag)=>{
    const api = (0, import_get_context.getContext)().purge;
    if (api) {
        return api.invalidateByTag(tag);
    }
    return Promise.resolve();
};
const dangerouslyDeleteByTag = (tag, options)=>{
    const api = (0, import_get_context.getContext)().purge;
    if (api) {
        return api.dangerouslyDeleteByTag(tag, options);
    }
    return Promise.resolve();
};
const invalidateBySrcImage = (src)=>{
    const api = (0, import_get_context.getContext)().purge;
    return api ? api.invalidateBySrcImage(src) : Promise.resolve();
};
const dangerouslyDeleteBySrcImage = (src, options)=>{
    const api = (0, import_get_context.getContext)().purge;
    return api ? api.dangerouslyDeleteBySrcImage(src, options) : Promise.resolve();
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
    dangerouslyDeleteBySrcImage,
    dangerouslyDeleteByTag,
    invalidateBySrcImage,
    invalidateByTag
});
}),
"[project]/node_modules/@vercel/functions/addcachetag/index.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all)=>{
    for(var name in all)__defProp(target, name, {
        get: all[name],
        enumerable: true
    });
};
var __copyProps = (to, from, except, desc)=>{
    if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames(from))if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
            get: ()=>from[key],
            enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
        });
    }
    return to;
};
var __toCommonJS = (mod)=>__copyProps(__defProp({}, "__esModule", {
        value: true
    }), mod);
var addcachetag_exports = {};
__export(addcachetag_exports, {
    addCacheTag: ()=>addCacheTag
});
module.exports = __toCommonJS(addcachetag_exports);
var import_get_context = __turbopack_context__.r("[project]/node_modules/@vercel/functions/get-context.js [app-rsc] (ecmascript)");
const addCacheTag = (tag)=>{
    const addCacheTag2 = (0, import_get_context.getContext)().addCacheTag;
    if (addCacheTag2) {
        return addCacheTag2(tag);
    }
    return Promise.resolve();
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
    addCacheTag
});
}),
"[project]/node_modules/@vercel/functions/index.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all)=>{
    for(var name in all)__defProp(target, name, {
        get: all[name],
        enumerable: true
    });
};
var __copyProps = (to, from, except, desc)=>{
    if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames(from))if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
            get: ()=>from[key],
            enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
        });
    }
    return to;
};
var __toCommonJS = (mod)=>__copyProps(__defProp({}, "__esModule", {
        value: true
    }), mod);
var src_exports = {};
__export(src_exports, {
    addCacheTag: ()=>import_addcachetag.addCacheTag,
    attachDatabasePool: ()=>import_db_connections.attachDatabasePool,
    dangerouslyDeleteBySrcImage: ()=>import_purge.dangerouslyDeleteBySrcImage,
    dangerouslyDeleteByTag: ()=>import_purge.dangerouslyDeleteByTag,
    experimental_attachDatabasePool: ()=>import_db_connections.experimental_attachDatabasePool,
    geolocation: ()=>import_headers.geolocation,
    getCache: ()=>import_cache.getCache,
    getEnv: ()=>import_get_env.getEnv,
    invalidateBySrcImage: ()=>import_purge.invalidateBySrcImage,
    invalidateByTag: ()=>import_purge.invalidateByTag,
    ipAddress: ()=>import_headers.ipAddress,
    next: ()=>import_middleware.next,
    rewrite: ()=>import_middleware.rewrite,
    waitUntil: ()=>import_wait_until.waitUntil
});
module.exports = __toCommonJS(src_exports);
var import_headers = __turbopack_context__.r("[project]/node_modules/@vercel/functions/headers.js [app-rsc] (ecmascript)");
var import_get_env = __turbopack_context__.r("[project]/node_modules/@vercel/functions/get-env.js [app-rsc] (ecmascript)");
var import_wait_until = __turbopack_context__.r("[project]/node_modules/@vercel/functions/wait-until.js [app-rsc] (ecmascript)");
var import_middleware = __turbopack_context__.r("[project]/node_modules/@vercel/functions/middleware.js [app-rsc] (ecmascript)");
var import_cache = __turbopack_context__.r("[project]/node_modules/@vercel/functions/cache/index.js [app-rsc] (ecmascript)");
var import_db_connections = __turbopack_context__.r("[project]/node_modules/@vercel/functions/db-connections/index.js [app-rsc] (ecmascript)");
var import_purge = __turbopack_context__.r("[project]/node_modules/@vercel/functions/purge/index.js [app-rsc] (ecmascript)");
var import_addcachetag = __turbopack_context__.r("[project]/node_modules/@vercel/functions/addcachetag/index.js [app-rsc] (ecmascript)");
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
    addCacheTag,
    attachDatabasePool,
    dangerouslyDeleteBySrcImage,
    dangerouslyDeleteByTag,
    experimental_attachDatabasePool,
    geolocation,
    getCache,
    getEnv,
    invalidateBySrcImage,
    invalidateByTag,
    ipAddress,
    next,
    rewrite,
    waitUntil
});
}),
"[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-validate.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

// This function ensures that all the exported values are valid server actions,
// during the runtime. By definition all actions are required to be async
// functions, but here we can only check that they are functions.
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ensureServerEntryExports", {
    enumerable: true,
    get: function() {
        return ensureServerEntryExports;
    }
});
function ensureServerEntryExports(actions) {
    for(let i = 0; i < actions.length; i++){
        const action = actions[i];
        if (typeof action !== 'function') {
            throw Object.defineProperty(new Error(`A "use server" file can only export async functions, found ${typeof action}.\nRead more: https://nextjs.org/docs/messages/invalid-use-server-value`), "__NEXT_ERROR_CODE", {
                value: "E352",
                enumerable: false,
                configurable: true
            });
        }
    }
} //# sourceMappingURL=action-validate.js.map
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__3690fc98._.js.map