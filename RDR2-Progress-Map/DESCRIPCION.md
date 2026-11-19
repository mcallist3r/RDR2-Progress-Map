# RDR2 · Mapa de progreso

Mapa interactivo de coleccionables, recursos y puntos de interés de Red Dead Redemption 2 para PC, pensado para usarlo en local mientras juegas. Está inspirado en los mapas de progreso de Breath of the Wild y Tears of the Kingdom: abres el mapa, marcas lo que vas consiguiendo y el progreso se guarda por partida.

Funciona sin conexión (los tiles del mapa se descargan una sola vez si no vienen incluidos) y no instala nada raro: un servidor local en Python y tu navegador. No toca tus archivos de guardado.

## Qué incluye

- **6.971 marcadores** en tres grupos:
  - **Coleccionables (623 puntos con seguimiento):** 30 huesos de dinosaurio, 20 atrapasueños, 10 petroglifos, 9 tumbas, 187 orquídeas exóticas, 20 huevos de aligátor, 83 cofres salvajes, 17 madrigueras de cangrejo, 150 naipes de cigarrillos, 14 sombreros, 14 armas únicas, 8 objetos raros, 20 mapas del tesoro, 12 tesoros, 16 animales legendarios y 13 peces legendarios.
  - **Recursos:** 6.290 puntos de hierbas y plantas.
  - **Lugares:** 58 puntos de interés.
- **Progreso por partida:** detecta tus partidas (nombre, porcentaje y fecha) y guarda un archivo independiente para cada una. Al cambiar de partida cambia el progreso; nunca se mezclan.
- **Filtros:** pestañas Todos / Pendientes / Hechos, casillas por categoría con contador y barra de progreso, y ocultación automática de las categorías densas según el zoom (hierbas, orquídeas y cofres aparecen al acercarte).
- **Buscador** por nombre, subtipo o nota, en español e inglés.
- **Ficha de cada marcador:** nombre, categoría, coordenadas y botones Marcar como hecho / Deshacer / Centrar. Animales y peces legendarios con fotografía.
- **Idioma ES/EN y tamaño de letra** ajustables al instante (hasta 150 %), recordados entre sesiones.
- **Exportar / Importar** el progreso en JSON; la importación fusiona lo que ya tuvieras.
- **Seguir al jugador y marcado automático** al pasar cerca (opcionales, con el mod).
- La vista, los filtros y las preferencias se recuerdan en el navegador.

## El progreso es manual: lo que ya tienes hecho en el juego NO se importa

Esta es la pregunta que más se repite, así que mejor dejarlo claro desde el principio:

**El mapa empieza en 0 en cada partida y no puede leer qué coleccionables concretos has conseguido ya en tu save.**

El motivo es cómo guarda RDR2 las partidas. Del archivo de guardado solo se puede leer en claro la cabecera: nombre, porcentaje y fecha. Todo el estado interno (misiones, inventario, coleccionables) va en bloques PSO cifrados y no hay un esquema público de ese formato. Para saber «este hueso de dinosaurio en concreto ya lo tengo» habría que descifrar y entender esos bloques: es ingeniería inversa, se rompe con cualquier parche del juego y el más mínimo error puede corromper la partida. El mapa no lo intenta: solo lee la cabecera para mostrar el porcentaje informativo y nunca escribe en tus saves.

Tampoco hay una forma fiable de consultar el estado de cada coleccionable por separado, así que no existe un atajo.

**Qué implica en la práctica:** si ya llevas progreso, tendrás que marcar a mano lo que ya tienes (un clic por marcador; el buscador y los filtros ayudan). A partir de ahí puedes ir marcando sobre la marcha o activar el marcado automático al pasar cerca con el mod. El porcentaje del save no sirve para deducirlo, porque incluye historia, misiones y mucho más.

El JSON de Exportar/Importar sirve para mover **tu progreso marcado** entre partidas u ordenadores, no para extraerlo del juego.

## Cómo se usa

1. Descomprime la carpeta donde quieras.
2. Doble clic en **Start.bat**. Si tu copia no incluye los tiles, la primera vez los descarga (unos 120 MB) y tarda unos minutos; después arranca al instante y funciona sin conexión.
3. Se abre el navegador en `http://127.0.0.1:8790`.
4. Elige tu partida en el desplegable **PARTIDA** de la barra superior.
5. Deja la ventana negra abierta mientras lo uses; para cerrarlo, ciérrala o pulsa `Ctrl+C`.

**Requisitos:** Windows 10/11, Python 3.10 o superior (con `py -3` o `python` en el PATH) y un navegador moderno. No hace falta tener RDR2 abierto para consultar el mapa; solo para el seguimiento de partidas y la posición en vivo.

## Mod opcional de posición en vivo

Incluye un plugin (`RDR2MapTracker.asi`) que dibuja tu posición y orientación sobre el mapa cada 250 ms. Para usarlo, copia `mod/dist/RDR2MapTracker.asi` a la carpeta del juego, junto a `RDR2.exe`; necesitarás ScriptHookRDR2 + ASI Loader. Solo modo historia offline: no lo uses en Red Dead Online. El plugin solo lee tu posición y escribe un JSON aparte en `%LOCALAPPDATA%\RDR2ProgressMap\live.json`; no modifica partidas ni archivos del juego.

Si no quieres instalar el plugin, el mapa funciona igual: simplemente no verás la flecha ni el marcado automático.

## Privacidad y datos

- Todo es local: el servidor escucha solo en `127.0.0.1` y la app no envía nada a internet.
- El progreso son archivos JSON dentro de la carpeta `progress/`; puedes copiarlos o hacer copia de seguridad.
- Los tiles del mapa se descargan una sola vez de la CDN pública de RDOMap y las fotos de los legendarios de la Red Dead Wiki. Son material de Rockstar Games y se usan solo para consulta personal; no los redistribuyas por separado.

## Si algo no va

- **No aparecen partidas:** deben estar en `Documentos\Rockstar Games\Red Dead Redemption 2\Profiles\<perfil>\SRDR*`. También se miran OneDrive y la carpeta «Documentos» en español.
- **Aviso de tiles que no cargan:** comprueba que la ventana de `Start.bat` sigue abierta y pulsa Recargar en el aviso.
- **El antivirus marca el `.asi`:** es un plugin sin firmar compilado desde el código incluido en `mod/src/main.cpp`.

## Créditos

Datos de marcadores de [jeanropke/RDOMap](https://github.com/jeanropke/RDOMap) (Unlicense) y del archivo de [the0neWhoKnocks](https://github.com/the0neWhoKnocks/red-dead-redemption-2-map) (MIT); Leaflet 1.9.4 (BSD-2-Clause). Interfaz inspirada en botw-progress y totk-progress. Proyecto no oficial, sin relación con Rockstar Games.
