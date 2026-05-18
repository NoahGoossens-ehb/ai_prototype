# PortfoliAI Coach Client

This frontend is a small `React` + `Vite` app. The guide below maps each important part of the code to the official documentation that explains how it works.

## Project Files

- Entry file: `src/main.jsx`
- Main component: `src/App.jsx`
- App styling: `src/App.css`
- Global root styling: `src/index.css`
- Package setup: `package.json`

## Run The App

```bash
npm install
npm run dev
```

Default backend URL:

```env
VITE_API_URL=http://localhost:3001
```

## How The Code Works

### 1. App startup and mounting

- `src/main.jsx` uses React Strict Mode to help catch development issues:
  https://react.dev/reference/react/StrictMode
- `createRoot()` mounts the React app into the DOM element with id `root`:
  https://react.dev/reference/react-dom/client/createRoot

### 2. State and component logic

- `useState` stores UI state like the active tab, form data, loading state, errors, and result data:
  https://react.dev/reference/react/useState
- `useMemo` calculates `contextScore` from the form fields without recalculating on every render unless `textForm` changes:
  https://react.dev/reference/react/useMemo
- Components return JSX markup to describe the UI:
  https://react.dev/learn/writing-markup-with-jsx
- Conditional rendering is used for the tab content, loading state, empty state, and improved text block:
  https://react.dev/learn/conditional-rendering
- List rendering is used in `checklist.map(...)` and `items.map(...)`:
  https://react.dev/learn/rendering-lists
- Events like `onClick` and `onChange` drive the app behavior:
  https://react.dev/learn/responding-to-events

### 3. Form fields and controlled inputs

- The text inputs and textareas are controlled by React state:
  https://react.dev/reference/react-dom/components/input
- The multi-line fields use the React `textarea` component API:
  https://react.dev/reference/react-dom/components/textarea
- The dropdowns for tone, context, and length use the React `select` component API:
  https://react.dev/reference/react-dom/components/select
- The image upload uses the browser file input element:
  https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/file

### 4. API calls and data handling

- `fetch()` sends the frontend requests to the backend endpoints:
  https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
- `FormData` is used to upload the screenshot file to `/api/analyze-image`:
  https://developer.mozilla.org/en-US/docs/Web/API/FormData

### 5. Environment variables and Vite behavior

- `import.meta.env.VITE_API_URL` comes from Vite environment variables:
  https://vite.dev/guide/env-and-mode/
- `import.meta` itself is a JavaScript platform feature:
  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import.meta
- Vite is the dev server and build tool used by the `dev`, `build`, and `preview` scripts:
  https://vite.dev/guide/
- The React plugin for Vite handles the React integration used by this project:
  https://vite.dev/plugins/#vitejs-plugin-react

### 6. Image preview behavior

- `URL.createObjectURL(file)` creates a temporary local preview URL for the uploaded screenshot:
  https://developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL_static
- The preview image is rendered with the standard HTML `img` element:
  https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/img

### 7. Semantic HTML used in the UI

- The score bar uses the HTML `progress` element:
  https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/progress
- Tabs include `role="tablist"` and `aria-label` for accessibility:
  https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/tablist_role

### 8. CSS layout and visual system

- CSS custom properties in `:root` define the theme colors and shared design tokens:
  https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_cascading_variables/Using_CSS_custom_properties
- `display: grid` is used for the hero, notice cards, tool layout, settings row, and result cards:
  https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout
- `display: flex` is used for button rows, tabs, score boxes, and headers:
  https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout/Flexbox
- `radial-gradient(...)` and `linear-gradient(...)` create the warm background and button fills:
  https://developer.mozilla.org/en-US/docs/Web/CSS/gradient/radial-gradient
  https://developer.mozilla.org/en-US/docs/Web/CSS/gradient/linear-gradient
- `backdrop-filter: blur(...)` gives the glass-like card effect:
  https://developer.mozilla.org/docs/Web/CSS/backdrop-filter
- `position: sticky` keeps the result panel visible while scrolling on larger screens:
  https://developer.mozilla.org/en-US/docs/Web/CSS/position
- `@media` rules adapt the layout for tablets and mobile screens:
  https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_media_queries/Using_media_queries
- The `:has(...)` selector changes the settings grid when the third field is present:
  https://developer.mozilla.org/en-US/docs/Web/CSS/:has
- `@keyframes` and `animation` drive the spinner in the loading panel:
  https://developer.mozilla.org/en-US/docs/Web/CSS/@keyframes
  https://developer.mozilla.org/en-US/docs/Web/CSS/animation

### 9. Tooling and quality checks

- ESLint powers the `npm run lint` command in this project:
  https://eslint.org/docs/latest/use/getting-started
- ESLint flat config and project-wide configuration are documented here:
  https://eslint.org/docs/latest/use/configure/configuration-files

## Quick Code Map

- `main.jsx`: bootstraps React and renders `<App />`
- `App.jsx`: holds all state, form handling, API requests, tab switching, and result rendering
- `App.css`: styles the complete interface, layout, motion, and responsive behavior
- `index.css`: ensures the root container fills the viewport
