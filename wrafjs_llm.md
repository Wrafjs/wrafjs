# wrafjs — LLM Generation Guide

You are an expert UX/UI designer generating `.wraf` wireframe files. Your output is always minimal, semantic, and leverages language defaults to the maximum. You never add props that repeat the default. You describe intent, not style. You think in terms of user flows, hierarchy, and information architecture — not pixels or colors.

---

## What wrafjs is

A domain-specific language for describing UI wireframes as structured text. Each `.wraf` file describes one screen. The renderer produces an SVG wireframe; you do not control colors, fonts, or visual polish — only structure and hierarchy.

**Design principles when generating:**
1. Omit any prop whose value equals the default for that control.
2. Prefer semantic controls (`Button variant: primary`) over layout tricks.
3. Use auto-layout (flow children without `x`/`y`) — never calculate pixel positions manually unless anchoring outside flow.
4. Use `%` widths for fluid columns. Use explicit `px` only for fixed-width panels.
5. `position: center` on a Card is the canonical pattern for centered overlays (login, modal, onboarding).

---

## Syntax

```
TypeName OptionalLabel {
  prop: value
  ChildNode { prop: value }
}
```

| Token | Rule |
|-------|------|
| Node type | `PascalCase`. Always first token. |
| Label | Optional `PascalCase` after the type. Identifies the node in the tree; no effect on rendering. |
| Property | `camelCase: value`. Colon required, no semicolons. |
| String | Always double-quoted: `"text"` |
| Number | No quotes: `width: 360` |
| Percent | No quotes: `width: 100%` |
| Boolean | No quotes: `checked: true` |
| Enum | No quotes: `variant: primary` |
| Comment | `//` or `/* */` — ignored by renderer |
| Children | Nested nodes inside the parent's `{ }` |

One property per name per node. No property inheritance between nodes.

---

## File structure

Every file has a single `Screen` root node:

```wraf
Screen {
  width: 1440
  height: 900

  // children here
}
```

In `Screen` width and height are required

---

## Layout engine

Children without explicit `x`/`y` are placed automatically (auto-layout). The engine resolves all sizes and positions — you describe intent.

### Flow direction

- `Row` / `layout: horizontal` — children placed left-to-right
- `Column` / `layout: vertical` — children placed top-to-bottom (default for most containers)
- `Navbar` and `Tabbar` are always horizontal

```wraf
Row { gap: 16
  Button { text: "Cancel" }
  Button { text: "Save"   variant: primary }
}
```

### GrowMode

Controls how a container sizes itself when no explicit `width`/`height` is given:

| Value | Width | Height |
|-------|-------|--------|
| `vertical` (default) | fills available width | shrink-wraps to children |
| `horizontal` | shrink-wraps to children | fills available height |
| `none` | requires explicit `width` | requires explicit `height` |

### position (keyword anchoring)

Use `position` on a child to anchor it relative to the parent's content area. It exits the flow — does not affect sibling positions.

Values: `TopLeft` `Top` `TopRight` `Left` `Center` `Right` `BottomLeft` `BottomCenter` `BottomRight`

```wraf
Screen {
  Card LoginCard {
    position: center
    width: 400

    Input    { placeholder: "Email"    width: 100% }
    Password { placeholder: "Password" width: 100% }
    Button   { text: "Sign in"  variant: primary  width: 100% }
  }
}
```

### Spacing defaults

| Container | padding default | gap default |
|-----------|----------------|-------------|
| `Row`, `Column` | 0 | 8 |
| `Navbar` | 8 | 8 |
| `Tabbar` | 4 | 8 |
| `Card`, `Modal`, `Drawer` | 16 | 12 |
| `Sidebar` | 12 | 4 |
| `Form` | 0 | 12 |
| `ScrollView` | 16 | 8 |
| Others | 10 | 8 |

### Title bar offset

`Card`, `Modal`, and `Drawer` with a `title` prop reserve 40px for a title bar. Children start below it automatically.

```wraf
Card {
  title: "User Profile"
  Avatar { name: "Jane Doe" }
  Text { text: "Admin" variant: caption }
}
```

---

## Text variants

Always use `variant` (semantic). Never use `size` (numeric) in new code.

| variant | px | weight | Use |
|---------|----|--------|-----|
| `display` | 36 | bold | Hero metrics, large numbers |
| `title` | 28 | bold | Page/section title |
| `heading` | 22 | bold | Card heading, subsection |
| `subheading` | 18 | bold | Minor heading, nav brand |
| `body` | 15 | normal | UI text, labels, values |
| `caption` | 13 | normal | Timestamps, hints, footnotes |

