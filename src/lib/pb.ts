import PocketBase from 'pocketbase'

// Change this to your PocketBase instance URL
const PB_URL = import.meta.env.VITE_PB_URL || 'http://127.0.0.1:8090'

export const pb = new PocketBase(PB_URL)

// Auto-refresh auth token on app load
pb.authStore.onChange(() => {
  // token is kept fresh automatically by the PocketBase SDK
}, true)
