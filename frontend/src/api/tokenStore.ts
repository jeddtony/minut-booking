let _token: string | null = null
let _onExpired: (() => void) | null = null

export const tokenStore = {
  get: () => _token,
  set: (t: string | null) => { _token = t },
  onExpired: (cb: () => void) => { _onExpired = cb },
  expire: () => _onExpired?.(),
}
