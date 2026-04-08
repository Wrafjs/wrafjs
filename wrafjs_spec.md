# Wrafjs Language Specification

**Spec v1.0** — 2026-04-04

---

# 1. Filosofía

Wrafjs es un lenguaje de dominio específico para describir wireframes de UI como texto estructurado. Está diseñado primero para LLMs, no para humanos:

- **Token efficiency** — sin keywords redundantes, sin sintaxis decorativa
- **LLM determinism** — una sola forma de expresar cada concepto, sin alternativas equivalentes
- **Single-file** — una pantalla, un archivo; al estilo MermaidJS
- **Estructura sobre comportamiento** — describe qué se ve, no qué hace

> Si dos nodos hacen lo mismo, existe solo uno. Si una propiedad no afecta el render, no existe.

---

# 2. Modelo de archivo

Un archivo `.wraf` contiene exactamente **un nodo raíz** de tipo `Screen`.

```wraf
Screen Dashboard {
  width: 1440
  height: 900

  Navbar {
    title: "Metrica"
    Button { text: "Nuevo" variant: primary }
  }

  Row {
    Sidebar {
      MenuItem { text: "Dashboard" active: true }
      MenuItem { text: "Usuarios" }
    }
    Column {
      Text { text: "Panel principal" variant: title }
      Row {
        Card { Text { text: "Ventas" variant: heading } }
        Card { Text { text: "Usuarios" variant: heading } }
      }
    }
  }
}
```

Reglas:
- El nodo raíz **debe** ser `Screen`.
- `width` y `height` son requeridos en `Screen`.
- Un archivo con múltiples nodos raíz es inválido.
- No existe multi-file, no existe `Layout`, `View`, `Slot`.

---

# 3. Sintaxis

## 3.1 Gramática

```
File   ::= Node
Node   ::= Identifier Identifier? "{" Body "}"
Body   ::= (Property | Node)*
Property ::= Identifier ":" Value
Value  ::= String | Number | Boolean | Enum | Percent
```

- `Identifier` — `[A-Za-z][A-Za-z0-9_]*`
- `String` — `"[^"]*"` (comillas dobles)
- `Number` — `[0-9]+` (entero sin signo)
- `Boolean` — `true` | `false`
- `Enum` — Identifier usado como valor (sin comillas)
- `Percent` — `[0-9]+%`

## 3.2 Tokens

| Token | Símbolo | Rol |
|---|---|---|
| `{` | LBrace | Abre cuerpo de nodo |
| `}` | RBrace | Cierra cuerpo de nodo |
| `:` | Colon | Separa nombre y valor de propiedad |
| `//` | LineComment | Comentario hasta fin de línea |
| `/* */` | BlockComment | Comentario multilínea |

Comentarios equivalen a whitespace. No afectan el AST.

## 3.3 Reglas léxicas

- El lenguaje es **case-insensitive** en nombres de nodo, labels y valores de enum.
- `layout: horizontal`, `layout: Horizontal`, `layout: HORIZONTAL` son equivalentes.
- Whitespace (espacio, tab, newline) es ignorado.
- Una propiedad por nombre por nodo. Duplicar una propiedad es error.

## 3.4 NodeLabel

Un nodo puede tener un label opcional después del tipo. El label no afecta el render; sirve como identificador estructural para herramientas, inspectores y generadores.

```wraf
Card MetricasPanel {
  padding: 16
  Text { text: "Ventas" variant: heading }
}
```

---

# 4. Tipos de valor

| Tipo | Sintaxis | Ejemplo |
|---|---|---|
| String | `"texto"` | `text: "Guardar"` |
| Number | sin comillas | `width: 360` |
| Boolean | `true` / `false` | `checked: true` |
| Enum | sin comillas | `variant: primary` |
| Percent | número + `%` | `width: 50%` |

Reglas:
- Strings siempre con comillas dobles. Nunca comillas simples.
- Enums nunca con comillas. `variant: "primary"` es un error.
- Porcentajes se resuelven contra el ancho o alto disponible del padre.

