import { describe, expect, it, vi } from 'vitest'
import { seedAdmin, type AdminSeedDependencies, type SeedUser } from '../server/services/adminSeed.js'

function fixture(existing: SeedUser | null, verified: SeedUser | null, role = false) {
  let user = existing
  let hasRole = role
  const dependencies: AdminSeedDependencies = {
    findUserByEmail: vi.fn(async () => user),
    verifyCredentials: vi.fn(async () => verified),
    createUser: vi.fn(async () => { user = { id: 'new-user' }; return user }),
    hasAdminRole: vi.fn(async () => hasRole),
    assignAdminRole: vi.fn(async () => { hasRole = true }),
  }
  return { dependencies, getUser: () => user }
}

describe('admin seed', () => {
  it('creates and assigns the account once, then reruns without duplication or password reset', async () => {
    const state = fixture(null, { id: 'new-user' })
    const first = await seedAdmin('admin@example.com', 'initial-password', state.dependencies)
    expect(first).toEqual({ created: true, roleAssigned: true, alreadyProvisioned: false })
    expect(state.dependencies.createUser).toHaveBeenCalledTimes(1)
    const second = await seedAdmin('admin@example.com', 'initial-password', state.dependencies)
    expect(second).toEqual({ created: false, roleAssigned: false, alreadyProvisioned: true })
    expect(state.dependencies.createUser).toHaveBeenCalledTimes(1)
    expect(state.dependencies.assignAdminRole).toHaveBeenCalledTimes(1)
    expect(state.getUser()?.id).toBe('new-user')
  })

  it('leaves an already provisioned administrator unchanged even after its initial password changed', async () => {
    const state = fixture({ id: 'existing-admin' }, null, true)
    await expect(seedAdmin('admin@example.com', 'obsolete-initial-password', state.dependencies)).resolves.toEqual({ created: false, roleAssigned: false, alreadyProvisioned: true })
    expect(state.dependencies.verifyCredentials).not.toHaveBeenCalled()
    expect(state.dependencies.createUser).not.toHaveBeenCalled()
    expect(state.dependencies.assignAdminRole).not.toHaveBeenCalled()
  })

  it('does not elevate or alter an existing account when identity verification fails', async () => {
    const state = fixture({ id: 'existing-user' }, null)
    await expect(seedAdmin('admin@example.com', 'wrong-password', state.dependencies)).rejects.toThrow('identity could not be verified')
    expect(state.dependencies.createUser).not.toHaveBeenCalled()
    expect(state.dependencies.assignAdminRole).not.toHaveBeenCalled()
  })
})