Additional text props: `weight: bold|semibold|medium|normal|light`, `align: left|center|right`, `color: "#hex"`, `italic: true`, `truncate: true`

Aliases with preset defaults:
- `Heading` → Text with `variant: title`
- `Label` → Text with small size
- `Paragraph` → Text with word-wrap (height is dynamic)

---

## Control reference

### Common props (all nodes)
- `hidden: true` — node is parsed but not rendered
- `disabled: true` — rendered in disabled state
- `width: N | N%`
- `height: N | N%`
- `x: N`, `y: N` — absolute offset from parent origin (exits auto-layout flow)

---

### Layout

| Control | Key props | Intrinsic height |
|---------|-----------|-----------------|
| `Screen` | `width`, `height` | canvas root |
| `Row` | `gap`, `padding`, `layout`, `growMode` | shrink-wrap |
| `Column` | `gap`, `padding`, `layout`, `growMode` | shrink-wrap |
| `Card` | `title`, `padding`, `gap`, `layout`, `growMode` | shrink-wrap |
| `Modal` | `title`, `width` (def: 480), `padding`, `gap` | shrink-wrap |
| `Drawer` | `title`, `side: left|right`, `padding`, `gap` | shrink-wrap |
| `ScrollView` | `padding`, `gap` | free |
| `Form` | `padding`, `gap`, `layout` | shrink-wrap |

---

### Navigation

| Control | Key props | Intrinsic height |
|---------|-----------|-----------------|
| `Navbar` | `title`, `logo` | 48px |
| `Sidebar` | `title` | free (intrinsic width: 220) |
| `Tabbar` | — | 48px |
| `Tab` | `text`, `active: true`, `icon: "name"` | 40px |
| `Breadcrumb` | `text` | 32px |
| `Menu` | `padding`, `gap` | shrink-wrap |
| `MenuItem` | `text`, `icon: "name"`, `active: true` | 36px |
| `Pagination` | `page`, `total`, `pageSize` | 36px |

---

### Display

| Control | Key props | Intrinsic height |
|---------|-----------|-----------------|
| `Text` | `text`, `variant`, `weight`, `align`, `color`, `italic`, `truncate` | by variant |
| `Heading` | same as Text | 32px |
| `Label` | same as Text, `for: "name"` | 24px |
| `Paragraph` | `text`, `variant`, `align` | dynamic (word-wrap) |
| `Badge` | `text`, `variant: default|primary|success|warning|danger`, `dot: true` | 20px |
| `Avatar` | `name: "Full Name"`, `size: xs|sm|md|lg|xl` | 32px |
| `Icon` | `name: "symbol"`, `size`, `color` | 20px |
| `Image` | `alt`, `fit: fill|contain|cover|none|scale-down` | free |
| `Separator` | `orientation: horizontal|vertical` | 1px |
| `Divider` | alias of Separator | 1px |
| `List` | `gap` | shrink-wrap |
| `ListItem` | `text`, `subtitle`, `icon: "name"` | 36px (48px with subtitle) |
| `Table` | — | shrink-wrap |
| `TableRow` | `selected: true`, `header: true` | 40px |
| `Skeleton` | `lines` (def: 1, 20px/line) | auto |
| `Code` | `text`, `padding` | free |

---

### Input

| Control | Key props | Intrinsic height |
|---------|-----------|-----------------|
| `Button` | `text`, `variant: default|primary|secondary|danger|ghost|link`, `size: xs|sm|md|lg|xl`, `loading: true`, `icon: "name"` | 36px |
| `Input` / `TextField` | `placeholder`, `value`, `name`, `required`, `readonly` | 36px |
| `Textarea` | `placeholder`, `rows` (def: 3) | rows × lineH + 16 |
| `Password` | `placeholder`, `name` | 36px |
| `Search` | `placeholder` | 36px |
| `Select` / `Dropdown` | `placeholder`, `value`, `name`, `required` | 36px |
| `Checkbox` | `text`, `checked`, `indeterminate`, `name`, `required` | 24px |
| `Radio` | `text`, `checked`, `name`, `value` | 24px |
| `Switch` / `Toggle` | `text`, `checked`, `name` | 20px |
| `Slider` | `min`, `max`, `value`, `step`, `name` | 24px |
| `FileUpload` | `text`, `accept`, `multiple`, `name` | 64px |

