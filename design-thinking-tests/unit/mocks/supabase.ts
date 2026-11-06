// Test double: each test sets `nextResult` to what Supabase would return.
export let nextResult: any = { data: [], error: null };
export const setNext = (r: any) => { nextResult = r; };
const chain: any = new Proxy({}, {
  get: (_t, prop) => prop === 'then'
    ? (res: any) => res(nextResult)
    : (..._args: any[]) => chain,
});
export const supabase = { from: (_: string) => chain } as any;
