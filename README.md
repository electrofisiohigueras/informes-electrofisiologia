# Sistema de Informes Médicos — Electrofisiología

Aplicación web 100% estática (sin servidor, sin base de datos) para registrar
procedimientos de electrofisiología y generar informes con formato.

- **Abre `index.html`** y trabaja: formulario por pestañas o asistente paso a paso.
- **Vista Previa** genera el informe; **Copiar Informe** lo deja en el portapapeles
  con formato (listo para pegar en Medicap conservando colores y tablas).
- **Imprimir** usa el menú del navegador (formato carta).

## Persistencia y datos compartidos

- **Para el colega**: no hay registro, ni login, ni configuración. Se abre el
  link y se trabaja. El formulario en curso, el personal y las plantillas que
  ese colega haya cargado quedan guardados **en su navegador** (`localStorage`),
  con autoguardado cada 30 s.
- **Datos universales** (catálogos, procedimientos, plantillas y personal del
  servicio) viven en `data.json` dentro de este mismo repositorio: **todos los
  colegas ven exactamente los mismos**. Se cargan solos al abrir la app.
  - Actualizarlos: **Opciones → Datos Comunes → Exportar datos compartidos**
    (descarga `data.json`) y luego doble clic en **`publicar-datos.bat`**
    (commit + push automático; también funciona `publicar-datos.ps1`).
  - Traer la última versión publicada a cualquier equipo:
    **Opciones → Datos Comunes → Restaurar datos compartidos**.
- **Ningún dato de paciente se ingresa ni se publica**: el informe final se
  pega en el sistema institucional (Medicap), que cuenta con los estándares de
  seguridad correspondientes.
- **Respaldo local**: botón "Respaldar datos" (guardar JSON) e "Importar" para
  restaurar el estado de un equipo.

## Instalación / actualizaciones

- **URL publicada**: https://electrofisiohigueras.github.io/informes-electrofisiologia/
- La app es una **PWA**: el navegador ofrece "Instalar app" (icono en el
  escritorio o celular) y funciona **sin internet** después de la primera
  carga. Al publicar una versión nueva en el repo, la app se actualiza sola
  al refrescar la página (la versión visible en el header indica el nivel).
- La copia local alternativa sigue funcionando abriendo `index.html`
  directo (sin service worker ni catálogos por la web).

## Técnico

- Vanilla JS (16 módulos `js/` cargados en orden, sin build), Tailwind CSS y
  Font Awesome incluidos localmente en `vendor/` (no requiere internet).
- Catálogos base y datos universales editables en `data.json`; las mediciones
  por defecto viven allí y en `js/01-data.js` (fallback para uso offline sin
  servidor).
- PWA: `manifest.json` + `sw.js` (precache de assets, network-first para
  `data.json`). Versión del caché en `SW_VERSION`; al publicar cambios de
  código bump de `APP_VERSION` (js/01-data.js) y de `SW_VERSION` (sw.js).
- Publicar una nueva versión: editar → commit en `main` → push; GitHub Pages
  despliega automáticamente en ~1 minuto.