---

# 5. Sistema de layout

## 5.1 Auto-layout

Cuando un nodo contenedor tiene hijos sin `x`/`y` explícito, los posiciona automáticamente.

- `layout: vertical` (default) — hijos apilados de arriba a abajo
- `layout: horizontal` — hijos apilados de izquierda a derecha
- `gap` — espacio entre hijos consecutivos (default: `8`)
- `padding` — inset interno; los hijos inician en `(padding, padding)` (defaults por tipo, ver tabla)

```wraf
Column {
  gap: 12
  padding: 16

  Input { }      // y = 16
  Button { }     // y = 16 + <height_input> + 12
}
```

## 5.2 GrowMode

Controla cómo se dimensiona un contenedor cuando no se declaran `width`/`height` explícitos.

| Valor | Ancho | Alto |
|---|---|---|
| `vertical` (default) | fill — ocupa todo el ancho disponible | shrink — se ajusta a la altura de sus hijos |
| `horizontal` | shrink — se ajusta al ancho de sus hijos | fill — ocupa toda la altura disponible |
| `none` | fijo — requiere `width` explícito | fijo — requiere `height` explícito |

## 5.3 Coordenadas relativas

Todas las coordenadas son relativas al origen del nodo padre, desplazadas por el `padding` del padre.

- Un nodo con `x: 100` dentro de un `Card { x: 260 }` tiene posición absoluta `360`.
- Un nodo sin `x`/`y` usa auto-layout y no compite con nodos que sí los tienen.

## 5.4 Propiedad `position`

Ancla un nodo en una de 9 posiciones dentro del área de contenido de su padre, sin afectar el cursor de auto-layout del resto de hijos.

| | Izquierda | Centro | Derecha |
|---|---|---|---|
| **Arriba** | `TopLeft` | `Top` | `TopRight` |
| **Medio** | `Left` | `Center` | `Right` |
| **Abajo** | `BottomLeft` | `BottomCenter` | `BottomRight` |

- Requiere que el nodo tenga `width` y `height` para calcular el centrado.
- Un nodo con `position` es flotante: no avanza el cursor de auto-layout.

```wraf
Screen Login {
  width: 1440
  height: 900

  Card {
    position: center
    width: 400
    height: 480

    Input { placeholder: "Email" }
    Password { placeholder: "Contraseña" }
    Button { text: "Entrar" variant: primary }
  }
}
```

## 5.5 Defaults de padding por nodo

| Nodo | `padding` | `gap` |
|---|---|---|
| `Row`, `Column` | 0 | 8 |
| `Navbar` | 8 | 8 |
| `Tabbar` | 4 | 8 |
| `Sidebar` | 12 | 4 |
| `Card` | 16 | 12 |
| `Modal`, `Drawer` | 24 | 16 |
| `ScrollView` | 16 | 8 |
| `Form` | 16 | 12 |
| `Menu` | 4 | 0 |
| `Screen` | 0 | 0 |
| Resto | 10 | 8 |

---

# 6. Propiedades globales

Válidas en cualquier nodo.

| Propiedad | Tipo | Descripción |
|---|---|---|
| `width` | number \| percent | Ancho del nodo |
| `height` | number \| percent | Alto del nodo |
| `x` | number | Posición horizontal relativa al padre |
| `y` | number | Posición vertical relativa al padre |
| `padding` | number | Inset interno |
| `gap` | number | Espacio entre hijos en auto-layout |
| `layout` | `horizontal` \| `vertical` | Dirección de flujo de hijos |
| `growMode` | `vertical` \| `horizontal` \| `none` | Comportamiento de dimensionado |
| `position` | enum (9-point grid) | Anclaje flotante dentro del padre |
| `hidden` | boolean | Ocultar nodo del render |
| `disabled` | boolean | Aplicar apariencia deshabilitada |

