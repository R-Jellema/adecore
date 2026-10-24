import { useState } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { Segmented } from '@adecore/ui';

type Theme = 'light' | 'dark' | 'system';

export default function SegmentedIconsDemo() {
    const [theme, setTheme] = useState<Theme>('system');

    return (
        <Segmented<Theme>
            label="Theme"
            iconOnly
            value={theme}
            onValueChange={setTheme}
            options={[
                { id: 'light', label: 'Light', icon: Sun },
                { id: 'dark', label: 'Dark', icon: Moon },
                { id: 'system', label: 'Match the system', icon: Monitor }
            ]}
        />
    );
}
