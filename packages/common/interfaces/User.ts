import { IdentityProvider } from './IdentityProvider'

export type RelationshipType = 'friend' | 'requested' | 'blocked' | 'blocking'
export interface User {
  id: string
  name: string
  userRole: string
  identityProviders: IdentityProvider[]
  relationType?: RelationshipType
  inverseRelationType?: RelationshipType
  subscription: any
  subscriptions: any[]
  avatarUrl?: string
  instanceId?: string
}

export const UserSeed = {
  id: '',
  name: '',
  identityProviders: []
}

export function resolveUser (user: any): User {
  let returned = user
  if (user?.identity_providers) {
    returned = {
      ...returned,
      identityProviders: user.identity_providers
    }
  }
  if (user?.subscriptions && user.subscriptions.length > 0) {
    const verifiedSubscription = user.subscriptions.find(item => item.status === true)
    returned = {
      ...returned,
      subscription: verifiedSubscription
    }
    delete returned.subscriptions
  }
  return returned
}