Nota: `x`/`y` y `position` son mutuamente excluyentes. Si un nodo declara `x`/`y`, se posiciona de forma absoluta dentro del padre. Si declara `position`, se ancla por el sistema de 9 puntos. Si declara ambos, `x`/`y` tiene precedencia.

---

# 7. Sistema de texto

## 7.1 Variantes semánticas

La propiedad `variant` en nodos de texto define el tamaño y peso de forma semántica. Es la forma preferida de dimensionar texto.

| Variant | Tamaño | Peso | Uso |
|---|---|---|---|
| `display` | 36px | bold | Métricas grandes, números destacados |
| `title` | 28px | bold | Título de pantalla o sección principal |
| `heading` | 22px | bold | Título de card o subsección |
| `subheading` | 18px | bold | Encabezado menor, navegación |
| `body` | 15px | normal | Texto principal de UI |
| `caption` | 13px | normal | Notas, timestamps, hints |
| `overline` | 11px | bold | Encabezados de etiquetas pequeñas |
| `annotation` | 11px | normal | Anotaciones, texto fino |

Aliases HTML aceptados: `h1` (display) · `h2` (title) · `h3` (heading) · `h4` (subheading) · `h5` (body) · `h6` (caption).

Aliases numéricos aceptados: `size: 1` (display) · `size: 2` (title) · ... · `size: 6` (caption). Se aceptan por compatibilidad; `variant` es preferido.

## 7.2 Propiedades de texto

| Propiedad | Tipo | Descripción |
|---|---|---|
| `text` | string | Contenido textual |
| `variant` | enum | Tamaño y peso semántico |
| `weight` | `bold` \| `semibold` \| `medium` \| `normal` \| `light` | Override de peso |
| `align` | `left` \| `center` \| `right` | Alineación horizontal |
| `italic` | boolean | Cursiva |
| `truncate` | boolean | Truncar con `…` si supera el ancho |
| `color` | string (hex) | Color del texto |

`variant` siempre tiene precedencia sobre `size`. `weight` sobrescribe el peso del `variant`.

---

# 8. Controles

## 8.1 Nodo raíz

### Screen

Nodo raíz único. Define las dimensiones del canvas.

```wraf
Screen NombrePantalla {
  width: 1440
  height: 900
  // hijos directos
}
```

| Propiedad | Tipo | Req | Descripción |
|---|---|---|---|
| `width` | number | ✓ | Ancho del canvas |
| `height` | number | ✓ | Alto del canvas |
| `title` | string | — | Metadato; no se renderiza |

---

## 8.2 Contenedores de layout

### Row

Contenedor de flujo horizontal. Transparente visualmente.

```wraf
Row {
  gap: 12
  Button { text: "Cancelar" }
  Button { text: "Guardar" variant: primary }
}
```

`layout: horizontal` implícito. No tiene propiedades propias más allá de las globales.

---

### Column

Contenedor de flujo vertical. Transparente visualmente.

```wraf
Column {
  gap: 8
  Label { text: "Nombre" }
  Input { placeholder: "Tu nombre" }
}
```

`layout: vertical` implícito. No tiene propiedades propias más allá de las globales.

---

### Card

Superficie elevada. Rectángulo con borde y fondo diferenciado. Puede tener `title` para mostrar una barra de cabecera de 40px.

```wraf
Card Resumen {
  title: "Métricas"
  padding: 16
  gap: 12

  Text { text: "1,234" variant: display }
  Text { text: "ventas este mes" variant: caption }
}
```

| Propiedad | Tipo | Descripción |
|---|---|---|
| `title` | string | Barra de cabecera (40px de alto) |

---

### Modal

Overlay de diálogo. Declarado como hijo directo de `Screen`; se renderiza flotando sobre el canvas completo, no en el flujo de hijos.

```wraf
Screen Confirmacion {
  width: 800
  height: 600

  Modal {
    title: "¿Confirmar eliminación?"
    width: 480

    Text { text: "Esta acción no se puede deshacer." variant: body }
    Row {
      Button { text: "Cancelar" }
      Button { text: "Eliminar" variant: danger }
    }
  }
}
```

