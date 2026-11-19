/*
 * RDR2MapTracker — plugin de ScriptHookRDR2 para el mapa de progreso local.
 *
 * Escribe cada 250 ms la posición del jugador en
 *   %LOCALAPPDATA%\RDR2ProgressMap\live.json
 * con el formato {x, y, z, heading, ts}. El servidor local lo lee en
 * /api/live y dibuja la flecha en el mapa. No toca partidas ni archivos
 * del juego: solo escribe ese JSON fuera de la carpeta del juego.
 *
 * El plugin enlaza dinámicamente con ScriptHookRDR2.dll (que ya está
 * cargado por el ASI loader), sin necesidad del SDK ni de su .lib para
 * compilar. Los hashes de los natives son los públicos de RDR2.
 */
#include <windows.h>
#include <cstdio>
#include <ctime>

namespace {

/* ---- natives de RDR2 (hashes estables entre versiones) ---- */
const UINT64 N_PLAYER_PED_ID = 0x096275889B8E0EE0ULL;
const UINT64 N_GET_ENTITY_COORDS = 0xA86D5F069399F44DULL;
const UINT64 N_GET_ENTITY_HEADING = 0xC230DD956E2F5507ULL;
const UINT64 N_DOES_ENTITY_EXIST = 0xD42BD6EB2E0F1677ULL;
const UINT64 N_IS_ENTITY_DEAD = 0x7D5B1F88E7504BBAULL;

struct Vector3 {
    alignas(8) float x;
    alignas(8) float y;
    alignas(8) float z;
};
static_assert(sizeof(Vector3) == 24, "Vector3 debe medir 24 bytes");

/* ---- exports de ScriptHookRDR2.dll, resueltos en tiempo de carga ---- */
struct Hook {
    void (*scriptRegister)(HMODULE, void (*)()) = nullptr;
    void (*scriptUnregister)(HMODULE) = nullptr;
    void (*scriptWait)(DWORD) = nullptr;
    void (*nativeInit)(UINT64) = nullptr;
    void (*nativePush64)(UINT64) = nullptr;
    UINT64* (*nativeCall)() = nullptr;