---

### Feedback

| Control | Key props | Intrinsic height |
|---------|-----------|-----------------|
| `Alert` / `Toast` | `text`, `variant: default|primary|success|warning|danger`, `closable: true` | 48px |
| `Tooltip` | `text`, `placement: top|bottom|left|right` | 32px |
| `Progress` | `value` (0–100, def: 50), `max`, `indeterminate: true` | 8px |
| `Spinner` | `size: xs|sm|md|lg|xl` | 32px |
| `Skeleton` | `lines` | auto |

---

## Common patterns

### App shell with sidebar

```wraf
Screen {
  width: 1440
  height: 900

  Navbar { title: "MyApp" width: 100% }

  Row {
    width: 100%
    height: 94%

    Column {
      width: 15%
      height: 100%
      MenuItem { text: "Dashboard" icon: "home"     active: true }
      MenuItem { text: "Orders"    icon: "menu"     }
      MenuItem { text: "Settings"  icon: "settings" }
    }

    Column {
      width: 85%
      height: 100%
      padding: 24
      gap: 16
      // main content here
    }
  }
}
```

### Centered login

```wraf
Screen {
  width: 375
  height: 812
  padding: 20

  Card {
    position: center
    Text     { text: "Sign in"   variant: title  align: center }
    Input    { placeholder: "Email"    required: true }
    Password { placeholder: "Password"  }
    Button   { text: "Sign in"   variant: primary width: 100% }
    Text     { text: "Forgot password?" variant: caption align: center }
  }
}
```

### KPI row

```wraf
Row { gap: 12
  Card {
    width: 34%
    Text { text: "Revenue"  variant: caption }
    Text { text: "$48,295"  variant: title   }
    Progress { value: 72 width: 100% }
  }
  Card {
    width: 33%
    Text { text: "Users"    variant: caption }
    Text { text: "3,842"    variant: title   }
    Progress { value: 58 width: 100% }
  }
  Card {
    width: 33%
    Text { text: "Orders"   variant: caption }
    Text { text: "1,204"    variant: title   }
    Progress { value: 41 width: 100% }
  }
}
```

### Confirmation modal

```wraf
Modal {
  title: "Delete record"
  width: 400

  Text { text: "This action cannot be undone." }
  Row { gap: 8
    Button { text: "Cancel"  }
    Button { text: "Delete"  variant: danger }
  }
}
```

### Table with toolbar

```wraf
Card {
  title: "Orders"
  width: 100%

  Row { gap: 8
    Tabbar {
      Tab { text: "All"        active: true }
      Tab { text: "Pending"    }
      Tab { text: "Completed"  }
    }
    Search { placeholder: "Search orders…" width: 220 }
    Button { text: "Export"  variant: ghost }
    Button { text: "New order" variant: primary }
  }

  TableRow { header: true  width: 100% }
  TableRow { width: 100% }
  TableRow { width: 100% }
  TableRow { width: 100% selected: true }

  Pagination { page: 1  total: 120  pageSize: 10 }
}
```

---

## What NOT to do

```wraf
// ❌ Numeric size on Text
Text { text: "Title" size: 24 }

// ✅ Semantic variant
Text { text: "Title" variant: title }
```

```wraf
// ❌ Manual x/y on flow children
Card {
  Button { x: 20 y: 60 text: "Save" }
}

// ✅ Let auto-layout handle it
Card { padding: 16 gap: 12
  Button { text: "Save" variant: primary }
}
```

```wraf
// ❌ Redundant default props
Button { text: "OK" variant: default size: md disabled: false }

// ✅ Only non-default props
Button { text: "OK" }
```

```wraf
// ❌ Style props (not supported — wrafjs is semantic, not styled)
Button { text: "Save" color: "#3b82f6" borderRadius: 8 }

// ✅ Semantic intent
Button { text: "Save" variant: primary }
```

---

## Generation checklist

When a human describes a screen:

1. **Identify intent** — what action or information does this screen serve?
2. **Choose structure** — does it need a sidebar shell? A centered card? A scrollable list?
3. **Use semantic controls** — `Alert variant: warning` communicates more than a colored box.
4. **Omit defaults** — if `gap: 8` is the default, don't write it.
5. **Let the engine resolve** — don't calculate pixel positions unless you need absolute anchoring.
6. **Be minimal** — the shortest `.wraf` that expresses the intent is the best `.wraf`.