| Propiedad | Tipo | Default | Descripción |
|---|---|---|---|
| `title` | string | — | Barra de cabecera (40px) |
| `width` | number | 480 | Ancho del modal |

---

### Drawer

Panel lateral deslizante. Declarado como hijo directo de `Screen`; se renderiza como overlay lateral.

```wraf
Drawer {
  title: "Filtros"
  side: right
  width: 320

  Select { label: "Estado" }
  Select { label: "Categoría" }
  Button { text: "Aplicar" variant: primary }
}
```

| Propiedad | Tipo | Default | Descripción |
|---|---|---|---|
| `title` | string | — | Barra de cabecera (40px) |
| `side` | `left` \| `right` | `right` | Lado desde el que aparece |

---

### ScrollView

Contenedor scrollable.

| Sin propiedades propias más allá de las globales. |
|---|

---

## 8.3 Navegación

### Navbar

Barra de navegación superior. Siempre 48px de alto. Flujo horizontal implícito.

```wraf
Navbar {
  title: "App"
  Avatar { size: sm }
  Button { text: "Salir" variant: ghost }
}
```

| Propiedad | Tipo | Descripción |
|---|---|---|
| `title` | string | Texto a la izquierda de la barra |
| `logo` | string | Alternativa a `title` con imagen |

---

### Sidebar

Panel de navegación lateral. Flujo vertical implícito. Ancho default: 220px.

```wraf
Sidebar {
  Menu {
    MenuItem { text: "Inicio" active: true icon: "home" }
    MenuItem { text: "Usuarios" icon: "user" }
    MenuItem { text: "Configuración" icon: "settings" }
  }
}
```

| Propiedad | Tipo | Descripción |
|---|---|---|
| `title` | string | Encabezado del sidebar |

---

### Tabbar

Barra de pestañas. Siempre 48px de alto. Solo puede contener nodos `Tab`.

```wraf
Tabbar {
  Tab { text: "General" active: true }
  Tab { text: "Seguridad" }
  Tab { text: "Notificaciones" }
}
```

---

### Tab

Pestaña individual dentro de `Tabbar`.

| Propiedad | Tipo | Descripción |
|---|---|---|
| `text` | string | Etiqueta de la pestaña |
| `active` | boolean | Estado activo (underline + bold) |
| `icon` | string | Ícono a la izquierda del texto |

---

### Breadcrumb

Rastro de navegación. 32px de alto.

```wraf
Breadcrumb { text: "Inicio / Usuarios / Perfil" }
```

| Propiedad | Tipo | Descripción |
|---|---|---|
| `text` | string | Ruta separada por `/` |

---

### Pagination

Navegación de páginas. 36px de alto.

```wraf
Pagination { page: 3 total: 150 pageSize: 10 }
```

| Propiedad | Tipo | Default | Descripción |
|---|---|---|---|
| `page` | number | 1 | Página activa |
| `total` | number | — | Total de registros |
| `pageSize` | number | 10 | Registros por página |

---

### Menu

Contenedor de ítems de menú. Flujo vertical implícito.

---

### MenuItem

Ítem individual de menú. 36px de alto.

| Propiedad | Tipo | Descripción |
|---|---|---|
| `text` | string | Texto del ítem |
| `active` | boolean | Estado activo |
| `icon` | string | Ícono a la izquierda |

---

## 8.4 Display

### Text

Nodo de texto de una o varias líneas.

```wraf
Text { text: "Bienvenido" variant: title }
Text { text: "Usuario activo" variant: caption color: "#6b7280" }
```

