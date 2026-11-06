export const Platform = { OS: 'ios' };
export const Linking = { openURL: async (_: string) => {} };
export const Share = { share: async (_: any) => ({ action: 'sharedAction' }), dismissedAction: 'dismissedAction' };