    bool loaded() const {
        return scriptRegister && scriptUnregister && scriptWait &&
               nativeInit && nativePush64 && nativeCall;
    }
};

Hook g_hook;

/* ScriptHookRDR2.dll exporta símbolos C++ con nombre decorado; se prueban
 * primero los nombres planos (por si el runtime los exporta así) y luego
 * los decorados del build oficial. */
FARPROC findExport(HMODULE mod, const char* plain, const char* mangled) {
    FARPROC fn = GetProcAddress(mod, plain);
    return fn ? fn : GetProcAddress(mod, mangled);
}

bool loadHook() {
    HMODULE mod = GetModuleHandleW(L"ScriptHookRDR2.dll");
    if (!mod) return false;

    g_hook.scriptRegister = reinterpret_cast<decltype(g_hook.scriptRegister)>(
        findExport(mod, "scriptRegister",
                   "?scriptRegister@@YAXPEAUHINSTANCE__@@P6AXXZ@Z"));
    g_hook.scriptUnregister =
        reinterpret_cast<decltype(g_hook.scriptUnregister)>(
            findExport(mod, "scriptUnregister",
                       "?scriptUnregister@@YAXPEAUHINSTANCE__@@@Z"));
    g_hook.scriptWait = reinterpret_cast<decltype(g_hook.scriptWait)>(
        findExport(mod, "scriptWait", "?scriptWait@@YAXK@Z"));
    g_hook.nativeInit = reinterpret_cast<decltype(g_hook.nativeInit)>(
        findExport(mod, "nativeInit", "?nativeInit@@YAX_K@Z"));
    g_hook.nativePush64 = reinterpret_cast<decltype(g_hook.nativePush64)>(
        findExport(mod, "nativePush64", "?nativePush64@@YAX_K@Z"));
    g_hook.nativeCall = reinterpret_cast<decltype(g_hook.nativeCall)>(
        findExport(mod, "nativeCall", "?nativeCall@@YAPEA_KXZ"));

    return g_hook.loaded();
}

/* ---- invocación genérica de natives ---- */
template <typename R>
R callNative(UINT64 hash) {
    g_hook.nativeInit(hash);
    return *reinterpret_cast<R*>(g_hook.nativeCall());
}

template <typename R, typename A>
R callNative(UINT64 hash, A a) {
    g_hook.nativeInit(hash);
    g_hook.nativePush64(static_cast<UINT64>(a));
    return *reinterpret_cast<R*>(g_hook.nativeCall());
}

template <typename R, typename A, typename B>
R callNative(UINT64 hash, A a, B b) {
    g_hook.nativeInit(hash);
    g_hook.nativePush64(static_cast<UINT64>(a));
    g_hook.nativePush64(static_cast<UINT64>(b));
    return *reinterpret_cast<R*>(g_hook.nativeCall());
}

template <typename R, typename A, typename B, typename C>
R callNative(UINT64 hash, A a, B b, C c) {
    g_hook.nativeInit(hash);
    g_hook.nativePush64(static_cast<UINT64>(a));
    g_hook.nativePush64(static_cast<UINT64>(b));
    g_hook.nativePush64(static_cast<UINT64>(c));
    return *reinterpret_cast<R*>(g_hook.nativeCall());
}

/* ---- escritura de live.json ---- */
wchar_t g_livePath[MAX_PATH] = {0};
wchar_t g_tmpPath[MAX_PATH] = {0};

void initPaths() {
    wchar_t base[MAX_PATH];
    DWORD n = GetEnvironmentVariableW(L"LOCALAPPDATA", base, MAX_PATH);
    if (n == 0 || n >= MAX_PATH) return;

    wchar_t dir[MAX_PATH];
    _snwprintf_s(dir, MAX_PATH, _TRUNCATE, L"%s\\RDR2ProgressMap", base);
    CreateDirectoryW(dir, nullptr);

    _snwprintf_s(g_livePath, MAX_PATH, _TRUNCATE, L"%s\\live.json", dir);
    _snwprintf_s(g_tmpPath, MAX_PATH, _TRUNCATE, L"%s\\live.json.tmp", dir);
}

void writeLive(float x, float y, float z, float heading) {
    if (!g_livePath[0]) return;

    char buf[256];
    int len = _snprintf_s(buf, sizeof(buf), _TRUNCATE,
        "{\"x\":%.3f,\"y\":%.3f,\"z\":%.3f,\"heading\":%.2f,\"ts\":%lld}",
        x, y, z, heading, static_cast<long long>(time(nullptr)));
    if (len <= 0) return;

    HANDLE h = CreateFileW(g_tmpPath, GENERIC_WRITE, 0, nullptr, CREATE_ALWAYS,
                           FILE_ATTRIBUTE_NORMAL, nullptr);
    if (h == INVALID_HANDLE_VALUE) return;

    DWORD written = 0;
    BOOL ok = WriteFile(h, buf, static_cast<DWORD>(len), &written, nullptr);
    CloseHandle(h);

    if (ok && written == static_cast<DWORD>(len)) {
        MoveFileExW(g_tmpPath, g_livePath, MOVEFILE_REPLACE_EXISTING);
    }
}

void update() {
    int ped = callNative<int>(N_PLAYER_PED_ID);
    if (ped == 0) return;
    if (!callNative<int>(N_DOES_ENTITY_EXIST, ped)) return;
    if (callNative<int>(N_IS_ENTITY_DEAD, ped)) return;

    Vector3 pos = callNative<Vector3>(N_GET_ENTITY_COORDS, ped, 1, 1);
    // Descarta lecturas corruptas durante cargas o transiciones.
    if (pos.x != pos.x || pos.y != pos.y || pos.z != pos.z) return;
    if (pos.x < -100000.0f || pos.x > 100000.0f) return;
    if (pos.y < -100000.0f || pos.y > 100000.0f) return;

    float heading = callNative<float>(N_GET_ENTITY_HEADING, ped);
    writeLive(pos.x, pos.y, pos.z, heading);
}

}  // namespace

void ScriptMain() {
    initPaths();
    while (true) {
        update();
        g_hook.scriptWait(250);
    }
}

BOOL APIENTRY DllMain(HMODULE module, DWORD reason, LPVOID) {
    switch (reason) {
    case DLL_PROCESS_ATTACH:
        if (loadHook()) g_hook.scriptRegister(module, ScriptMain);
        break;
    case DLL_PROCESS_DETACH:
        if (g_hook.scriptUnregister) g_hook.scriptUnregister(module);
        break;
    default:
        break;
    }
    return TRUE;
}
