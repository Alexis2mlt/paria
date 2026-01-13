// Supabase removed — stub to avoid runtime errors if still imported.
export const supabase = {
	auth: {
		signOut: async () => {},
		getUser: async () => ({ data: { user: null } }),
		onAuthStateChange: (_cb: any) => ({ data: { subscription: { unsubscribe: () => {} } } }),
	},
};
