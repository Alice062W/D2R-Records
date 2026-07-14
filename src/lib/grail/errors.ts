// Supabase's query errors (PostgrestError) are plain objects with a `message`
// string, not `Error` instances — String(e) on them gives "[object Object]".
export function getErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (e && typeof e === 'object' && 'message' in e && typeof (e as { message: unknown }).message === 'string') {
    return (e as { message: string }).message;
  }
  return String(e);
}