Propiedades: todas las de [Sistema de texto §7.2](#72-propiedades-de-texto).

---

### Heading

Alias semántico de `Text` con `variant: title` por defecto. Útil para hacer la intención explícita.

```wraf
Heading { text: "Configuración de cuenta" }
```

Propiedades: igual que `Text`.

---

### Label

Texto corto. 24px de alto. Típicamente etiqueta de campo de formulario.

```wraf
Label { text: "Correo electrónico" for: "email" }
```

| Propiedad extra | Tipo | Descripción |
|---|---|---|
| `for` | string | Referencia al `id` del control asociado |

---

### Paragraph

Bloque de texto con word-wrap. La altura se calcula dinámicamente en función del ancho disponible.

```wraf
Paragraph {
  text: "Este es un texto largo que ocupará varias líneas dependiendo del ancho disponible."
  width: 400
}
```

Propiedades: igual que `Text`.

---

### Badge

Píldora de estado o contador. 20px de alto.

```wraf
Badge { text: "Nuevo" variant: success }
Badge { text: "5" variant: danger }
Badge { dot: true variant: warning }
```

| Propiedad | Tipo | Default | Descripción |
|---|---|---|---|
| `text` | string | — | Contenido |
| `variant` | `default` \| `primary` \| `success` \| `warning` \| `danger` | `default` | Color |
| `dot` | boolean | false | Renderiza solo el punto de color sin texto |

---

### Avatar

Círculo de usuario con iniciales. Tamaño por `size`.

```wraf
Avatar { name: "Juan García" size: md }
Avatar { src: "/foto.jpg" size: lg }
```

| Propiedad | Tipo | Default | Descripción |
|---|---|---|---|
| `name` | string | — | Fuente para iniciales y color determinista |
| `src` | string | — | URL de imagen (placeholder en wireframe) |
| `size` | `xs` \| `sm` \| `md` \| `lg` \| `xl` | `sm` | Tamaño: xs=24 sm=32 md=40 lg=48 xl=64 |

---

### Icon

Ícono vectorial. 20px de alto por defecto.

```wraf
Icon { name: "search" size: 20 color: "#6b7280" }
```

| Propiedad | Tipo | Descripción |
|---|---|---|
| `name` | string | Símbolo: `search` `home` `user` `settings` `menu` `close` `check` `arrow` `edit` `delete` `add` `filter` |
| `size` | number | Tamaño en px |
| `color` | string (hex) | Color del ícono |

---

### Image

Imagen o placeholder. La altura no tiene intrínseco útil; siempre declarar `height`.

```wraf
Image { src: "/banner.jpg" width: 600 height: 300 fit: cover }
```

| Propiedad | Tipo | Default | Descripción |
|---|---|---|---|
| `src` | string | — | URL (solo placeholder en wireframe) |
| `alt` | string | — | Texto alternativo |
| `fit` | `fill` \| `contain` \| `cover` \| `none` | `cover` | Modo de ajuste |

---

### Separator

Línea divisoria. 1px en la dimensión principal.

```wraf
Separator { }
Separator { orientation: vertical height: 24 }
```

| Propiedad | Tipo | Default | Descripción |
|---|---|---|---|
| `orientation` | `horizontal` \| `vertical` | `horizontal` | Dirección |

Alias aceptado: `Divider`.

---

### List

Contenedor de ítems de lista. Flujo vertical implícito.

---

### ListItem

Fila de lista. 36px si no tiene `subtitle`, 48px si lo tiene.

```wraf
ListItem { text: "Pedro Ramírez" subtitle: "Administrador" icon: "user" }
```

| Propiedad | Tipo | Descripción |
|---|---|---|
| `text` | string | Texto principal |
| `subtitle` | string | Segunda línea |
| `icon` | string | Ícono a la izquierda |

---

### Table

Contenedor de filas de tabla. Solo puede contener `TableRow`.

---

### TableRow

Fila de tabla. 40px de alto.

```wraf
Table {
  TableRow { selected: true }
  TableRow { }
  TableRow { disabled: true }
}
```

| Propiedad | Tipo | Descripción |
|---|---|---|
| `selected` | boolean | Fila seleccionada (fondo accent) |

---

### Skeleton

Placeholder de carga. Líneas apiladas de 20px cada una.

```wraf
Skeleton { lines: 3 width: 240 }
```

| Propiedad | Tipo | Default | Descripción |
|---|---|---|---|
| `lines` | number | 1 | Número de líneas placeholder |

---

### Code

Bloque de código. Sin resaltado de sintaxis en wireframe.

```wraf
Code { text: "const x = 1;" width: 400 height: 80 }
```

---

## 8.5 Input

### Button

Control de acción. 36px de alto por defecto (varía con `size`).

```wraf
Button { text: "Guardar" variant: primary }
Button { text: "Cancelar" variant: ghost size: sm }
Button { text: "Procesando" variant: primary loading: true }
```

| Propiedad | Tipo | Default | Descripción |
|---|---|---|---|
| `text` | string | — | Etiqueta |
| `variant` | `default` \| `primary` \| `secondary` \| `danger` \| `ghost` \| `link` | `default` | Estilo visual |
| `size` | `xs` \| `sm` \| `md` \| `lg` \| `xl` | `md` | xs=24 sm=28 md=36 lg=44 xl=52 (altura px) |
| `loading` | boolean | false | Spinner en lugar de texto |
| `icon` | string | — | Ícono a la izquierda del texto |

No puede tener hijos.

---

### Input

Campo de texto de una línea. 36px de alto.

```wraf
Input { placeholder: "Buscar..." }
Input { label: "Nombre" value: "Juan" required: true }
```

| Propiedad | Tipo | Descripción |
|---|---|---|
| `placeholder` | string | Texto de placeholder |
| `value` | string | Valor precompletado |
| `name` | string | Nombre del campo |
| `required` | boolean | Marca requerido (`*`) |
| `readonly` | boolean | Campo de solo lectura |

Alias aceptado: `TextField`.

---

### Password

Campo de contraseña. Mismo render que `Input` con caracteres enmascarados.

Propiedades: igual que `Input`.

---

### Search

Campo de búsqueda. Mismo render que `Input` con ícono lupa.

Propiedades: igual que `Input`.

---

### TextArea

Campo de texto multilínea.

```wraf
TextArea { placeholder: "Descripción..." rows: 4 }
```

| Propiedad | Tipo | Default | Descripción |
|---|---|---|---|
| `placeholder` | string | — | Texto de placeholder |
| `value` | string | — | Valor precompletado |
| `rows` | number | 3 | Número de líneas visibles (altura = rows × lineHeight + 16) |
| `name` | string | — | Nombre del campo |
| `required` | boolean | false | Marca requerido |
| `readonly` | boolean | false | Solo lectura |

---

### Select

Selector desplegable. 36px de alto.

```wraf
Select { placeholder: "Selecciona un país" }
Select { label: "Rol" value: "Administrador" required: true }
```

| Propiedad | Tipo | Descripción |
|---|---|---|
| `placeholder` | string | Texto cuando no hay selección |
| `value` | string | Opción seleccionada |
| `label` | string | Etiqueta del campo |
| `required` | boolean | Marca requerido |

Alias aceptado: `Dropdown`.

---

### Checkbox

Casilla de verificación con etiqueta. 24px de alto.

```wraf
Checkbox { text: "Recordar sesión" checked: true }
Checkbox { text: "Acepto los términos" indeterminate: true }
```

| Propiedad | Tipo | Default | Descripción |
|---|---|---|---|
| `text` | string | — | Etiqueta |
| `checked` | boolean | false | Estado marcado |
| `indeterminate` | boolean | false | Estado indeterminado |
| `name` | string | — | Nombre del campo |
| `required` | boolean | false | Requerido |

---

### Radio

Botón de radio individual. 24px de alto.

```wraf
Column {
  Radio { text: "Mensual" checked: true name: "plan" }
  Radio { text: "Anual" name: "plan" }
}
```

| Propiedad | Tipo | Default | Descripción |
|---|---|---|---|
| `text` | string | — | Etiqueta |
| `checked` | boolean | false | Seleccionado |
| `name` | string | — | Grupo al que pertenece |
| `value` | string | — | Valor del radio |

---

### Switch

Interruptor de encendido/apagado. 20px de alto.

```wraf
Switch { checked: true }
Switch { text: "Notificaciones por email" checked: false }
```

| Propiedad | Tipo | Default | Descripción |
|---|---|---|---|
| `text` | string | — | Etiqueta |
| `checked` | boolean | false | Estado activo |
| `name` | string | — | Nombre del campo |

Alias aceptado: `Toggle`.

---

### Slider

Control deslizante de rango. 24px de alto.

```wraf
Slider { min: 0 max: 100 value: 40 }
```

| Propiedad | Tipo | Default | Descripción |
|---|---|---|---|
| `min` | number | 0 | Valor mínimo |
| `max` | number | 100 | Valor máximo |
| `value` | number | 0 | Valor actual |
| `step` | number | 1 | Incremento |
| `name` | string | — | Nombre del campo |

---

### FileUpload

Zona de carga de archivos. 64px de alto.

```wraf
FileUpload { text: "Arrastra o haz clic para subir" accept: ".pdf,.docx" }
```

| Propiedad | Tipo | Descripción |
|---|---|---|
| `text` | string | Texto de la zona |
| `accept` | string | Tipos de archivo aceptados |
| `multiple` | boolean | Permite múltiples archivos |
| `name` | string | Nombre del campo |

---

### Form

Contenedor semántico de formulario. Equivalente visual a `Column`.

```wraf
Form {
  gap: 16
  Label { text: "Correo" }
  Input { placeholder: "correo@ejemplo.com" required: true }
  Label { text: "Contraseña" }
  Password { placeholder: "••••••••" required: true }
  Button { text: "Iniciar sesión" variant: primary }
}
```

Sin propiedades propias más allá de las globales.

---

## 8.6 Feedback

### Alert

Banner de notificación con variante de color. 48px de alto.

```wraf
Alert { text: "Guardado correctamente" variant: success }
Alert { text: "Revisar los campos marcados" variant: danger closable: true }
```

| Propiedad | Tipo | Default | Descripción |
|---|---|---|---|
| `text` | string | — | Mensaje |
| `variant` | `default` \| `primary` \| `success` \| `warning` \| `danger` | `default` | Color |
| `closable` | boolean | false | Muestra botón de cierre |

Alias aceptado: `Toast`.

---

### Tooltip

Etiqueta contextual emergente. 32px de alto.

```wraf
Tooltip { text: "Eliminar registro" placement: top }
```

| Propiedad | Tipo | Default | Descripción |
|---|---|---|---|
| `text` | string | — | Contenido |
| `placement` | `top` \| `bottom` \| `left` \| `right` | `top` | Posición |

---

### Progress

Barra de progreso lineal. 8px de alto.

```wraf
Progress { value: 65 max: 100 }
Progress { indeterminate: true }
```

| Propiedad | Tipo | Default | Descripción |
|---|---|---|---|
| `value` | number | 0 | Valor actual |
| `max` | number | 100 | Valor máximo |
| `indeterminate` | boolean | false | Animación de carga sin valor definido |

---

### Spinner

Indicador de carga circular.

```wraf
Spinner { size: lg }
```

| Propiedad | Tipo | Default | Descripción |
|---|---|---|---|
| `size` | `xs` \| `sm` \| `md` \| `lg` \| `xl` | `md` | xs=16 sm=24 md=32 lg=40 xl=48 (px) |

---

# 9. Referencia rápida de controles

| Nodo | Alto intrínseco | Categoría |
|---|---|---|
| `Screen` | — (root) | Raíz |
| `Row` | shrink | Layout |
| `Column` | shrink | Layout |
| `Card` | shrink | Layout |
| `Modal` | shrink | Layout |
| `Drawer` | fill | Layout |
| `ScrollView` | shrink | Layout |
| `Navbar` | 48px | Navegación |
| `Sidebar` | fill | Navegación |
| `Tabbar` | 48px | Navegación |
| `Tab` | 40px | Navegación |
| `Breadcrumb` | 32px | Navegación |
| `Pagination` | 36px | Navegación |
| `Menu` | shrink | Navegación |
| `MenuItem` | 36px | Navegación |
| `Text` | 36px | Display |
| `Heading` | 28px | Display |
| `Label` | 24px | Display |
| `Paragraph` | dinámico | Display |
| `Badge` | 20px | Display |
| `Avatar` | size-qualified | Display |
| `Icon` | 20px | Display |
| `Image` | declarar explícito | Display |
| `Separator` | 1px | Display |
| `List` | shrink | Display |
| `ListItem` | 36px / 48px | Display |
| `Table` | shrink | Display |
| `TableRow` | 40px | Display |
| `Skeleton` | lines × 20px | Display |
| `Code` | declarar explícito | Display |
| `Button` | 36px (size-qualified) | Input |
| `Input` | 36px | Input |
| `Password` | 36px | Input |
| `Search` | 36px | Input |
| `TextArea` | rows × lineH + 16 | Input |
| `Select` | 36px | Input |
| `Checkbox` | 24px | Input |
| `Radio` | 24px | Input |
| `Switch` | 20px | Input |
| `Slider` | 24px | Input |
| `FileUpload` | 64px | Input |
| `Form` | shrink | Input |
| `Alert` | 48px | Feedback |
| `Tooltip` | 32px | Feedback |
| `Progress` | 8px | Feedback |
| `Spinner` | size-qualified | Feedback |

---

# 10. Renderer

El renderer genera SVG estático a partir del árbol de layout resuelto.

## 10.1 Painter

El único painter en productivo es **SketchPainter** (Rough.js): estilo mano alzada, líneas levemente irregulares, aspecto de boceto.

## 10.2 Tema

El render usa **modo claro únicamente**:

| Token | Valor |
|---|---|
| Canvas background | `#faf8f4` |
| Stroke | `#2a2a2a` |
| Fill | `#f4f0e8` |
| Text | `#1a1a1a` |

Los colores, radios y demás defaults del renderer son parte del paquete y no son configurables por el usuario en esta versión.

## 10.3 Pipeline de render

```
.wraf source
  │
  ▼  parser
parse()        lexer → CST → AST (WrafNode tree) → validate()
  │
  ▼  layout
collectBoxes() walk AST → ResolvedBox[] (x, y, width, height por nodo)
  │
  ▼  renderer
buildScene()   ResolvedBox[] → DrawCall[] (RectItem, TextItem, LineItem, …)
paint()        DrawCall[] → SVG string  (SketchPainter)
```

---

# 11. Playground

El playground es la herramienta de desarrollo para wrafjs productivo.

| Elemento | Descripción |
|---|---|
| Editor | CodeMirror, un solo archivo `.wraf` |
| Panel de errores | Lista de errores de parsing y validación con línea y columna |
| Canvas | SVG renderizado, con zoom y pan |
| Sincronización | Click en canvas → cursor en editor; cursor en editor → highlight en canvas |

Sin DevTools, sin panel de configuración de renderer, sin multi-tab de archivos.

---

# 12. Validación y errores

El validador opera sobre el AST después del parsing e informa:

- **Error** — el nodo o propiedad es inválido; el render no debe continuar
- **Warning** — el nodo es válido pero hay algo sospechoso

Errores comunes:

| Código | Descripción |
|---|---|
| `E001` | Nodo raíz no es `Screen` |
| `E002` | `Screen` sin `width` o `height` |
| `E003` | Propiedad desconocida para el tipo de nodo |
| `E004` | Tipo de valor incorrecto (e.g., enum con comillas) |
| `E005` | Propiedad duplicada en el mismo nodo |
| `W001` | Nodo sin dimensiones explícitas ni dimensión intrínseca conocida |
| `W002` | `Button` con hijos declarados |
