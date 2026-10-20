// What cmd.exe reads as syntax outside quotes, and so escapes with a caret.
const CMD_SPECIAL = /([()\][%!^"`<>&|;, *?])/g;

export function cmdEscaped(text: string): string {
    return text.replace(CMD_SPECIAL, '^$1');
}

/*
 * What a manager finds the cmd.exe of a task by: `schtasks /End` ends that process alone, so a stop
 * has to end the tree under it first. Its title is the label, which is the name of the task.
 */
export function scheduledTaskMarker(label: string): string {
    return `title ${cmdEscaped(label)} && `;
}
