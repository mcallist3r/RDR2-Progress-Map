/*
 * Carga el stub de ScriptHookRDR2.dll y RDR2MapTracker.asi en un proceso
 * normal, espera a que el plugin escriba live.json y comprueba el JSON.
 *
 * Uso: harness.exe <ruta\ScriptHookRDR2.dll> <ruta\RDR2MapTracker.asi>
 */
#include <windows.h>
#include <cstdio>
#include <cstring>

int main(int argc, char** argv) {
    if (argc < 3) {
        std::printf("uso: harness.exe <stub.dll> <plugin.asi>\n");
        return 2;
    }

    HMODULE stub = LoadLibraryA(argv[1]);
    if (!stub) {
        std::printf("no se pudo cargar el stub: %lu\n", GetLastError());
        return 1;
    }
    HMODULE asi = LoadLibraryA(argv[2]);
    if (!asi) {
        std::printf("no se pudo cargar el plugin: %lu\n", GetLastError());
        return 1;
    }

    Sleep(2000);

    wchar_t base[MAX_PATH];
    if (!GetEnvironmentVariableW(L"LOCALAPPDATA", base, MAX_PATH)) {
        std::printf("sin LOCALAPPDATA\n");
        return 1;
    }

    wchar_t path[MAX_PATH];
    _snwprintf_s(path, MAX_PATH, _TRUNCATE,
                 L"%s\\RDR2ProgressMap\\live.json", base);

    FILE* f = nullptr;
    if (_wfopen_s(&f, path, L"rb") != 0 || !f) {
        std::printf("no existe live.json\n");
        return 1;
    }
    char buf[512] = {0};
    size_t n = fread(buf, 1, sizeof(buf) - 1, f);
    fclose(f);
    (void)n;

    std::printf("live.json: %s\n", buf);

    bool ok = std::strstr(buf, "\"x\":1234.500") != nullptr &&
              std::strstr(buf, "\"y\":-567.250") != nullptr &&
              std::strstr(buf, "\"z\":100.000") != nullptr &&
              std::strstr(buf, "\"heading\":90.00") != nullptr;
    std::printf(ok ? "RESULTADO: OK\n" : "RESULTADO: FALLO\n");
    return ok ? 0 : 3;
}
