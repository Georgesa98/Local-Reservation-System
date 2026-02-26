import { safeStorage } from 'electron'
import Store from 'electron-store'

interface Tokens {
  access: string
  refresh: string
}

interface TokenStoreSchema {
  tokens: string | null
}

let store: Store<TokenStoreSchema> | null = null

function getStore(): Store<TokenStoreSchema> {
  if (!store) {
    store = new Store<TokenStoreSchema>({
      name: 'auth-tokens',
      defaults: {
        tokens: null,
      },
    })
  }
  return store
}

export async function saveTokens(access: string, refresh: string): Promise<void> {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('Encryption not available on this system')
  }

  const tokenData: Tokens = { access, refresh }
  const jsonString = JSON.stringify(tokenData)
  const encrypted = safeStorage.encryptString(jsonString)
  getStore().set('tokens', encrypted.toString('base64'))
}

export async function getTokens(): Promise<Tokens | null> {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('Encryption not available on this system')
  }

  const encryptedBase64 = getStore().get('tokens')
  if (!encryptedBase64) {
    return null
  }

  try {
    const encrypted = Buffer.from(encryptedBase64 as string, 'base64')
    const decrypted = safeStorage.decryptString(encrypted)
    return JSON.parse(decrypted) as Tokens
  } catch {
    return null
  }
}

export async function clearTokens(): Promise<void> {
  getStore().delete('tokens')
}

export function isEncryptionAvailable(): boolean {
  return safeStorage.isEncryptionAvailable()
}
