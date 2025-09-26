declare module 'tree-kill' {
  type Callback = (error?: NodeJS.ErrnoException | null) => void;
  function treeKill(pid: number, signal?: string, callback?: Callback): void;
  export default treeKill;
}
