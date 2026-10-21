import { useEffect, useState } from 'react';
import type { ChatInfo, ChatItem, ProviderCapabilities } from '@adecore/agent-contracts';
import { useChatRow } from '../../../state/chats';
import { RESUME_COMPACTION_TOKENS, resumeCompactionDueAt, resumeCompactionOffer } from '../../logic/resume-compaction';
import { useResumeCompactionDismissal } from '../../resume-compaction-dismissals';

/* The offer to fold a long context before a chat whose cache went cold goes on, or null when there is none. */
export function useCompactionOffer(chatId: string, info: ChatInfo, compaction: ProviderCapabilities['compaction'] | undefined) {
    const order = useChatRow(chatId, (row) => row?.order);
    const structure = useChatRow(chatId, (row) => row?.structure);
    const dismissedTurnId = useResumeCompactionDismissal(chatId);
    const [now, setNow] = useState(Date.now);
    // The cheap half of the offer, so a chat that can never make one walks no thread.
    const couldOffer = compaction !== undefined && compaction !== 'none' && info.usage.contextTokens >= RESUME_COMPACTION_TOKENS;
    const items = couldOffer ? (order ?? []).map((id) => structure?.[id]).filter((item): item is ChatItem => item !== undefined) : [];
    const input = { info, compaction, items, dismissedTurnId };
    const dueAt = couldOffer ? resumeCompactionDueAt(input) : null;

    // One timer for the moment the offer comes due, so a chat that can never make one keeps none.
    useEffect(() => {
        if (dueAt === null) {
            return;
        }
        const timer = setTimeout(() => setNow(Date.now()), Math.max(0, dueAt - Date.now()));
        return () => clearTimeout(timer);
    }, [dueAt]);

    return dueAt === null ? null : resumeCompactionOffer({ ...input, now });
}
