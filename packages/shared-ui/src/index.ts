// @demo/shared-ui — React components and helpers shared by both apps.
// Components are consumed directly as source (no build step); the app's
// bundler transpiles them.

export type { Note, User } from "./types";
export { DemoBanner } from "./DemoBanner";
export { Layout } from "./Layout";
export type { LayoutProps, NavLink } from "./Layout";
export { CredentialsForm, LoginForm, RegisterForm } from "./LoginForm";
export type { CredentialsFormProps } from "./LoginForm";
export { NoteList } from "./NoteList";
export type { NoteListProps } from "./NoteList";
export { NoteEditor } from "./NoteEditor";
export type { NoteEditorProps } from "./NoteEditor";
