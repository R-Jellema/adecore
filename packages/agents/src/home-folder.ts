import { homedir } from 'node:os';

/*
 * The home folder the CLIs read their config from. On Windows they take it from USERPROFILE, as Node
 * does; a HOME there is often Git Bash's `/c/Users/...`, which no native program can open.
 */
export function homeFolder(env: Record<string, string | undefined>, platform: NodeJS.Platform = process.platform): string {
    return (platform === 'win32' ? env.USERPROFILE : env.HOME) || homedir();
}
