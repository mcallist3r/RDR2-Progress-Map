/*
 * Stub de ScriptHookRDR2.dll para probar el plugin sin abrir el juego.
 * Exporta (con los mismos nombres decorados de C++) las funciones que
 * usa RDR2MapTracker.asi y devuelve una posición ficticia.
 */
#include <windows.h>
#include <thread>

namespace {

const UINT64 H_PED = 0x096275889B8E0EE0ULL;
const UINT64 H_COORDS = 0xA86D5F069399F44DULL;
const UINT64 H_HEADING = 0xC230DD956E2F5507ULL;
const UINT64 H_EXISTS = 0xD42BD6EB2E0F1677ULL;
const UINT64 H_DEAD = 0x7D5B1F88E7504BBAULL;

UINT64 g_hash = 0;
alignas(8) unsigned char g_buf[32];

}  // namespace

__declspec(dllexport) void nativeInit(UINT64 hash) {
    g_hash = hash;
    ZeroMemory(g_buf, sizeof(g_buf));
}

__declspec(dllexport) void nativePush64(UINT64) {}

__declspec(dllexport) UINT64* nativeCall() {
    if (g_hash == H_PED) {
        *reinterpret_cast<int*>(g_buf) = 42;
    } else if (g_hash == H_EXISTS) {
        *reinterpret_cast<int*>(g_buf) = 1;
    } else if (g_hash == H_DEAD) {
        *reinterpret_cast<int*>(g_buf) = 0;
    } else if (g_hash == H_HEADING) {
        *reinterpret_cast<float*>(g_buf) = 90.0f;
    } else if (g_hash == H_COORDS) {
        *reinterpret_cast<float*>(g_buf + 0) = 1234.5f;
        *reinterpret_cast<float*>(g_buf + 8) = -567.25f;
        *reinterpret_cast<float*>(g_buf + 16) = 100.0f;
    }
    return reinterpret_cast<UINT64*>(g_buf);
}

__declspec(dllexport) void scriptWait(DWORD ms) {
    Sleep(ms);
}

__declspec(dllexport) void scriptRegister(HMODULE, void (*fn)()) {
    std::thread([fn]() { fn(); }).detach();
}

__declspec(dllexport) void scriptUnregister(HMODULE) {}

BOOL APIENTRY DllMain(HMODULE, DWORD, LPVOID) {
    return TRUE;
}
