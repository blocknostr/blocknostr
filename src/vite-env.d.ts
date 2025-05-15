
/// <reference types="vite/client" />

// Add any custom type definitions here if needed

// Define a union type for ref callback or ref object
type LoadMoreRefType = React.RefObject<HTMLDivElement> | ((node: HTMLDivElement | null) => void);
