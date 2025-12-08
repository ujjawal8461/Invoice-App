// app/types.ts (or at top of Services.tsx)
export type Service = {
    id: string;        // uuid or timestamp string
    name: string;
    ratePaise: number; // store money as paise (integer) to avoid float bugs
    taxPercent: number;
};
