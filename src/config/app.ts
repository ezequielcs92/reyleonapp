// This would ideally be fetched from Firestore 'config/app' to keep it dynamic.
// But we might want a fallback or type definition here.

export const DEFAULT_GROUP_CODE_FALLBACK = 'SIMBA'; // Just a fallback if offline or logic fails, though we should enforce DB check.
